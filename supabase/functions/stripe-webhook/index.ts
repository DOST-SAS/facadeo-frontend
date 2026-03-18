import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "npm:stripe@15.4.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SERVICE_ROLE_KEY")!
);

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const { data: stripeKeyRow, error: keyError } = await supabase
      .from("app_setting")
      .select("STRIPE_SECRET_KEY")
      .single();

    if (keyError || !stripeKeyRow?.STRIPE_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: "Stripe secret key not configured" }),
        { status: 500, headers: corsHeaders }
      );
    }

    const stripe = new Stripe(stripeKeyRow.STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
    });

    const sig = req.headers.get("stripe-signature");
    const body = await req.text();

    if (!sig) {
      return new Response(
        JSON.stringify({ error: "Missing stripe-signature header" }),
        { status: 400, headers: corsHeaders }
      );
    }

    let event: Stripe.Event;

    try {
      const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
      if (!webhookSecret) {
        return new Response(
          JSON.stringify({ error: "Missing STRIPE_WEBHOOK_SECRET" }),
          { status: 500, headers: corsHeaders }
        );
      }

      event = await stripe.webhooks.constructEventAsync(
        body,
        sig,
        webhookSecret
      );
    } catch (err) {
      return new Response(
        JSON.stringify({
          error: "Webhook signature verification failed",
          details: err instanceof Error ? err.message : "Unknown error",
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Idempotence
    const { data: existingLog } = await supabase
      .from("webhooks_log")
      .select("id")
      .eq("idempotency_key", event.id)
      .maybeSingle();

    if (existingLog) {
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    await supabase.from("webhooks_log").insert({
      source: "stripe",
      event_type: event.type,
      event_id: event.id,
      payload: event.data.object,
      idempotency_key: event.id,
      status: "processing",
    });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const planId = session.metadata?.plan_id;

        if (session.mode === "subscription") {
          if (!planId) break;

          const { data: activeSubscription, error: fetchError } = await supabase
            .from("subscriptions")
            .select("id")
            .eq("profile_id", session.client_reference_id)
            .eq("status", "active")
            .maybeSingle();

          if (fetchError) break;

          if (activeSubscription) {
            await supabase
              .from("subscriptions")
              .update({ status: "past_due" })
              .eq("id", activeSubscription.id);
          }

          const { error: subscriptionError } = await supabase
            .from("subscriptions")
            .insert({
              profile_id: session.client_reference_id,
              plan_id: planId,
              stripe_subscription_id: session.subscription,
              stripe_customer_id: session.customer,
              status: "active",
              current_period_start: new Date(),
              current_period_end: new Date(
                new Date().setMonth(new Date().getMonth() + 1)
              ),
            });

          if (!subscriptionError) {
            const { data: activePlan } = await supabase
              .from("plans")
              .select("*")
              .eq("id", planId)
              .eq("active", true)
              .maybeSingle();

            if (activePlan) {
              const n_scans =
                (activePlan.features?.find((f: any) => f.key === "max_scans_per_month")
                  ?.value as number) || 0;

              await supabase
                .from("profiles")
                .update({ scans_number: n_scans })
                .eq("id", session.client_reference_id);
            }
          }

          const { data: planDetails } = await supabase
            .from("plans")
            .select("*")
            .eq("id", planId)
            .single();

          if (planDetails) {
            const monthlyCredits =
              planDetails.monthly_credit ||
              planDetails.monthly_credits ||
              planDetails.credits ||
              0;

            if (monthlyCredits > 0) {
              await supabase.from("credit_ledger").insert({
                profile_id: session.client_reference_id,
                type: "monthly_grant",
                amount: monthlyCredits,
                reference_id: planId,
                reference_type: "subscription",
                idempotency_key: `subscription_${session.id}`,
                metadata: {
                  note: `souscrire à un abonnement ${planDetails.name}`,
                  stripe_session_id: session.id,
                  stripe_subscription_id: session.subscription,
                  plan_id: planId,
                  event_type: "checkout.session.completed",
                },
              });
            }
          }

          const { data: profile } = await supabase
            .from("profiles")
            .select("email, display_name")
            .eq("id", session.client_reference_id)
            .single();

          if (profile?.email) {
            const { data: emailSettings } = await supabase
              .from("app_setting")
              .select("emailSender, BREVO_API_KEY, emailEnabled")
              .single();

            const { data: plan } = await supabase
              .from("plans")
              .select("name")
              .eq("id", planId)
              .single();

            if (
              emailSettings?.emailEnabled &&
              emailSettings.BREVO_API_KEY &&
              emailSettings.emailSender
            ) {
              await fetch(
                `${Deno.env.get("SUPABASE_URL")}/functions/v1/email-sender`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    apikey: Deno.env.get("SUPABASE_ANON_KEY")!,
                  },
                  body: JSON.stringify({
                    to: profile.email,
                    templateName: "subscription_confirmation",
                    variables: {
                      display_name: profile.display_name ?? "",
                      plan_name: plan?.name ?? "",
                      next_billing_date: new Date(
                        new Date().setMonth(new Date().getMonth() + 1)
                      ).toLocaleDateString("fr-FR"),
                    },
                  }),
                }
              );
            }
          }
        } else if (session.mode === "payment") {
          const metadata = session.metadata;
          const packId = metadata?.pack_id;

          if (!packId) break;

          const { data: pack } = await supabase
            .from("credit_packs")
            .select("credit_amount")
            .eq("id", packId)
            .single();

          if (!pack) break;

          await supabase.rpc("increment_credits", {
            profile_id: session.client_reference_id,
            credits: pack.credit_amount,
          });

          await supabase.from("credit_ledger").insert({
            profile_id: session.client_reference_id,
            type: "top_up",
            amount: pack.credit_amount,
            reference_id: packId,
            reference_type: "credit_pack",
            idempotency_key: `payment_${session.id}`,
            metadata: {
              stripe_session_id: session.id,
              stripe_payment_intent: session.payment_intent,
              pack_id: packId,
              event_type: "checkout.session.completed",
            },
          });
        }
        break;
      }

      case "invoice.payment_succeeded": {
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        await supabase
          .from("subscriptions")
          .update({ status: "canceled", ended_at: new Date() })
          .eq("stripe_subscription_id", subscription.id);

        break;
      }

      default:
        break;
    }

    await supabase
      .from("webhooks_log")
      .update({ status: "processed", processed_at: new Date() })
      .eq("idempotency_key", event.id);

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});
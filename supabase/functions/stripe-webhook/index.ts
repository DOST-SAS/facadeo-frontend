import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "npm:stripe@15.4.0";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    /* =========================
GET STRIPE SECRET KEY FROM DB
========================== */
    const { data: stripeKeyRow, error: keyError } = await supabase
      .from("app_setting")
      .select(`"STRIPE_SECRET_KEY"`)
      .single();
    console.log(stripeKeyRow)
    console.log('STRIPE_SECRET_KEY : ', stripeKeyRow.STRIPE_SECRET_KEY)

    if (keyError || !stripeKeyRow?.STRIPE_SECRET_KEY) {
      console.error("Stripe key not found in app_settings", keyError);
      return new Response(
        JSON.stringify({ error: "Stripe secret key not configured" }),
        { status: 500, headers: corsHeaders }
      );
    }

    const stripe = new Stripe(stripeKeyRow.STRIPE_SECRET_KEY);



    const sig = req.headers.get("stripe-signature")!;
    const body = await req.text();

    let event: Stripe.Event;

    console.log("[WEBHOOK] Starting webhook processing");

    // GET SETTINGS
    console.log("[SETTINGS] Fetching app settings");
    const { data: settings, error: settingsError } = await supabase
      .from("app_setting")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (settingsError) {
      console.error("[SETTINGS ERROR]", settingsError);
    } else {
      console.log("[SETTINGS] Settings fetched successfully");
    }

    try {
      console.log(Deno.env.get("STRIPE_WEBHOOK_SECRET"));
      console.log("[STRIPE] Verifying webhook signature");
      event = await stripe.webhooks.constructEventAsync(
        body,
        sig,
        Deno.env.get("STRIPE_WEBHOOK_SECRET")
      );
      console.log("[STRIPE] Signature verified. Event type:", event.type, "Event ID:", event.id);
    } catch (err) {
      console.error("[STRIPE ERROR] Webhook signature verification failed:", err.message);
      return new Response("Webhook Error", { status: 400, headers: corsHeaders });
    }

    console.log("[IDEMPOTENCY] Checking for duplicate webhook:", event.id);
    const { data: existingLog, error: idempotencyError } = await supabase
      .from("webhooks_log")
      .select("id")
      .eq("idempotency_key", event.id)
      .maybeSingle();

    if (idempotencyError) {
      console.error("[IDEMPOTENCY ERROR]", idempotencyError);
    }

    if (existingLog) {
      console.log("[IDEMPOTENCY] Duplicate webhook ignored:", event.id);
      return new Response(JSON.stringify({ received: true }), { headers: corsHeaders });
    }

    // سجل webhook جديد
    console.log("[WEBHOOK LOG] Creating new webhook log entry");
    const { error: logError } = await supabase.from("webhooks_log").insert({
      source: "stripe",
      event_type: event.type,
      event_id: event.id,
      payload: event.data.object,
      idempotency_key: event.id,
      status: "processing",
    });

    if (logError) {
      console.error("[WEBHOOK LOG ERROR]", logError);
    } else {
      console.log("[WEBHOOK LOG] Webhook log created successfully");
    }

    // Handle events
    console.log("[EVENT HANDLER] Processing event type:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const planId = session.metadata?.plan_id;

        console.log("[CHECKOUT] Session completed. Mode:", session.mode, "Session ID:", session.id);

        if (session.mode === "subscription") {
          console.log("[SUBSCRIPTION] Processing subscription checkout");

          if (!planId) {
            console.error("[SUBSCRIPTION ERROR] plan_id missing in session metadata");
            break;
          }

          console.log("[SUBSCRIPTION] Plan ID:", planId, "Profile ID:", session.client_reference_id);

          // 1️⃣ قلب على subscription active ديال هاد profile
          const { data: activeSubscription, error: fetchError } = await supabase
            .from("subscriptions")
            .select("id")
            .eq("profile_id", session.client_reference_id)
            .eq("status", "active")
            .maybeSingle();

          if (fetchError) {
            console.error("[SUBSCRIPTION ERROR] Failed to fetch active subscription:", fetchError);
            return;
          }

          // 2️⃣ إلا كانت كاينة → بدلها past_due
          if (activeSubscription) {
            const { error: updateError } = await supabase
              .from("subscriptions")
              .update({ status: "past_due" })
              .eq("id", activeSubscription.id);
            if (updateError) {
              console.error("[SUBSCRIPTION ERROR] Failed to update old subscription:", updateError);
              return;
            }
          }

          // 3️⃣ دخل subscription الجديدة active
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

          if (subscriptionError) {
            console.error(
              "[SUBSCRIPTION ERROR] Failed to insert new subscription:",
              subscriptionError
            );
          } else {
            console.log("[SUBSCRIPTION] New active subscription created successfully");
            const { data: activePlan, error: planError } = await supabase
              .from("plans")
              .select("*")
              .eq("id", planId)
              .eq("active", true)
              .maybeSingle();

            if (planError) {
              console.error("[plans ERROR] Failed to fetch active subscription:", planError);
              return;
            } else {
              console.log("features : ", activePlan.features);
              const n_scans = (activePlan.features?.find(f => f.key === "max_scans_per_month")?.value as number) || 0;
              const { error: profileError } = await supabase
                .from("profiles")
                .update({ scans_number: n_scans})
                .eq("id", session.client_reference_id,);
              if (profileError) {
                console.error(
                  "[profileError ERROR] Failed to insert new profile:",
                  profileError
                );
              }
            }

          }

          // Fetch plan details for monthly credits
          console.log("[LEDGER] Fetching plan details for monthly grant");
          const { data: planDetails, error: planDetailsError } = await supabase
            .from("plans")
            .select("*")
            .eq("id", planId)
            .single();

          if (planDetailsError) {
            console.error("[LEDGER ERROR] Failed to fetch plan details:", planDetailsError);
          } else if (planDetails) {
            console.log("[LEDGER] Plan details fetched:", JSON.stringify(planDetails, null, 2));

            // Check if plan has monthly_credit (singular), monthly_credits (plural), or credits field
            const monthlyCredits = planDetails.monthly_credit || planDetails.monthly_credits || planDetails.credits || 0;

            console.log("[LEDGER] Monthly credits found:", monthlyCredits);

            if (monthlyCredits > 0) {
              console.log("[LEDGER] Inserting monthly_grant for subscription. Credits:", monthlyCredits);
              console.log("[LEDGER] Data to insert:", {
                profile_id: session.client_reference_id,
                type: "monthly_grant",
                amount: monthlyCredits,
                reference_id: planId,
                reference_type: "subscription",
                idempotency_key: `subscription_${session.id}`,
              });

              const { data: ledgerData, error: ledgerError } = await supabase
                .from("credit_ledger")
                .insert({
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
                })
                .select();

              if (ledgerError) {
                console.error("[LEDGER ERROR] Failed to insert into credit_ledger:", ledgerError);
                console.error("[LEDGER ERROR] Error details:", JSON.stringify(ledgerError, null, 2));
              } else if (!ledgerData || ledgerData.length === 0) {
                console.error("[LEDGER ERROR] Insert returned no data - insertion may have failed silently");
              } else {
                console.log("[LEDGER SUCCESS] Credit ledger entry created successfully");
                console.log("[LEDGER SUCCESS] Inserted data:", JSON.stringify(ledgerData, null, 2));

                // Verify the insertion
                const { data: verifyData, error: verifyError } = await supabase
                  .from("credit_ledger")
                  .select("*")
                  .eq("idempotency_key", `subscription_${session.id}`)
                  .single();

                if (verifyError) {
                  console.error("[LEDGER VERIFY ERROR] Failed to verify insertion:", verifyError);
                } else if (verifyData) {
                  console.log("[LEDGER VERIFY SUCCESS] Verified ledger entry exists:", JSON.stringify(verifyData, null, 2));
                } else {
                  console.error("[LEDGER VERIFY ERROR] Could not find inserted record");
                }
              }
            } else {
              console.log("[LEDGER] No monthly credits defined for this plan (credits:", monthlyCredits, ")");
            }
          }

          // === SEND EMAIL AFTER SUBSCRIPTION ===
          console.log("[EMAIL] Fetching profile for email notification");
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("email, display_name")
            .eq("id", session.client_reference_id)
            .single();

          if (profileError) {
            console.error("[EMAIL ERROR] Failed to fetch profile:", profileError);
          }

          if (!profile) {
            console.log('[EMAIL] Profile not found');
          } else {
            console.log('[EMAIL] Profile found:', profile.email);
          }

          if (profile?.email) {
            console.log("[EMAIL] Fetching email settings");
            const { data: emailSettings, error: emailSettingsError } = await supabase
              .from("app_setting")
              .select("emailSender, BREVO_API_KEY, emailEnabled")
              .order("created_at", { ascending: false })
              .limit(1)
              .single();

            if (emailSettingsError) {
              console.error("[EMAIL ERROR] Failed to fetch email settings:", emailSettingsError);
            }

            console.log("[EMAIL] Fetching plan details for email");
            const { data: plan, error: planError } = await supabase
              .from("plans")
              .select("name")
              .eq('id', planId)
              .limit(1)
              .single();

            if (planError) {
              console.error("[EMAIL ERROR] Failed to fetch plan:", planError);
            }

            if (emailSettings?.emailEnabled && emailSettings.BREVO_API_KEY && emailSettings.emailSender) {
              console.log("[EMAIL] Sending subscription confirmation email to:", profile.email);

              try {
                const emailResponse = await fetch("https://txehqqekdxgzynlxdnss.supabase.co/functions/v1/email-sender", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json"
                  },
                  body: JSON.stringify({
                    to: profile.email,
                    templateName: "subscription_confirmation",
                    variables: {
                      display_name: profile.display_name ?? "",
                      plan_name: plan?.name ?? "",
                      next_billing_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleDateString("fr-FR"),
                    },
                  }),
                });
                console.log(" respons :  ", emailResponse.ok);
                if (!emailResponse.ok) {
                  const errorText = await emailResponse.text();
                  console.error("[EMAIL ERROR] Failed to send email. Status:", emailResponse.status, "Response:", errorText);
                } else {
                  console.log("[EMAIL] Email sent successfully");
                }
              } catch (emailError) {
                console.error("[EMAIL ERROR] Exception while sending email:", emailError);
              }
            } else {
              console.log("[EMAIL] Email not sent - email settings not configured or disabled");
            }
          }

        } else if (session.mode === "payment") {
          console.log("[PAYMENT] Processing one-time payment");

          const metadata = session.metadata;
          const packId = metadata?.pack_id;

          if (!packId) {
            console.error("[PAYMENT ERROR] pack_id missing in session metadata");
            break;
          }

          console.log("[PAYMENT] Pack ID:", packId, "Profile ID:", session.client_reference_id);

          const { data: pack, error: packError } = await supabase
            .from("credit_packs")
            .select("credit_amount")
            .eq("id", packId)
            .single();

          if (packError) {
            console.error("[PAYMENT ERROR] Failed to fetch credit pack:", packError);
            break;
          }

          if (!pack) {
            console.error("[PAYMENT ERROR] Credit pack not found for ID:", packId);
            break;
          }

          console.log("[PAYMENT] Credit pack found. Amount:", pack.credit_amount);

          // Increment credits
          console.log("[CREDITS] Incrementing credits via RPC");
          const { error: incrementError } = await supabase.rpc("increment_credits", {
            profile_id: session.client_reference_id,
            credits: pack.credit_amount,
          });

          if (incrementError) {
            console.error("[CREDITS ERROR] Failed to increment credits:", incrementError);
          } else {
            console.log("[CREDITS] Credits incremented successfully");
          }

          // Insert into credit_ledger for top_up (one-time payment)
          console.log("[LEDGER] Inserting top_up into credit_ledger");
          console.log("[LEDGER] Data to insert:", {
            profile_id: session.client_reference_id,
            type: "top_up",
            amount: pack.credit_amount,
            reference_id: packId,
            reference_type: "credit_pack",
            idempotency_key: `payment_${session.id}`,
          });

          const { data: ledgerData, error: ledgerError } = await supabase.from("credit_ledger").insert({
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
          }).select();

          if (ledgerError) {
            console.error("[LEDGER ERROR] Failed to insert into credit_ledger:", ledgerError);
            console.error("[LEDGER ERROR] Error details:", JSON.stringify(ledgerError, null, 2));
          } else if (!ledgerData || ledgerData.length === 0) {
            console.error("[LEDGER ERROR] Insert returned no data - insertion may have failed silently");
          } else {
            console.log("[LEDGER SUCCESS] Credit ledger entry created successfully");
            console.log("[LEDGER SUCCESS] Inserted data:", JSON.stringify(ledgerData, null, 2));

            // Verify the insertion by querying back
            const { data: verifyData, error: verifyError } = await supabase
              .from("credit_ledger")
              .select("*")
              .eq("idempotency_key", `payment_${session.id}`)
              .single();

            if (verifyError) {
              console.error("[LEDGER VERIFY ERROR] Failed to verify insertion:", verifyError);
            } else if (verifyData) {
              console.log("[LEDGER VERIFY SUCCESS] Verified ledger entry exists:", JSON.stringify(verifyData, null, 2));
            } else {
              console.error("[LEDGER VERIFY ERROR] Could not find inserted record");
            }
          }
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("[INVOICE] Invoice payment succeeded. Invoice ID:", invoice.id);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("[SUBSCRIPTION] Subscription deleted. Subscription ID:", subscription.id);

        const { error: deleteError } = await supabase
          .from("subscriptions")
          .update({ status: "canceled", ended_at: new Date() })
          .eq("stripe_subscription_id", subscription.id);

        if (deleteError) {
          console.error("[SUBSCRIPTION ERROR] Failed to update subscription status:", deleteError);
        } else {
          console.log("[SUBSCRIPTION] Subscription marked as canceled");
        }
        break;
      }

      default:
        console.log(`[EVENT] Unhandled event type: ${event.type}`);
    }

    // Update webhook status
    console.log("[WEBHOOK LOG] Updating webhook status to processed");
    const { error: updateError } = await supabase
      .from("webhooks_log")
      .update({ status: "processed", processed_at: new Date() })
      .eq("idempotency_key", event.id);

    if (updateError) {
      console.error("[WEBHOOK LOG ERROR] Failed to update webhook status:", updateError);
    } else {
      console.log("[WEBHOOK LOG] Webhook marked as processed");
    }

    console.log("[WEBHOOK] Webhook processing completed successfully");
    return new Response(JSON.stringify({ received: true }), { headers: corsHeaders });

  } catch (error) {
    console.error("[FATAL ERROR] Error processing webhook:", error);
    console.error("[FATAL ERROR] Stack trace:", error.stack);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
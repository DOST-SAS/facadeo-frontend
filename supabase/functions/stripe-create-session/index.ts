import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "npm:stripe@15.4.0";
import { corsHeaders } from "../_shared/cors.ts";
import { requireUser } from "../_shared/user.ts";

/* =========================
   TYPES
========================= */
type Payload = {
  type: "subscription" | "payment";
  profileId: string;

  // subscription
  priceId?: string;
  plan_id?: string;

  // pack
  amount?: number;
  packId?: string;
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: corsHeaders,
        }
      );
    }

    const userCheck = await requireUser(req);

    if (!userCheck.ok) {
      return new Response(
        JSON.stringify({ error: userCheck.error }),
        {
          status: userCheck.status,
          headers: corsHeaders,
        }
      );
    }

    const { user, profile, supabase } = userCheck;

    const {
      type,
      profileId,
      priceId,
      plan_id,
      amount,
      packId,
    }: Payload = await req.json();

    if (!type || !profileId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    const isAdmin = profile.is_admin === true || profile.role === "admin";

    if (profileId !== user.id && !isAdmin) {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        {
          status: 403,
          headers: corsHeaders,
        }
      );
    }

    if (type === "subscription" && !priceId) {
      return new Response(
        JSON.stringify({ error: "priceId is required for subscription" }),
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    if (type === "payment" && !amount) {
      return new Response(
        JSON.stringify({ error: "amount is required for pack payment" }),
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    /* =========================
       GET STRIPE SECRET KEY FROM DB
    ========================== */
    const { data: stripeKeyRow, error: keyError } = await supabase
      .from("app_setting")
      .select("STRIPE_SECRET_KEY")
      .single();

    if (keyError || !stripeKeyRow?.STRIPE_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: "Stripe secret key not configured" }),
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }

    const stripe = new Stripe(stripeKeyRow.STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
    });

    /* =========================
       GET / CREATE CUSTOMER
    ========================== */
    const { data: targetProfile, error: profileError } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", profileId)
      .single();

    if (profileError) {
      return new Response(
        JSON.stringify({ error: profileError.message }),
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }

    let customerId: string;

    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("profile_id", profileId)
      .maybeSingle();

    if (existingSub?.stripe_customer_id) {
      customerId = existingSub.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: targetProfile?.email ?? undefined,
        metadata: { profile_id: profileId },
      });
      customerId = customer.id;
    }

    /* =========================
       LINE ITEMS
    ========================== */
    const lineItems =
      type === "subscription"
        ? [
            {
              price: priceId!,
              quantity: 1,
            },
          ]
        : [
            {
              price_data: {
                currency: "eur",
                product_data: {
                  name: "Credit Pack",
                  description: "Recharge de crédits",
                },
                unit_amount: amount,
              },
              quantity: 1,
            },
          ];

    /* =========================
       CREATE SESSION
    ========================== */
    const origin =
      req.headers.get("origin") ||
      Deno.env.get("FRONTEND_URL") ||
      "https://facadeo.fr";

    const session = await stripe.checkout.sessions.create({
      mode: type === "subscription" ? "subscription" : "payment",
      customer: customerId,
      payment_method_types: ["card"],
      line_items: lineItems,
      client_reference_id: profileId,
      metadata: {
        type,
        plan_id: plan_id ?? "",
        pack_id: packId ?? "",
      },
      success_url: `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/billing/cancel`,
      allow_promotion_codes: true,
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Failed to create checkout session",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { requireAdmin } from "../_shared/admin.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "PUT") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: corsHeaders,
      });
    }

    const adminCheck = await requireAdmin(req);

    if (!adminCheck.ok) {
      return new Response(JSON.stringify({ error: adminCheck.error }), {
        status: adminCheck.status,
        headers: corsHeaders,
      });
    }

    const { supabase } = adminCheck;
    const { planId, plan } = await req.json();

    if (!planId) {
      return new Response(JSON.stringify({ error: "planId is required" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const updates = {
      name: plan.name,
      slug: plan.slug,
      monthly_credit: plan.monthly_credit,
      price_cents: plan.price_cents,
      currency: plan.currency,
      features: plan.features ?? [],
      stripe_product_id: plan.stripe_product_id ?? null,
      stripe_price_id: plan.stripe_price_id ?? null,
      description: plan.description ?? null,
      active: plan.active,
      is_public: plan.is_public,
      sort_order: plan.sort_order ?? 0,
      sub_features: plan.sub_features ?? null,
      type: plan.type ?? null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("plans")
      .update(updates)
      .eq("id", planId)
      .select("*")
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});
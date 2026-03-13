import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { requireAdmin } from "../_shared/admin.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const adminCheck = await requireAdmin(req);
  if (!adminCheck.ok) {
    return new Response(JSON.stringify({ error: adminCheck.error }), {
      status: adminCheck.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const payload = await req.json();

  const planToInsert = {
    name: payload.name,
    slug: payload.slug,
    monthly_credit: payload.monthly_credit ?? 0,
    price_cents: payload.price_cents ?? 0,
    currency: payload.currency ?? "EUR",
    features: payload.features ?? [],
    stripe_product_id: payload.stripe_product_id ?? null,
    stripe_price_id: payload.stripe_price_id ?? null,
    description: payload.description ?? null,
    active: payload.active ?? true,
    is_public: payload.is_public ?? true,
    sort_order: payload.sort_order ?? 0,
    sub_features: payload.sub_features ?? null,
    type: payload.type ?? null,
  };

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data, error } = await supabase
    .from("plans")
    .insert(planToInsert)
    .select("*")
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ data }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { requireAdmin } from "../_shared/admin.ts";

serve(async (req) => {
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

    const adminCheck = await requireAdmin(req);

    if (!adminCheck.ok) {
      return new Response(
        JSON.stringify({ error: adminCheck.error }),
        {
          status: adminCheck.status,
          headers: corsHeaders,
        }
      );
    }

    const { supabase } = adminCheck;

    const {
      name,
      slug,
      credit_amount,
      price_cents,
      currency,
      description,
      active,
      is_public,
      sort_order,
    } = await req.json();

    if (!name || !slug || !credit_amount || !price_cents) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    const { data, error } = await supabase
      .from("credit_packs")
      .insert({
        name,
        slug,
        credit_amount,
        price_cents,
        currency: currency ?? "EUR",
        description: description ?? null,
        active: active ?? true,
        is_public: is_public ?? true,
        sort_order: sort_order ?? 0,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return new Response(
          JSON.stringify({ error: "Slug already exists" }),
          {
            status: 409,
            headers: corsHeaders,
          }
        );
      }

      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }

    return new Response(
      JSON.stringify({ data }),
      {
        status: 201,
        headers: corsHeaders,
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Internal server error",
      }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});
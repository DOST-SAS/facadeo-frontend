import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

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

    const { quote_id } = await req.json();

    if (!quote_id) {
      return new Response(
        JSON.stringify({ error: "quote_id is required" }),
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SERVICE_ROLE_KEY")!
    );

    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .select(`*, artisan:profiles(*)`)
      .eq("id", quote_id)
      .single();

    if (quoteError || !quote) {
      return new Response(
        JSON.stringify({ error: "Quote not found" }),
        {
          status: 404,
          headers: corsHeaders,
        }
      );
    }

    const { data: items, error: itemsError } = await supabase
      .from("quote_items")
      .select(`
        id,
        description,
        unit_price_cents,
        unit,
        quantity,
        total_cents,
        sort_order,
        facade_id
      `)
      .eq("quote_id", quote_id)
      .order("sort_order", { ascending: true });

    if (itemsError) {
      return new Response(
        JSON.stringify({ error: "Failed to load quote items" }),
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }

    const artisanId = quote.artisan?.id;
    let profileMetiers: any[] = [];

    if (artisanId) {
      const { data, error: metiersError } = await supabase
        .from("profile_metiers")
        .select(`
          id,
          description,
          metier:metiers (
            id,
            key,
            label,
            icon_url
          )
        `)
        .eq("profile_id", artisanId)
        .eq("active", true);

      if (metiersError) {
        return new Response(
          JSON.stringify({ error: "Failed to load artisan metiers" }),
          {
            status: 500,
            headers: corsHeaders,
          }
        );
      }

      profileMetiers = data ?? [];
    }

    const facadeIds = (items ?? []).map((i: any) => i.facade_id).filter(Boolean);
    let facades: any = [];

    if (facadeIds.length > 0) {
      const { data: fData, error: fError } = await supabase
        .from("facades")
        .select(`
          id,
          facade_number,
          address,
          streetview_url,
          surface_m2,
          score,
          metadata
        `)
        .in("id", facadeIds);

      if (fError) {
        return new Response(
          JSON.stringify({ error: "Failed to load facades" }),
          {
            status: 500,
            headers: corsHeaders,
          }
        );
      }

      if (fData && fData.length > 0) {
        const { data: sfData } = await supabase
          .from("scan_facades")
          .select("facade_id, simulated_facade_image")
          .in("facade_id", facadeIds);

        const simMap = new Map(
          (sfData ?? []).map((row: any) => [row.facade_id, row.simulated_facade_image])
        );

        facades = fData.map((facade: any) => ({
          ...facade,
          facades_sim: simMap.get(facade.id) ?? null,
        }));
      }
    }

    if (!quote.viewed_at) {
      await supabase
        .from("quotes")
        .update({ viewed_at: new Date().toISOString() })
        .eq("id", quote_id);
    }

    return new Response(
      JSON.stringify({
        quote,
        quote_items: items ?? [],
        metiers: profileMetiers.map((pm: any) => pm.metier).filter(Boolean),
        facades,
      }),
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "Invalid request",
        details: err instanceof Error ? err.message : String(err),
      }),
      {
        status: 400,
        headers: corsHeaders,
      }
    );
  }
});
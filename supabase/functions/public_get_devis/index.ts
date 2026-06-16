import { serve } from "https://deno.land/std@0.192.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { quote_id } = await req.json()
    if (!quote_id) {
      return new Response(
        JSON.stringify({ error: "quote_id is required" }),
        { status: 400, headers: corsHeaders }
      )
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    /* 1️⃣ Quote + Artisan profile */
    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .select(`*,artisan:profiles (*)`)
      .eq("id", quote_id)
      .single()

    if (quoteError || !quote) {
      return new Response(
        JSON.stringify({ error: "Quote not found" }),
        { status: 404, headers: corsHeaders }
      )
    }

    /* 2️⃣ Quote items */
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
      .order("sort_order", { ascending: true })

    if (itemsError) {
      return new Response(
        JSON.stringify({ error: "Failed to load quote items" }),
        { status: 500, headers: corsHeaders }
      )
    }

    /* 3️⃣ Artisan métiers */
    const { data: profileMetiers, error: metiersError } = await supabase
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
      .eq("profile_id", quote.artisan.id)
      .eq("active", true)

    if (metiersError) {
      return new Response(
        JSON.stringify({ error: "Failed to load artisan metiers" }),
        { status: 500, headers: corsHeaders }
      )
    }

    /* 4️⃣ Facades related to this quote */
    const facadeIds = items.map(i => i.facade_id).filter(Boolean)
    let facades = []
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
        .in("id", facadeIds)

      if (fError) {
        return new Response(
          JSON.stringify({ error: "Failed to load facades" }),
          { status: 500, headers: corsHeaders }
        )
      }
        const { data: s_fData, error: s_fError } = await supabase
          .from("scan_facades")
          .select(`simulated_facade_image`)
          .eq("facade_id", fData[0].id)
      
          const facades_sim = s_fData[0].simulated_facade_image
          facades = {...fData[0],facades_sim}

      
    }

    /* 5️⃣ Mark as viewed */
    if (!quote.viewed_at) {
      await supabase
        .from("quotes")
        .update({ viewed_at: new Date().toISOString() })
        .eq("id", quote_id)
    }

    /* 6️⃣ Final response */
    return new Response(
      JSON.stringify({
        quote,
        quote_items: items,
        metiers: profileMetiers?.map(pm => pm.metier) || [],
        facades
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    )

  } catch (err) {
  return new Response(JSON.stringify({ error: "Invalid request", details: String(err) }), { status: 400, headers: corsHeaders });
}

})


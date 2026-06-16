import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { quote_id, status } = await req.json();

    if (!quote_id || !status) {
      return new Response(
        JSON.stringify({ error: "quote_id and status are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 🧠 build update payload dynamically
    const updateData: Record<string, any> = { status };

    const now = new Date().toISOString();

    switch (status) {
      case "sent":
        updateData.sent_at = now;
        break;
      case "viewed":
        updateData.viewed_at = now;
        break;
      case "accepted":
        updateData.accepted_at = now;
        break;
      case "refused":
        updateData.refused_at = now;
        break;
    }

    const { error } = await supabase
      .from("quotes")
      .update(updateData)
      .eq("id", quote_id);

    if (error) {
      return new Response(
        JSON.stringify({ error: "Failed to update quote status", details: error }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Quote status updated" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Unexpected error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

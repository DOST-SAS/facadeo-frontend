import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST" && req.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: corsHeaders,
      }
    );
  }

  try {
    const now = new Date().toISOString();

    const { data: expiredQuotes, error } = await supabase
      .from("quotes")
      .update({
        status: "expired",
        updated_at: new Date().toISOString(),
      })
      .eq("status", "sent")
      .lt("valid_until", now)
      .select("id");

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        expired_count: expiredQuotes?.length ?? 0,
      }),
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Cron failed",
      }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});
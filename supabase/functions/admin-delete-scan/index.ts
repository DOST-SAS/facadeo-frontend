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
    const { scanId } = await req.json();

    if (!scanId) {
      return new Response(
        JSON.stringify({ error: "scanId is required" }),
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    const { error: sfDelErr } = await supabase
      .from("scan_facades")
      .delete()
      .eq("scan_id", scanId);

    if (sfDelErr) {
      return new Response(
        JSON.stringify({ error: sfDelErr.message }),
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }

    const { error: scanDelErr } = await supabase
      .from("scans")
      .delete()
      .eq("id", scanId);

    if (scanDelErr) {
      return new Response(
        JSON.stringify({ error: scanDelErr.message }),
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        deletedScanId: scanId,
      }),
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});
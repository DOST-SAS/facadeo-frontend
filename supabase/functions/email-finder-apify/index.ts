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

    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    const { website } = body;

    if (!website) {
      return new Response(
        JSON.stringify({ success: false, error: "website is required" }),
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data, error } = await supabase
      .from("app_setting")
      .select("apifyApiKey")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data?.apifyApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Apify API key not found" }),
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }

    const APIFY_TOKEN = data.apifyApiKey?.key;

    if (!APIFY_TOKEN) {
      return new Response(
        JSON.stringify({ success: false, error: "Apify API key is empty" }),
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }

    const APIFY_URL =
      `https://api.apify.com/v2/acts/caprolok~website-email-phone-finder/run-sync-get-dataset-items?token=${APIFY_TOKEN}`;

    const res = await fetch(APIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domains: [website] }),
    });

    if (!res.ok) {
      return new Response(
        JSON.stringify({ success: false, error: "Apify request failed" }),
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }

    const apifyData = await res.json();

    const emails =
      apifyData?.[0]?.emails
        ? [...new Set(apifyData[0].emails.map((e: string) => e.toLowerCase()))]
        : [];

    if (emails.length === 0) {
      return new Response(
        JSON.stringify({ success: false, emails: [] }),
        {
          status: 200,
          headers: corsHeaders,
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, emails }),
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : "Internal server error",
      }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});
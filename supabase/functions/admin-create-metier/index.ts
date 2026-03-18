import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { requireAdmin } from "../_shared/admin.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", {
        status: 405,
        headers: corsHeaders,
      });
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
    const body = await req.json();

    if (!body.key || !body.label) {
      return new Response(
        JSON.stringify({ error: "key and label are required" }),
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    const { data, error } = await supabase
      .from("metiers")
      .insert(body)
      .select()
      .single();

    if (error) {
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
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid body" }),
      {
        status: 400,
        headers: corsHeaders,
      }
    );
  }
});
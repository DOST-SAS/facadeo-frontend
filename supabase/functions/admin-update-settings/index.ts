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
    const body = await req.json();

    if (!body.id) {
      return new Response(
        JSON.stringify({ error: "Missing app_setting id" }),
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    const { id, ...updateData } = body;

    const { data, error } = await supabase
      .from("app_setting")
      .update(updateData)
      .eq("id", id)
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
      JSON.stringify({
        data,
        message: "App setting updated successfully",
      }),
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Invalid body",
      }),
      {
        status: 400,
        headers: corsHeaders,
      }
    );
  }
});
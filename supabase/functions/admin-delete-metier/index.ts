import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { requireAdmin } from "../_shared/admin.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "DELETE") {
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

    const { id } = await req.json();

    if (!id) {
      return new Response(
        JSON.stringify({ error: "id is required" }),
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    const { error } = await supabase
      .from("metiers")
      .delete()
      .eq("id", id);

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
      JSON.stringify({ success: true }),
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
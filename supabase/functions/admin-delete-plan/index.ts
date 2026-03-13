import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { requireAdmin } from "../_shared/admin.ts";

serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (req.method !== "GET") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: corsHeaders,
        },
      );
    }

    const adminCheck = await requireAdmin(req);

    if (!adminCheck.ok) {
      return new Response(
        JSON.stringify({ error: adminCheck.error }),
        {
          status: adminCheck.status,
          headers: corsHeaders,
        },
      );
    }

    const { supabase } = adminCheck;

    const { data, error, count } = await supabase
      .from("plans")
      .select("*", { count: "exact" })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: corsHeaders,
        },
      );
    }

    const plans = data ?? [];

    return new Response(
      JSON.stringify({
        data: plans,
        pagination: {
          page: 1,
          limit: 100,
          total: count ?? plans.length,
          totalPages: 1,
        },
      }),
      {
        status: 200,
        headers: corsHeaders,
      },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown server error";

    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
});
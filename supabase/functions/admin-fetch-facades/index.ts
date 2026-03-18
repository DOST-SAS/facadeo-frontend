import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { requireAdmin } from "../_shared/admin.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "GET") {
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

    const url = new URL(req.url);
    const page = Number(url.searchParams.get("page") ?? "1");
    const limit = Number(url.searchParams.get("limit") ?? "10");
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const searchterm = url.searchParams.get("searchterm") ?? "";
    const typeFilter = url.searchParams.get("type") ?? "";
    const scoreFilter = url.searchParams.get("score") ?? "";

    let query = supabase
      .from("facades")
      .select(
        `
        *,
        scan_facades(
          *,
          scans(*)
        ),
        businesses_cache(*)
      `,
        { count: "exact" }
      )
      .eq("flagged", false);

    if (searchterm) {
      query = query.ilike("location", `%${searchterm}%`);
    }

    if (typeFilter && typeFilter !== "all") {
      query = query.ilike("types", `%${typeFilter}%`);
    }

    if (scoreFilter !== "all") {
      if (scoreFilter === "high") {
        query = query.gte("score", 70);
      }

      if (scoreFilter === "medium") {
        query = query.gte("score", 40).lte("score", 69);
      }

      if (scoreFilter === "low") {
        query = query.lt("score", 40);
      }
    }

    query = query
      .range(from, to)
      .order("created_at", { ascending: false });

    const { data: facades, error, count } = await query;

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
        data: facades ?? [],
        pagination: {
          page,
          limit,
          total: count ?? 0,
          totalPages: Math.ceil((count ?? 0) / limit),
        },
      }),
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Internal server error",
      }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});
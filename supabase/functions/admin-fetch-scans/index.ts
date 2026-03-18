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
    const status = url.searchParams.get("status") ?? "";

    let query = supabase
      .from("scans")
      .select(
        `
        *,
        scan_facades(
          id
        )
      `,
        { count: "exact" }
      );

    if (searchterm) {
      query = query.or(
        `name.ilike.%${searchterm}%,address_text.ilike.%${searchterm}%`
      );
    }

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    query = query
      .order("created_at", { ascending: false })
      .range(from, to);

    const { data: scans, error, count } = await query;

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }

    const scansWithCount =
      scans?.map((scan: any) => ({
        ...scan,
        facadesCount: scan.scan_facades?.length ?? 0,
      })) ?? [];

    return new Response(
      JSON.stringify({
        data: scansWithCount,
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
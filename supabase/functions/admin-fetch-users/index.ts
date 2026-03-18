import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { requireAdmin } from "../_shared/admin.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "GET") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: corsHeaders,
      });
    }

    const adminCheck = await requireAdmin(req);

    if (!adminCheck.ok) {
      return new Response(JSON.stringify({ error: adminCheck.error }), {
        status: adminCheck.status,
        headers: corsHeaders,
      });
    }

    const { supabase } = adminCheck;

    const url = new URL(req.url);
    const page = Number(url.searchParams.get("page") ?? "1");
    const limit = Number(url.searchParams.get("limit") ?? "10");
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const searchterm = (url.searchParams.get("searchterm") ?? "").trim();
    const status = (url.searchParams.get("status") ?? "").trim();

    let query = supabase
      .from("profiles")
      .select(
        `
        *,
        scans:scans!scans_profile_id_fkey(id),
        quotes:quotes!quotes_profile_id_fkey(id)
      `,
        { count: "exact" }
      )
      .eq("role", "artisan");

    if (searchterm) {
      query = query.ilike("display_name", `%${searchterm}%`);
    }

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    query = query.range(from, to).order("display_name", { ascending: true });

    const { data: users, error, count } = await query;

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    const formattedData =
      users?.map((u) => ({
        id: String(u.id),
        display_name: u.display_name,
        email: u.email,
        role: u.role,
        status: u.status,
        numberScans: u.scans?.length ?? 0,
        numberDevis: u.quotes?.length ?? 0,
        created_at: u.created_at?.split("T")[0] ?? "",
        avatar: u.avatar,
        cin: u.cin ?? "",
      })) ?? [];

    return new Response(
      JSON.stringify({
        data: formattedData,
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
        error: err instanceof Error ? err.message : "Unknown server error",
      }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});
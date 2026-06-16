import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers })

  const url = new URL(req.url)
  const page = Number(url.searchParams.get("page") ?? 1)
  const limit = Number(url.searchParams.get("limit") ?? 10)
  const from = (page - 1) * limit
  const to = from + limit - 1

  const searchterm = url.searchParams.get("searchterm") ?? ""
  const statusFilter = url.searchParams.get("status") ?? ""

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )

  let query = supabase
    .from("quotes")
    .select(`
      *,
      scan:scans(*),
      artisan:profiles(*)
    `, { count: "exact" })
    .range(from, to)
    .order("created_at", { ascending: false })

  // Apply filters
  if (searchterm) {
    query = query.or(
      `quote_number.ilike.%${searchterm}%`
    )
  }
  if (statusFilter && statusFilter !== "all") query = query.eq("status", statusFilter)

  const { data: devisList, error, count } = await query

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers,
    })
  }

  return new Response(
    JSON.stringify({
      data: devisList,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    }),
    { headers }
  )
})

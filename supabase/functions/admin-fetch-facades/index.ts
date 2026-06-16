import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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
  const typeFilter = url.searchParams.get("type") ?? ""
  const scoreFilter = url.searchParams.get("score") ?? ""

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )

let query = supabase
  .from("facades")
  .select(`
    *,
    scan_facades(
    *,
        scans(*) 
    ),
    businesses_cache(*)
  `, { count: "exact" }).eq('flagged',false)


// Apply filters
if (searchterm) query = query.ilike("location", `%${searchterm}%`)
if (typeFilter && typeFilter !== "all") query = query.ilike("types", `%${typeFilter}%`)
if (scoreFilter !== "all") {
  if (scoreFilter === "high") {
    query = query.gte("score", 70)
  }

  if (scoreFilter === "medium") {
    query = query.gte("score", 40).lte("score", 69)
  }

  if (scoreFilter === "low") {
    query = query.lt("score", 40)
  }
}


query = query.range(from, to).order("created_at", { ascending: false })

const { data: facades, error, count } = await query

if (error) {
  return new Response(JSON.stringify({ error: error.message }), {
    status: 500,
    headers,
  })
}

return new Response(
  JSON.stringify({
    data: facades,
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

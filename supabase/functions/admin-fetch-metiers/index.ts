import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
}
function escapeLike(value: string) {
  let escaped = value.replace(/[\\%_'"\(\)\[\]\{\}]/g, "\\$&")
  if (escaped.endsWith("\\")) {
    escaped = escaped.slice(0, -1)
  }
  return escaped
}


serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers })

  const url = new URL(req.url)
  const page = Number(url.searchParams.get("page") ?? 1)
  const limit = Number(url.searchParams.get("limit") ?? 10)
  const from = (page - 1) * limit
  const to = from + limit - 1

  const searchterm = url.searchParams.get("searchterm") ?? ""
  const status = url.searchParams.get("status") ?? ""


  let query = supabase
    .from("metiers")
    .select(`*`, { count: "exact" })
    .range(from, to)
    .order("created_at", { ascending: false })

  // Apply filters


if (searchterm) {
  const escaped = escapeLike(searchterm)
  query = query.ilike("label", `%${escaped}%`)
}

  if (status && status !== "all") query = query.eq("active", status)

  const { data: metiers, error, count } = await query

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers,
    })
  }

  return new Response(
    JSON.stringify({
      data: metiers,
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

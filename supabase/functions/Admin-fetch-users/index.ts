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
  const status = url.searchParams.get("status") ?? ""

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )

  let query = supabase
    .from("profiles")
    .select(`
      *,
      scans:scans!scans_profile_id_fkey(id),
      quotes:quotes!quotes_profile_id_fkey(id)
    `, { count: "exact" })
    .eq("role", "artisan") 

  // Apply filters
  if (searchterm) query = query.ilike("display_name", `%${searchterm}%`)
  if (status && status !== "all") query = query.eq("status", status)

  query = query.range(from, to).order("display_name", { ascending: true })

  const { data: users, error, count } = await query

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers,
    })
  }

  // Format data with number of scans and quotes
  const formattedData = users?.map(u => ({
    id: u.id.toString(),
    display_name: u.display_name,
    email: u.email,
    role: u.role,
    status: u.status,
    numberScans: u.scans?.length ?? 0,
    numberDevis: u.quotes?.length ?? 0,
    created_at: u.created_at?.split("T")[0] ?? "",
    avatar: u.avatar,
    cin: u.cin ?? "",
  }))

  return new Response(
    JSON.stringify({
      data: formattedData,
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

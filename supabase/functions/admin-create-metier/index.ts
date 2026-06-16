import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers })
  if (req.method !== "POST")
    return new Response("Method not allowed", { status: 405, headers })

  try {
    const body = await req.json()

    if (!body.key || !body.label) {
      return new Response(
        JSON.stringify({ error: "key and label are required" }),
        { status: 400, headers }
      )
    }

    const { data, error } = await supabase
      .from("metiers")
      .insert(body)
      .select()
      .single()

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers,
      })
    }

    return new Response(JSON.stringify({ data }), { headers })
  } catch (err) {
    return new Response(JSON.stringify({ error: "Invalid body" }), {
      status: 400,
      headers,
    })
  }
})

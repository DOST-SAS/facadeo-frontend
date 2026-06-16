import { serve } from "https://deno.land/std@0.192.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders })
    }

    if (req.method !== "GET") {
      return new Response("Method not allowed", {
        status: 405,
        headers: corsHeaders,
      })
    }

    const url = new URL(req.url)
    const email = url.searchParams.get("email")

    if (!email) {
      return new Response("Missing email parameter", {
        status: 400,
        headers: corsHeaders,
      })
    }

    /* ✅ Create client INSIDE handler */
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

    if (!supabaseUrl || !serviceKey) {
      return new Response("Missing Supabase env vars", {
        status: 500,
        headers: corsHeaders,
      })
    }

    const supabase = createClient(supabaseUrl, serviceKey)

    const { error } = await supabase
      .from("email_unsubscribes")
      .insert({
        email,
        reason: "Unsubscribed via email link",
      })

    /* Ignore duplicate unsubscribe */
    if (error && error.code !== "23505") {
      return new Response(error.message, {
        status: 500,
        headers: corsHeaders,
      })
    }
    const returnTo = 'https://facadeo.netlify.app/'
    return new Response(null, {
      status: 302,
      headers: {
        Location: returnTo,
      },
    })

  } catch (err) {
    return new Response(String(err), {
      status: 500,
      headers: corsHeaders,
    })
  }
})

import { serve } from "https://deno.land/std@0.192.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

serve(async (req) => {
  console.log("➡️ Incoming request:", req.method, req.url)

  // Preflight
  if (req.method === "OPTIONS") {
    console.log("⚡ CORS preflight")
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  if (req.method !== "POST") {
    console.log("❌ Invalid method:", req.method)
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: corsHeaders }
    )
  }

  let body: any
  try {
    body = await req.json()
    console.log("📦 Request body:", body)
  } catch (e) {
    console.error("❌ Invalid JSON body:", e)
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: corsHeaders }
    )
  }

  const { website } = body

  if (!website) {
    console.log("❌ website missing in body")
    return new Response(
      JSON.stringify({ success: false, error: "website is required" }),
      { status: 400, headers: corsHeaders }
    )
  }

  // 1) جيب الإعدادات من جدول app_setting
  console.log("🔎 Fetching apifyApiKey from app_setting...")

  const { data, error } = await supabase
    .from("app_setting")
    .select("apifyApiKey")
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  console.log("🗄 Supabase raw data:", data)
  console.log("🗄 Supabase error:", error)

  if (error || !data?.apifyApiKey) {
    console.error("❌ Apify key not found in DB")
    return new Response(
      JSON.stringify({ success: false, error: "Apify API key not found" }),
      { status: 500, headers: corsHeaders }
    )
  }

  console.log("🔑 apifyApiKey field:", data.apifyApiKey)

  // 2) استخرج الـ key من jsonb
  const APIFY_TOKEN = data.apifyApiKey.key

  console.log("🔑 Extracted APIFY_TOKEN:", APIFY_TOKEN)

  if (!APIFY_TOKEN) {
    console.error("❌ APIFY_TOKEN is empty after extraction")
    return new Response(
      JSON.stringify({ success: false, error: "Apify API key is empty" }),
      { status: 500, headers: corsHeaders }
    )
  }

  const APIFY_URL =
    `https://api.apify.com/v2/acts/caprolok~website-email-phone-finder/run-sync-get-dataset-items?token=${APIFY_TOKEN}`

  console.log("🌐 APIFY_URL:", APIFY_URL)

  // 3) نعيّط على Apify
  console.log("🚀 Calling Apify with domain:", website)

  const res = await fetch(APIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ domains: [website] }),
  })

  console.log("📡 Apify response status:", res.status)

  if (!res.ok) {
    const text = await res.text()
    console.error("❌ Apify error body:", text)
    return new Response(
      JSON.stringify({ success: false, error: "Apify request failed" }),
      { status: 500, headers: corsHeaders }
    )
  }

  const apifyData = await res.json()

  console.log("📨 Apify raw data:", apifyData)

  const emails =
    apifyData?.[0]?.emails
      ? [...new Set(apifyData[0].emails.map((e: string) => e.toLowerCase()))]
      : []

  console.log("📧 Extracted emails:", emails)

  if (emails.length === 0) {
    console.log("⚠️ No emails found")
    return new Response(
      JSON.stringify({ success: false, emails: [] }),
      { status: 200, headers: corsHeaders }
    )
  }

  console.log("✅ Success, returning emails")

  return new Response(
    JSON.stringify({ success: true, emails }),
    { status: 200, headers: corsHeaders }
  )
})

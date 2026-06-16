import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { start_date, end_date } = await req.json()

    if (!start_date || !end_date) {
      return new Response(
        JSON.stringify({ error: "start_date and end_date are required" }),
        { status: 400, headers: corsHeaders }
      )
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    const end = new Date(end_date)
    end.setDate(end.getDate() + 1)

    const { data, error } = await supabase
      .from("credit_ledger")
      .select("type, amount")
      .gte("created_at", start_date)
      .lt("created_at", end.toISOString())

    if (error) throw error

    let rawConsumed = 0
    let refundTotal = 0

    const breakdown: Record<
      string,
      { consumed: number; refunded: number; operations: number }
    > = {}

    for (const row of data) {
      if (!breakdown[row.type]) {
        breakdown[row.type] = {
          consumed: 0,
          refunded: 0,
          operations: 0,
        }
      }

      // استهلاك
      if (row.amount < 0) {
        const val = Math.abs(row.amount)
        rawConsumed += val
        breakdown[row.type].consumed += val
        breakdown[row.type].operations += 1
      }

      // Refund
      if (
        row.amount > 0 &&
        (row.type === "refund" || row.type === "scan_refund")
      ) {
        refundTotal += row.amount
        breakdown[row.type].refunded += row.amount
      }
    }

    const netConsumed = Math.max(rawConsumed - refundTotal, 0)

    return new Response(
      JSON.stringify({
        scope: "platform",
        period: { start_date, end_date },
        raw_consumed: rawConsumed,
        refund_total: refundTotal,
        net_consumed: netConsumed,
        breakdown,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: corsHeaders }
    )
  }
})

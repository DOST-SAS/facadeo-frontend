import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { requireAdmin } from "../_shared/admin.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
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
    const { start_date, end_date } = await req.json();

    if (!start_date || !end_date) {
      return new Response(
        JSON.stringify({ error: "start_date and end_date are required" }),
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    const end = new Date(end_date);
    end.setDate(end.getDate() + 1);

    const { data, error } = await supabase
      .from("credit_ledger")
      .select("type, amount")
      .gte("created_at", start_date)
      .lt("created_at", end.toISOString());

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }

    let rawConsumed = 0;
    let refundTotal = 0;

    const breakdown: Record<
      string,
      { consumed: number; refunded: number; operations: number }
    > = {};

    for (const row of data ?? []) {
      if (!breakdown[row.type]) {
        breakdown[row.type] = {
          consumed: 0,
          refunded: 0,
          operations: 0,
        };
      }

      if (row.amount < 0) {
        const val = Math.abs(row.amount);
        rawConsumed += val;
        breakdown[row.type].consumed += val;
        breakdown[row.type].operations += 1;
      }

      if (
        row.amount > 0 &&
        (row.type === "refund" || row.type === "scan_refund")
      ) {
        refundTotal += row.amount;
        breakdown[row.type].refunded += row.amount;
      }
    }

    const netConsumed = Math.max(rawConsumed - refundTotal, 0);

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
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : String(err),
      }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});
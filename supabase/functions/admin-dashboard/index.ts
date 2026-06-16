import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  /* ================= HELPERS ================= */

  function computeTrend(current: number, previous: number) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  function formatDate(d: Date) {
    return d.toISOString().split("T")[0];
  }

  function getPeriodRange(
    date: Date,
    type: "daily" | "weekly" | "monthly"
  ) {
    const start = new Date(date);
    const end = new Date(date);

    if (type === "daily") {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }

    if (type === "weekly") {
      const day = start.getDay(); // 0 = Sunday
      const diff = day === 0 ? -6 : 1 - day;
      start.setDate(start.getDate() + diff);
      start.setHours(0, 0, 0, 0);

      end.setTime(start.getTime());
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    }

    if (type === "monthly") {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);

      end.setMonth(start.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
    }

    return { start, end };
  }

  function inRange(date: string, start: Date, end: Date) {
    const d = new Date(date);
    return d >= start && d <= end;
  }

  /* ================= MAIN ================= */

  try {
    const { periodType = "monthly" } = await req.json().catch(() => ({}));

    const now = new Date();

    const { start: currentStart, end: currentEnd } =
      getPeriodRange(now, periodType);

    const previousRef = new Date(currentStart);

    if (periodType === "daily")
      previousRef.setDate(previousRef.getDate() - 1);
    if (periodType === "weekly")
      previousRef.setDate(previousRef.getDate() - 7);
    if (periodType === "monthly")
      previousRef.setMonth(previousRef.getMonth() - 1);

    const { start: previousStart, end: previousEnd } =
      getPeriodRange(previousRef, periodType);

    /* ========== ARTISANS ========== */

    const { count: artisansCurrent } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "artisan")
      .gte("created_at", currentStart.toISOString())
      .lte("created_at", currentEnd.toISOString());

    const { count: artisansPrev } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "artisan")
      .gte("created_at", previousStart.toISOString())
      .lte("created_at", previousEnd.toISOString());

    /* ========== SCANS + FACADES (ONE QUERY) ========== */

    const { data: scansWithFacades } = await supabase
      .from("scans")
      .select(
        `
        id,
        created_at,
        scan_facades (
          id
        )
      `
      )
      .gte("created_at", previousStart.toISOString())
      .lte("created_at", currentEnd.toISOString());

    /* ========== DEVIS ========== */

    const { data: devisData } = await supabase
      .from("quotes")
      .select("id, created_at")
      .gte("created_at", previousStart.toISOString())
      .lte("created_at", currentEnd.toISOString());

    /* ========== PAYMENTS ========== */

    const { data: paymentsData } = await supabase
      .from("payments")
      .select("amount_cents, created_at")
      .eq("status", "succeeded")
      .gte("created_at", previousStart.toISOString())
      .lte("created_at", currentEnd.toISOString());

    const sumRevenue = (
      data: { amount_cents: number; created_at: string }[],
      start: Date,
      end: Date
    ) =>
      data
        ?.filter((p) => inRange(p.created_at, start, end))
        .reduce((sum, p) => sum + p.amount_cents, 0) ?? 0;

    const revenueCurrent = sumRevenue(
      paymentsData ?? [],
      currentStart,
      currentEnd
    );

    const revenuePrev = sumRevenue(
      paymentsData ?? [],
      previousStart,
      previousEnd
    );

    /* ========== CURRENT PERIOD COUNTS ========== */

    const scansCurrent =
      scansWithFacades?.filter((s) =>
        inRange(s.created_at, currentStart, currentEnd)
      ) ?? [];

    const facadeIdsCurrent = new Set<string>();
    scansCurrent.forEach((s) =>
      s.scan_facades?.forEach((f) => facadeIdsCurrent.add(f.id))
    );

    const devisCurrent =
      devisData?.filter((d) =>
        inRange(d.created_at, currentStart, currentEnd)
      ).length ?? 0;

    /* ========== ADMIN STATS ========== */

    const adminStats = [
      {
        icon: "Users",
        label: "Artisans",
        value: artisansCurrent ?? 0,
        trend: computeTrend(artisansCurrent ?? 0, artisansPrev ?? 0),
      },
      {
        icon: "ScanLine",
        label: "Scans",
        value: scansCurrent.length,
        trend: 0,
      },
      {
        icon: "Building2",
        label: "Façades",
        value: facadeIdsCurrent.size,
        trend: 0,
      },
      {
        icon: "FileText",
        label: "Devis",
        value: devisCurrent,
        trend: 0,
      },
      {
        icon: "Euro",
        label: "Revenus",
        value: revenueCurrent / 100,
        trend: computeTrend(revenueCurrent, revenuePrev),
      },
    ];

    /* ========== CHART DATA (12 periods) ========== */

    const chartData = [];
    const periodsToShow = 12;

    for (let i = periodsToShow - 1; i >= 0; i--) {
      const refDate = new Date(currentStart);

      if (periodType === "daily")
        refDate.setDate(refDate.getDate() - i);
      if (periodType === "weekly")
        refDate.setDate(refDate.getDate() - i * 7);
      if (periodType === "monthly")
        refDate.setMonth(refDate.getMonth() - i);

      const { start, end } = getPeriodRange(refDate, periodType);

      const scansPeriod =
        scansWithFacades?.filter((s) =>
          inRange(s.created_at, start, end)
        ) ?? [];

      const facadeIds = new Set<string>();
      scansPeriod.forEach((s) =>
        s.scan_facades?.forEach((f) => facadeIds.add(f.id))
      );

      const devisCount =
        devisData?.filter((d) => inRange(d.created_at, start, end)).length ?? 0;

      chartData.push({
        date: formatDate(start),
        scans: scansPeriod.length,
        facades: facadeIds.size,
        devis: devisCount,
      });
    }

    return new Response(JSON.stringify({ adminStats, chartData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("ADMIN STATS ERROR:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

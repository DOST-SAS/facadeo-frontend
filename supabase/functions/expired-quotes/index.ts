import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async () => {
  try {
    const now = new Date().toISOString();

    const { data: expiredQuotes, error } = await supabase
      .from("quotes")
      .update({
        status: "expired",
        updated_at: new Date(),
      })
      .eq("status", "sent")
      .lt("valid_until", now)
      .select("id");

    if (error) throw error;

    return new Response(
      JSON.stringify({
        success: true,
        expired_count: expiredQuotes?.length ?? 0,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Expire quotes cron error:", err);
    return new Response(
      JSON.stringify({ error: "Cron failed" }),
      { status: 500 }
    );
  }
});

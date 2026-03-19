import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "GET") {
      return new Response("Method not allowed", {
        status: 405,
        headers: corsHeaders,
      });
    }

    const url = new URL(req.url);
    const trackingId = url.pathname.split("/").pop();

    if (!trackingId) {
      return new Response("Missing ID", {
        status: 400,
        headers: corsHeaders,
      });
    }

    const { data: email } = await supabase
      .from("email_queue")
      .select("opened_at, oppend_count")
      .eq("id", trackingId)
      .single();

    await supabase
      .from("email_queue")
      .update({
        opened: true,
        opened_at: email?.opened_at || new Date().toISOString(),
        oppend_count: (email?.oppend_count || 0) + 1,
      })
      .eq("id", trackingId);

    const imgBase64 =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";
    const imgBytes = Uint8Array.from(atob(imgBase64), (c) => c.charCodeAt(0));

    return new Response(imgBytes, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (err) {
    return new Response("Error", { status: 500 });
  }
});
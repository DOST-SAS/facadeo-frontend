import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const trackingId = url.pathname.split("/").pop();

    if (!trackingId) return new Response("Missing ID", { status: 400 });

    const { data: email } = await supabase
      .from("email_queue")
      .select("opened_at, oppend_count")
      .eq("id", trackingId)
      .single();

    await supabase.from("email_queue").update({
      opened: true,
      opened_at: email.opened_at || new Date().toISOString(),
      oppend_count: (email.oppend_count || 0) + 1,
    }).eq("id", trackingId);

    // 1x1 transparent PNG base64
    const imgBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";
    const imgBytes = Uint8Array.from(atob(imgBase64), c => c.charCodeAt(0));

    return new Response(imgBytes, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (err) {
    console.error(err);
    return new Response("Error", { status: 500 });
  }
});

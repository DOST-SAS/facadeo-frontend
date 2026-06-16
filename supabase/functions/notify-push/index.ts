import webpush from "npm:web-push";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

webpush.setVapidDetails(
  "mailto:support@facadeo.com",
  Deno.env.get("VAPID_PUBLIC_KEY")!,
  Deno.env.get("VAPID_PRIVATE_KEY")!
);

serve(async (req) => {
  try {
    const payload = await req.json();

    const notification = payload.record;
    if (!notification) return new Response("no record", { status: 200 });

    const { profile_id, title, message, metadata } = notification;

    const { data: subs, error } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("profile_id", profile_id);

    if (error) return new Response(`DB error: ${error.message}`, { status: 500 });
    if (!subs || subs.length === 0) return new Response("no subscriptions", { status: 200 });

    await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            JSON.stringify({
              title,
              message,
              url: metadata?.redirect ?? "/scans", 
            })
          );
        } catch (err) {
          console.error("Failed push, deleting subscription:", sub.id, err);
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        }
      })
    );

    return new Response("ok", { status: 200 });

  } catch (err: any) {
    console.error("Error in notify-push function:", err);
    return new Response(err.message ?? "Unknown error", { status: 500 });
  }
});

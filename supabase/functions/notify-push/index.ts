import webpush from "npm:web-push";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SERVICE_ROLE_KEY")!
);

webpush.setVapidDetails(
  "mailto:support@facadeo.com",
  Deno.env.get("VAPID_PUBLIC_KEY")!,
  Deno.env.get("VAPID_PRIVATE_KEY")!
);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const payload = await req.json();
    const notification = payload.record;

    if (!notification) {
      return new Response("no record", {
        status: 200,
        headers: corsHeaders,
      });
    }

    const { profile_id, title, message, metadata } = notification;

    const { data: subs, error } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("profile_id", profile_id);

    if (error) {
      return new Response(`DB error: ${error.message}`, {
        status: 500,
        headers: corsHeaders,
      });
    }

    if (!subs || subs.length === 0) {
      return new Response("no subscriptions", {
        status: 200,
        headers: corsHeaders,
      });
    }

    await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            JSON.stringify({
              title,
              message,
              url: metadata?.redirect ?? "/scans",
            })
          );
        } catch (err) {
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("id", sub.id);
        }
      })
    );

    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    return new Response(
      err instanceof Error ? err.message : "Unknown error",
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});
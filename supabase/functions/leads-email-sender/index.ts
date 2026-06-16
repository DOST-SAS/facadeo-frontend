import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    // 1️⃣ Fetch pending emails
    const { data: pendingEmails, error } = await supabase
      .from("email_queue")
      .select("*")
      .eq("status", "pending")
      .limit(10);

    if (error) throw error;
    if (!pendingEmails || pendingEmails.length === 0) {
      return new Response(JSON.stringify({ message: "No pending emails" }), { headers: corsHeaders });
    }

    // 2️⃣ App settings
    const { data: settings } = await supabase
      .from("app_setting")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!settings?.emailEnabled) {
      return new Response(JSON.stringify({ error: "Email service disabled" }), { status: 403, headers: corsHeaders });
    }

    const results: any[] = [];

    for (const email of pendingEmails) {
      try {
        // 3️⃣ Check unsubscribe
        const { data: unsub } = await supabase
          .from("email_unsubscribes")
          .select("id")
          .eq("email", email.to_email)
          .limit(1)
          .single();

        if (unsub) {
          results.push({ email_id: email.id, status: "skipped", reason: "unsubscribed" });
          await supabase.from("email_queue").update({
            status: "unsubscribed",
          }).eq("id", email.id);
          continue;
        }

        // 4️⃣ Fetch template
        const { data: template } = await supabase
          .from("email_templates")
          .select("*")
          .eq("name", email.template_name)
          .single();

        if (!template) throw new Error("Template not found");

        let htmlContent = template.body;
        const variables = email.variables || {};
        for (const key in variables) {
          htmlContent = htmlContent.replaceAll(`{{${key}}}`, variables[key] ?? "");
        }
        const textContent = htmlContent.replace(/<[^>]+>/g, "");

        // 5️⃣ Attachments
        let attachments: any[] = [];
        if (email.metadata?.pdf_url) {
          const pdfResp = await fetch(email.metadata.pdf_url);
          const pdfBuffer = await pdfResp.arrayBuffer();
          attachments.push({
            name: email.metadata.pdf_name || `devis_${email.variables.quote_number}.pdf`,
            content: arrayBufferToBase64(pdfBuffer),
            contentType: "application/pdf",
          });
        }
        const { email: sending_email, name } = settings.emailOffers
        console.log(sending_email, name)
        // 6️⃣ Tracking pixel
        const trackingId = email.id;
        const trackingPixel = `<img src="https://qceutznwobozxuvblyzo.supabase.co/functions/v1/email-tracking/${trackingId}" width="1" height="1" style="display:none;" />`;
        htmlContent += trackingPixel;

        // 7️⃣ Send via Brevo
        const res = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            "api-key": settings.BREVO_API_KEY,
          },
          body: JSON.stringify({
            sender: { email: sending_email, name: variables.artisan_name || "FacadEO Offers" },
            replyTo: {
              email: email.to_email ,
              name: variables.artisan_name ,
            },
            to: [{ email: email.to_email }],
            subject: template.subject,
            htmlContent,
            textContent,
            attachment: attachments,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(JSON.stringify(err));
        }

        await supabase.from("email_queue").update({
          status: "sent",
          sent_at: new Date().toISOString(),
        }).eq("id", email.id);

        results.push({ email_id: email.id, status: "sent" });

      } catch (err) {
        console.error("Failed to send email:", err);

        const attempts = (email.attempts || 0) + 1;
        const nextRetry = new Date(Date.now() + 2 * 60 * 1000);

        const updatePayload: any = {
          attempts,
          last_error: String(err),
          next_retry_at: nextRetry.toISOString(),
        };

        if (attempts >= (email.max_attempts || 3)) {
          updatePayload.status = "failed";
        }

        await supabase.from("email_queue").update(updatePayload).eq("id", email.id);

        results.push({ email_id: email.id, status: "failed", error: String(err) });
      }
    }

    return new Response(JSON.stringify({ processed: results }), { headers: corsHeaders });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: corsHeaders });
  }
});

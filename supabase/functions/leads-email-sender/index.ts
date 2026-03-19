import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SERVICE_ROLE_KEY")!
);

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
    const { data: pendingEmails, error } = await supabase
      .from("email_queue")
      .select("*")
      .eq("status", "pending")
      .limit(10);

    if (error) {
      throw error;
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      return new Response(JSON.stringify({ message: "No pending emails" }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    const { data: settings } = await supabase
      .from("app_setting")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!settings?.emailEnabled) {
      return new Response(
        JSON.stringify({ error: "Email service disabled" }),
        {
          status: 403,
          headers: corsHeaders,
        }
      );
    }

    const results: any[] = [];

    for (const email of pendingEmails) {
      try {
        const { data: unsub } = await supabase
          .from("email_unsubscribes")
          .select("id")
          .eq("email", email.to_email)
          .limit(1)
          .maybeSingle();

        if (unsub) {
          results.push({
            email_id: email.id,
            status: "skipped",
            reason: "unsubscribed",
          });

          await supabase
            .from("email_queue")
            .update({ status: "unsubscribed" })
            .eq("id", email.id);

          continue;
        }

        const { data: template } = await supabase
          .from("email_templates")
          .select("*")
          .eq("name", email.template_name)
          .single();

        if (!template) {
          throw new Error("Template not found");
        }

        let htmlContent = template.body;
        const variables = email.variables || {};

        for (const key in variables) {
          htmlContent = htmlContent.replaceAll(
            `{{${key}}}`,
            String(variables[key] ?? "")
          );
        }

        const textContent = htmlContent.replace(/<[^>]+>/g, "");

        const attachments: any[] = [];

        if (email.metadata?.pdf_url) {
          const pdfResp = await fetch(email.metadata.pdf_url);

          if (!pdfResp.ok) {
            throw new Error("Failed to download PDF attachment");
          }

          const pdfBuffer = await pdfResp.arrayBuffer();

          attachments.push({
            name:
              email.metadata.pdf_name ||
              `devis_${email.variables?.quote_number ?? "document"}.pdf`,
            content: arrayBufferToBase64(pdfBuffer),
            contentType: "application/pdf",
          });
        }

        const { email: sendingEmail } = settings.emailOffers ?? {};

        if (!sendingEmail || !settings.BREVO_API_KEY) {
          throw new Error("Brevo configuration incomplete");
        }

        const trackingId = email.id;
        const trackingPixel = `<img src="https://urqayvebhzfasoqsswse.supabase.co/functions/v1/email-tracking/${trackingId}" width="1" height="1" style="display:none;" />`;
        htmlContent += trackingPixel;

        const res = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            "api-key": settings.BREVO_API_KEY,
          },
          body: JSON.stringify({
            sender: {
              email: sendingEmail,
              name: variables.artisan_name || "FacadEO Offers",
            },
            replyTo: {
              email: email.to_email,
              name: variables.artisan_name || "",
            },
            to: [{ email: email.to_email }],
            subject: template.subject,
            htmlContent,
            textContent,
            attachment: attachments,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(JSON.stringify(err ?? { error: "Brevo send failed" }));
        }

        await supabase
          .from("email_queue")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
          })
          .eq("id", email.id);

        results.push({ email_id: email.id, status: "sent" });
      } catch (err) {
        const attempts = (email.attempts || 0) + 1;
        const nextRetry = new Date(Date.now() + 2 * 60 * 1000);

        const updatePayload: any = {
          attempts,
          last_error: err instanceof Error ? err.message : String(err),
          next_retry_at: nextRetry.toISOString(),
        };

        if (attempts >= (email.max_attempts || 3)) {
          updatePayload.status = "failed";
        }

        await supabase
          .from("email_queue")
          .update(updatePayload)
          .eq("id", email.id);

        results.push({
          email_id: email.id,
          status: "failed",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return new Response(JSON.stringify({ processed: results }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});
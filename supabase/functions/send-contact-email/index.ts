// TODO: add this to supabase secrets
// supabase secrets set BREVO_API_KEY=your_brevo_api_key
// supabase secrets set BREVO_SENDER_EMAIL=contact@dost.pro
// supabase secrets set BREVO_SENDER_NAME="DOST Contact"

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const jsonHeaders = {
  ...corsHeaders,
  "Content-Type": "application/json",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: jsonHeaders,
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const body = await req.json();
    const { email, subject, message, website, startedAt } = body ?? {};

    // Honeypot
    if (website) {
      return jsonResponse({ success: true }, 200);
    }

    if (!email || !subject || !message) {
      return jsonResponse(
        { error: "email, subject and message are required" },
        400
      );
    }

    if (
      typeof email !== "string" ||
      typeof subject !== "string" ||
      typeof message !== "string"
    ) {
      return jsonResponse({ error: "Invalid payload" }, 400);
    }

    const cleanEmail = email.trim();
    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();

    if (!cleanEmail || !cleanSubject || !cleanMessage) {
      return jsonResponse({ error: "All fields must be filled" }, 400);
    }

    if (cleanSubject.length < 3) {
      return jsonResponse({ error: "Subject is too short" }, 400);
    }

    if (cleanMessage.length < 10) {
      return jsonResponse({ error: "Message is too short" }, 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return jsonResponse({ error: "Invalid email address" }, 400);
    }

    if (!startedAt || Number.isNaN(Number(startedAt))) {
      return jsonResponse({ error: "Invalid form timestamp" }, 400);
    }

    const elapsed = Date.now() - Number(startedAt);
    if (elapsed < 3000) {
      return jsonResponse({ error: "Soumission trop rapide" }, 400);
    }

    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    const senderEmail = Deno.env.get("BREVO_SENDER_EMAIL");
    const senderName = Deno.env.get("BREVO_SENDER_NAME") || "DOST Contact";

    if (!brevoApiKey) {
      console.error("Missing BREVO_API_KEY");
      return jsonResponse({ error: "Missing BREVO_API_KEY" }, 500);
    }

    if (!senderEmail) {
      console.error("Missing BREVO_SENDER_EMAIL");
      return jsonResponse({ error: "Missing BREVO_SENDER_EMAIL" }, 500);
    }

    const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": brevoApiKey,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: [
          {
            email: "contact@dost.pro",
            name: "DOST Contact",
          },
        ],
        replyTo: {
          email: cleanEmail,
        },
        subject: `[Contact DOST] ${cleanSubject}`,
        textContent: [
          "Nouveau message depuis le formulaire de contact",
          "",
          `Email: ${cleanEmail}`,
          `Sujet: ${cleanSubject}`,
          "",
          "Message:",
          cleanMessage,
        ].join("\n"),
      }),
    });

    const brevoText = await brevoRes.text();
    console.log("Brevo status:", brevoRes.status);
    console.log("Brevo raw response:", brevoText);

    let brevoData: Record<string, unknown> = {};
    try {
      brevoData = brevoText ? JSON.parse(brevoText) : {};
    } catch {
      brevoData = { raw: brevoText };
    }

    if (!brevoRes.ok) {
      const providerError =
        (brevoData?.message as string) ||
        (brevoData?.code as string) ||
        "Failed to send email";

      console.error("Brevo error:", brevoData);

      return jsonResponse(
        {
          error: providerError,
          provider: brevoData,
        },
        500
      );
    }

    return jsonResponse({
      success: true,
      messageId: brevoData?.messageId ?? null,
    });
  } catch (error) {
    console.error("send-contact-email error:", error);
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : "Invalid body",
      },
      400
    );
  }
});
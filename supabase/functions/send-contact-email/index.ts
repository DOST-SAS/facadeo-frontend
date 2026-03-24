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

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return jsonResponse({ error: "Missing RESEND_API_KEY" }, 500);
    }

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "DOST Contact <onboarding@resend.dev>",
        to: ["huda@dost.pro"],
        reply_to: cleanEmail,
        subject: `[Contact DOST] ${cleanSubject}`,
        text: [
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

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      return jsonResponse(
        {
          error:
            resendData?.message ||
            resendData?.error ||
            "Failed to send email",
        },
        500
      );
    }

    return jsonResponse({
      success: true,
      emailId: resendData?.id ?? null,
    });
  } catch (error) {
    console.error("send-contact-email error:", error);
    return jsonResponse({ error: "Invalid body" }, 400);
  }
});
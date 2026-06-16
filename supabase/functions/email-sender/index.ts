import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const { to, templateName, variables } = await req.json();

    if (!to || !templateName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: corsHeaders }
      );
    }
    console.log({ to, templateName, variables })
    /* =========================
       GET EMAIL CONFIG FROM DB
    ========================== */
    const { data: settings, error: settingsError } = await supabase
      .from("app_setting")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (settingsError || !settings) {
      return new Response(
        JSON.stringify({ error: "Email configuration not found" }),
        { status: 500, headers: corsHeaders }
      );
    }

    if (!settings.emailEnabled) {
      return new Response(
        JSON.stringify({ error: "Email service disabled" }),
        { status: 403, headers: corsHeaders }
      );
    }

    if (!settings.BREVO_API_KEY || !settings.emailSender) {
      return new Response(
        JSON.stringify({ error: "Brevo configuration incomplete" }),
        { status: 500, headers: corsHeaders }
      );
    }

    /* =========================
       GET EMAIL TEMPLATE FROM DB
    ========================== */
    const { data: template, error: templateError } = await supabase
      .from("email_templates")
      .select("*")
      .eq("name", templateName)
      .single();

    if (templateError || !template) {
      return new Response(
        JSON.stringify({ error: "Email template not found" }),
        { status: 404, headers: corsHeaders }
      );
    }

    /* =========================
       REPLACE VARIABLES IN TEMPLATE
    ========================== */
    let htmlContent = template.body;
    if (variables) {
      for (const key in variables) {
        const value = variables[key] ?? "";
        htmlContent = htmlContent.replaceAll(`{{${key}}}`, value);
      }
    }
    const textContent = htmlContent.replace(/<[^>]+>/g, ""); // strip HTML for text
    const { email, name } = settings.emailGeneral
    console.log(settings.emailGeneral)
    console.log(email, name)
    /* =========================
       SEND EMAIL VIA BREVO
    ========================== */
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "api-key": settings.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { email: email, name: name },
        to: [{ email: to }],
        subject: template.subject,
        htmlContent,
        textContent,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Brevo error:", data);
      return new Response(
        JSON.stringify({ error: "Brevo send failed", details: data }),
        { status: 500, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ success: true, messageId: data.messageId }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Email sender error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});

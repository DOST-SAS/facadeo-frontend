import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SERVICE_ROLE_KEY")!
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
    const { to, templateName, variables } = await req.json();

    if (!to || !templateName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: corsHeaders }
      );
    }

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

    let htmlContent = template.body;
    if (variables) {
      for (const key in variables) {
        const value = variables[key] ?? "";
        htmlContent = htmlContent.replaceAll(`{{${key}}}`, String(value));
      }
    }

    const textContent = htmlContent.replace(/<[^>]+>/g, "");

    const { email, name } = settings.emailGeneral ?? {};

    if (!email || !name) {
      return new Response(
        JSON.stringify({ error: "Email sender information incomplete" }),
        { status: 500, headers: corsHeaders }
      );
    }

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "api-key": settings.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { email, name },
        to: [{ email: to }],
        subject: template.subject,
        htmlContent,
        textContent,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: "Brevo send failed", details: data }),
        { status: 500, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ success: true, messageId: data?.messageId }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
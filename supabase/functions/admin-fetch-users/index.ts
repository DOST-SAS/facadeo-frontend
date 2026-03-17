import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  return new Response(
    JSON.stringify({
      ok: true,
      message: "admin-fetch-users reached",
      authHeader:
        req.headers.get("Authorization") ||
        req.headers.get("authorization") ||
        null,
    }),
    {
      status: 200,
      headers: corsHeaders,
    }
  );
});
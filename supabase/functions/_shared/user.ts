import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function requireUser(req: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return {
      ok: false,
      status: 500,
      error: "Missing server configuration",
    };
  }

  const authHeader =
    req.headers.get("Authorization") ||
    req.headers.get("authorization") ||
    "";

  const token = authHeader.split(" ")[1]?.trim() || "";

  if (!token) {
    return {
      ok: false,
      status: 401,
      error: "Missing authorization header",
    };
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      status: 401,
      error: "Invalid or expired token",
    };
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, role, is_admin, email")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return {
      ok: false,
      status: 403,
      error: "Profile not found",
    };
  }

  return {
    ok: true,
    user,
    profile,
    supabase: adminClient,
  };
}
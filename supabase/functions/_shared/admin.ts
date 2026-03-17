import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function requireAdmin(req: Request) {
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

  // Client dédié à l'auth utilisateur
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

  // Client admin pour lire la base
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, role, is_admin")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return {
      ok: false,
      status: 403,
      error: "Profile not found",
    };
  }

  const isAdmin = profile.is_admin === true || profile.role === "admin";

  if (!isAdmin) {
    return {
      ok: false,
      status: 403,
      error: "Admin access required",
    };
  }

  return {
    ok: true,
    user,
    profile,
    supabase: adminClient,
  };
}
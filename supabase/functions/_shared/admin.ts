import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function requireAdmin(req: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
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

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return {
      ok: false,
      status: 401,
      error: "Invalid or expired token",
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, is_admin")
    .eq("id", userData.user.id)
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
    user: userData.user,
    profile,
    supabase,
  };
}
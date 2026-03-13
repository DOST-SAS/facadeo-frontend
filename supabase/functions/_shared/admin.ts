import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function requireAdmin(req: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY")!;

  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) {
    return { ok: false, status: 401, error: "Missing bearer token" };
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) {
    return { ok: false, status: 401, error: "Invalid auth token" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, is_admin")
    .eq("id", userData.user.id)
    .single();

  if (profileError || !profile) {
    return { ok: false, status: 403, error: "Profile not found" };
  }

  const isAdmin = profile.is_admin === true || profile.role === "admin";
  if (!isAdmin) {
    return { ok: false, status: 403, error: "Admin access required" };
  }

  return { ok: true, user: userData.user, profile };
}
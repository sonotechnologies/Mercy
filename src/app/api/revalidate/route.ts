import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { SUPABASE_ANON_KEY, SUPABASE_URL, hasSupabase } from "@/lib/backend/config";

/** Called by the admin after a change so every visitor sees it straight away. */
export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!hasSupabase || !token) return Response.json({ error: "Unauthorised" }, { status: 401 });
  try {
    // Act as the signed-in user: is_admin() checks their email against admin_users.
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: user } = await sb.auth.getUser(token);
    if (!user.user) return Response.json({ error: "Unauthorised" }, { status: 401 });
    const { data: ok } = await sb.rpc("is_admin");
    if (!ok) return Response.json({ error: "Forbidden" }, { status: 403 });
    revalidatePath("/", "layout");
    return Response.json({ ok: true });
  } catch (e) {
    console.error("[revalidate] failed", e);
    return Response.json({ error: "Failed" }, { status: 500 });
  }
}

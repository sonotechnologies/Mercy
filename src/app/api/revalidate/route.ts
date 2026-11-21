import { revalidatePath } from "next/cache";
import { publicClient, serviceClient } from "@/lib/backend/server";

/** Called by the admin after a change so every visitor sees it straight away. */
export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!token) return Response.json({ error: "Unauthorised" }, { status: 401 });
  try {
    const { data } = await publicClient().auth.getUser(token);
    const email = data.user?.email?.toLowerCase();
    if (!email) return Response.json({ error: "Unauthorised" }, { status: 401 });
    const { data: admin } = await serviceClient().from("admin_users").select("email").ilike("email", email).maybeSingle();
    if (!admin) return Response.json({ error: "Forbidden" }, { status: 403 });
    revalidatePath("/", "layout");
    return Response.json({ ok: true });
  } catch (e) {
    console.error("[revalidate] failed", e);
    return Response.json({ error: "Failed" }, { status: 500 });
  }
}

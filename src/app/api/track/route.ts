import { orderFromRow, type OrderRow } from "@/lib/backend/mappers";
import { publicClient } from "@/lib/backend/server";
import { normaliseRef } from "@/lib/orders";

export const dynamic = "force-dynamic";

/** Looks up an order by reference + phone (checked by the database function track_order). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const ref = normaliseRef(url.searchParams.get("ref") ?? "");
  const phone = url.searchParams.get("phone") ?? "";
  if (!ref || phone.replace(/\D/g, "").length < 10) return Response.json({ error: "Add your order reference and phone number." }, { status: 400 });
  try {
    const { data, error } = await publicClient().rpc("track_order", { p_ref: ref, p_phone: phone });
    if (error) throw error;
    if (!data) return Response.json({ error: "Order not found." }, { status: 404 });
    return Response.json({ order: orderFromRow(data as OrderRow) }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[track] lookup failed", e);
    return Response.json({ error: "Couldn't check that order right now." }, { status: 500 });
  }
}

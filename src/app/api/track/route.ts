import { orderFromRow, type OrderRow } from "@/lib/backend/mappers";
import { serviceClient } from "@/lib/backend/server";
import { normaliseRef, samePhone } from "@/lib/orders";

export const dynamic = "force-dynamic";

/** Looks up an order by reference + phone (both must match). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const ref = normaliseRef(url.searchParams.get("ref") ?? "");
  const phone = url.searchParams.get("phone") ?? "";
  if (!ref || phone.replace(/\D/g, "").length < 10) return Response.json({ error: "Add your order reference and phone number." }, { status: 400 });
  try {
    const { data, error } = await serviceClient().from("orders").select("*, order_items(*)").eq("ref", ref).maybeSingle();
    if (error) throw error;
    if (!data || !samePhone((data as OrderRow).phone, phone)) return Response.json({ error: "Order not found." }, { status: 404 });
    return Response.json({ order: orderFromRow(data as OrderRow) }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[track] lookup failed", e);
    return Response.json({ error: "Couldn't check that order right now." }, { status: 500 });
  }
}

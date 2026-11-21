import { loadStoreData, serviceClient } from "@/lib/backend/server";
import { orderToRows } from "@/lib/backend/mappers";
import { buildOrder, OrderError, type OrderRequest } from "@/lib/order-build";
import { newOrderRef } from "@/lib/orders";
import { saleStatus } from "@/lib/sale";

/** Creates an order. Prices are recalculated here from the catalogue. */
export async function POST(request: Request) {
  let req: OrderRequest;
  try {
    req = (await request.json()) as OrderRequest;
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  try {
    const sb = serviceClient();
    const data = await loadStoreData(sb);
    const now = Date.now();
    const order = buildOrder(req, { products: data.products, sale: data.sale, settings: data.settings, status: saleStatus(data.sale, now), now });

    // Keep the browser's reference (already in the WhatsApp message) unless it's taken.
    for (let attempt = 0; attempt < 5; attempt++) {
      const rows = orderToRows(order);
      const ins = await sb.from("orders").insert(rows.order);
      if (!ins.error) {
        const items = await sb.from("order_items").insert(rows.items);
        if (items.error) {
          await sb.from("orders").delete().eq("ref", order.ref);
          throw items.error;
        }
        return Response.json({ order });
      }
      if (ins.error.code !== "23505") throw ins.error; // unique violation -> new ref
      order.ref = newOrderRef();
    }
    throw new Error("Couldn't allocate an order reference.");
  } catch (e) {
    if (e instanceof OrderError) return Response.json({ error: e.message }, { status: 400 });
    console.error("[orders] create failed", e);
    return Response.json({ error: "We couldn't save your order. Please try again, or send it on WhatsApp." }, { status: 500 });
  }
}

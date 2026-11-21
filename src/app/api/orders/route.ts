import { orderFromRow, type OrderRow } from "@/lib/backend/mappers";
import { loadStoreData, publicClient } from "@/lib/backend/server";
import { buildOrder, OrderError, type OrderRequest } from "@/lib/order-build";
import { saleStatus } from "@/lib/sale";

/**
 * Creates an order. The order is checked here first (friendly errors, ready date),
 * then saved by the database function place_order, which recalculates every price.
 */
export async function POST(request: Request) {
  let req: OrderRequest;
  try {
    req = (await request.json()) as OrderRequest;
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  try {
    const sb = publicClient();
    const data = await loadStoreData(sb);
    const now = Date.now();
    const draft = buildOrder(req, { products: data.products, sale: data.sale, settings: data.settings, status: saleStatus(data.sale, now), now });
    const { data: row, error } = await sb.rpc("place_order", {
      p: {
        ref: draft.ref,
        name: draft.name,
        phone: draft.phone,
        fulfilment: draft.fulfilment,
        address: draft.address,
        city: draft.city,
        state: draft.state,
        note: draft.note,
        expectedReady: draft.expectedReady,
        items: draft.items.map((i) => ({ productId: i.productId, colour: i.colour, size: i.size, qty: i.qty, image: i.image && !i.image.startsWith("data:") ? i.image : null })),
      },
    });
    if (error) {
      // Messages raised by place_order are written for customers.
      if (error.code === "P0001") throw new OrderError(error.message);
      throw error;
    }
    return Response.json({ order: orderFromRow(row as OrderRow) });
  } catch (e) {
    if (e instanceof OrderError) return Response.json({ error: e.message }, { status: 400 });
    console.error("[orders] create failed", e);
    return Response.json({ error: "We couldn't save your order. Please try again, or send it on WhatsApp." }, { status: 500 });
  }
}

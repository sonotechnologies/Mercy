import { expectedReady, isMadeToOrder, maxWorkingDays, newOrderRef, productionTimeOf } from "./orders";
import { giftEnabled, unitPrice, type SaleStatus } from "./sale";
import type { Order, Product, SaleConfig, Settings } from "./types";
import type { CustomerDetails } from "./whatsapp";

export type OrderRequest = {
  /** Reference generated in the browser so WhatsApp can open instantly. */
  ref?: string;
  items: { productId: string; colour: number; size: number; qty: number }[];
  customer: CustomerDetails;
};

export class OrderError extends Error {}

const clean = (s: unknown, max = 300) => (typeof s === "string" ? s.trim().slice(0, max) : "");

/**
 * Builds an order from the catalogue (never from client-sent prices).
 * Shared by the API route (Supabase mode) and the browser (demo mode).
 */
export function buildOrder(req: OrderRequest, ctx: { products: Product[]; sale: SaleConfig; settings: Settings; status: SaleStatus; now: number }): Order {
  const c = req.customer ?? ({} as CustomerDetails);
  const name = clean(c.name, 120);
  const phone = clean(c.phone, 40);
  const fulfilment = c.fulfilment === "delivery" ? "delivery" : "pickup";
  const address = clean(c.address);
  if (!name) throw new OrderError("Please add your name.");
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 14) throw new OrderError("Please add a valid WhatsApp number.");
  if (fulfilment === "delivery" && address.length < 6) throw new OrderError("Please add your delivery address.");
  if (fulfilment === "delivery" && !ctx.settings.fulfilment.delivery) throw new OrderError("Delivery isn't available right now.");
  if (fulfilment === "pickup" && !ctx.settings.fulfilment.pickup) throw new OrderError("Pickup isn't available right now.");
  if (!Array.isArray(req.items) || !req.items.length || req.items.length > 50) throw new OrderError("Your bag is empty.");

  const items = req.items.map((it) => {
    const p = ctx.products.find((x) => x.id === it.productId);
    if (!p || !p.inStock) throw new OrderError("One of the items is no longer available. Please refresh and try again.");
    const qty = Math.max(1, Math.min(20, Math.floor(Number(it.qty) || 1)));
    const size = Math.floor(Number(it.size));
    if (!p.sizes.includes(size)) throw new OrderError(`Size ${size} isn't available for ${p.name}.`);
    const colour = p.colours[Math.floor(Number(it.colour))] ?? p.colours[0];
    const unit = unitPrice(p, ctx.sale, ctx.status);
    return { product: p, line: { productId: p.id, name: p.name, colour: colour?.name ?? "", size, qty, unitPrice: unit, total: unit * qty, image: colour?.image ?? p.images[0] } };
  });

  const pairs = items.reduce((a, i) => a + i.line.qty, 0);
  const subtotal = items.reduce((a, i) => a + i.line.total, 0);
  const fullTotal = items.reduce((a, i) => a + i.product.price * i.line.qty, 0);
  const giftMin = giftEnabled(ctx.status) ? Math.max(1, ctx.sale.freeGiftMinPairs || 1) : null;

  // The slowest made-to-order item decides when the order is ready.
  const mto = items.filter((i) => isMadeToOrder(i.product, ctx.settings));
  const slowest = mto.length
    ? mto.map((i) => productionTimeOf(i.product, ctx.settings)).sort((a, b) => maxWorkingDays(b) - maxWorkingDays(a))[0]
    : "2 working days";

  const ref = /^MF-\d{5}$/.test(req.ref ?? "") ? req.ref! : newOrderRef();
  return {
    ref,
    createdAt: new Date(ctx.now).toISOString(),
    name,
    phone,
    fulfilment,
    address: fulfilment === "delivery" ? address : "",
    city: fulfilment === "delivery" ? clean(c.city, 80) : "",
    state: fulfilment === "delivery" ? clean(c.state, 80) : "",
    note: clean(c.note, 500),
    items: items.map((i) => i.line),
    subtotal,
    fullTotal,
    giftUnlocked: giftMin != null && pairs >= giftMin,
    status: "received",
    expectedReady: expectedReady(ctx.now, ctx.sale, ctx.status === "live", slowest),
  };
}

import { naira, shortDate } from "./format";
import type { Fulfilment, Order, OrderStatus, Product, SaleConfig, Settings } from "./types";

/* ---------- made to order ---------- */

export function isMadeToOrder(p: Product, s: Settings): boolean {
  return p.orderType ? p.orderType === "made-to-order" : s.madeToOrder;
}

export function productionTimeOf(p: Product | undefined, s: Settings): string {
  return (p?.productionTime?.trim() || s.productionTime || "5–7 working days").trim();
}

/** "5–7 working days" -> 7, "2 weeks" -> 10 (working days). Falls back to 7. */
export function maxWorkingDays(text: string): number {
  const nums = (text.match(/\d+/g) ?? []).map(Number);
  if (!nums.length) return 7;
  const n = Math.max(...nums);
  return /week/i.test(text) ? n * 5 : n;
}

/** Adds working days (Mon–Fri) to a yyyy-mm-dd date in Lagos time. */
export function addWorkingDays(fromIso: string, days: number): string {
  const d = new Date(fromIso + "T12:00:00+01:00");
  let left = days;
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    const wd = d.getUTCDay();
    if (wd !== 0 && wd !== 6) left--;
  }
  return d.toISOString().slice(0, 10);
}

export const lagosToday = (now = Date.now()) => new Date(now + 3600e3).toISOString().slice(0, 10);

/**
 * When production can start: today, or the sale's production date for orders
 * placed while the sale is running ("Sale orders go into production from Dec 5").
 */
export function productionStart(now: number, sale: SaleConfig, saleLive: boolean): string {
  const today = lagosToday(now);
  if (saleLive && sale.deliveryStarts && sale.deliveryStarts > today) return sale.deliveryStarts;
  return today;
}

export function expectedReady(now: number, sale: SaleConfig, saleLive: boolean, productionText: string): string {
  return addWorkingDays(productionStart(now, sale, saleLive), maxWorkingDays(productionText));
}

/** "Fri, Dec 11" */
export function niceDate(iso: string): string {
  const d = new Date(iso.length <= 10 ? iso + "T12:00:00+01:00" : iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "Africa/Lagos" });
}

/* ---------- references ---------- */

export function newOrderRef(): string {
  const n = typeof crypto !== "undefined" && crypto.getRandomValues ? crypto.getRandomValues(new Uint32Array(1))[0] : Math.floor(Math.random() * 2 ** 32);
  return `MF-${10000 + (n % 90000)}`;
}

export function normaliseRef(input: string): string {
  const digits = input.replace(/\D/g, "");
  return digits ? `MF-${digits}` : "";
}

/** Compare phone numbers by their last 10 digits (handles 0803…, +234803…, 234803…). */
export function samePhone(a: string, b: string): boolean {
  const x = a.replace(/\D/g, "").slice(-10);
  const y = b.replace(/\D/g, "").slice(-10);
  return x.length === 10 && x === y;
}

/* ---------- statuses ---------- */

export const STATUS_LABEL: Record<OrderStatus, string> = {
  received: "Received",
  confirmed: "Confirmed",
  "in-production": "In production",
  ready: "Ready for pickup",
  "out-for-delivery": "Out for delivery",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const STATUS_OPTIONS: OrderStatus[] = ["received", "confirmed", "in-production", "ready", "out-for-delivery", "completed", "cancelled"];

/** Timeline shown to the customer for their fulfilment choice. */
export function statusSteps(f: Fulfilment): { status: OrderStatus; label: string; hint: string }[] {
  return [
    { status: "received", label: "Order received", hint: "We've got your order." },
    { status: "confirmed", label: "Confirmed", hint: "Details and payment confirmed on WhatsApp." },
    { status: "in-production", label: "In production", hint: "Your pairs are being made by hand." },
    f === "pickup"
      ? { status: "ready", label: "Ready for pickup", hint: "Come and collect your pairs." }
      : { status: "out-for-delivery", label: "Out for delivery", hint: "Your pairs are on their way." },
    { status: "completed", label: f === "pickup" ? "Collected" : "Delivered", hint: "Enjoy them. Walk proud!" },
  ];
}

export function stepIndex(status: OrderStatus, f: Fulfilment): number {
  if (status === "cancelled") return -1;
  const steps = statusSteps(f).map((s) => s.status);
  const i = steps.indexOf(status);
  if (i >= 0) return i;
  // "ready" on a delivery order (or vice versa) sits at the same step
  return status === "ready" || status === "out-for-delivery" ? 3 : 0;
}

export function statusTone(status: OrderStatus): { bg: string; fg: string; border: string } {
  switch (status) {
    case "received":
      return { bg: "#F6E3E0", fg: "#8F1921", border: "#B3202A" };
    case "confirmed":
    case "in-production":
      return { bg: "#F1E6D6", fg: "#5C4317", border: "#B8924A" };
    case "ready":
    case "out-for-delivery":
      return { bg: "#E4EBE2", fg: "#33482F", border: "#4E6B4A" };
    case "completed":
      return { bg: "#EDE7DF", fg: "#6B574B", border: "rgba(43,31,26,.25)" };
    case "cancelled":
      return { bg: "#F1EEEA", fg: "#6B574B", border: "rgba(43,31,26,.2)" };
  }
}

/* ---------- WhatsApp messages ---------- */

const first = (name: string) => name.trim().split(/\s+/)[0] || "there";

/** The update Mercy sends a customer from Admin → Orders. */
export function customerUpdateMessage(o: Order, s: Settings): string {
  const hi = `Hi ${first(o.name)}, this is Mercy Footwears about your order ${o.ref}.`;
  const track = "You can track it anytime on our website under Track order.";
  switch (o.status) {
    case "received":
      return `${hi} We've received it, thank you! We'll confirm the details and payment with you here before we start making your pairs.`;
    case "confirmed":
      return `${hi} Your order is confirmed ✅ We'll start making your pairs shortly. Expected ready: ${niceDate(o.expectedReady)}. ${track}`;
    case "in-production":
      return `${hi} Your pairs are now being made 👟 Expected ready: ${niceDate(o.expectedReady)}. ${track}`;
    case "ready": {
      const where = [s.pickupAddress, s.pickupHours].filter((x) => x.trim()).join(" · ");
      return `${hi} Your order is ready for pickup 🎉${where ? `\n\nPickup: ${where}` : ""}\n\nSee you soon!`;
    }
    case "out-for-delivery":
      return `${hi} Your order is on its way to you 🚚 Please keep your phone close so the rider can reach you.`;
    case "completed":
      return `${hi} Thank you for shopping with us! We hope you love your new pairs. Walk proud 💛`;
    case "cancelled":
      return `${hi} Your order has been cancelled. If this is a mistake, please reply here and we'll sort it out.`;
  }
}

export function orderSummaryLines(o: Pick<Order, "items">): string {
  return o.items.map((l, i) => `${i + 1}. ${l.name} – ${l.colour} · Size ${l.size} · x${l.qty} · ${naira(l.total)}`).join("\n");
}

export { shortDate };

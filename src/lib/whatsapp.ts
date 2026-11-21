import { naira, shortDate } from "./format";
import type { SaleConfig } from "./types";
import type { SaleStatus } from "./sale";

export type OrderLine = {
  name: string;
  colour: string;
  size: number;
  qty: number;
  /** Line total (unit × qty) */
  total: number;
  /** Line total at the normal price, to show the sale saving. */
  full?: number;
};

export type CustomerDetails = {
  name: string;
  phone: string;
  fulfilment: "pickup" | "delivery";
  address: string;
  city: string;
  state: string;
  note: string;
};

export function waLink(number: string, text: string): string {
  const n = number.replace(/\D/g, "");
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}

const CLICK_KEY = "mf.waClicks";

/** Demo analytics: counts WhatsApp hand-offs on this device (shown in admin). */
export function trackWhatsAppClick() {
  try {
    const n = Number(localStorage.getItem(CLICK_KEY) || 0) + 1;
    localStorage.setItem(CLICK_KEY, String(n));
  } catch {
    /* storage unavailable */
  }
}
export function readWhatsAppClicks(): number {
  try {
    return Number(localStorage.getItem(CLICK_KEY) || 0);
  } catch {
    return 0;
  }
}

export function openWhatsApp(number: string, text: string) {
  trackWhatsAppClick();
  window.open(waLink(number, text), "_blank", "noopener,noreferrer");
}

function itemLines(lines: OrderLine[]): string {
  return lines
    .map((l, i) => `${i + 1}. ${l.name} – ${l.colour} · Size ${l.size} · x${l.qty} · ${naira(l.total)}`)
    .join("\n");
}

type OrderContext = {
  sale: SaleConfig;
  status: SaleStatus;
  /** null when the free gift isn't running */
  giftMin: number | null;
};

export type OrderMessageInput = {
  ref: string;
  lines: OrderLine[];
  customer: CustomerDetails;
  madeToOrder: boolean;
  productionTime: string;
  /** yyyy-mm-dd */
  expectedReady: string;
};

export function buildOrderMessage(o: OrderMessageInput, ctx: OrderContext): string {
  const pairs = o.lines.reduce((a, l) => a + l.qty, 0);
  const subtotal = o.lines.reduce((a, l) => a + l.total, 0);
  const c = o.customer;
  const out: string[] = [];
  out.push(`Hello Mercy Footwears 👋 I'd like to order (Order ${o.ref}):`, "", itemLines(o.lines), "");

  const saved = o.lines.reduce((a, l) => a + Math.max(0, (l.full ?? l.total) - l.total), 0);
  out.push(`Subtotal: ${naira(subtotal)}`);
  if (saved > 0) out.push(`You save: ${naira(saved)} (sale prices)`);
  if (ctx.giftMin != null) {
    const left = ctx.giftMin - pairs;
    out.push(left <= 0 ? "🎁 Free gift: yes, unlocked" : `🎁 Free gift: not yet (add ${left} more pair${left > 1 ? "s" : ""})`);
  }
  if (o.madeToOrder) {
    out.push(`🧵 Made to order · ready in ${o.productionTime} (around ${readyLabel(o.expectedReady)})`);
    if (ctx.status === "live" && ctx.sale.deliveryStarts) out.push(`Sale orders go into production from ${shortDate(ctx.sale.deliveryStarts)}`);
  }

  out.push("", `Name: ${c.name.trim()}`, `Phone: ${c.phone.trim()}`);
  if (c.fulfilment === "pickup") out.push("Fulfilment: Pickup");
  else out.push(`Fulfilment: Delivery to ${[c.address.trim(), c.city.trim(), c.state.trim()].filter(Boolean).join(", ")}`);
  if (c.note.trim()) out.push(`Note: ${c.note.trim()}`);
  return out.join("\n");
}

function readyLabel(iso: string): string {
  const d = new Date(iso + "T12:00:00+01:00");
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "Africa/Lagos" });
}

export function buildSingleItemMessage(line: OrderLine, ctx: OrderContext, extra?: string): string {
  const saved = Math.max(0, (line.full ?? line.total) - line.total);
  return [
    "Hello Mercy Footwears 👋 I'd like to order:",
    "",
    itemLines([line]),
    "",
    `Subtotal: ${naira(line.total)}`,
    ...(saved > 0 ? [`You save: ${naira(saved)} (sale price)`] : []),
    ...(extra ? [extra] : []),
    "",
    "Please confirm my order and how to pay. Thank you!",
  ].join("\n");
}

export function buildChatMessage(): string {
  return "Hello Mercy Footwears 👋 I'd like to ask about your slides.";
}

export function buildNotifyMessage(sale: SaleConfig): string {
  return `Hello Mercy Footwears 👋 Please notify me when the ${sale.title} starts (${shortDate(sale.startsAt)}).`;
}

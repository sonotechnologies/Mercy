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
};

export type CustomerDetails = {
  name: string;
  phone: string;
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

export function buildOrderMessage(lines: OrderLine[], customer: CustomerDetails, ctx: OrderContext): string {
  const pairs = lines.reduce((a, l) => a + l.qty, 0);
  const subtotal = lines.reduce((a, l) => a + l.total, 0);
  const out: string[] = [];
  out.push("Hello Mercy Footwears 👋 I'd like to order:", "", itemLines(lines), "");

  const disc = ctx.status === "live" ? ` (${ctx.sale.discountPercent}% sale discount applied)` : "";
  out.push(`Subtotal: ${naira(subtotal)}${disc}`);

  if (ctx.giftMin != null) {
    const left = ctx.giftMin - pairs;
    out.push(left <= 0 ? "🎁 Free gift: yes, unlocked" : `🎁 Free gift: not yet (add ${left} more pair${left > 1 ? "s" : ""})`);
  }
  if (ctx.status === "live" && ctx.sale.deliveryStarts) {
    out.push(`🚚 Delivery starts ${shortDate(ctx.sale.deliveryStarts)}`);
  }

  out.push("", `Name: ${customer.name.trim()}`, `Phone: ${customer.phone.trim()}`);
  const place = [customer.address.trim(), customer.city.trim(), customer.state.trim()].filter(Boolean).join(", ");
  out.push(`Delivery: ${place}`);
  if (customer.note.trim()) out.push(`Note: ${customer.note.trim()}`);
  return out.join("\n");
}

export function buildSingleItemMessage(line: OrderLine, ctx: OrderContext): string {
  const disc = ctx.status === "live" ? ` (${ctx.sale.discountPercent}% sale discount applied)` : "";
  return [
    "Hello Mercy Footwears 👋 I'd like to order:",
    "",
    itemLines([line]),
    "",
    `Subtotal: ${naira(line.total)}${disc}`,
    "",
    "Is it available? Please let me know the delivery fee to my location.",
  ].join("\n");
}

export function buildChatMessage(): string {
  return "Hello Mercy Footwears 👋 I'd like to ask about your slides.";
}

export function buildNotifyMessage(sale: SaleConfig): string {
  return `Hello Mercy Footwears 👋 Please notify me when the ${sale.title} starts (${shortDate(sale.startsAt)}).`;
}

import type { Product, SaleConfig } from "./types";

export type SaleStatus = "off" | "upcoming" | "live" | "ended";
export type SalePreview = Exclude<SaleStatus, "off"> | null;

export function saleStatus(sale: SaleConfig, now: number): SaleStatus {
  if (!sale.active) return "off";
  const start = Date.parse(sale.startsAt);
  const end = Date.parse(sale.endsAt);
  if (!Number.isNaN(start) && now < start) return "upcoming";
  if (Number.isNaN(end) || now <= end) return "live";
  return "ended";
}

/** Sale price for one pair. Rounded to the nearest ₦50. */
export function discounted(p: Product, sale: SaleConfig): number {
  if (p.salePrice && p.salePrice > 0 && p.salePrice < p.price) return p.salePrice;
  const pct = Math.min(90, Math.max(0, sale.discountPercent || 0));
  return Math.round((p.price * (1 - pct / 100)) / 50) * 50;
}

export function unitPrice(p: Product, sale: SaleConfig, status: SaleStatus): number {
  return status === "live" ? discounted(p, sale) : p.price;
}

export function badgeFor(p: Product, sale: SaleConfig, status: SaleStatus): string | null {
  if (status !== "live") return null;
  const now = discounted(p, sale);
  if (now >= p.price) return null;
  return `-${Math.round((1 - now / p.price) * 100)}%`;
}

/** The free gift runs alongside the sale: shown while it's upcoming or live. */
export function giftEnabled(status: SaleStatus): boolean {
  return status === "live" || status === "upcoming";
}

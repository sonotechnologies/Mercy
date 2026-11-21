import { naira } from "./format";
import type { Product, SaleConfig } from "./types";

export type SaleStatus = "off" | "upcoming" | "live" | "ended";
export type SalePreview = Exclude<SaleStatus, "off"> | null;

const at = (iso: string | undefined | null) => (iso ? Date.parse(iso) : NaN);

/**
 * off: switched off in admin. upcoming: a start date is set and still ahead.
 * ended: an end date is set and has passed. live: anything else (no dates = running now).
 */
export function saleStatus(sale: SaleConfig, now: number): SaleStatus {
  if (!sale.active) return "off";
  const start = at(sale.startsAt);
  const end = at(sale.endsAt);
  if (!Number.isNaN(start) && now < start) return "upcoming";
  if (!Number.isNaN(end) && now > end) return "ended";
  return "live";
}

/** True when this product has its own sale price below the normal price. */
export function hasSalePrice(p: Product): boolean {
  return !!p.salePrice && p.salePrice > 0 && p.salePrice < p.price;
}

/** What one pair costs right now. */
export function unitPrice(p: Product, _sale: SaleConfig, status: SaleStatus): number {
  return status === "live" && hasSalePrice(p) ? p.salePrice! : p.price;
}

/** Card pill while the sale is live and the product is reduced. */
export function badgeFor(p: Product, _sale: SaleConfig, status: SaleStatus): string | null {
  return status === "live" && hasSalePrice(p) ? "Sale" : null;
}

/** "Save ₦1,500" for the product page. */
export function savingLabel(p: Product, status: SaleStatus): string | null {
  return status === "live" && hasSalePrice(p) ? `Save ${naira(p.price - p.salePrice!)}` : null;
}

/** The free gift runs alongside the sale: shown while it's upcoming or live. */
export function giftEnabled(status: SaleStatus): boolean {
  return status === "live" || status === "upcoming";
}

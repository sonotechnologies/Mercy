import catalog from "../data/catalog.json";
import type { Product, SaleConfig, Settings, StoreData } from "./types";

/** Bump when the seed shape changes so stale demo data in localStorage is discarded. */
export const DATA_VERSION = 2;

export const STYLES = ["H-Slides", "Bow & Knot", "Toe-Ring", "Buckle", "Strappy", "Cross-Strap", "Platform", "Cork", "Slides", "Mules", "Loafers"] as const;

/** Home "Shop by style" tiles. Styles with no products are hidden automatically. */
export const STYLE_TILES: { name: string; image: string }[] = [
  { name: "H-Slides", image: "/products/catalog/buckle-h-slide-1.jpg" },
  { name: "Bow & Knot", image: "/products/catalog/mustard-bow-slide-1.jpg" },
  { name: "Toe-Ring", image: "/products/catalog/slingback-thong-sandal-1.jpg" },
  { name: "Buckle", image: "/products/catalog/clasp-slide-5.jpg" },
  { name: "Strappy", image: "/products/catalog/knotted-strappy-slide-2.jpg" },
  { name: "Cross-Strap", image: "/products/catalog/woven-cross-slide-3.jpg" },
  { name: "Platform", image: "/products/catalog/knotted-thong-platform-1.jpg" },
  { name: "Cork", image: "/products/catalog/double-strap-cork-slide-2.jpg" },
  { name: "Slides", image: "/products/catalog/wide-strap-slide-1.jpg" },
  { name: "Mules", image: "/products/catalog/buckle-mule-1.jpg" },
  { name: "Loafers", image: "/products/catalog/penny-loafer-1.jpg" },
];

export const INSTAGRAM_TILES = [
  "/products/mf-10.jpg",
  "/products/catalog/clasp-slide-4.jpg",
  "/products/catalog/suede-tassel-slide-1.jpg",
  "/products/catalog/knotted-thong-platform-1.jpg",
  "/products/mf-08.jpg",
  "/products/catalog/mens-cross-slide-1.jpg",
];

/** Group photo of mixed styles used on the home sale card. */
export const SALE_BANNER = catalog.banner;

export const WOMEN_SIZES = [36, 37, 38, 39, 40, 41, 42];
export const MEN_SIZES = [40, 41, 42, 43, 44, 45, 46];

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Mercy's catalogue, imported from her product pack (scripts/import-catalog.ts). */
export const SEED_PRODUCTS: Product[] = catalog.products as Product[];

export const SEED_SALE: SaleConfig = {
  active: true,
  title: "End of Year Sale",
  // Optional: leave empty to run the sale until it's ended from the admin.
  startsAt: "",
  endsAt: "",
  // Optional: production for sale orders starts on this date (empty = straight away).
  deliveryStarts: "",
  freeGiftMinPairs: 4, // "above 3 pairs"
};

export const SEED_SETTINGS: Settings = {
  whatsappNumber: "2349098964885",
  instagramHandle: "mercy_footwear",
  tagline: "Walk proud, your feet deserve the best.",
  deliveryNote: "We deliver nationwide. Delivery fee is confirmed on WhatsApp.",
  heroVariant: "a",
  madeToOrder: true,
  productionTime: "5–7 working days",
  fulfilment: { pickup: true, delivery: true },
  pickupAddress: "Pickup location shared on WhatsApp",
  pickupHours: "",
  paymentNote: "Payment details will be confirmed on WhatsApp before production starts.",
};

export function seedData(): StoreData {
  return {
    version: DATA_VERSION,
    products: SEED_PRODUCTS.map((p) => ({ ...p, colours: p.colours.map((c) => ({ ...c })), images: [...p.images] })),
    sale: { ...SEED_SALE },
    settings: { ...SEED_SETTINGS },
  };
}

export const SIZE_GUIDE: { eu: number; cm: string }[] = [
  { eu: 36, cm: "22.5" },
  { eu: 37, cm: "23.0" },
  { eu: 38, cm: "24.0" },
  { eu: 39, cm: "24.5" },
  { eu: 40, cm: "25.5" },
  { eu: 41, cm: "26.0" },
  { eu: 42, cm: "27.0" },
  { eu: 43, cm: "27.5" },
  { eu: 44, cm: "28.5" },
  { eu: 45, cm: "29.0" },
];

export const NIGERIAN_STATES = [
  "Lagos", "Abuja (FCT)", "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano",
  "Katsina", "Kebbi", "Kogi", "Kwara", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau",
  "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

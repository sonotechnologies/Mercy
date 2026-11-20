export type Gender = "women" | "men-unisex";

export type Colour = {
  name: string;
  hex: string;
  /** Image shown when this colour is picked. Falls back to the product's first image. */
  image?: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  gender: Gender;
  style: string;
  /** Regular price in naira. */
  price: number;
  /** Optional fixed sale price. When empty, the sale discount % is applied to `price`. */
  salePrice?: number;
  colours: Colour[];
  sizes: number[];
  /** Sizes listed but currently sold out (shown struck through). */
  soldOutSizes: number[];
  inStock: boolean;
  isNew: boolean;
  isBestseller: boolean;
  images: string[];
  description: string;
  /** CSS object-position for card crops of the source still. */
  focus?: string;
  createdAt: number;
};

export type SaleConfig = {
  active: boolean;
  title: string;
  discountPercent: number;
  /** ISO date-time with offset, e.g. 2026-11-26T00:00:00+01:00 */
  startsAt: string;
  endsAt: string;
  /** ISO date, e.g. 2026-12-05 */
  deliveryStarts: string;
  freeGiftMinPairs: number;
};

export type HeroVariant = "a" | "b" | "c";

export type Settings = {
  /** International format without "+", e.g. 2349098964885 */
  whatsappNumber: string;
  instagramHandle: string;
  tagline: string;
  deliveryNote: string;
  heroVariant: HeroVariant;
};

export type StoreData = {
  version: number;
  products: Product[];
  sale: SaleConfig;
  settings: Settings;
};

export type CartLine = {
  key: string;
  productId: string;
  colour: number;
  size: number;
  qty: number;
};

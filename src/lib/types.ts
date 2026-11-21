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
  /** CSS object-position for the 4:5 card crop. */
  focus?: string;
  /** Overrides the store-wide made-to-order setting for this product. */
  orderType?: OrderType;
  /** Overrides the store-wide production time, e.g. "10–14 working days". */
  productionTime?: string;
  createdAt: number;
};

export type OrderType = "made-to-order" | "ready-stock";

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
  /** Every product is made after it's ordered (unless a product overrides it). */
  madeToOrder: boolean;
  /** Shown as "Ready in …", e.g. "5–7 working days". */
  productionTime: string;
  fulfilment: { pickup: boolean; delivery: boolean };
  pickupAddress: string;
  pickupHours: string;
  paymentNote: string;
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

export type Fulfilment = "pickup" | "delivery";

export type OrderStatus = "received" | "confirmed" | "in-production" | "ready" | "out-for-delivery" | "completed" | "cancelled";

export type OrderItem = {
  productId: string;
  name: string;
  colour: string;
  size: number;
  qty: number;
  unitPrice: number;
  total: number;
  image?: string;
};

export type Order = {
  ref: string;
  createdAt: string;
  name: string;
  phone: string;
  fulfilment: Fulfilment;
  address: string;
  city: string;
  state: string;
  note: string;
  items: OrderItem[];
  subtotal: number;
  /** Total at regular prices, for showing savings. */
  fullTotal: number;
  giftUnlocked: boolean;
  status: OrderStatus;
  /** ISO date (yyyy-mm-dd) */
  expectedReady: string;
};

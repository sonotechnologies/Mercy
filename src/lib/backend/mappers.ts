import type { Colour, Order, OrderItem, OrderStatus, Product, SaleConfig, Settings } from "../types";

/* Row shapes as stored in Postgres (snake_case). */

export type ProductRow = {
  id: string;
  slug: string;
  name: string;
  gender: Product["gender"];
  style: string;
  price: number;
  sale_price: number | null;
  colours: Colour[];
  sizes: number[];
  sold_out_sizes: number[];
  in_stock: boolean;
  is_new: boolean;
  is_bestseller: boolean;
  description: string;
  focus: string | null;
  order_type: Product["orderType"] | null;
  production_time: string | null;
  sort: number;
  created_at: string;
  product_images?: { url: string; position: number }[];
};

export function productFromRow(r: ProductRow): Product {
  const images = [...(r.product_images ?? [])].sort((a, b) => a.position - b.position).map((i) => i.url);
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    gender: r.gender,
    style: r.style,
    price: r.price,
    salePrice: r.sale_price ?? undefined,
    colours: r.colours ?? [],
    sizes: r.sizes ?? [],
    soldOutSizes: r.sold_out_sizes ?? [],
    inStock: r.in_stock,
    isNew: r.is_new,
    isBestseller: r.is_bestseller,
    images: images.length ? images : (r.colours ?? []).map((c) => c.image).filter((x): x is string => !!x),
    description: r.description ?? "",
    focus: r.focus ?? undefined,
    orderType: r.order_type ?? undefined,
    productionTime: r.production_time ?? undefined,
    createdAt: Date.parse(r.created_at) || 0,
  };
}

export function productToRow(p: Product, sort = 0): Omit<ProductRow, "product_images"> {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    gender: p.gender,
    style: p.style,
    price: Math.round(p.price),
    sale_price: p.salePrice ? Math.round(p.salePrice) : null,
    colours: p.colours,
    sizes: p.sizes,
    sold_out_sizes: p.soldOutSizes,
    in_stock: p.inStock,
    is_new: p.isNew,
    is_bestseller: p.isBestseller,
    description: p.description,
    focus: p.focus ?? null,
    order_type: p.orderType ?? null,
    production_time: p.productionTime?.trim() || null,
    sort,
    created_at: new Date(p.createdAt || Date.now()).toISOString(),
  };
}

export type OrderRow = {
  ref: string;
  created_at: string;
  customer_name: string;
  phone: string;
  fulfilment: Order["fulfilment"];
  address: string;
  city: string;
  state: string;
  note: string;
  subtotal: number;
  full_total: number;
  gift_unlocked: boolean;
  status: OrderStatus;
  expected_ready: string;
  order_items?: OrderItemRow[];
};

export type OrderItemRow = {
  order_ref?: string;
  product_id: string | null;
  name: string;
  colour: string;
  size: number;
  qty: number;
  unit_price: number;
  total: number;
  image: string | null;
};

export function orderFromRow(r: OrderRow): Order {
  return {
    ref: r.ref,
    createdAt: r.created_at,
    name: r.customer_name,
    phone: r.phone,
    fulfilment: r.fulfilment,
    address: r.address ?? "",
    city: r.city ?? "",
    state: r.state ?? "",
    note: r.note ?? "",
    subtotal: r.subtotal,
    fullTotal: r.full_total,
    giftUnlocked: r.gift_unlocked,
    status: r.status,
    expectedReady: r.expected_ready,
    items: (r.order_items ?? []).map(
      (i): OrderItem => ({
        productId: i.product_id ?? "",
        name: i.name,
        colour: i.colour,
        size: i.size,
        qty: i.qty,
        unitPrice: i.unit_price,
        total: i.total,
        image: i.image ?? undefined,
      }),
    ),
  };
}

export function orderToRows(o: Order): { order: Omit<OrderRow, "order_items">; items: OrderItemRow[] } {
  return {
    order: {
      ref: o.ref,
      created_at: o.createdAt,
      customer_name: o.name,
      phone: o.phone,
      fulfilment: o.fulfilment,
      address: o.address,
      city: o.city,
      state: o.state,
      note: o.note,
      subtotal: o.subtotal,
      full_total: o.fullTotal,
      gift_unlocked: o.giftUnlocked,
      status: o.status,
      expected_ready: o.expectedReady,
    },
    items: o.items.map((i) => ({
      order_ref: o.ref,
      product_id: i.productId || null,
      name: i.name,
      colour: i.colour,
      size: i.size,
      qty: i.qty,
      unit_price: i.unitPrice,
      total: i.total,
      image: i.image && !i.image.startsWith("data:") ? i.image : null,
    })),
  };
}

export type SettingsRows = { key: "settings" | "sale"; value: Settings | SaleConfig }[];

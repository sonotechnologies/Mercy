"use client";

/**
 * Browser-side data API. Each call goes to Supabase when it's configured,
 * otherwise to browser storage (demo mode), so the UI never has to care which.
 */
import { buildOrder, OrderError, type OrderRequest } from "../order-build";
import { normaliseRef, samePhone } from "../orders";
import { seedData } from "../seed";
import type { SaleStatus } from "../sale";
import type { Order, OrderStatus, Product, SaleConfig, Settings, StoreData } from "../types";
import { browserClient } from "./browser";
import { IMAGE_BUCKET, hasSupabase } from "./config";
import { orderFromRow, productFromRow, productToRow, type OrderRow, type ProductRow } from "./mappers";

export { hasSupabase, OrderError };

/* ---------- local (demo) storage ---------- */

const ORDERS_KEY = "mf.orders";
const MY_ORDERS_KEY = "mf.myOrders";

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeLocal(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    throw new Error("Browser storage is full.");
  }
}

/** Orders placed on this device, so /track can offer them without typing. */
export function rememberMyOrder(o: Pick<Order, "ref" | "phone" | "createdAt">) {
  const list = readLocal<{ ref: string; phone: string; createdAt: string }[]>(MY_ORDERS_KEY, []).filter((x) => x.ref !== o.ref);
  writeLocal(MY_ORDERS_KEY, [{ ref: o.ref, phone: o.phone, createdAt: o.createdAt }, ...list].slice(0, 10));
}
export const myOrders = () => readLocal<{ ref: string; phone: string; createdAt: string }[]>(MY_ORDERS_KEY, []);

/* ---------- catalogue ---------- */

export async function fetchCatalog(): Promise<Pick<StoreData, "products" | "sale" | "settings"> | null> {
  if (!hasSupabase) return null;
  const sb = browserClient();
  const [p, s] = await Promise.all([
    sb.from("products").select("*, product_images(url, position)").order("sort").order("created_at"),
    sb.from("settings").select("key, value"),
  ]);
  if (p.error || s.error) return null;
  const seed = seedData();
  const rows = s.data as { key: string; value: unknown }[];
  const settings = rows.find((r) => r.key === "settings")?.value as Partial<Settings> | undefined;
  const sale = rows.find((r) => r.key === "sale")?.value as Partial<SaleConfig> | undefined;
  const products = (p.data as ProductRow[]).map(productFromRow);
  return {
    products: products.length ? products : seed.products,
    sale: { ...seed.sale, ...sale },
    settings: { ...seed.settings, ...settings, fulfilment: { ...seed.settings.fulfilment, ...settings?.fulfilment } },
  };
}

/* ---------- orders ---------- */

export async function submitOrder(req: OrderRequest, local: { data: StoreData; status: SaleStatus }): Promise<Order> {
  if (hasSupabase) {
    const res = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(req) });
    const body = (await res.json().catch(() => ({}))) as { order?: Order; error?: string };
    if (!res.ok || !body.order) throw new OrderError(body.error ?? "We couldn't save your order. Please try again.");
    rememberMyOrder(body.order);
    return body.order;
  }
  const order = buildOrder(req, { products: local.data.products, sale: local.data.sale, settings: local.data.settings, status: local.status, now: Date.now() });
  const all = readLocal<Order[]>(ORDERS_KEY, []);
  writeLocal(ORDERS_KEY, [order, ...all.filter((o) => o.ref !== order.ref)]);
  rememberMyOrder(order);
  return order;
}

export async function trackOrder(refInput: string, phone: string): Promise<Order | null> {
  const ref = normaliseRef(refInput);
  if (!ref) return null;
  if (hasSupabase) {
    const res = await fetch(`/api/track?ref=${encodeURIComponent(ref)}&phone=${encodeURIComponent(phone)}`, { cache: "no-store" });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("We couldn't check that order right now. Please try again.");
    return ((await res.json()) as { order: Order }).order;
  }
  const o = readLocal<Order[]>(ORDERS_KEY, []).find((x) => x.ref === ref);
  return o && samePhone(o.phone, phone) ? o : null;
}

/* ---------- admin ---------- */

export type AdminSession = { email: string } | null;

export async function adminSession(): Promise<AdminSession> {
  if (!hasSupabase) return null;
  const sb = browserClient();
  const { data } = await sb.auth.getSession();
  if (!data.session) return null;
  const { data: ok } = await sb.rpc("is_admin");
  return ok ? { email: data.session.user.email ?? "" } : null;
}

export async function adminSignIn(email: string, password: string): Promise<AdminSession> {
  const sb = browserClient();
  const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw new Error(error.message === "Invalid login credentials" ? "That email and password don't match." : error.message);
  const s = await adminSession();
  if (!s) {
    await sb.auth.signOut();
    throw new Error("This account isn't an admin for the store.");
  }
  return s;
}

/** Changes the signed-in admin's password after re-checking the current one. */
export async function adminChangePassword(current: string, next: string): Promise<void> {
  const sb = browserClient();
  const { data } = await sb.auth.getSession();
  const email = data.session?.user.email;
  if (!email) throw new Error("Please sign in again.");
  if (next.length < 8) throw new Error("Use at least 8 characters for the new password.");
  if (next === current) throw new Error("The new password is the same as the current one.");
  const check = await sb.auth.signInWithPassword({ email, password: current });
  if (check.error) throw new Error("Your current password isn't right.");
  const { error } = await sb.auth.updateUser({ password: next });
  if (error) throw new Error(/weak|short|leaked|pwned/i.test(error.message) ? "That password is too easy to guess. Try a longer one." : error.message);
}

export async function adminSignOut() {
  if (hasSupabase) await browserClient().auth.signOut();
}

/** Asks the server to rebuild cached pages so changes show for every visitor. */
async function refreshSite() {
  const { data } = await browserClient().auth.getSession();
  await fetch("/api/revalidate", { method: "POST", headers: { Authorization: `Bearer ${data.session?.access_token ?? ""}` } }).catch(() => undefined);
}

export async function dbSaveProduct(p: Product, sort: number): Promise<void> {
  const sb = browserClient();
  const { error } = await sb.from("products").upsert(productToRow(p, sort));
  if (error) throw new Error(error.message);
  const del = await sb.from("product_images").delete().eq("product_id", p.id);
  if (del.error) throw new Error(del.error.message);
  if (p.images.length) {
    const ins = await sb.from("product_images").insert(p.images.map((url, position) => ({ product_id: p.id, url, position })));
    if (ins.error) throw new Error(ins.error.message);
  }
  await refreshSite();
}

export async function dbDeleteProduct(id: string): Promise<void> {
  const { error } = await browserClient().from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await refreshSite();
}

export async function dbSaveSetting(key: "settings" | "sale", value: Settings | SaleConfig): Promise<void> {
  const { error } = await browserClient().from("settings").upsert({ key, value });
  if (error) throw new Error(error.message);
  await refreshSite();
}

/** Uploads a processed photo and returns its public URL (or a data URL in demo mode). */
export async function uploadImage(blob: Blob, productId: string): Promise<string> {
  if (!hasSupabase) {
    return await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = () => reject(new Error("Couldn't read that image."));
      r.readAsDataURL(blob);
    });
  }
  const sb = browserClient();
  const path = `${productId}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}.jpg`;
  const { error } = await sb.storage.from(IMAGE_BUCKET).upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000" });
  if (error) throw new Error(error.message);
  return sb.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function listOrders(): Promise<Order[]> {
  if (!hasSupabase) return readLocal<Order[]>(ORDERS_KEY, []);
  const { data, error } = await browserClient()
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  return (data as OrderRow[]).map(orderFromRow);
}

export async function setOrderStatus(ref: string, status: OrderStatus): Promise<void> {
  if (!hasSupabase) {
    writeLocal(ORDERS_KEY, readLocal<Order[]>(ORDERS_KEY, []).map((o) => (o.ref === ref ? { ...o, status } : o)));
    return;
  }
  const { error } = await browserClient().from("orders").update({ status }).eq("ref", ref);
  if (error) throw new Error(error.message);
}

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { seedData } from "../seed";
import type { SaleConfig, Settings, StoreData } from "../types";
import { SUPABASE_ANON_KEY, SUPABASE_URL, hasSupabase } from "./config";
import { productFromRow, type ProductRow } from "./mappers";

if (typeof window !== "undefined") throw new Error("lib/backend/server must only be imported on the server");

const opts = { auth: { persistSession: false, autoRefreshToken: false } };

export const publicClient = () => createClient(SUPABASE_URL, SUPABASE_ANON_KEY, opts);

/** Full-access client for API routes. Needs SUPABASE_SECRET_KEY (never exposed to the browser). */
export function serviceClient(): SupabaseClient {
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!hasSupabase || !key) throw new Error("Supabase is not configured on the server (SUPABASE_SECRET_KEY missing).");
  return createClient(SUPABASE_URL, key, opts);
}

export const PRODUCT_SELECT = "*, product_images(url, position)";

/** Products, sale and settings from Supabase, merged over the seed defaults. Falls back to the seed on any error. */
export async function loadStoreData(sb?: SupabaseClient): Promise<StoreData> {
  const seed = seedData();
  if (!hasSupabase) return seed;
  try {
    const client = sb ?? publicClient();
    const [p, s] = await Promise.all([
      client.from("products").select(PRODUCT_SELECT).order("sort").order("created_at"),
      client.from("settings").select("key, value"),
    ]);
    if (p.error) throw p.error;
    if (s.error) throw s.error;
    const rows = (s.data ?? []) as { key: string; value: unknown }[];
    const settings = rows.find((r) => r.key === "settings")?.value as Partial<Settings> | undefined;
    const sale = rows.find((r) => r.key === "sale")?.value as Partial<SaleConfig> | undefined;
    const products = (p.data as ProductRow[]).map(productFromRow);
    return {
      version: seed.version,
      products: products.length ? products : seed.products,
      sale: { ...seed.sale, ...sale },
      settings: { ...seed.settings, ...settings, fulfilment: { ...seed.settings.fulfilment, ...settings?.fulfilment } },
    };
  } catch (e) {
    console.error("[mercy] Falling back to seed data:", e);
    return seed;
  }
}

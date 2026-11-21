"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { dbDeleteProduct, dbSaveProduct, dbSaveSetting, fetchCatalog, hasSupabase } from "@/lib/backend/client";
import { localDataSource } from "@/lib/data-source";
import { seedData } from "@/lib/seed";
import type { Product, SaleConfig, Settings, StoreData } from "@/lib/types";

type StoreCtx = {
  data: StoreData;
  /** True once the freshest data has been loaded on the client. */
  ready: boolean;
  /** "supabase" when changes are saved to the database, "local" in demo mode. */
  mode: "supabase" | "local";
  products: Product[];
  getProduct: (idOrSlug: string) => Product | undefined;
  saveProduct: (p: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  setSale: (s: SaleConfig) => Promise<void>;
  setSettings: (s: Settings) => Promise<void>;
  resetDemo: () => void;
};

const Ctx = createContext<StoreCtx | null>(null);

/**
 * Catalogue, sale and settings. `initial` comes from the server (Supabase or the seed)
 * so pages render with real data; the client then refreshes it once.
 */
export function StoreProvider({ children, initial }: { children: React.ReactNode; initial?: StoreData }) {
  const [data, setData] = useState<StoreData>(() => initial ?? seedData());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (hasSupabase) {
      fetchCatalog()
        .then((fresh) => {
          if (!cancelled && fresh) setData((d) => ({ ...d, ...fresh }));
        })
        .finally(() => !cancelled && setReady(true));
      return () => {
        cancelled = true;
      };
    }
    const saved = localDataSource.load();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate demo data from browser storage
    if (saved) setData(saved);
    setReady(true);
    return localDataSource.subscribe(() => setData(localDataSource.load() ?? seedData()));
  }, []);

  /** Demo mode: apply and persist to browser storage. */
  const commitLocal = useCallback((fn: (d: StoreData) => StoreData) => {
    setData((prev) => {
      const next = fn(prev);
      localDataSource.save(next);
      return next;
    });
  }, []);

  const value = useMemo<StoreCtx>(() => {
    const upsert = (d: StoreData, p: Product): StoreData => ({
      ...d,
      products: d.products.some((x) => x.id === p.id) ? d.products.map((x) => (x.id === p.id ? p : x)) : [...d.products, p],
    });
    return {
      data,
      ready,
      mode: hasSupabase ? "supabase" : "local",
      products: data.products,
      getProduct: (k) => data.products.find((p) => p.id === k || p.slug === k),
      saveProduct: async (p) => {
        if (hasSupabase) {
          const idx = data.products.findIndex((x) => x.id === p.id);
          await dbSaveProduct(p, idx >= 0 ? idx : data.products.length);
          setData((d) => upsert(d, p));
        } else commitLocal((d) => upsert(d, p));
      },
      deleteProduct: async (id) => {
        if (hasSupabase) await dbDeleteProduct(id);
        const drop = (d: StoreData) => ({ ...d, products: d.products.filter((x) => x.id !== id) });
        if (hasSupabase) setData(drop);
        else commitLocal(drop);
      },
      setSale: async (sale) => {
        if (hasSupabase) {
          await dbSaveSetting("sale", sale);
          setData((d) => ({ ...d, sale }));
        } else commitLocal((d) => ({ ...d, sale }));
      },
      setSettings: async (settings) => {
        if (hasSupabase) {
          await dbSaveSetting("settings", settings);
          setData((d) => ({ ...d, settings }));
        } else commitLocal((d) => ({ ...d, settings }));
      },
      resetDemo: () => {
        localDataSource.clear();
        setData(seedData());
      },
    };
  }, [data, ready, commitLocal]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore must be used inside <StoreProvider>");
  return c;
}

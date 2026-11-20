"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { localDataSource, type DataSource } from "@/lib/data-source";
import { seedData } from "@/lib/seed";
import type { Product, SaleConfig, Settings, StoreData } from "@/lib/types";

type StoreCtx = {
  data: StoreData;
  /** True once saved data (if any) has been loaded on the client. */
  ready: boolean;
  products: Product[];
  getProduct: (idOrSlug: string) => Product | undefined;
  saveProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  setSale: (s: SaleConfig) => void;
  setSettings: (s: Settings) => void;
  resetDemo: () => void;
};

const Ctx = createContext<StoreCtx | null>(null);

export function StoreProvider({ children, source = localDataSource }: { children: React.ReactNode; source?: DataSource }) {
  const [data, setData] = useState<StoreData>(seedData);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = source.load();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from browser storage after SSR
    if (saved) setData(saved);
    setReady(true);
    return source.subscribe(() => setData(source.load() ?? seedData()));
  }, [source]);

  const commit = useCallback(
    (fn: (d: StoreData) => StoreData) => {
      setData((prev) => {
        const next = fn(prev);
        source.save(next);
        return next;
      });
    },
    [source],
  );

  const value = useMemo<StoreCtx>(() => {
    const visible = data.products;
    return {
      data,
      ready,
      products: visible,
      getProduct: (k) => visible.find((p) => p.id === k || p.slug === k),
      saveProduct: (p) =>
        commit((d) => ({
          ...d,
          products: d.products.some((x) => x.id === p.id) ? d.products.map((x) => (x.id === p.id ? p : x)) : [...d.products, p],
        })),
      deleteProduct: (id) => commit((d) => ({ ...d, products: d.products.filter((x) => x.id !== id) })),
      setSale: (sale) => commit((d) => ({ ...d, sale })),
      setSettings: (settings) => commit((d) => ({ ...d, settings })),
      resetDemo: () => {
        source.clear();
        setData(seedData());
      },
    };
  }, [data, ready, commit, source]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore must be used inside <StoreProvider>");
  return c;
}

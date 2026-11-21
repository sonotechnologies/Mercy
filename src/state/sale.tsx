"use client";

import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { badgeFor, giftEnabled, saleStatus, unitPrice, type SalePreview, type SaleStatus } from "@/lib/sale";
import type { Product, SaleConfig } from "@/lib/types";
import { useStore } from "./store";

type SaleCtx = {
  sale: SaleConfig;
  /** "off" until the clock is known on the client, so SSR shows regular prices. */
  status: SaleStatus;
  known: boolean;
  preview: SalePreview;
  /** Timestamp the countdown counts to (start when upcoming, end when live). */
  target: number | null;
  giftMin: number | null;
  priceOf: (p: Product) => number;
  badgeOf: (p: Product) => string | null;
};

const Ctx = createContext<SaleCtx | null>(null);

const PREVIEW_KEY = "mf.salePreview";

function readPreview(): SalePreview {
  try {
    const q = new URLSearchParams(window.location.search).get("preview");
    if (q === "live" || q === "upcoming" || q === "ended") {
      sessionStorage.setItem(PREVIEW_KEY, q);
      return q;
    }
    if (q === "off" || q === "none") {
      sessionStorage.removeItem(PREVIEW_KEY);
      return null;
    }
    const s = sessionStorage.getItem(PREVIEW_KEY);
    return s === "live" || s === "upcoming" || s === "ended" ? s : null;
  } catch {
    return null;
  }
}

/** Ticks once a second on the client; null during SSR/hydration. */
const clock = {
  listeners: new Set<() => void>(),
  now: 0,
  timer: 0 as unknown as ReturnType<typeof setInterval>,
  subscribe(cb: () => void) {
    clock.listeners.add(cb);
    if (clock.listeners.size === 1) {
      clock.now = Date.now();
      clock.timer = setInterval(() => {
        clock.now = Date.now();
        clock.listeners.forEach((l) => l());
      }, 1000);
    }
    return () => {
      clock.listeners.delete(cb);
      if (clock.listeners.size === 0) clearInterval(clock.timer);
    };
  },
  get: () => {
    if (!clock.now) clock.now = Date.now();
    return clock.now;
  },
  server: () => null as number | null,
};

/** Current time, updated every second (null on the server). */
export function useNow(): number | null {
  return useSyncExternalStore<number | null>(clock.subscribe, clock.get, clock.server);
}

/**
 * `renderedAt` is the server's clock when the HTML was generated. Using it for the
 * first render keeps the sale bar and prices identical between server HTML and
 * hydration (no layout shift); the live clock takes over right after mount.
 */
export function SaleProvider({ children, renderedAt }: { children: React.ReactNode; renderedAt: number }) {
  const { data } = useStore();
  const sale = data.sale;
  const [preview, setPreview] = useState<SalePreview>(null);
  const [real, setReal] = useState<SaleStatus>(() => saleStatus(sale, renderedAt));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read ?preview= on the client only
    setPreview(readPreview());
  }, []);

  // Re-evaluate the real status every second, but only re-render the tree when it changes.
  useEffect(() => {
    const tick = () => setReal((prev) => {
      const s = saleStatus(sale, Date.now());
      return prev === s ? prev : s;
    });
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [sale]);

  const value = useMemo<SaleCtx>(() => {
    const known = true;
    const status: SaleStatus = sale.active && preview ? preview : real;
    // Countdown only when there's a date to count to (no end date = no countdown).
    const raw = status === "upcoming" ? Date.parse(sale.startsAt) : status === "live" && sale.endsAt ? Date.parse(sale.endsAt) : NaN;
    const target = Number.isNaN(raw) ? null : raw;
    return {
      sale,
      status,
      known,
      preview,
      target,
      giftMin: giftEnabled(status) ? Math.max(1, sale.freeGiftMinPairs || 1) : null,
      priceOf: (p) => unitPrice(p, sale, status),
      badgeOf: (p) => badgeFor(p, sale, status),
    };
  }, [sale, real, preview]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSale() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSale must be used inside <SaleProvider>");
  return c;
}

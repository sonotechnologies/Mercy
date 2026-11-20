"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { CartLine, Product } from "@/lib/types";
import type { CustomerDetails } from "@/lib/whatsapp";
import { useSale } from "./sale";
import { useStore } from "./store";

export type ResolvedLine = CartLine & { product: Product; unit: number; total: number; colourName: string; image: string };

type CartCtx = {
  lines: ResolvedLine[];
  count: number;
  subtotal: number;
  /** Total at regular prices (for "Sale savings"). */
  fullTotal: number;
  add: (productId: string, colour: number, size: number, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;

  cartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;

  quickId: string | null;
  openQuick: (productId: string) => void;
  closeQuick: () => void;

  /** Increments on every add (drives the bag bounce). */
  bump: number;
  /** Increments once when the free gift unlocks (drives confetti). */
  burst: number;

  customer: CustomerDetails;
  setCustomer: (c: CustomerDetails) => void;
};

const Ctx = createContext<CartCtx | null>(null);
const CART_KEY = "mf.cart";
const FORM_KEY = "mf.checkout";
const GIFT_KEY = "mf.giftCelebrated";

const EMPTY_CUSTOMER: CustomerDetails = { name: "", phone: "", address: "", city: "", state: "Lagos", note: "" };

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* ignore */
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { products } = useStore();
  const { priceOf, giftMin } = useSale();
  const [raw, setRaw] = useState<CartLine[]>([]);
  const [customer, setCustomerState] = useState<CustomerDetails>(EMPTY_CUSTOMER);
  const [cartOpen, setCartOpen] = useState(false);
  const [quickId, setQuickId] = useState<string | null>(null);
  const [bump, setBump] = useState(0);
  const [burst, setBurst] = useState(0);
  const celebrated = useRef(false);
  const loaded = useRef(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- hydrate from browser storage after SSR */
    setRaw(read<CartLine[]>(CART_KEY, []));
    setCustomerState({ ...EMPTY_CUSTOMER, ...read<Partial<CustomerDetails>>(FORM_KEY, {}) });
    /* eslint-enable react-hooks/set-state-in-effect */
    celebrated.current = read<boolean>(GIFT_KEY, false);
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (loaded.current) write(CART_KEY, raw);
  }, [raw]);

  const lines = useMemo<ResolvedLine[]>(
    () =>
      raw.flatMap((l) => {
        const product = products.find((p) => p.id === l.productId);
        if (!product) return [];
        const c = product.colours[l.colour] ?? product.colours[0];
        const unit = priceOf(product);
        return [{ ...l, product, unit, total: unit * l.qty, colourName: c?.name ?? "", image: c?.image ?? product.images[0] }];
      }),
    [raw, products, priceOf],
  );

  const count = lines.reduce((a, l) => a + l.qty, 0);
  const subtotal = lines.reduce((a, l) => a + l.total, 0);
  const fullTotal = lines.reduce((a, l) => a + l.product.price * l.qty, 0);

  const add = useCallback(
    (productId: string, colour: number, size: number, qty = 1) => {
      setRaw((prev) => {
        const key = `${productId}|${colour}|${size}`;
        const next = prev.some((l) => l.key === key)
          ? prev.map((l) => (l.key === key ? { ...l, qty: l.qty + qty } : l))
          : [...prev, { key, productId, colour, size, qty }];
        const total = next.reduce((a, l) => a + l.qty, 0);
        if (giftMin != null && total >= giftMin && !celebrated.current) {
          celebrated.current = true;
          write(GIFT_KEY, true);
          setBurst((b) => b + 1);
        }
        return next;
      });
      setBump((b) => b + 1);
    },
    [giftMin],
  );

  const value = useMemo<CartCtx>(
    () => ({
      lines,
      count,
      subtotal,
      fullTotal,
      add,
      setQty: (key, qty) => setRaw((prev) => prev.map((l) => (l.key === key ? { ...l, qty } : l)).filter((l) => l.qty > 0)),
      clear: () => setRaw([]),
      cartOpen,
      openCart: () => {
        setQuickId(null);
        setCartOpen(true);
      },
      closeCart: () => setCartOpen(false),
      quickId,
      openQuick: (id) => setQuickId(id),
      closeQuick: () => setQuickId(null),
      bump,
      burst,
      customer,
      setCustomer: (c) => {
        setCustomerState(c);
        write(FORM_KEY, c);
      },
    }),
    [lines, count, subtotal, fullTotal, add, cartOpen, quickId, bump, burst, customer],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside <CartProvider>");
  return c;
}

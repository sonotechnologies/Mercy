"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { naira } from "@/lib/format";
import { MEN_SIZES, STYLES, WOMEN_SIZES } from "@/lib/seed";
import type { Gender, Product } from "@/lib/types";
import { useSale } from "@/state/sale";
import { useStore } from "@/state/store";
import { CloseIcon, FilterIcon } from "./icons";
import { ProductCard } from "./product-card";
import { Backdrop, useOverlay } from "./ui";

type Sort = "newest" | "price-asc" | "price-desc";

const PRICE_BANDS = [
  { id: "u10", label: "Under ₦10,000", test: (n: number) => n < 10000 },
  { id: "10-14", label: "₦10,000 – ₦14,000", test: (n: number) => n >= 10000 && n <= 14000 },
  { id: "o14", label: "Over ₦14,000", test: (n: number) => n > 14000 },
];

/** "Mocha & White" -> "Mocha"; groups colours into simple families for the filter. */
const family = (name: string) => name.split(/\s*[&/,]\s*|\s+/)[0];

function Chip({ active, onClick, children, label }: { active: boolean; onClick: () => void; children: React.ReactNode; label?: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={label}
      onClick={onClick}
      className={`h-9 rounded-full border px-3.5 text-[13px] font-medium transition-colors ${
        active ? "border-cocoa bg-cocoa text-cream" : "border-cocoa/20 hover:border-cocoa"
      }`}
    >
      {children}
    </button>
  );
}

export function ShopView() {
  const { products } = useStore();
  const { status, priceOf, badgeOf } = useSale();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const gender: Gender = params.get("g") === "men-unisex" ? "men-unisex" : "women";
  const style = params.get("style");
  const onSale = params.get("sale") === "1";

  const [colours, setColours] = useState<string[]>([]);
  const [sizes, setSizes] = useState<number[]>([]);
  const [band, setBand] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("newest");
  const [sheet, setSheet] = useState(false);
  const closeSheet = useCallback(() => setSheet(false), []);
  useOverlay(sheet, closeSheet);

  const setParam = (k: string, v: string | null) => {
    const q = new URLSearchParams(params.toString());
    if (v == null) q.delete(k);
    else q.set(k, v);
    router.replace(`${pathname}?${q.toString()}`, { scroll: false });
  };
  const setGender = (g: Gender) => {
    const q = new URLSearchParams(params.toString());
    q.set("g", g);
    q.delete("style");
    setSizes([]);
    router.replace(`${pathname}?${q.toString()}`, { scroll: false });
  };

  const pool = useMemo(() => products.filter((p) => p.gender === gender), [products, gender]);
  const styleOptions = STYLES.filter((s) => pool.some((p) => p.style === s));
  const colourOptions = useMemo(() => {
    const m = new Map<string, string>();
    pool.forEach((p) => p.colours.forEach((c) => !m.has(family(c.name)) && m.set(family(c.name), c.hex)));
    return [...m.entries()];
  }, [pool]);
  const sizeOptions = gender === "women" ? WOMEN_SIZES : MEN_SIZES;

  const list = useMemo(() => {
    const out = pool.filter(
      (p: Product) =>
        (!style || p.style === style) &&
        (!onSale || !!badgeOf(p)) &&
        (!colours.length || p.colours.some((c) => colours.includes(family(c.name)))) &&
        (!sizes.length || sizes.some((z) => p.sizes.includes(z) && !p.soldOutSizes.includes(z))) &&
        (!band || PRICE_BANDS.find((b) => b.id === band)!.test(priceOf(p))),
    );
    return out.sort((a, b) =>
      sort === "price-asc" ? priceOf(a) - priceOf(b) : sort === "price-desc" ? priceOf(b) - priceOf(a) : Number(b.isNew) - Number(a.isNew) || b.createdAt - a.createdAt,
    );
  }, [pool, style, onSale, colours, sizes, band, sort, priceOf, badgeOf]);

  const activeCount = (style ? 1 : 0) + (onSale ? 1 : 0) + colours.length + sizes.length + (band ? 1 : 0);
  const clearAll = () => {
    setColours([]);
    setSizes([]);
    setBand(null);
    const q = new URLSearchParams();
    q.set("g", gender);
    router.replace(`${pathname}?${q.toString()}`, { scroll: false });
  };
  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const prices = pool.map(priceOf);

  const filters = (
    <div className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-2.5">
        <legend className="mb-2.5 text-xs font-semibold tracking-[.14em] text-ochre">STYLE</legend>
        <div className="flex flex-wrap gap-2">
          <Chip active={!style} onClick={() => setParam("style", null)}>All</Chip>
          {styleOptions.map((s) => (
            <Chip key={s} active={style === s} onClick={() => setParam("style", style === s ? null : s)}>
              {s}
            </Chip>
          ))}
        </div>
      </fieldset>
      {status === "live" && (
        <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium">
          <input type="checkbox" checked={onSale} onChange={() => setParam("sale", onSale ? null : "1")} className="size-[18px] accent-mercy" />
          On sale only
        </label>
      )}
      <fieldset>
        <legend className="mb-2.5 text-xs font-semibold tracking-[.14em] text-ochre">COLOUR</legend>
        <div className="flex flex-wrap gap-2">
          {colourOptions.map(([name, hex]) => (
            <Chip key={name} active={colours.includes(name)} onClick={() => setColours((c) => toggle(c, name))}>
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded-full shadow-[inset_0_0_0_1px_rgba(43,31,26,.2)]" style={{ background: hex }} />
                {name}
              </span>
            </Chip>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2.5 text-xs font-semibold tracking-[.14em] text-ochre">PRICE</legend>
        <div className="flex flex-wrap gap-2">
          {PRICE_BANDS.map((b) => (
            <Chip key={b.id} active={band === b.id} onClick={() => setBand(band === b.id ? null : b.id)}>
              {b.label}
            </Chip>
          ))}
        </div>
        {prices.length > 0 && (
          <p className="tabular mt-2 text-xs text-muted">
            From {naira(Math.min(...prices))} to {naira(Math.max(...prices))}
          </p>
        )}
      </fieldset>
      <fieldset>
        <legend className="mb-2.5 text-xs font-semibold tracking-[.14em] text-ochre">SIZE (EU)</legend>
        <div className="flex flex-wrap gap-2">
          {sizeOptions.map((z) => (
            <Chip key={z} active={sizes.includes(z)} onClick={() => setSizes((s) => toggle(s, z))} label={`EU ${z}`}>
              <span className="tabular">{z}</span>
            </Chip>
          ))}
        </div>
      </fieldset>
      {activeCount > 0 && (
        <button type="button" onClick={clearAll} className="self-start border-b border-gold pb-0.5 text-sm font-medium">
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="px-5 pt-6 pb-16 lg:mx-auto lg:max-w-[1240px] lg:px-12 lg:pt-12 lg:pb-24">
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold tracking-[.18em] text-ochre lg:text-xs">{onSale ? "END OF YEAR SALE" : "SHOP"}</span>
        <h1 className="m-0 font-serif text-[34px] leading-[1.05] font-semibold lg:text-6xl">{gender === "women" ? "Women's slides" : "Men & Unisex"}</h1>
      </div>

      <div className="mt-5 flex gap-1 rounded-full border border-hair p-1 lg:inline-flex" role="tablist" aria-label="Collection">
        {(
          [
            ["women", "Women"],
            ["men-unisex", "Men & Unisex"],
          ] as const
        ).map(([g, label]) => (
          <button
            key={g}
            role="tab"
            type="button"
            aria-selected={gender === g}
            onClick={() => setGender(g)}
            className={`h-10 flex-1 rounded-full px-5 text-sm font-semibold transition-colors lg:flex-none ${gender === g ? "bg-cocoa text-cream" : "hover:bg-sand"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6 lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-12">
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="sticky top-32">{filters}</div>
        </aside>

        <div>
          <div className="mb-5 flex items-center justify-between gap-3 border-b border-hair pb-4">
            <button
              type="button"
              onClick={() => setSheet(true)}
              className="flex h-10 items-center gap-2 rounded-full border border-cocoa/20 px-4 text-sm font-medium lg:hidden"
            >
              <FilterIcon size={16} />
              Filters{activeCount ? ` (${activeCount})` : ""}
            </button>
            <span className="hidden text-sm text-muted lg:inline" aria-live="polite">
              {list.length} {list.length === 1 ? "style" : "styles"}
            </span>
            <label className="flex items-center gap-2 text-sm">
              <span className="sr-only lg:not-sr-only">Sort by</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="h-10 rounded-full border border-cocoa/20 bg-field px-3.5 text-sm font-medium outline-none focus:border-gold"
              >
                <option value="newest">Newest</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
              </select>
            </label>
          </div>

          {list.length ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:gap-x-6 lg:gap-y-10">
              {list.map((p, i) => (
                <ProductCard key={p.id} product={p} revealIndex={i} sizes="(min-width:1024px) 290px, (min-width:640px) 33vw, 50vw" priority={i < 4} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-sand px-6 py-14 text-center">
              <span className="font-serif text-[26px] font-semibold">Nothing matches those filters.</span>
              <p className="text-sm text-muted">Try fewer filters, or ask Mercy on WhatsApp. She may have it in the shop.</p>
              <button type="button" onClick={clearAll} className="mt-1 h-11 rounded-full bg-cocoa px-6 text-sm font-semibold text-cream hover:bg-mercy">
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter sheet */}
      <Backdrop open={sheet} onClick={closeSheet} z="z-[45] lg:hidden" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
        aria-hidden={!sheet}
        inert={!sheet}
        className={`fixed inset-x-0 bottom-0 z-[46] flex max-h-[85dvh] flex-col rounded-t-3xl bg-cream transition-transform duration-[350ms] ease-out-soft lg:hidden ${sheet ? "translate-y-0" : "translate-y-[105%]"}`}
      >
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <h2 className="font-serif text-[28px] font-semibold">Filters</h2>
          <button type="button" onClick={closeSheet} aria-label="Close filters" className="grid size-11 place-items-center">
            <CloseIcon />
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-4">{filters}</div>
        <div className="border-t border-hair px-5 pt-3 pb-[calc(16px+env(safe-area-inset-bottom))]">
          <button type="button" onClick={closeSheet} className="h-[52px] w-full rounded-full bg-cocoa text-[15px] font-semibold text-cream">
            Show {list.length} {list.length === 1 ? "style" : "styles"}
          </button>
        </div>
      </div>
    </div>
  );
}

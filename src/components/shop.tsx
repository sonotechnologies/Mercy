"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { FAMILIES, familyOf, type FamilyId } from "@/lib/colour";
import { naira } from "@/lib/format";
import { MEN_SIZES, STYLES, WOMEN_SIZES } from "@/lib/seed";
import type { Gender, Product } from "@/lib/types";
import { useSale } from "@/state/sale";
import { useStore } from "@/state/store";
import { CloseIcon, FilterIcon } from "./icons";
import { ProductCard } from "./product-card";
import { Backdrop, useOverlay } from "./ui";

type Sort = "featured" | "newest" | "price-asc" | "price-desc";

const PRICE_BANDS = [
  { id: "u8", label: "Under ₦8,000", test: (n: number) => n < 8000 },
  { id: "8-12", label: "₦8,000 – ₦12,000", test: (n: number) => n >= 8000 && n <= 12000 },
  { id: "o12", label: "Over ₦12,000", test: (n: number) => n > 12000 },
];

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`h-9 flex-none rounded-full border px-3.5 text-[13px] font-medium whitespace-nowrap transition-colors ${
        active ? "border-cocoa bg-cocoa text-cream" : "border-cocoa/20 bg-cream hover:border-cocoa"
      }`}
    >
      {children}
    </button>
  );
}

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function ShopView() {
  const { products } = useStore();
  const { status, priceOf, badgeOf } = useSale();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const gender: Gender = params.get("g") === "men-unisex" ? "men-unisex" : "women";
  const style = params.get("style");
  const onSale = params.get("sale") === "1" && status === "live";

  const [query, setQuery] = useState(params.get("q") ?? "");
  const [colours, setColours] = useState<FamilyId[]>([]);
  const [sizes, setSizes] = useState<number[]>([]);
  const [band, setBand] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("featured");
  const [sheet, setSheet] = useState(false);
  const closeSheet = useCallback(() => setSheet(false), []);
  const sheetRef = useRef<HTMLDivElement>(null);
  useOverlay(sheet, closeSheet, sheetRef);

  const replace = (q: URLSearchParams) => router.replace(`${pathname}?${q.toString()}`, { scroll: false });
  const setParam = (k: string, v: string | null) => {
    const q = new URLSearchParams(params.toString());
    if (v == null) q.delete(k);
    else q.set(k, v);
    replace(q);
  };
  const setGender = (g: Gender) => {
    const q = new URLSearchParams(params.toString());
    q.set("g", g);
    q.delete("style");
    setSizes([]);
    replace(q);
  };

  const pool = useMemo(() => products.filter((p) => p.gender === gender), [products, gender]);
  const styleOptions = STYLES.filter((s) => pool.some((p) => p.style === s));
  const familyOptions = useMemo(() => FAMILIES.filter((f) => pool.some((p) => p.colours.some((c) => familyOf(c.hex) === f.id))), [pool]);
  const sizeOptions = gender === "women" ? WOMEN_SIZES : MEN_SIZES;

  const list = useMemo(() => {
    const q = norm(query.trim());
    const out = pool.filter(
      (p: Product) =>
        (!q || norm(`${p.name} ${p.style} ${p.colours.map((c) => c.name).join(" ")}`).includes(q)) &&
        (!style || p.style === style) &&
        (!onSale || !!badgeOf(p)) &&
        (!colours.length || p.colours.some((c) => colours.includes(familyOf(c.hex)))) &&
        (!sizes.length || sizes.some((z) => p.sizes.includes(z) && !p.soldOutSizes.includes(z))) &&
        (!band || PRICE_BANDS.find((b) => b.id === band)!.test(priceOf(p))),
    );
    const score = (p: Product) => (p.inStock ? 0 : 10) - (p.isBestseller ? 2 : 0) - (p.isNew ? 1 : 0);
    return out.sort((a, b) => {
      if (a.inStock !== b.inStock) return a.inStock ? -1 : 1; // sold out always last
      if (sort === "price-asc") return priceOf(a) - priceOf(b);
      if (sort === "price-desc") return priceOf(b) - priceOf(a);
      if (sort === "newest") return Number(b.isNew) - Number(a.isNew) || b.createdAt - a.createdAt;
      return score(a) - score(b) || a.createdAt - b.createdAt;
    });
  }, [pool, query, style, onSale, colours, sizes, band, sort, priceOf, badgeOf]);

  const activeCount = (style ? 1 : 0) + (onSale ? 1 : 0) + colours.length + sizes.length + (band ? 1 : 0);
  const clearAll = () => {
    setColours([]);
    setSizes([]);
    setBand(null);
    setQuery("");
    const q = new URLSearchParams();
    q.set("g", gender);
    replace(q);
  };
  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const prices = pool.map(priceOf);
  const legend = "mb-2.5 text-xs font-semibold tracking-[.14em] text-ochre";

  const filters = (
    <div className="flex flex-col gap-6">
      <fieldset>
        <legend className={legend}>STYLE</legend>
        <div className="flex flex-wrap gap-2">
          <Chip active={!style} onClick={() => setParam("style", null)}>
            All
          </Chip>
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
        <legend className={legend}>COLOUR</legend>
        <div className="flex flex-wrap gap-2">
          {familyOptions.map((f) => (
            <Chip key={f.id} active={colours.includes(f.id)} onClick={() => setColours((c) => toggle(c, f.id))}>
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded-full shadow-[inset_0_0_0_1px_rgba(43,31,26,.2)]" style={{ background: f.swatch }} />
                {f.label}
              </span>
            </Chip>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className={legend}>PRICE</legend>
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
        <legend className={legend}>SIZE (EU)</legend>
        <div className="flex flex-wrap gap-2">
          {sizeOptions.map((z) => (
            <Chip key={z} active={sizes.includes(z)} onClick={() => setSizes((s) => toggle(s, z))}>
              <span className="sr-only">EU </span>
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
    <div className="pt-6 pb-16 lg:mx-auto lg:max-w-[1240px] lg:px-12 lg:pt-12 lg:pb-24">
      <div className="flex flex-col gap-1.5 px-5 lg:px-0">
        <span className="text-[11px] font-semibold tracking-[.18em] text-ochre lg:text-xs">{onSale ? "END OF YEAR SALE" : "SHOP"}</span>
        <h1 className="m-0 font-serif text-[34px] leading-[1.05] font-semibold lg:text-6xl">{gender === "women" ? "Women's slides" : "Men & Unisex"}</h1>
      </div>

      <div className="mt-5 flex flex-col gap-3 px-5 lg:flex-row lg:items-center lg:justify-between lg:px-0">
        <div className="flex gap-1 rounded-full border border-hair p-1 lg:inline-flex" role="tablist" aria-label="Collection">
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
        <label className="relative block lg:w-[300px]">
          <span className="sr-only">Search slides</span>
          <svg className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search bow, toe-ring, black…"
            className="h-11 w-full rounded-full border border-cocoa/15 bg-field pr-4 pl-11 text-base outline-none placeholder:text-muted/80 focus:border-gold lg:text-sm"
          />
        </label>
      </div>

      {/* Mobile: one-tap style row */}
      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto px-5 lg:hidden" aria-label="Styles">
        <Chip active={!style} onClick={() => setParam("style", null)}>
          All styles
        </Chip>
        {styleOptions.map((s) => (
          <Chip key={s} active={style === s} onClick={() => setParam("style", style === s ? null : s)}>
            {s}
          </Chip>
        ))}
      </div>

      <div className="mt-4 px-5 lg:mt-8 lg:grid lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-12 lg:px-0">
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="sticky top-32">{filters}</div>
        </aside>

        <div>
          <div className="mb-5 flex items-center justify-between gap-3 border-b border-hair pb-4">
            <button
              type="button"
              onClick={() => setSheet(true)}
              className={`flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium lg:hidden ${activeCount ? "border-cocoa bg-cocoa text-cream" : "border-cocoa/20"}`}
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
                className="h-10 rounded-full border border-cocoa/20 bg-field px-3.5 text-base font-medium outline-none focus:border-gold lg:text-sm"
              >
                <option value="featured">Featured</option>
                <option value="newest">Newest</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
              </select>
            </label>
          </div>

          {list.length ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:gap-x-6 lg:gap-y-10">
              {list.map((p, i) => (
                <ProductCard key={p.id} product={p} revealIndex={i} sizes="(min-width:1024px) 290px, (min-width:640px) 33vw, 50vw" priority={i < 2} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-sand px-6 py-14 text-center">
              <span className="font-serif text-[26px] font-semibold">Nothing matches that.</span>
              <p className="text-sm text-muted">Try fewer filters, or ask Mercy on WhatsApp. She may have it in the shop.</p>
              <button type="button" onClick={clearAll} className="mt-1 h-11 rounded-full bg-cocoa px-6 text-sm font-semibold text-cream hover:bg-mercy">
                Clear search &amp; filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter sheet */}
      <Backdrop open={sheet} onClick={closeSheet} z="z-[45] lg:hidden" />
      <div
        ref={sheetRef}
        tabIndex={-1}
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

"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { naira, normalisePhone, shortDate } from "@/lib/format";
import { saleStatus } from "@/lib/sale";
import { MEN_SIZES, STYLES, WOMEN_SIZES, slugify } from "@/lib/seed";
import type { Colour, HeroVariant, Product, SaleConfig, Settings } from "@/lib/types";
import { readWhatsAppClicks } from "@/lib/whatsapp";
import { useNow } from "@/state/sale";
import { useStore } from "@/state/store";
import { CheckIcon, ExternalIcon, LockIcon, PlusIcon, TrashIcon, UploadIcon } from "./icons";
import { LogoMark } from "./logo";

/** Demo passcode. Shared on the pitch call, never shown on the site. */
const PASSCODE = "mercy2026";
const AUTH_KEY = "mf.admin";

const input =
  "h-11 w-full rounded-xl border border-cocoa/15 bg-white px-3 text-base text-cocoa outline-none lg:text-[15px] transition-colors focus:border-gold";
const labelCls = "flex flex-col gap-1.5 text-[13px] font-medium";
const card = "rounded-2xl border border-gold/45 bg-field";
const primaryBtn = "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-cocoa px-5 text-sm font-semibold text-cream transition-colors hover:bg-mercy disabled:opacity-50";
const ghostBtn = "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-cocoa/20 px-5 text-sm font-semibold hover:border-cocoa";

/* ---------- helpers ---------- */

/** "2026-11-26T00:00:00+01:00" <-> "2026-11-26T00:00" (Lagos time, UTC+1, no DST) */
const toLocalInput = (iso: string) => {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? "" : new Date(t + 3600e3).toISOString().slice(0, 16);
};
const fromLocalInput = (v: string) => (v ? `${v}:00+01:00` : "");

/** Resizes an uploaded photo so it fits comfortably in browser storage. */
function fileToDataUrl(file: File, max = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Couldn't read that image."));
    };
    img.src = url;
  });
}

function Thumb({ src, className = "h-[50px] w-10" }: { src?: string; className?: string }) {
  return (
    <span className={`relative block flex-none overflow-hidden rounded-lg bg-sand ${className}`}>
      {src && <Image src={src} alt="" fill sizes="80px" unoptimized={src.startsWith("data:")} className="object-cover" />}
    </span>
  );
}

function Toggle({ checked, onChange, children, accent = "accent-leaf" }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode; accent?: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className={`size-[18px] ${accent}`} />
      {children}
    </label>
  );
}

function Saved({ show }: { show: boolean }) {
  return show ? (
    <span className="flex items-center gap-1 text-[13px] text-leaf" role="status">
      <CheckIcon size={16} />
      Saved. Live on the store.
    </span>
  ) : null;
}

/* ---------- passcode ---------- */

function Gate({ onOk }: { onOk: () => void }) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState(false);
  return (
    <div className="grid min-h-dvh place-items-center bg-cream px-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (code.trim().toLowerCase() === PASSCODE) {
            try {
              sessionStorage.setItem(AUTH_KEY, "1");
            } catch {
              /* ignore */
            }
            onOk();
          } else setErr(true);
        }}
        className={`${card} flex w-full max-w-sm flex-col gap-4 p-6`}
      >
        <div className="grid size-12 place-items-center rounded-xl bg-cocoa">
          <LogoMark width={30} tone="monogram" />
        </div>
        <div>
          <h1 className="font-serif text-3xl font-semibold">Mercy admin</h1>
          <p className="text-sm text-muted">Enter the passcode to manage products, the sale and settings.</p>
        </div>
        <label className={labelCls}>
          Passcode
          <input
            type="password"
            autoFocus
            autoComplete="current-password"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setErr(false);
            }}
            className={input}
          />
        </label>
        {err && (
          <span className="text-[13px] text-mercy" role="alert">
            That passcode isn&apos;t right.
          </span>
        )}
        <button type="submit" className={primaryBtn}>
          <LockIcon size={16} />
          Unlock
        </button>
        <Link href="/" className="text-center text-sm text-muted hover:text-cocoa">
          ← Back to the store
        </Link>
      </form>
    </div>
  );
}

/* ---------- products ---------- */

function blankProduct(): Product {
  return {
    id: "p" + Date.now().toString(36),
    name: "",
    slug: "",
    gender: "women",
    style: "H-Slides",
    price: 8000,
    colours: [{ name: "Black", hex: "#1F1B19" }],
    sizes: [...WOMEN_SIZES],
    soldOutSizes: [],
    inStock: true,
    isNew: true,
    isBestseller: false,
    images: [],
    description: "",
    createdAt: Date.now(),
  };
}

function ProductEditor({ initial, isNew, onSaved, onDeleted }: { initial: Product; isNew: boolean; onSaved: (p: Product) => void; onDeleted: () => void }) {
  const { saveProduct, deleteProduct, products } = useStore();
  const [p, setP] = useState<Product>(initial);
  const [sizesText, setSizesText] = useState(initial.sizes.join(", "));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof Product>(k: K, v: Product[K]) => {
    setP((x) => ({ ...x, [k]: v }));
    setSaved(false);
  };
  const setColour = (i: number, c: Partial<Colour>) => set("colours", p.colours.map((x, j) => (j === i ? { ...x, ...c } : x)));

  const upload = async (files: FileList | null, colourIndex?: number) => {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    try {
      const urls = await Promise.all([...files].map((f) => fileToDataUrl(f)));
      if (colourIndex != null) setColour(colourIndex, { image: urls[0] });
      else set("images", [...p.images, ...urls]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const save = () => {
    const name = p.name.trim();
    if (!name) return setError("Give the product a name.");
    if (!p.price || p.price < 100) return setError("Add a price in naira.");
    const sizes = sizesText
      .split(/[\s,]+/)
      .map(Number)
      .filter((n) => n >= 30 && n <= 50);
    if (!sizes.length) return setError("Add at least one size.");
    const images = p.images.length ? p.images : p.colours.map((c) => c.image).filter(Boolean) as string[];
    if (!images.length) return setError("Upload at least one photo.");
    let slug = slugify(name) || p.id;
    if (products.some((x) => x.slug === slug && x.id !== p.id)) slug = `${slug}-${p.id.slice(-4)}`;
    const next: Product = {
      ...p,
      name,
      slug,
      sizes,
      soldOutSizes: p.soldOutSizes.filter((z) => sizes.includes(z)),
      images,
      salePrice: p.salePrice && p.salePrice > 0 && p.salePrice < p.price ? p.salePrice : undefined,
      colours: p.colours.filter((c) => c.name.trim()).map((c) => ({ ...c, name: c.name.trim() })),
    };
    if (!next.colours.length) return setError("Add at least one colour.");
    try {
      saveProduct(next);
      setP(next);
      setSizesText(next.sizes.join(", "));
      setError(null);
      setSaved(true);
      onSaved(next);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const sizesParsed = sizesText.split(/[\s,]+/).map(Number).filter((n) => n >= 30 && n <= 50);

  return (
    <div className={`${card} flex flex-col gap-4 p-5`}>
      <div className="flex items-center gap-3.5">
        <Thumb src={p.colours[0]?.image ?? p.images[0]} className="h-20 w-16" />
        <div className="min-w-0 flex-1">
          <span className="block font-serif text-[26px] leading-[1.1] font-semibold">{isNew ? "New product" : p.name || "Untitled"}</span>
          {!isNew && (
            <Link href={`/shop/${p.slug}`} target="_blank" className="inline-flex items-center gap-1 text-[13px] text-muted hover:text-cocoa">
              View on store <ExternalIcon size={13} />
            </Link>
          )}
        </div>
      </div>

      <label className={labelCls}>
        Name
        <input value={p.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Ada Bow Slide" className={input} />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className={labelCls}>
          Collection
          <select
            value={p.gender}
            onChange={(e) => {
              const g = e.target.value as Product["gender"];
              set("gender", g);
              setSizesText((g === "women" ? WOMEN_SIZES : MEN_SIZES).join(", "));
            }}
            className={input}
          >
            <option value="women">Women</option>
            <option value="men-unisex">Men &amp; Unisex</option>
          </select>
        </label>
        <label className={labelCls}>
          Style
          <select value={p.style} onChange={(e) => set("style", e.target.value)} className={input}>
            {STYLES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className={labelCls}>
          Price (₦)
          <input type="number" inputMode="numeric" min={0} step={50} value={p.price || ""} onChange={(e) => set("price", Number(e.target.value))} className={input} />
        </label>
        <label className={labelCls}>
          Sale price (₦, optional)
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={50}
            value={p.salePrice ?? ""}
            placeholder="Uses sale %"
            onChange={(e) => set("salePrice", e.target.value ? Number(e.target.value) : undefined)}
            className={input}
          />
        </label>
      </div>

      <label className={labelCls}>
        Description
        <textarea value={p.description} onChange={(e) => set("description", e.target.value)} rows={3} className={`${input} h-auto resize-y py-2.5`} />
      </label>

      {/* Photos */}
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-medium">Photos</span>
        <div className="flex flex-wrap gap-2">
          {p.images.map((src, i) => (
            <span key={i} className="relative">
              <Thumb src={src} className="h-[75px] w-[60px]" />
              <button
                type="button"
                aria-label="Remove photo"
                onClick={() => set("images", p.images.filter((_, j) => j !== i))}
                className="absolute -top-1.5 -right-1.5 grid size-6 place-items-center rounded-full bg-cocoa text-cream"
              >
                <TrashIcon size={12} />
              </button>
            </span>
          ))}
          <label className="grid h-[75px] w-[60px] cursor-pointer place-items-center rounded-lg border border-dashed border-gold text-gold hover:bg-sand">
            <UploadIcon size={18} />
            <span className="sr-only">Upload photos</span>
            <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => upload(e.target.files)} />
          </label>
        </div>
        {busy && <span className="text-xs text-muted">Processing…</span>}
      </div>

      {/* Colours */}
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-medium">Colours</span>
        {p.colours.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <input type="color" aria-label="Colour swatch" value={c.hex} onChange={(e) => setColour(i, { hex: e.target.value })} className="size-11 flex-none cursor-pointer rounded-xl border border-cocoa/15 bg-white p-1" />
            <input value={c.name} onChange={(e) => setColour(i, { name: e.target.value })} placeholder="Colour name" className={input} />
            <label className="grid size-11 flex-none cursor-pointer place-items-center overflow-hidden rounded-xl border border-cocoa/15 bg-white" title="Photo for this colour">
              {c.image ? <Thumb src={c.image} className="size-11" /> : <UploadIcon size={16} />}
              <span className="sr-only">Photo for {c.name}</span>
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => upload(e.target.files, i)} />
            </label>
            <button
              type="button"
              aria-label={`Remove ${c.name}`}
              disabled={p.colours.length < 2}
              onClick={() => set("colours", p.colours.filter((_, j) => j !== i))}
              className="grid size-11 flex-none place-items-center rounded-xl text-muted hover:text-mercy disabled:opacity-30"
            >
              <TrashIcon size={16} />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => set("colours", [...p.colours, { name: "", hex: "#C89B6D" }])} className="flex items-center gap-1.5 self-start text-sm font-medium text-ochre">
          <PlusIcon size={16} /> Add colour
        </button>
      </div>

      {/* Sizes */}
      <label className={labelCls}>
        Sizes (EU, comma separated)
        <input value={sizesText} onChange={(e) => { setSizesText(e.target.value); setSaved(false); }} className={input} />
      </label>
      {sizesParsed.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium">Sold-out sizes (tap to toggle)</span>
          <div className="flex flex-wrap gap-1.5">
            {sizesParsed.map((z) => {
              const sold = p.soldOutSizes.includes(z);
              return (
                <button
                  key={z}
                  type="button"
                  aria-pressed={sold}
                  onClick={() => set("soldOutSizes", sold ? p.soldOutSizes.filter((x) => x !== z) : [...p.soldOutSizes, z])}
                  className={`tabular h-9 min-w-11 rounded-full border px-2.5 text-sm ${sold ? "border-tan/60 text-tan-ink line-through" : "border-cocoa/20"}`}
                >
                  {z}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Toggle checked={p.inStock} onChange={(v) => set("inStock", v)}>In stock</Toggle>
        <Toggle checked={p.isNew} onChange={(v) => set("isNew", v)} accent="accent-gold">Show &ldquo;New&rdquo; badge</Toggle>
        <Toggle checked={p.isBestseller} onChange={(v) => set("isBestseller", v)} accent="accent-cocoa">Bestseller (shows on the home page)</Toggle>
      </div>

      {error && (
        <span className="text-[13px] text-mercy" role="alert">
          {error}
        </span>
      )}
      <div className="flex flex-wrap items-center gap-2.5">
        <button type="button" onClick={save} disabled={busy} className={primaryBtn}>
          {isNew ? "Add product" : "Save"}
        </button>
        {!isNew && (
          <button
            type="button"
            onClick={() => {
              if (confirm(`Delete "${p.name}"? This removes it from the store.`)) {
                deleteProduct(p.id);
                onDeleted();
              }
            }}
            className="inline-flex h-11 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-mercy hover:bg-mercy/10"
          >
            <TrashIcon size={16} /> Delete
          </button>
        )}
        <Saved show={saved} />
      </div>
    </div>
  );
}

function ProductsTab() {
  const { products } = useStore();
  const [sel, setSel] = useState<string | null>(products[0]?.id ?? null);
  const [draft, setDraft] = useState<Product | null>(null);
  const [q, setQ] = useState("");
  const current = draft ?? products.find((p) => p.id === sel) ?? null;
  const list = products.filter((p) => !q || `${p.name} ${p.style}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-serif text-4xl font-semibold">Products</h1>
        <div className="flex w-full gap-2 sm:w-auto">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" aria-label="Search products" className={`${input} h-10 min-w-0 flex-1 sm:w-44 sm:flex-none`} />
          <button type="button" onClick={() => setDraft(blankProduct())} className={`${primaryBtn} h-10 flex-none whitespace-nowrap`}>
            <PlusIcon size={16} /> Add product
          </button>
        </div>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)]">
        <div className={`${card} overflow-x-auto`}>
          <table className="w-full min-w-[460px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs tracking-[.06em] text-muted">
                <th className="px-4 py-3 font-semibold">PRODUCT</th>
                <th className="px-4 py-3 text-right font-semibold">PRICE</th>
                <th className="px-4 py-3 font-semibold">STOCK</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => {
                    setDraft(null);
                    setSel(p.id);
                  }}
                  className={`cursor-pointer border-t border-gold/30 ${!draft && p.id === sel ? "bg-sand" : "hover:bg-sand/50"}`}
                >
                  <td className="px-4 py-2.5">
                    <button type="button" className="flex items-center gap-3 text-left">
                      <Thumb src={p.images[0]} />
                      <span>
                        <span className="block font-medium">{p.name}</span>
                        <span className="text-xs text-muted">
                          {p.style} · {p.gender === "women" ? "Women" : "Men & Unisex"}
                          {p.isBestseller ? " · Bestseller" : ""}
                          {p.isNew ? " · New" : ""}
                        </span>
                      </span>
                    </button>
                  </td>
                  <td className="tabular px-4 py-2.5 text-right font-semibold">
                    {naira(p.price)}
                    {p.salePrice ? <span className="block text-xs font-normal text-mercy">Sale {naira(p.salePrice)}</span> : null}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-1.5 text-[13px]">
                      <span className={`size-[7px] rounded-full ${p.inStock ? "bg-leaf" : "bg-tan"}`} />
                      {p.inStock ? "In stock" : "Sold out"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="lg:sticky lg:top-6">
          {current ? (
            <ProductEditor
              key={current.id + (draft ? "-new" : "")}
              initial={current}
              isNew={!!draft}
              onSaved={(p) => {
                setDraft(null);
                setSel(p.id);
              }}
              onDeleted={() => {
                setSel(products.find((p) => p.id !== sel)?.id ?? null);
              }}
            />
          ) : (
            <p className="text-muted">Select a product to edit.</p>
          )}
        </div>
      </div>
    </>
  );
}

/* ---------- sale ---------- */

function SaleTab() {
  const { data, setSale } = useStore();
  const [s, setS] = useState<SaleConfig>(data.sale);
  const [saved, setSaved] = useState(false);
  const set = <K extends keyof SaleConfig>(k: K, v: SaleConfig[K]) => {
    setS((x) => ({ ...x, [k]: v }));
    setSaved(false);
  };
  const now = useNow() ?? 0;
  const status = saleStatus(s, now);
  const statusLabel = { off: "Off", upcoming: "Scheduled", live: "Live now", ended: "Ended" }[status];
  const bar =
    status === "live"
      ? `${s.title.toUpperCase()} · ${s.discountPercent}% OFF · Ends ${shortDate(s.endsAt)}`
      : status === "upcoming"
        ? `${s.title.toUpperCase()} · ${s.discountPercent}% OFF · Starts ${shortDate(s.startsAt)}`
        : "The sale bar is hidden on the store.";

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-4xl font-semibold">Sale &amp; free gift</h1>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status === "live" ? "bg-mercy text-cream" : status === "upcoming" ? "bg-gold text-cocoa" : "bg-sand text-muted"}`}>
          {statusLabel}
        </span>
      </div>
      <div className={`${card} flex max-w-[620px] flex-col gap-4 p-5`}>
        <Toggle checked={s.active} onChange={(v) => set("active", v)} accent="accent-mercy">
          Sale is on (red bar, countdown, -% badges and free-gift bar)
        </Toggle>
        <label className={labelCls}>
          Title
          <input value={s.title} onChange={(e) => set("title", e.target.value)} className={input} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className={labelCls}>
            Discount (%)
            <input type="number" min={0} max={90} value={s.discountPercent} onChange={(e) => set("discountPercent", Number(e.target.value))} className={input} />
          </label>
          <label className={labelCls}>
            Free gift from (pairs)
            <input type="number" min={1} value={s.freeGiftMinPairs} onChange={(e) => set("freeGiftMinPairs", Number(e.target.value))} className={input} />
          </label>
          <label className={labelCls}>
            Starts (Lagos time)
            <input type="datetime-local" value={toLocalInput(s.startsAt)} onChange={(e) => set("startsAt", fromLocalInput(e.target.value))} className={input} />
          </label>
          <label className={labelCls}>
            Ends (Lagos time)
            <input type="datetime-local" value={toLocalInput(s.endsAt)} onChange={(e) => set("endsAt", fromLocalInput(e.target.value))} className={input} />
          </label>
          <label className={`${labelCls} col-span-2`}>
            Delivery starts
            <input type="date" value={s.deliveryStarts} onChange={(e) => set("deliveryStarts", e.target.value)} className={input} />
          </label>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold tracking-[.06em] text-muted">PREVIEW</span>
          <div className={`rounded-lg px-2.5 py-2 text-center text-[11px] font-semibold tracking-[.06em] ${status === "live" || status === "upcoming" ? "bg-mercy text-cream" : "bg-sand text-muted"}`}>
            {bar}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setSale({ ...s, discountPercent: Math.min(90, Math.max(0, s.discountPercent || 0)), freeGiftMinPairs: Math.max(1, s.freeGiftMinPairs || 1) });
              setSaved(true);
            }}
            className={primaryBtn}
          >
            Save sale
          </button>
          <Saved show={saved} />
        </div>
      </div>
      <div className={`${card} flex max-w-[620px] flex-col gap-2 p-5 text-sm`}>
        <span className="font-semibold">Preview the sale on the store</span>
        <p className="text-muted">Opens the store as a customer would see it at each stage. Only affects your own browser tab.</p>
        <div className="flex flex-wrap gap-2">
          {(["upcoming", "live", "ended"] as const).map((v) => (
            <a key={v} href={`/?preview=${v}`} target="_blank" className={`${ghostBtn} h-9 px-4 capitalize`}>
              {v === "upcoming" ? "Before" : v === "live" ? "During" : "After"} <ExternalIcon size={13} />
            </a>
          ))}
          <a href="/?preview=off" target="_blank" className={`${ghostBtn} h-9 px-4`}>
            Real time <ExternalIcon size={13} />
          </a>
        </div>
      </div>
    </>
  );
}

/* ---------- settings ---------- */

const HEROES: { v: HeroVariant; label: string; hint: string }[] = [
  { v: "a", label: "Shelf wall", hint: "Big shop photo with the headline over a cream fade" },
  { v: "b", label: "Lineup card", hint: "Headline beside a framed photo of the H-slide lineup" },
  { v: "c", label: "Arched row", hint: "Centred headline over a row of arched photos" },
];

function SettingsTab() {
  const { data, setSettings, resetDemo } = useStore();
  const [s, setS] = useState<Settings>(data.settings);
  const [saved, setSaved] = useState(false);
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => {
    setS((x) => ({ ...x, [k]: v }));
    setSaved(false);
  };
  return (
    <>
      <h1 className="font-serif text-4xl font-semibold">Settings</h1>
      <div className={`${card} flex max-w-[620px] flex-col gap-4 p-5`}>
        <label className={labelCls}>
          WhatsApp number (orders go here)
          <input value={s.whatsappNumber} onChange={(e) => set("whatsappNumber", e.target.value)} inputMode="tel" placeholder="0909 896 4885" className={input} />
          <span className="font-normal text-muted">Saved as {normalisePhone(s.whatsappNumber) || "…"} → wa.me/{normalisePhone(s.whatsappNumber)}</span>
        </label>
        <label className={labelCls}>
          Instagram handle
          <div className="flex items-center gap-1">
            <span className="text-muted">@</span>
            <input value={s.instagramHandle} onChange={(e) => set("instagramHandle", e.target.value.replace(/^@/, ""))} className={input} />
          </div>
        </label>
        <label className={labelCls}>
          Store tagline
          <input value={s.tagline} onChange={(e) => set("tagline", e.target.value)} className={input} />
        </label>
        <label className={labelCls}>
          Delivery note
          <textarea value={s.deliveryNote} onChange={(e) => set("deliveryNote", e.target.value)} rows={2} className={`${input} h-auto resize-y py-2.5`} />
        </label>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-[13px] font-medium">Home page hero</legend>
          {HEROES.map((h) => (
            <label key={h.v} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${s.heroVariant === h.v ? "border-gold bg-sand" : "border-cocoa/10"}`}>
              <input type="radio" name="hero" checked={s.heroVariant === h.v} onChange={() => set("heroVariant", h.v)} className="mt-1 accent-cocoa" />
              <span>
                <span className="block text-sm font-semibold">{h.label}</span>
                <span className="text-[13px] text-muted">{h.hint}</span>
              </span>
            </label>
          ))}
        </fieldset>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setSettings({ ...s, whatsappNumber: normalisePhone(s.whatsappNumber), instagramHandle: s.instagramHandle.trim() });
              setSaved(true);
            }}
            className={primaryBtn}
          >
            Save settings
          </button>
          <Saved show={saved} />
        </div>
      </div>
      <div className={`${card} flex max-w-[620px] flex-col gap-2 p-5`}>
        <span className="text-sm font-semibold">Reset demo</span>
        <p className="text-sm text-muted">Puts back the original products, sale and settings in this browser.</p>
        <button
          type="button"
          onClick={() => {
            if (confirm("Reset all products, the sale and settings to the demo data?")) {
              resetDemo();
              location.reload();
            }
          }}
          className={`${ghostBtn} self-start text-mercy`}
        >
          Reset demo data
        </button>
      </div>
    </>
  );
}

/* ---------- shell ---------- */

type Tab = "products" | "sale" | "settings";

export function AdminApp() {
  const { products, data, ready } = useStore();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("products");
  const [clicks, setClicks] = useState(0);
  const now = useNow() ?? 0;

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- read browser-only state after mount */
    try {
      setAuthed(sessionStorage.getItem(AUTH_KEY) === "1");
    } catch {
      setAuthed(false);
    }
    setClicks(readWhatsAppClicks());
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const stats = useMemo(
    () => [
      { label: "Products", value: String(products.length) },
      { label: "In stock", value: String(products.filter((p) => p.inStock).length) },
      { label: "Sale", value: { off: "Off", upcoming: "Scheduled", live: "Live", ended: "Ended" }[saleStatus(data.sale, now)] },
      { label: "WhatsApp clicks", value: String(clicks), hint: "this device" },
    ],
    [products, data.sale, clicks, now],
  );

  if (authed === null || !ready) return <div className="min-h-dvh bg-cream" />;
  if (!authed) return <Gate onOk={() => setAuthed(true)} />;

  return (
    <div className="min-h-dvh bg-cream">
      <header className="sticky top-0 z-30 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-hair bg-cream/95 px-5 py-3 backdrop-blur-md lg:px-7">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-[10px] bg-cocoa">
            <LogoMark width={24} tone="monogram" />
          </span>
          <span className="font-semibold">Mercy Footwears · Admin</span>
        </Link>
        <nav className="order-last flex w-full gap-1 sm:order-none sm:ml-auto sm:w-auto" aria-label="Admin sections">
          {(
            [
              ["products", "Products"],
              ["sale", "Sale"],
              ["settings", "Settings"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              aria-current={tab === k ? "page" : undefined}
              onClick={() => setTab(k)}
              className={`h-[38px] flex-1 rounded-full px-4 text-sm font-medium sm:flex-none ${tab === k ? "bg-cocoa text-cream" : "hover:bg-sand"}`}
            >
              {label}
            </button>
          ))}
        </nav>
        <Link href="/" target="_blank" className="hidden items-center gap-1 text-sm text-muted hover:text-cocoa sm:flex">
          View store <ExternalIcon size={14} />
        </Link>
      </header>
      <main className="mx-auto flex max-w-[1120px] flex-col gap-6 px-5 pt-8 pb-16 lg:px-7">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className={`${card} px-4 py-3`}>
              <span className="block text-xs font-semibold tracking-[.06em] text-muted">{s.label.toUpperCase()}</span>
              <span className="tabular font-serif text-3xl font-semibold">{s.value}</span>
              {s.hint && <span className="ml-1.5 text-xs text-muted">{s.hint}</span>}
            </div>
          ))}
        </div>
        {tab === "products" ? <ProductsTab /> : tab === "sale" ? <SaleTab /> : <SettingsTab />}
        <p className="text-xs text-muted">
          Demo mode: changes are saved in this browser and show on the store straight away. Orders arrive in WhatsApp, not here.
        </p>
      </main>
    </div>
  );
}

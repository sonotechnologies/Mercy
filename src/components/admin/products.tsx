"use client";

import Link from "next/link";
import { useState } from "react";
import { hasSupabase, uploadImage } from "@/lib/backend/client";
import { naira } from "@/lib/format";
import { isMadeToOrder } from "@/lib/orders";
import { MEN_SIZES, STYLES, WOMEN_SIZES, slugify } from "@/lib/seed";
import type { Colour, Product } from "@/lib/types";
import { useStore } from "@/state/store";
import { ExternalIcon, PlusIcon, TrashIcon, UploadIcon } from "../icons";
import { card, compressImage, hint, input, labelCls, primaryBtn, SaveBar, Thumb, Toggle } from "./ui";

const FOCUS = [
  { v: "50% 20%", label: "Top" },
  { v: "50% 50%", label: "Centre" },
  { v: "50% 80%", label: "Bottom" },
];

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
    focus: "50% 50%",
    createdAt: Date.now(),
  };
}

function ProductEditor({ initial, isNew, onSaved, onDeleted }: { initial: Product; isNew: boolean; onSaved: (p: Product) => void; onDeleted: () => void }) {
  const { saveProduct, deleteProduct, products, data } = useStore();
  const [p, setP] = useState<Product>(initial);
  const [sizesText, setSizesText] = useState(initial.sizes.join(", "));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(0);

  const set = <K extends keyof Product>(k: K, v: Product[K]) => {
    setP((x) => ({ ...x, [k]: v }));
    setSaved(false);
  };
  const setColour = (i: number, c: Partial<Colour>) => set("colours", p.colours.map((x, j) => (j === i ? { ...x, ...c } : x)));

  const upload = async (files: FileList | null, colourIndex?: number) => {
    if (!files?.length) return;
    const list = [...files].slice(0, 12);
    setUploading(list.length);
    setError(null);
    try {
      const urls: string[] = [];
      for (const f of list) {
        const blob = await compressImage(f, hasSupabase ? 1600 : 900, hasSupabase ? 0.85 : 0.8);
        urls.push(await uploadImage(blob, p.id));
        setUploading((n) => n - 1);
      }
      if (colourIndex != null) setColour(colourIndex, { image: urls[0] });
      else setP((x) => ({ ...x, images: [...x.images, ...urls] }));
      setSaved(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(0);
    }
  };

  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= p.images.length) return;
    const next = [...p.images];
    [next[i], next[j]] = [next[j], next[i]];
    set("images", next);
  };

  const save = async () => {
    const name = p.name.trim();
    if (!name) return setError("Give the product a name.");
    if (!p.price || p.price < 100) return setError("Add a price in naira.");
    const sizes = sizesText
      .split(/[\s,]+/)
      .map(Number)
      .filter((n) => n >= 30 && n <= 50);
    if (!sizes.length) return setError("Add at least one size.");
    const images = p.images.length ? p.images : (p.colours.map((c) => c.image).filter(Boolean) as string[]);
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
      productionTime: p.productionTime?.trim() || undefined,
      colours: p.colours.filter((c) => c.name.trim()).map((c) => ({ ...c, name: c.name.trim() })),
    };
    if (!next.colours.length) return setError("Add at least one colour.");
    setBusy(true);
    setError(null);
    try {
      await saveProduct(next);
      setP(next);
      setSizesText(next.sizes.join(", "));
      setSaved(true);
      onSaved(next);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm(`Delete "${p.name}"? This removes it from the store.`)) return;
    setBusy(true);
    try {
      await deleteProduct(p.id);
      onDeleted();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  const sizesParsed = sizesText.split(/[\s,]+/).map(Number).filter((n) => n >= 30 && n <= 50);
  const mto = isMadeToOrder(p, data.settings);
  const cover = p.images[0] ?? p.colours[0]?.image;

  return (
    <div className={`${card} flex flex-col gap-4 p-5`}>
      <div className="flex items-center gap-3.5">
        <Thumb src={cover} className="aspect-[4/5] w-16" focus={p.focus} />
        <div className="min-w-0 flex-1">
          <span className="block font-serif text-[26px] leading-[1.1] font-semibold">{isNew ? "New product" : p.name || "Untitled"}</span>
          {!isNew && (
            <Link href={`/shop/${p.slug}`} target="_blank" className="inline-flex items-center gap-1 text-[13px] text-muted hover:text-cocoa">
              View on store <ExternalIcon size={13} />
            </Link>
          )}
        </div>
      </div>

      {/* Photos */}
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-medium">
          Photos <span className={hint}>· first photo is the cover · {hasSupabase ? "compressed automatically" : "demo: kept small"}</span>
        </span>
        <div className="flex flex-wrap gap-2">
          {p.images.map((src, i) => (
            <span key={src + i} className="group relative">
              <Thumb src={src} className="aspect-[4/5] w-[72px]" focus={i === 0 ? p.focus : undefined} />
              {i === 0 && <span className="absolute bottom-1 left-1 rounded-full bg-cocoa px-1.5 text-[10px] font-semibold text-cream">Cover</span>}
              <span className="absolute inset-x-0 top-1 flex justify-between px-1 opacity-100 sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                <button type="button" aria-label="Move photo left" disabled={i === 0} onClick={() => move(i, -1)} className="grid size-6 place-items-center rounded-full bg-cream/90 text-xs font-bold disabled:opacity-0">
                  ‹
                </button>
                <button type="button" aria-label="Move photo right" disabled={i === p.images.length - 1} onClick={() => move(i, 1)} className="grid size-6 place-items-center rounded-full bg-cream/90 text-xs font-bold disabled:opacity-0">
                  ›
                </button>
              </span>
              <button
                type="button"
                aria-label="Remove photo"
                onClick={() => set("images", p.images.filter((_, j) => j !== i))}
                className="absolute -right-1.5 -bottom-1.5 grid size-6 place-items-center rounded-full bg-cocoa text-cream"
              >
                <TrashIcon size={12} />
              </button>
            </span>
          ))}
          <label className="grid aspect-[4/5] w-[72px] cursor-pointer place-items-center rounded-lg border border-dashed border-gold text-center text-gold hover:bg-sand">
            <span className="flex flex-col items-center gap-1 text-[11px] font-semibold">
              <UploadIcon size={18} />
              {uploading ? `${uploading}…` : "Add"}
            </span>
            <span className="sr-only">Upload photos</span>
            <input type="file" accept="image/*" multiple className="sr-only" disabled={!!uploading} onChange={(e) => void upload(e.target.files)} />
          </label>
        </div>
        <div className="flex items-center gap-2 text-[13px]">
          <span className="font-medium">Card crop (4:5)</span>
          {FOCUS.map((f) => (
            <button
              key={f.v}
              type="button"
              aria-pressed={(p.focus ?? "50% 55%") === f.v}
              onClick={() => set("focus", f.v)}
              className={`h-8 rounded-full border px-3 ${(p.focus ?? "") === f.v ? "border-cocoa bg-cocoa text-cream" : "border-cocoa/20"}`}
            >
              {f.label}
            </button>
          ))}
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
          Sale price (₦)
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

      <div className="grid grid-cols-2 gap-3">
        <label className={labelCls}>
          Order type
          <select value={p.orderType ?? ""} onChange={(e) => set("orderType", (e.target.value || undefined) as Product["orderType"])} className={input}>
            <option value="">Store default ({data.settings.madeToOrder ? "made to order" : "ready stock"})</option>
            <option value="made-to-order">Made to order</option>
            <option value="ready-stock">Ready stock</option>
          </select>
        </label>
        <label className={labelCls}>
          Production time
          <input
            value={p.productionTime ?? ""}
            onChange={(e) => set("productionTime", e.target.value)}
            placeholder={data.settings.productionTime}
            disabled={!mto}
            className={`${input} disabled:opacity-50`}
          />
        </label>
      </div>

      <label className={labelCls}>
        Description
        <textarea value={p.description} onChange={(e) => set("description", e.target.value)} rows={3} className={`${input} h-auto resize-y py-2.5`} />
      </label>

      {/* Colours */}
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-medium">
          Colours <span className={hint}>· add a photo per colour to switch pictures</span>
        </span>
        {p.colours.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <input type="color" aria-label="Colour swatch" value={c.hex} onChange={(e) => setColour(i, { hex: e.target.value })} className="size-11 flex-none cursor-pointer rounded-xl border border-cocoa/15 bg-white p-1" />
            <input value={c.name} onChange={(e) => setColour(i, { name: e.target.value })} placeholder="Colour name" className={input} />
            <label className="grid size-11 flex-none cursor-pointer place-items-center overflow-hidden rounded-xl border border-cocoa/15 bg-white" title="Photo for this colour">
              {c.image ? <Thumb src={c.image} className="size-11" /> : <UploadIcon size={16} />}
              <span className="sr-only">Photo for {c.name}</span>
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => void upload(e.target.files, i)} />
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

      <label className={labelCls}>
        Sizes (EU, comma separated)
        <input
          value={sizesText}
          onChange={(e) => {
            setSizesText(e.target.value);
            setSaved(false);
          }}
          className={input}
        />
      </label>
      {!mto && sizesParsed.length > 0 && (
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
        <Toggle checked={p.inStock} onChange={(v) => set("inStock", v)}>
          Available to order <span className={hint}>(untick to hide the Add button)</span>
        </Toggle>
        <Toggle checked={p.isNew} onChange={(v) => set("isNew", v)} accent="accent-gold">
          Show &ldquo;New&rdquo; badge
        </Toggle>
        <Toggle checked={p.isBestseller} onChange={(v) => set("isBestseller", v)} accent="accent-cocoa">
          Bestseller <span className={hint}>(shows on the home page)</span>
        </Toggle>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <SaveBar busy={busy || !!uploading} saved={saved} error={error} onSave={() => void save()} label={isNew ? "Add product" : "Save"} />
        {!isNew && (
          <button type="button" onClick={() => void remove()} disabled={busy} className="inline-flex h-11 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-mercy hover:bg-mercy/10">
            <TrashIcon size={16} /> Delete
          </button>
        )}
      </div>
    </div>
  );
}

export function ProductsTab() {
  const { products, data } = useStore();
  const [sel, setSel] = useState<string | null>(products[0]?.id ?? null);
  const [draft, setDraft] = useState<Product | null>(null);
  const [q, setQ] = useState("");
  const current = draft ?? products.find((p) => p.id === sel) ?? null;
  const list = products.filter((p) => !q || `${p.name} ${p.style}`.toLowerCase().includes(q.toLowerCase()));

  const startNew = () => {
    setDraft(blankProduct());
    requestAnimationFrame(() => document.getElementById("product-editor")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-serif text-4xl font-semibold">Products</h1>
        <div className="flex w-full gap-2 sm:w-auto">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" aria-label="Search products" className={`${input} h-10 min-w-0 flex-1 sm:w-44 sm:flex-none`} />
          <button type="button" onClick={startNew} className={`${primaryBtn} h-10 flex-none whitespace-nowrap`}>
            <PlusIcon size={16} /> Add product
          </button>
        </div>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)]">
        <div className={`${card} overflow-x-auto`}>
          <table className="w-full min-w-[440px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs tracking-[.06em] text-muted">
                <th className="px-4 py-3 font-semibold">PRODUCT</th>
                <th className="px-4 py-3 text-right font-semibold">PRICE</th>
                <th className="px-4 py-3 font-semibold">TYPE</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => {
                const mto = isMadeToOrder(p, data.settings);
                return (
                  <tr
                    key={p.id}
                    onClick={() => {
                      setDraft(null);
                      setSel(p.id);
                      if (window.innerWidth < 1024) requestAnimationFrame(() => document.getElementById("product-editor")?.scrollIntoView({ behavior: "smooth", block: "start" }));
                    }}
                    className={`cursor-pointer border-t border-gold/30 ${!draft && p.id === sel ? "bg-sand" : "hover:bg-sand/50"}`}
                  >
                    <td className="px-4 py-2.5">
                      <button type="button" className="flex items-center gap-3 text-left">
                        <Thumb src={p.images[0]} focus={p.focus} />
                        <span>
                          <span className="block font-medium">{p.name}</span>
                          <span className="text-xs text-muted">
                            {p.style} · {p.gender === "women" ? "Women" : "Men & Unisex"}
                            {p.isBestseller ? " · Bestseller" : ""}
                            {p.isNew ? " · New" : ""}
                            {p.images.length > 1 ? ` · ${p.images.length} photos` : ""}
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
                        <span className={`size-[7px] rounded-full ${!p.inStock ? "bg-tan" : mto ? "bg-gold" : "bg-leaf"}`} />
                        {!p.inStock ? "Unavailable" : mto ? "Made to order" : "Ready stock"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div id="product-editor" className="scroll-mt-28 lg:sticky lg:top-24">
          {current ? (
            <ProductEditor
              key={current.id + (draft ? "-new" : "")}
              initial={current}
              isNew={!!draft}
              onSaved={(p) => {
                setDraft(null);
                setSel(p.id);
              }}
              onDeleted={() => setSel(products.find((p) => p.id !== sel)?.id ?? null)}
            />
          ) : (
            <p className="text-muted">Select a product to edit.</p>
          )}
        </div>
      </div>
    </>
  );
}

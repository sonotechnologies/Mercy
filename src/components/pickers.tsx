"use client";

import type { Product } from "@/lib/types";
import { MinusIcon, PlusIcon } from "./icons";

export function ColourPicker({ product, value, onChange, showName = false }: { product: Product; value: number; onChange: (i: number) => void; showName?: boolean }) {
  return (
    <div className="flex items-center gap-3.5 pl-1" role="radiogroup" aria-label="Colour">
      {product.colours.map((c, i) => (
        <button
          key={c.name + i}
          type="button"
          role="radio"
          aria-checked={i === value}
          aria-label={c.name}
          title={c.name}
          onClick={() => onChange(i)}
          className="size-7 rounded-full transition-shadow"
          style={{
            background: c.hex,
            boxShadow: i === value ? "0 0 0 2px #FBF6EF, 0 0 0 3.5px #B8924A" : "0 0 0 2px #FBF6EF, 0 0 0 3px rgba(43,31,26,.12)",
          }}
        />
      ))}
      {showName && <span className="text-[13px] lg:text-sm">{product.colours[value]?.name}</span>}
    </div>
  );
}

export function SizePicker({ product, value, onChange, lg = false }: { product: Product; value: number | null; onChange: (z: number) => void; lg?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Size (EU)">
      {product.sizes.map((z) => {
        const sold = product.soldOutSizes.includes(z) || !product.inStock;
        const sel = value === z;
        return (
          <button
            key={z}
            type="button"
            role="radio"
            aria-checked={sel}
            aria-label={`EU ${z}${sold ? ", sold out" : ""}`}
            disabled={sold}
            onClick={() => onChange(z)}
            className={`tabular rounded-full border px-3 font-medium transition-colors ${lg ? "h-[46px] min-w-14 px-3.5 text-[15px]" : "h-11 min-w-[52px] text-sm"} ${
              sel
                ? "border-cocoa bg-cocoa text-cream"
                : sold
                  ? "cursor-not-allowed border-tan/50 text-tan-ink line-through"
                  : "border-cocoa/20 hover:border-cocoa"
            }`}
          >
            {z}
          </button>
        );
      })}
    </div>
  );
}

export function QtyStepper({ value, onChange, min = 1, label }: { value: number; onChange: (n: number) => void; min?: number; label?: string }) {
  return (
    <div className="flex items-center gap-1.5" role="group" aria-label={label ?? "Quantity"}>
      <button
        type="button"
        aria-label="Less"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="grid size-8 place-items-center rounded-full border border-gold/70 disabled:opacity-40"
      >
        <MinusIcon size={14} />
      </button>
      <span className="tabular min-w-4 text-center font-semibold" aria-live="polite">
        {value}
      </span>
      <button type="button" aria-label="More" onClick={() => onChange(value + 1)} className="grid size-8 place-items-center rounded-full border border-gold/70">
        <PlusIcon size={14} />
      </button>
    </div>
  );
}

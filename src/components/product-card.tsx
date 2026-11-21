"use client";

import Link from "next/link";
import { naira } from "@/lib/format";
import type { Product } from "@/lib/types";
import { useCart } from "@/state/cart";
import { useSale } from "@/state/sale";
import { PlusIcon } from "./icons";
import { ProductImage } from "./product-image";

export function Price({ product, className = "", big = false }: { product: Product; className?: string; big?: boolean }) {
  const { priceOf, badgeOf } = useSale();
  const now = priceOf(product);
  const onSale = !!badgeOf(product);
  return (
    <span className={`tabular flex items-baseline gap-2 ${className}`}>
      {onSale && (
        <s className={`text-tan-ink ${big ? "order-2 text-sm lg:text-[15px]" : "text-[13px]"}`}>
          <span className="sr-only">Was </span>
          {naira(product.price)}
        </s>
      )}
      <span className={`font-semibold ${big ? "order-1 text-[19px] lg:text-[22px]" : ""}`}>
        {onSale && <span className="sr-only">Now </span>}
        {naira(now)}
      </span>
    </span>
  );
}

export function Badges({ product, lg = false, inline = false }: { product: Product; lg?: boolean; inline?: boolean }) {
  const { badgeOf } = useSale();
  const badge = badgeOf(product);
  const pill = `rounded-full font-bold ${lg ? "px-[9px] py-[3px] text-xs" : "px-2 py-[3px] text-[11px]"}`;
  return (
    <span className={`flex gap-1.5 ${inline ? "" : `absolute ${lg ? "top-3 left-3" : "top-2.5 left-2.5"}`}`}>
      {badge && <span className={`${pill} bg-mercy text-cream`}>{badge}</span>}
      {product.isNew && <span className={`${pill} bg-gold text-cocoa`}>New</span>}
      {!product.inStock && <span className={`${pill} bg-cream text-muted`}>Sold out</span>}
    </span>
  );
}

type Props = {
  product: Product;
  /** "grid": 2-col mobile / 4-col desktop. "strip": men's carousel. */
  variant?: "grid" | "strip";
  sizes?: string;
  priority?: boolean;
  revealIndex?: number;
};

export function ProductCard({ product, variant = "grid", sizes = "(min-width:1024px) 280px, 50vw", priority, revealIndex = 0 }: Props) {
  const { openQuick } = useCart();
  const strip = variant === "strip";
  return (
    <div
      data-reveal=""
      style={{ "--reveal-delay": `${(revealIndex % 4) * 70}ms` } as React.CSSProperties}
      className={`group relative flex flex-col gap-1.5 ${strip ? "w-[156px] flex-none snap-start lg:w-auto" : ""}`}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-sand">
        <ProductImage
          src={product.images[0]}
          alt={`${product.name}, ${product.colours[0]?.name ?? ""}`}
          sizes={sizes}
          priority={priority}
          focus={product.focus}
          imgClassName="transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
        <Badges product={product} lg />
        <button
          type="button"
          disabled={!product.inStock}
          onClick={() => openQuick(product.id)}
          aria-label={`Quick add ${product.name}`}
          className={`absolute z-10 grid place-items-center rounded-full bg-cream text-cocoa shadow-lift transition-colors hover:bg-cocoa hover:text-cream disabled:hidden ${
            strip ? "right-2 bottom-2 size-9 lg:right-2.5 lg:bottom-2.5 lg:size-10" : "right-2.5 bottom-2.5 size-[38px] lg:right-3 lg:bottom-3 lg:size-[42px]"
          }`}
        >
          <PlusIcon size={18} />
        </button>
      </div>
      <Link href={`/shop/${product.slug}`} className="mt-1 text-[15px] leading-[1.3] font-medium after:absolute after:inset-0 after:content-[''] lg:mt-1.5 lg:text-base">
        {product.name}
      </Link>
      <Price product={product} />
      {!strip && (
        <span className="flex gap-1.5" role="img" aria-label={`Colours: ${product.colours.map((c) => c.name).join(", ")}`}>
          {product.colours.map((c) => (
            <span key={c.name} className="size-2.5 rounded-full shadow-[inset_0_0_0_1px_rgba(43,31,26,.18)] lg:size-[11px]" style={{ background: c.hex }} />
          ))}
        </span>
      )}
    </div>
  );
}

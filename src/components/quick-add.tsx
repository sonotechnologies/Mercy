"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { naira } from "@/lib/format";
import { useCart } from "@/state/cart";
import { useSale } from "@/state/sale";
import { useStore } from "@/state/store";
import { CloseIcon } from "./icons";
import { ColourPicker, SizePicker } from "./pickers";
import { Backdrop, useOverlay } from "./ui";

export function QuickAdd() {
  const { quickId, closeQuick, add } = useCart();
  const { getProduct } = useStore();
  const { priceOf } = useSale();
  const open = !!quickId;
  // Keep the last product rendered while the sheet animates out.
  const [lastId, setLastId] = useState<string | null>(null);
  if (quickId && quickId !== lastId) setLastId(quickId);
  const product = lastId ? getProduct(lastId) : undefined;

  const [colour, setColour] = useState(0);
  const [size, setSize] = useState<number | null>(null);
  const [hint, setHint] = useState(false);
  useEffect(() => {
    if (!quickId) return;
    /* eslint-disable react-hooks/set-state-in-effect -- reset selection when a new product opens */
    setColour(0);
    setSize(null);
    setHint(false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [quickId]);

  const panelRef = useRef<HTMLDivElement>(null);
  useOverlay(open, closeQuick, panelRef);

  const submit = () => {
    if (!product) return;
    if (size == null) return setHint(true);
    add(product.id, colour, size);
    closeQuick();
  };

  const img = product ? (product.colours[colour]?.image ?? product.images[0]) : null;

  return (
    <>
      <Backdrop open={open} onClick={closeQuick} z="z-[45]" />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={product ? `Add ${product.name} to bag` : "Quick add"}
        aria-hidden={!open}
        inert={!open}
        className={`fixed inset-x-0 bottom-0 z-[46] flex flex-col gap-4 rounded-t-3xl bg-cream px-5 pt-2.5 pb-[calc(22px+env(safe-area-inset-bottom))] transition-all duration-[350ms] ease-out-soft lg:inset-x-auto lg:top-1/2 lg:bottom-auto lg:left-1/2 lg:w-[520px] lg:rounded-2xl lg:p-6 lg:shadow-soft ${
          open
            ? "translate-y-0 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:scale-100 lg:opacity-100"
            : "translate-y-[105%] lg:pointer-events-none lg:-translate-x-1/2 lg:-translate-y-[47%] lg:scale-[.97] lg:opacity-0"
        }`}
      >
        <span className="h-1 w-10 self-center rounded-full bg-cocoa/15 lg:hidden" />
        {product && img && (
          <>
            <div className="flex items-center gap-3.5 lg:gap-4">
              <div className="relative h-20 w-16 flex-none overflow-hidden rounded-xl bg-sand lg:h-[90px] lg:w-[72px]">
                <Image src={img} alt="" fill sizes="72px" unoptimized={img.startsWith("data:")} className="object-cover" style={{ objectPosition: product.focus ?? "50% 55%" }} />
              </div>
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="font-serif text-2xl leading-[1.1] font-semibold lg:text-[28px]">{product.name}</span>
                <span className="tabular font-semibold">{naira(priceOf(product))}</span>
              </div>
              <button type="button" onClick={closeQuick} aria-label="Close" className="grid size-11 flex-none place-items-center self-start">
                <CloseIcon />
              </button>
            </div>
            <ColourPicker product={product} value={colour} onChange={setColour} showName />
            <div className="flex justify-between text-[13px] font-medium lg:text-sm">
              <span>Size (EU)</span>
              {hint && (
                <span className="text-mercy" role="alert">
                  Please pick a size
                </span>
              )}
            </div>
            <div className="-mt-1.5">
              <SizePicker
                product={product}
                value={size}
                onChange={(z) => {
                  setSize(z);
                  setHint(false);
                }}
              />
            </div>
            <button type="button" onClick={submit} className="h-[52px] rounded-full bg-cocoa text-[15px] font-semibold text-cream transition-colors hover:bg-mercy">
              Add to cart
            </button>
            <Link href={`/shop/${product.slug}`} onClick={closeQuick} className="-mt-1 self-center border-b border-gold pb-px text-[13px] font-medium">
              See full details &amp; size guide
            </Link>
          </>
        )}
      </div>
    </>
  );
}

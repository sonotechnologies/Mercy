"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { naira, shortDate } from "@/lib/format";
import { NIGERIAN_STATES } from "@/lib/seed";
import { buildOrderMessage, openWhatsApp } from "@/lib/whatsapp";
import { useCart } from "@/state/cart";
import { useSale } from "@/state/sale";
import { useStore } from "@/state/store";
import { ChatIcon, CloseIcon, GiftIcon, TruckIcon } from "./icons";
import { QtyStepper } from "./pickers";
import { Backdrop, useOverlay } from "./ui";

const field =
  "rounded-xl border border-cocoa/15 bg-field px-3.5 text-[15px] font-normal text-cocoa outline-none transition-colors placeholder:text-muted/70 focus:border-gold";

export function GiftProgress() {
  const { count } = useCart();
  const { giftMin } = useSale();
  if (giftMin == null) return null;
  const unlocked = count >= giftMin;
  const left = giftMin - count;
  return (
    <div className="flex flex-col gap-2.5 rounded-2xl bg-sand px-4 py-3.5">
      <div className="flex items-center gap-2.5 text-sm font-medium" aria-live="polite">
        <GiftIcon size={20} className={`flex-none transition-colors ${unlocked ? "text-mercy" : "text-gold"}`} />
        <span>{unlocked ? "You've unlocked a free gift! We'll pack it with your order." : `Add ${left} more pair${left > 1 ? "s" : ""} to get a free gift 🎁`}</span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-gold/25"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={giftMin}
        aria-valuenow={Math.min(count, giftMin)}
        aria-label="Free gift progress"
      >
        <div className="h-full rounded-full bg-gold transition-[width] duration-400 ease-out" style={{ width: `${Math.min(count / giftMin, 1) * 100}%` }} />
      </div>
    </div>
  );
}

/** Bag contents + delivery form + "Send order on WhatsApp". Used by the drawer and /cart. */
export function CartContents({ onShop, page = false }: { onShop?: () => void; page?: boolean }) {
  const { lines, count, subtotal, fullTotal, setQty, customer, setCustomer } = useCart();
  const { sale, status, giftMin } = useSale();
  const { data } = useStore();
  const [error, setError] = useState(false);
  const set = (k: keyof typeof customer) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setCustomer({ ...customer, [k]: e.target.value });
    setError(false);
  };

  const send = () => {
    if (!customer.name.trim() || !customer.phone.trim() || !customer.address.trim()) {
      setError(true);
      return;
    }
    const msg = buildOrderMessage(
      lines.map((l) => ({ name: l.product.name, colour: l.colourName, size: l.size, qty: l.qty, total: l.total })),
      customer,
      { sale, status, giftMin },
    );
    openWhatsApp(data.settings.whatsappNumber, msg);
  };

  const pad = page ? "" : "px-5 lg:px-6";

  if (count === 0) {
    return (
      <div className={`flex flex-col gap-[18px] ${pad}`}>
        <GiftProgress />
        <div className="flex flex-col items-center gap-3.5 py-10 text-center">
          <span className="font-serif text-[26px] font-semibold">Your bag is empty.</span>
          {onShop ? (
            <button type="button" onClick={onShop} className="h-12 rounded-full bg-cocoa px-7 text-[15px] font-semibold text-cream hover:bg-mercy">
              Start shopping
            </button>
          ) : (
            <Link href="/shop" className="grid h-12 place-items-center rounded-full bg-cocoa px-7 text-[15px] font-semibold text-cream hover:bg-mercy">
              Start shopping
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`flex flex-1 flex-col gap-[18px] overflow-y-auto pb-5 ${pad} ${page ? "" : "no-scrollbar"}`}>
        <GiftProgress />
        <ul className="flex flex-col" aria-label="Items in your bag">
          {lines.map((l) => (
            <li key={l.key} className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-3 border-b border-gold/35 py-3">
              <Link href={`/shop/${l.product.slug}`} className="relative h-20 w-16 overflow-hidden rounded-xl bg-sand" tabIndex={-1}>
                <Image src={l.image} alt="" fill sizes="64px" unoptimized={l.image.startsWith("data:")} className="object-cover" style={{ objectPosition: l.product.focus ?? "50% 55%" }} />
              </Link>
              <div className="flex min-w-0 flex-col gap-0.5">
                <Link href={`/shop/${l.product.slug}`} className="leading-[1.3] font-medium hover:underline">
                  {l.product.name}
                </Link>
                <span className="text-[13px] text-muted">
                  {l.colourName} · EU {l.size}
                </span>
                <span className="tabular font-semibold">{naira(l.total)}</span>
              </div>
              <QtyStepper value={l.qty} min={0} onChange={(n) => setQty(l.key, n)} label={`Quantity of ${l.product.name}`} />
            </li>
          ))}
        </ul>
        <div className="tabular flex flex-col gap-1.5 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-semibold">{naira(subtotal)}</span>
          </div>
          {fullTotal > subtotal && (
            <div className="flex justify-between text-mercy">
              <span>Sale savings ({sale.discountPercent}%)</span>
              <span>−{naira(fullTotal - subtotal)}</span>
            </div>
          )}
          <div className="flex justify-between text-muted">
            <span>Delivery</span>
            <span>Confirmed on WhatsApp</span>
          </div>
        </div>
        <p className="flex items-start gap-2.5 rounded-2xl border border-gold/40 px-4 py-3 text-[13px]">
          <TruckIcon size={18} className="mt-px flex-none text-gold" />
          <span>
            {data.settings.deliveryNote}
            {status === "live" && sale.deliveryStarts && <strong className="font-semibold"> Delivery starts {shortDate(sale.deliveryStarts)}.</strong>}
          </span>
        </p>

        <form
          className="flex flex-col gap-3 pt-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          id="checkout"
        >
          <h3 className="font-serif text-[26px] font-semibold">Delivery details</h3>
          <label className="flex flex-col gap-1.5 text-[13px] font-medium">
            Full name
            <input value={customer.name} onChange={set("name")} autoComplete="name" placeholder="e.g. Ada Okafor" className={`${field} h-12`} />
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] font-medium">
            Phone (WhatsApp)
            <input value={customer.phone} onChange={set("phone")} type="tel" inputMode="tel" autoComplete="tel" placeholder="080..." className={`${field} h-12`} />
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] font-medium">
            Delivery address
            <textarea value={customer.address} onChange={set("address")} rows={2} autoComplete="street-address" placeholder="House number, street, area" className={`${field} resize-none py-3`} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-[13px] font-medium">
              City / town
              <input value={customer.city} onChange={set("city")} autoComplete="address-level2" placeholder="e.g. Ikeja" className={`${field} h-12`} />
            </label>
            <label className="flex flex-col gap-1.5 text-[13px] font-medium">
              State
              <select value={customer.state} onChange={set("state")} autoComplete="address-level1" className={`${field} h-12 px-3`}>
                {NIGERIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1.5 text-[13px] font-medium">
            Note (optional)
            <input value={customer.note} onChange={set("note")} placeholder="Landmark, preferred time…" className={`${field} h-12`} />
          </label>
          {error && (
            <span className="text-[13px] text-mercy" role="alert">
              Please add your name, phone and address.
            </span>
          )}
        </form>
      </div>
      <div className={`flex flex-col gap-2.5 border-t border-hair pt-3 pb-[calc(22px+env(safe-area-inset-bottom))] ${pad} ${page ? "sticky bottom-0 bg-cream" : ""}`}>
        <div className="tabular flex items-baseline justify-between">
          <span className="text-sm">
            Total ({count} {count === 1 ? "pair" : "pairs"})
          </span>
          <span className="text-[19px] font-bold lg:text-xl">{naira(subtotal)}</span>
        </div>
        <button type="submit" form="checkout" className="flex h-[54px] items-center justify-center gap-2.5 rounded-full bg-wa text-base font-bold text-cocoa transition-colors hover:bg-[#3ee07a]">
          <ChatIcon size={22} />
          Send order on WhatsApp
        </button>
        <span className="text-center text-xs text-muted">No payment now. Mercy confirms your order and delivery fee on WhatsApp.</span>
      </div>
    </>
  );
}

export function CartDrawer() {
  const { cartOpen, closeCart, count } = useCart();
  const router = useRouter();
  useOverlay(cartOpen, closeCart);
  const shop = () => {
    closeCart();
    router.push("/shop");
  };
  return (
    <>
      <Backdrop open={cartOpen} onClick={closeCart} z="z-[47]" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Your bag"
        aria-hidden={!cartOpen}
        inert={!cartOpen}
        className={`fixed inset-x-0 bottom-0 z-[48] flex h-[90dvh] flex-col rounded-t-3xl bg-cream transition-transform duration-400 ease-out-soft lg:inset-x-auto lg:top-0 lg:right-0 lg:h-auto lg:w-[440px] lg:rounded-l-3xl lg:rounded-tr-none ${
          cartOpen ? "translate-y-0 lg:translate-x-0" : "translate-y-[102%] lg:translate-x-[102%] lg:translate-y-0"
        }`}
      >
        <div className="flex flex-col gap-2 px-5 pt-2.5 pb-2 lg:px-6 lg:pt-5">
          <span className="h-1 w-10 self-center rounded-full bg-cocoa/15 lg:hidden" />
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-[30px] font-semibold lg:text-[32px]">
              Your bag <span className="font-sans text-[15px] font-medium">({count})</span>
            </h2>
            <button type="button" onClick={closeCart} aria-label="Close bag" className="grid size-11 place-items-center">
              <CloseIcon />
            </button>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col">
          <CartContents onShop={shop} />
        </div>
      </aside>
    </>
  );
}

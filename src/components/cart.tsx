"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { OrderError, submitOrder } from "@/lib/backend/client";
import { naira, shortDate } from "@/lib/format";
import { buildOrder } from "@/lib/order-build";
import { expectedReady, isMadeToOrder, maxWorkingDays, newOrderRef, niceDate, productionTimeOf } from "@/lib/orders";
import { NIGERIAN_STATES } from "@/lib/seed";
import type { Fulfilment } from "@/lib/types";
import { buildOrderMessage, openWhatsApp } from "@/lib/whatsapp";
import { useCart } from "@/state/cart";
import { useNow, useSale } from "@/state/sale";
import { useStore } from "@/state/store";
import { ChatIcon, CheckIcon, ClockIcon, CloseIcon, GiftIcon, StoreIcon, TruckIcon } from "./icons";
import { QtyStepper } from "./pickers";
import { Backdrop, useOverlay } from "./ui";

const field =
  "rounded-xl border border-cocoa/15 bg-field px-3.5 text-base font-normal text-cocoa outline-none transition-colors placeholder:text-muted/70 focus:border-gold";

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

/** What the bag will take to make, worked out from its slowest made-to-order item. */
function useProduction() {
  const { lines } = useCart();
  const { data } = useStore();
  const { sale, status } = useSale();
  const mto = lines.filter((l) => isMadeToOrder(l.product, data.settings));
  const time = mto.length ? mto.map((l) => productionTimeOf(l.product, data.settings)).sort((a, b) => maxWorkingDays(b) - maxWorkingDays(a))[0] : "";
  const now = useNow() ?? 0;
  const ready = time && now ? expectedReady(now, sale, status === "live", time) : "";
  return { madeToOrder: mto.length > 0, time, ready };
}

/** Shown after an order is placed: reference, ready date, Track order. */
function OrderPlaced({ page }: { page: boolean }) {
  const { placedOrder, clearPlacedOrder, closeCart } = useCart();
  const { data } = useStore();
  if (!placedOrder) return null;
  const o = placedOrder.order;
  const trackHref = `/track?ref=${encodeURIComponent(o.ref)}&phone=${encodeURIComponent(o.phone)}`;
  const done = () => {
    clearPlacedOrder();
    closeCart();
  };
  return (
    <div className={`flex flex-col items-center gap-4 py-6 text-center ${page ? "" : "px-5 lg:px-6"}`} role="status">
      <span className="grid size-16 place-items-center rounded-full bg-leaf/15 text-leaf">
        <CheckIcon size={30} />
      </span>
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold tracking-[.18em] text-ochre">ORDER RECEIVED</span>
        <h3 className="font-serif text-[34px] leading-tight font-semibold">Order {o.ref}</h3>
      </div>
      <p className="max-w-[340px] text-pretty">
        Thank you, {o.name.split(" ")[0]}! We&apos;ll start making your pairs once your order is confirmed on WhatsApp.
      </p>
      <div className="w-full rounded-2xl bg-sand p-4 text-left text-sm">
        <div className="flex justify-between gap-3 py-1">
          <span className="text-muted">Expected ready</span>
          <span className="font-semibold">{niceDate(o.expectedReady)}</span>
        </div>
        <div className="flex justify-between gap-3 py-1">
          <span className="text-muted">{o.fulfilment === "pickup" ? "Pickup" : "Delivery"}</span>
          <span className="text-right font-medium">{o.fulfilment === "pickup" ? data.settings.pickupAddress : [o.address, o.city, o.state].filter(Boolean).join(", ")}</span>
        </div>
        <div className="tabular flex justify-between gap-3 py-1">
          <span className="text-muted">Total</span>
          <span className="font-semibold">{naira(o.subtotal)}</span>
        </div>
      </div>
      {placedOrder.offline && (
        <p className="rounded-xl border border-mercy/40 px-4 py-3 text-left text-[13px]">
          We couldn&apos;t save your order online just now, but your WhatsApp message has all the details and Mercy will confirm it there.
        </p>
      )}
      <div className="flex w-full flex-col gap-2.5">
        <button
          type="button"
          onClick={() => openWhatsApp(data.settings.whatsappNumber, placedOrder.message)}
          className="flex h-[52px] items-center justify-center gap-2 rounded-full bg-wa font-semibold text-cocoa hover:bg-[#3ee07a]"
        >
          <ChatIcon size={20} />
          Send on WhatsApp again
        </button>
        {!placedOrder.offline && (
          <Link href={trackHref} onClick={done} className="grid h-[52px] place-items-center rounded-full bg-cocoa font-semibold text-cream hover:bg-mercy">
            Track order
          </Link>
        )}
        <Link href="/shop" onClick={done} className="grid h-11 place-items-center text-sm font-medium underline-offset-4 hover:underline">
          Continue shopping
        </Link>
      </div>
      <p className="text-xs text-muted">Save your reference. You&apos;ll need it with your phone number to track your order.</p>
    </div>
  );
}

/** Bag contents + checkout form. Used by the drawer and /cart. */
export function CartContents({ onShop, page = false }: { onShop?: () => void; page?: boolean }) {
  const { lines, count, subtotal, fullTotal, setQty, customer, setCustomer, placedOrder, setPlacedOrder, clear } = useCart();
  const { sale, status, giftMin } = useSale();
  const { data } = useStore();
  const production = useProduction();
  const { pickup: canPickup, delivery: canDeliver } = data.settings.fulfilment;
  const fulfilment: Fulfilment = canPickup && canDeliver ? customer.fulfilment : canDeliver ? "delivery" : "pickup";
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  type Field = "name" | "phone" | "address";
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const set = (k: keyof typeof customer) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setCustomer({ ...customer, [k]: e.target.value });
    if (k in errors) setErrors((x) => ({ ...x, [k]: undefined }));
  };
  const invalid = (k: Field) => (errors[k] ? "border-mercy focus:border-mercy" : "");
  const errorText = (k: Field) =>
    errors[k] ? (
      <span id={`err-${k}`} className="text-[13px] font-normal text-mercy">
        {errors[k]}
      </span>
    ) : null;

  const send = async () => {
    if (busy) return;
    const digits = customer.phone.replace(/\D/g, "");
    const next: Partial<Record<Field, string>> = {};
    if (!customer.name.trim()) next.name = "Please add your name.";
    if (!digits) next.phone = "Please add your WhatsApp number.";
    else if (digits.length < 10 || digits.length > 14) next.phone = "That number looks incomplete. Use e.g. 0803 123 4567.";
    if (fulfilment === "delivery" && customer.address.trim().length < 6) next.address = "Please add your delivery address.";
    setErrors(next);
    const firstBad = (["name", "phone", "address"] as Field[]).find((k) => next[k]);
    if (firstBad) {
      const el = document.getElementById(`f-${firstBad}`);
      el?.focus();
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }

    // WhatsApp must open inside the tap (pop-up blockers), so the reference is made here
    // and the order is saved straight after.
    const ref = newOrderRef();
    const who = { ...customer, fulfilment };
    const message = buildOrderMessage(
      {
        ref,
        lines: lines.map((l) => ({ name: l.product.name, colour: l.colourName, size: l.size, qty: l.qty, total: l.total })),
        customer: who,
        madeToOrder: production.madeToOrder,
        productionTime: production.time,
        expectedReady: production.ready,
      },
      { sale, status, giftMin },
    );
    openWhatsApp(data.settings.whatsappNumber, message);

    setBusy(true);
    setSubmitError(null);
    const req = { ref, items: lines.map((l) => ({ productId: l.productId, colour: l.colour, size: l.size, qty: l.qty })), customer: who };
    try {
      const order = await submitOrder(req, { data, status });
      setPlacedOrder({ order, message: order.ref === ref ? message : message.replace(ref, order.ref), offline: false });
      clear();
    } catch (e) {
      if (e instanceof OrderError) {
        setSubmitError(e.message);
      } else {
        // Saving failed but WhatsApp already has everything: show the confirmation anyway.
        const fallback = buildOrder(req, { products: data.products, sale, settings: data.settings, status, now: Date.now() });
        setPlacedOrder({ order: fallback, message, offline: true });
        clear();
      }
    } finally {
      setBusy(false);
    }
  };

  const pad = page ? "" : "px-5 lg:px-6";

  if (placedOrder) return <OrderPlaced page={page} />;

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
          <Link href="/track" onClick={onShop ? () => onShop() : undefined} className="text-sm font-medium underline-offset-4 hover:underline">
            Track an order
          </Link>
        </div>
      </div>
    );
  }

  const choice = (value: Fulfilment, title: string, sub: string, Icon: typeof StoreIcon) => (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition-colors ${
        fulfilment === value ? "border-cocoa bg-sand" : "border-cocoa/15 hover:border-cocoa/40"
      }`}
    >
      <input
        type="radio"
        name="fulfilment"
        value={value}
        checked={fulfilment === value}
        onChange={() => setCustomer({ ...customer, fulfilment: value })}
        className="mt-1 size-[18px] flex-none accent-cocoa"
      />
      <span className="flex flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-2 text-[15px] font-semibold">
          <Icon size={18} className="text-gold" />
          {title}
        </span>
        <span className="text-[13px] text-muted">{sub}</span>
      </span>
    </label>
  );

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
                <span className="flex items-baseline gap-3">
                  <span className="tabular font-semibold">{naira(l.total)}</span>
                  <button type="button" onClick={() => setQty(l.key, 0)} className="text-xs text-muted underline-offset-2 hover:text-mercy hover:underline">
                    Remove<span className="sr-only"> {l.product.name}</span>
                  </button>
                </span>
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
            <span>{fulfilment === "pickup" ? "Pickup" : "Delivery"}</span>
            <span>{fulfilment === "pickup" ? "Free" : "Fee confirmed on WhatsApp"}</span>
          </div>
        </div>

        <form
          className="flex flex-col gap-3 pt-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
          id="checkout"
          noValidate
        >
          <h3 className="font-serif text-[26px] font-semibold">Your details</h3>
          <label className="flex flex-col gap-1.5 text-[13px] font-medium">
            Full name
            <input id="f-name" value={customer.name} onChange={set("name")} autoComplete="name" placeholder="e.g. Ada Okafor" aria-invalid={!!errors.name} aria-describedby={errors.name ? "err-name" : undefined} className={`${field} h-12 ${invalid("name")}`} />
            {errorText("name")}
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] font-medium">
            Phone (WhatsApp)
            <input id="f-phone" value={customer.phone} onChange={set("phone")} type="tel" inputMode="tel" autoComplete="tel" placeholder="0803 123 4567" aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "err-phone" : undefined} className={`${field} h-12 ${invalid("phone")}`} />
            {errorText("phone")}
          </label>

          {canPickup && canDeliver ? (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1.5 text-[13px] font-medium">How do you want to get your order?</legend>
              {choice("pickup", "Pickup", data.settings.pickupAddress || "Pickup location shared on WhatsApp", StoreIcon)}
              {choice("delivery", "Delivery", "Anywhere in Nigeria. Fee confirmed on WhatsApp.", TruckIcon)}
            </fieldset>
          ) : (
            <p className="flex items-center gap-2 rounded-2xl bg-sand px-4 py-3 text-sm">
              {fulfilment === "pickup" ? <StoreIcon size={18} className="text-gold" /> : <TruckIcon size={18} className="text-gold" />}
              {fulfilment === "pickup" ? `Pickup · ${data.settings.pickupAddress}` : "Delivery anywhere in Nigeria. Fee confirmed on WhatsApp."}
            </p>
          )}

          {fulfilment === "delivery" && (
            <>
              <label className="flex flex-col gap-1.5 text-[13px] font-medium">
                Delivery address
                <textarea id="f-address" value={customer.address} onChange={set("address")} rows={2} autoComplete="street-address" placeholder="House number, street, area" aria-invalid={!!errors.address} aria-describedby={errors.address ? "err-address" : undefined} className={`${field} resize-none py-3 ${invalid("address")}`} />
                {errorText("address")}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5 text-[13px] font-medium">
                  City / town
                  <input value={customer.city} onChange={set("city")} autoComplete="address-level2" placeholder="e.g. Ikeja" className={`${field} h-12`} />
                </label>
                <label className="flex flex-col gap-1.5 text-[13px] font-medium">
                  State
                  <select value={customer.state} onChange={set("state")} autoComplete="address-level1" className={`${field} h-12 px-3`}>
                    {NIGERIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </>
          )}
          <label className="flex flex-col gap-1.5 text-[13px] font-medium">
            Note (optional)
            <input value={customer.note} onChange={set("note")} placeholder={fulfilment === "pickup" ? "Preferred pickup day…" : "Landmark, preferred time…"} className={`${field} h-12`} />
          </label>
          {Object.values(errors).some(Boolean) && (
            <span className="sr-only" role="alert">
              Please fix the highlighted details.
            </span>
          )}
        </form>

        <div className="flex flex-col gap-2 rounded-2xl border border-gold/40 px-4 py-3.5 text-[13px]">
          {production.madeToOrder && (
            <p className="flex items-start gap-2.5">
              <ClockIcon size={18} className="mt-px flex-none text-gold" />
              <span>
                <strong className="font-semibold">Made to order.</strong> Ready in {production.time}
                {production.ready && (
                  <>
                    , around <strong className="font-semibold">{niceDate(production.ready)}</strong>
                  </>
                )}
                .
                {status === "live" && sale.deliveryStarts && ` Sale orders go into production from ${shortDate(sale.deliveryStarts)}.`}
              </span>
            </p>
          )}
          <p className="flex items-start gap-2.5">
            <ChatIcon size={18} strokeWidth={1.5} className="mt-px flex-none text-gold" />
            <span>{data.settings.paymentNote}</span>
          </p>
        </div>
        {submitError && (
          <p className="rounded-xl border border-mercy/50 bg-mercy/5 px-4 py-3 text-[13px] text-mercy" role="alert">
            {submitError}
          </p>
        )}
      </div>
      <div className={`flex flex-col gap-2.5 border-t border-hair pt-3 pb-[calc(22px+env(safe-area-inset-bottom))] ${pad} ${page ? "sticky bottom-0 bg-cream" : ""}`}>
        <div className="tabular flex items-baseline justify-between">
          <span className="text-sm">
            Total ({count} {count === 1 ? "pair" : "pairs"})
          </span>
          <span className="text-[19px] font-bold lg:text-xl">{naira(subtotal)}</span>
        </div>
        <button
          type="submit"
          form="checkout"
          disabled={busy}
          className="flex h-[54px] items-center justify-center gap-2.5 rounded-full bg-wa text-base font-bold text-cocoa transition-colors hover:bg-[#3ee07a] disabled:opacity-70"
        >
          <ChatIcon size={22} />
          {busy ? "Placing your order…" : "Place order on WhatsApp"}
        </button>
        <span className="text-center text-xs text-muted">No payment now. You&apos;ll get an order number to track your pairs.</span>
      </div>
    </>
  );
}

export function CartDrawer() {
  const { cartOpen, closeCart, count } = useCart();
  const router = useRouter();
  const panelRef = useRef<HTMLElement>(null);
  useOverlay(cartOpen, closeCart, panelRef);
  const shop = () => {
    closeCart();
    router.push("/shop");
  };
  return (
    <>
      <Backdrop open={cartOpen} onClick={closeCart} z="z-[47]" />
      <aside
        ref={panelRef}
        tabIndex={-1}
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

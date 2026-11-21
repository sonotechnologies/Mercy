"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { myOrders, trackOrder } from "@/lib/backend/client";
import { naira } from "@/lib/format";
import { niceDate, normaliseRef, STATUS_LABEL, statusSteps, statusTone, stepIndex } from "@/lib/orders";
import type { Order } from "@/lib/types";
import { openWhatsApp } from "@/lib/whatsapp";
import { useStore } from "@/state/store";
import { ChatIcon, CheckIcon, ClockIcon, StoreIcon, TruckIcon } from "./icons";

const field =
  "h-12 w-full rounded-xl border border-cocoa/15 bg-field px-3.5 text-base text-cocoa outline-none transition-colors placeholder:text-muted/70 focus:border-gold";

function Timeline({ order }: { order: Order }) {
  const steps = statusSteps(order.fulfilment);
  const current = stepIndex(order.status, order.fulfilment);
  return (
    <ol className="flex flex-col" aria-label="Order progress">
      {steps.map((s, i) => {
        const done = i < current;
        const now = i === current;
        return (
          <li key={s.status} className="relative flex gap-4 pb-6 last:pb-0" aria-current={now ? "step" : undefined}>
            {i < steps.length - 1 && <span className={`absolute top-8 bottom-0 left-[15px] w-0.5 ${done ? "bg-gold" : "bg-gold/25"}`} aria-hidden="true" />}
            <span
              className={`relative z-10 grid size-8 flex-none place-items-center rounded-full border-2 ${
                done ? "border-gold bg-gold text-cream" : now ? "border-mercy bg-cream text-mercy" : "border-gold/30 bg-cream text-gold/40"
              }`}
            >
              {done ? <CheckIcon size={16} strokeWidth={2.5} /> : <span className={`size-2.5 rounded-full ${now ? "bg-mercy" : "bg-gold/30"}`} />}
              {now && <span className="absolute inset-0 animate-ping rounded-full border-2 border-mercy/40" data-anim="" aria-hidden="true" />}
            </span>
            <span className="flex flex-col pt-1">
              <span className={`font-semibold ${now ? "text-cocoa" : done ? "text-cocoa/80" : "text-muted"}`}>
                {s.label}
                {now && <span className="sr-only"> (current step)</span>}
              </span>
              <span className={`text-sm ${now ? "text-cocoa" : "text-muted"}`}>{s.hint}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function OrderCard({ order }: { order: Order }) {
  const { data } = useStore();
  const s = data.settings;
  const tone = statusTone(order.status);
  const cancelled = order.status === "cancelled";
  const ready = order.status === "ready";
  const finished = order.status === "completed";
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="text-[11px] font-semibold tracking-[.18em] text-ochre">ORDER</span>
          <h2 className="font-serif text-4xl leading-none font-semibold">{order.ref}</h2>
          <p className="mt-1 text-sm text-muted">Placed {niceDate(order.createdAt)} · {order.fulfilment === "pickup" ? "Pickup" : "Delivery"}</p>
        </div>
        <span className="rounded-full border px-3 py-1 text-[13px] font-semibold" style={{ background: tone.bg, color: tone.fg, borderColor: tone.border }}>
          {STATUS_LABEL[order.status]}
        </span>
      </div>

      {!cancelled && !finished && (
        <div className="flex items-center gap-3 rounded-2xl bg-sand px-4 py-3.5">
          <ClockIcon size={22} className="flex-none text-gold" />
          <span className="text-sm">
            {ready ? "Your pairs are ready!" : order.status === "out-for-delivery" ? "Your pairs are on the way." : <>Expected ready <strong className="font-semibold">{niceDate(order.expectedReady)}</strong></>}
          </span>
        </div>
      )}

      {ready && order.fulfilment === "pickup" && (
        <div className="flex items-start gap-3 rounded-2xl border border-leaf/40 bg-leaf/10 px-4 py-3.5 text-sm">
          <StoreIcon size={22} className="flex-none text-leaf" />
          <span>
            <strong className="block font-semibold">Pickup</strong>
            {s.pickupAddress}
            {s.pickupHours && <span className="block text-muted">{s.pickupHours}</span>}
          </span>
        </div>
      )}

      {cancelled ? (
        <p className="rounded-2xl border border-cocoa/15 px-4 py-3.5 text-sm">This order was cancelled. If that&apos;s a mistake, message Mercy on WhatsApp.</p>
      ) : (
        <Timeline order={order} />
      )}

      <div className="flex flex-col gap-2 border-t border-hair pt-5">
        <span className="text-sm font-semibold">Your pairs</span>
        <ul className="flex flex-col">
          {order.items.map((i, k) => (
            <li key={k} className="flex items-center gap-3 border-b border-gold/25 py-2.5 last:border-0">
              {i.image ? (
                <span className="relative h-14 w-11 flex-none overflow-hidden rounded-lg bg-sand">
                  <Image src={i.image} alt="" fill sizes="44px" unoptimized={i.image.startsWith("data:")} className="object-cover" />
                </span>
              ) : null}
              <span className="flex-1 text-sm">
                <span className="block font-medium">{i.name}</span>
                <span className="text-muted">
                  {i.colour} · EU {i.size} · x{i.qty}
                </span>
              </span>
              <span className="tabular text-sm font-semibold">{naira(i.total)}</span>
            </li>
          ))}
        </ul>
        <div className="tabular flex justify-between pt-1 text-sm">
          <span>Total</span>
          <span className="font-bold">{naira(order.subtotal)}</span>
        </div>
        {order.giftUnlocked && <span className="text-sm text-mercy">🎁 Includes a free gift</span>}
        {order.fulfilment === "delivery" && (
          <span className="flex items-start gap-2 pt-1 text-sm text-muted">
            <TruckIcon size={16} className="mt-0.5 flex-none" />
            {[order.address, order.city, order.state].filter(Boolean).join(", ")}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() => openWhatsApp(s.whatsappNumber, `Hello Mercy Footwears 👋 I have a question about my order ${order.ref}.`)}
        className="flex h-12 items-center justify-center gap-2 rounded-full bg-wa font-semibold text-cocoa hover:bg-[#3ee07a]"
      >
        <ChatIcon size={20} />
        Ask about this order
      </button>
    </div>
  );
}

export function TrackView({ initialRef, initialPhone }: { initialRef: string; initialPhone: string }) {
  const [ref, setRef] = useState(initialRef);
  const [phone, setPhone] = useState(initialPhone);
  const [order, setOrder] = useState<Order | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "notfound" | "error">("idle");
  const [error, setError] = useState("");
  const [recent, setRecent] = useState<{ ref: string; phone: string; createdAt: string }[]>([]);

  const look = useCallback(async (r: string, p: string) => {
    if (!normaliseRef(r) || p.replace(/\D/g, "").length < 10) {
      setState("error");
      setError("Enter your order reference (e.g. MF-24817) and the phone number you ordered with.");
      return;
    }
    setState("loading");
    try {
      const o = await trackOrder(r, p);
      setOrder(o);
      setState(o ? "idle" : "notfound");
      if (o) {
        const url = new URL(location.href);
        url.searchParams.set("ref", o.ref);
        url.searchParams.set("phone", p);
        history.replaceState(null, "", url);
      }
    } catch (e) {
      setState("error");
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read this device's orders after mount
    setRecent(myOrders());
    if (initialRef && initialPhone) void look(initialRef, initialPhone);
  }, [initialRef, initialPhone, look]);

  // Keep a shown order fresh while the page is open.
  useEffect(() => {
    if (!order) return;
    const t = setInterval(() => {
      trackOrder(order.ref, phone).then((o) => o && setOrder(o)).catch(() => undefined);
    }, 60000);
    return () => clearInterval(t);
  }, [order, phone]);

  return (
    <div className="mx-auto flex max-w-[560px] flex-col gap-6 px-5 pt-8 pb-20 lg:pt-14">
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold tracking-[.18em] text-ochre lg:text-xs">MADE TO ORDER</span>
        <h1 className="m-0 font-serif text-[38px] leading-[1.05] font-semibold lg:text-6xl">Track your order</h1>
        <p className="text-muted">Every pair is handmade after you order. Check where yours is.</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void look(ref, phone);
        }}
        className="flex flex-col gap-3 rounded-2xl border border-gold/40 bg-field p-4"
      >
        <label className="flex flex-col gap-1.5 text-[13px] font-medium">
          Order reference
          <input value={ref} onChange={(e) => setRef(e.target.value.toUpperCase())} placeholder="MF-24817" autoCapitalize="characters" autoComplete="off" className={`${field} tracking-wide`} />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-medium">
          Phone number you ordered with
          <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" inputMode="tel" autoComplete="tel" placeholder="0803 123 4567" className={field} />
        </label>
        <button type="submit" disabled={state === "loading"} className="h-12 rounded-full bg-cocoa font-semibold text-cream transition-colors hover:bg-mercy disabled:opacity-70">
          {state === "loading" ? "Checking…" : "Track order"}
        </button>
        {state === "notfound" && (
          <p className="text-sm text-mercy" role="alert">
            We couldn&apos;t find an order with that reference and phone number. Check both and try again.
          </p>
        )}
        {state === "error" && (
          <p className="text-sm text-mercy" role="alert">
            {error}
          </p>
        )}
      </form>

      {!order && recent.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold">Orders from this phone</span>
          <div className="flex flex-wrap gap-2">
            {recent.map((r) => (
              <button
                key={r.ref}
                type="button"
                onClick={() => {
                  setRef(r.ref);
                  setPhone(r.phone);
                  void look(r.ref, r.phone);
                }}
                className="h-10 rounded-full border border-cocoa/20 px-4 text-sm font-medium hover:border-cocoa"
              >
                {r.ref} <span className="text-muted">· {niceDate(r.createdAt)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {order && (
        <section aria-live="polite" className="rounded-3xl border border-gold/40 bg-cream p-5 shadow-soft lg:p-7">
          <OrderCard order={order} />
        </section>
      )}

      {!order && (
        <p className="text-center text-sm text-muted">
          Haven&apos;t ordered yet? <Link href="/shop" className="font-medium text-cocoa underline underline-offset-4">Shop slides</Link>
        </p>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { normalisePhone } from "@/lib/format";
import type { HeroVariant, Settings } from "@/lib/types";
import { useStore } from "@/state/store";
import { card, ghostBtn, hint, input, labelCls, SaveBar, Toggle } from "./ui";

const HEROES: { v: HeroVariant; label: string; hint: string }[] = [
  { v: "a", label: "Shelf wall", hint: "Big shop photo with the headline over a cream fade" },
  { v: "b", label: "Lineup card", hint: "Headline beside a framed photo of the H-slide lineup" },
  { v: "c", label: "Arched row", hint: "Centred headline over a row of arched photos" },
];

const section = "flex flex-col gap-4 border-t border-gold/30 pt-5 first:border-0 first:pt-0";
const h2 = "font-serif text-2xl font-semibold";

export function SettingsTab() {
  const { data, setSettings, resetDemo, mode } = useStore();
  const [s, setS] = useState<Settings>(data.settings);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => {
    setS((x) => ({ ...x, [k]: v }));
    setSaved(false);
  };

  const save = async () => {
    if (!s.fulfilment.pickup && !s.fulfilment.delivery) return setError("Turn on pickup, delivery, or both.");
    setBusy(true);
    setError(null);
    try {
      await setSettings({ ...s, whatsappNumber: normalisePhone(s.whatsappNumber), instagramHandle: s.instagramHandle.trim(), productionTime: s.productionTime.trim() || "5–7 working days" });
      setSaved(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <h1 className="font-serif text-4xl font-semibold">Settings</h1>
      <div className={`${card} flex max-w-[680px] flex-col gap-5 p-5`}>
        <div className={section}>
          <h2 className={h2}>Made to order</h2>
          <Toggle checked={s.madeToOrder} onChange={(v) => set("madeToOrder", v)} accent="accent-gold">
            Every pair is made after it&apos;s ordered <span className={hint}>(a product can override this)</span>
          </Toggle>
          <label className={labelCls}>
            Production time
            <input value={s.productionTime} onChange={(e) => set("productionTime", e.target.value)} placeholder="5–7 working days" className={input} />
            <span className={hint}>Shown as &ldquo;Ready in …&rdquo;. The largest number is used to work out ready dates (Mon–Fri).</span>
          </label>
          <label className={labelCls}>
            Payment note
            <textarea value={s.paymentNote} onChange={(e) => set("paymentNote", e.target.value)} rows={2} className={`${input} h-auto resize-y py-2.5`} />
            <span className={hint}>Shown at checkout, e.g. if you want a deposit before production.</span>
          </label>
        </div>

        <div className={section}>
          <h2 className={h2}>Pickup &amp; delivery</h2>
          <Toggle checked={s.fulfilment.pickup} onChange={(v) => set("fulfilment", { ...s.fulfilment, pickup: v })}>
            Pickup
          </Toggle>
          <Toggle checked={s.fulfilment.delivery} onChange={(v) => set("fulfilment", { ...s.fulfilment, delivery: v })}>
            Delivery <span className={hint}>(fee confirmed on WhatsApp)</span>
          </Toggle>
          <label className={labelCls}>
            Pickup address
            <input value={s.pickupAddress} onChange={(e) => set("pickupAddress", e.target.value)} placeholder="Pickup location shared on WhatsApp" className={input} />
          </label>
          <label className={labelCls}>
            Pickup hours
            <input value={s.pickupHours} onChange={(e) => set("pickupHours", e.target.value)} placeholder="e.g. Mon–Sat, 10am–6pm" className={input} />
          </label>
          <label className={labelCls}>
            Delivery note
            <textarea value={s.deliveryNote} onChange={(e) => set("deliveryNote", e.target.value)} rows={2} className={`${input} h-auto resize-y py-2.5`} />
          </label>
        </div>

        <div className={section}>
          <h2 className={h2}>Store</h2>
          <label className={labelCls}>
            WhatsApp number (orders go here)
            <input value={s.whatsappNumber} onChange={(e) => set("whatsappNumber", e.target.value)} inputMode="tel" placeholder="0909 896 4885" className={input} />
            <span className={hint}>Saved as wa.me/{normalisePhone(s.whatsappNumber) || "…"}</span>
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
        </div>
        <SaveBar busy={busy} saved={saved} error={error} onSave={() => void save()} label="Save settings" />
      </div>
      {mode === "local" && (
        <div className={`${card} flex max-w-[680px] flex-col gap-2 p-5`}>
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
      )}
    </>
  );
}

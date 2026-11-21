"use client";

import { useState } from "react";
import { shortDate } from "@/lib/format";
import { saleStatus } from "@/lib/sale";
import type { SaleConfig } from "@/lib/types";
import { useNow } from "@/state/sale";
import { useStore } from "@/state/store";
import { ExternalIcon } from "../icons";
import { card, fromLocalInput, ghostBtn, hint, input, labelCls, SaveBar, toLocalInput, Toggle } from "./ui";

export function SaleTab() {
  const { data, setSale } = useStore();
  const [s, setS] = useState<SaleConfig>(data.sale);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await setSale({ ...s, discountPercent: Math.min(90, Math.max(0, s.discountPercent || 0)), freeGiftMinPairs: Math.max(1, s.freeGiftMinPairs || 1) });
      setSaved(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

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
          Sale is on <span className={hint}>(red bar, countdown, -% badges and free-gift bar)</span>
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
            Sale orders go into production from
            <input type="date" value={s.deliveryStarts} onChange={(e) => set("deliveryStarts", e.target.value)} className={input} />
            <span className={hint}>Ready dates for orders placed during the sale count from this day.</span>
          </label>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold tracking-[.06em] text-muted">PREVIEW</span>
          <div className={`rounded-lg px-2.5 py-2 text-center text-[11px] font-semibold tracking-[.06em] ${status === "live" || status === "upcoming" ? "bg-mercy text-cream" : "bg-sand text-muted"}`}>
            {bar}
          </div>
        </div>
        <SaveBar busy={busy} saved={saved} error={error} onSave={() => void save()} label="Save sale" />
      </div>
      <div className={`${card} flex max-w-[620px] flex-col gap-2 p-5 text-sm`}>
        <span className="font-semibold">Preview the sale on the store</span>
        <p className="text-muted">Opens the store as a customer would see it at each stage. Only affects your own browser tab.</p>
        <div className="flex flex-wrap gap-2">
          {(["upcoming", "live", "ended"] as const).map((v) => (
            <a key={v} href={`/?preview=${v}`} target="_blank" className={`${ghostBtn} h-9 px-4`}>
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

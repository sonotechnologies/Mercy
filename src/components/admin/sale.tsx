"use client";

import { useState } from "react";
import { naira, shortDate } from "@/lib/format";
import { hasSalePrice, saleStatus } from "@/lib/sale";
import type { SaleConfig } from "@/lib/types";
import { useNow } from "@/state/sale";
import { useStore } from "@/state/store";
import { ExternalIcon } from "../icons";
import { card, fromLocalInput, ghostBtn, hint, input, labelCls, primaryBtn, SaveBar, toLocalInput, Toggle } from "./ui";

const STATUS_LABEL = { off: "Off", upcoming: "Scheduled", live: "On now", ended: "Ended" } as const;

/** Big on/off card: "End sale now" / "Start sale now". Used on the Sale tab and in Settings. */
export function SaleSwitch() {
  const { data, setSale, products } = useStore();
  const now = useNow() ?? 0;
  const status = saleStatus(data.sale, now);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reduced = products.filter(hasSalePrice).length;
  const running = status === "live" || status === "upcoming";

  const toggle = async () => {
    const ending = running;
    if (
      !confirm(
        ending
          ? "End the sale now? Every product goes back to its normal price straight away. Sale prices are kept for next time."
          : "Start the sale now? Products with a sale price will show it straight away.",
      )
    )
      return;
    setBusy(true);
    setError(null);
    try {
      await setSale(
        ending
          ? { ...data.sale, active: false }
          : { ...data.sale, active: true, startsAt: "", endsAt: data.sale.endsAt && Date.parse(data.sale.endsAt) > Date.now() ? data.sale.endsAt : "" },
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`${card} flex max-w-[680px] flex-col gap-3 p-5 ${running ? "border-mercy/40" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="flex items-center gap-2 font-serif text-2xl font-semibold">
            {data.sale.title || "Sale"}
            <span className={`rounded-full px-2.5 py-0.5 font-sans text-xs font-semibold ${status === "live" ? "bg-mercy text-cream" : status === "upcoming" ? "bg-gold text-cocoa" : "bg-sand text-muted"}`}>
              {STATUS_LABEL[status]}
            </span>
          </span>
          <p className="text-sm text-muted">
            {status === "live"
              ? `${reduced} products show their sale price${data.sale.endsAt ? `, until ${shortDate(data.sale.endsAt)}` : ". No end date: it runs until you end it"}.`
              : status === "upcoming"
                ? `Starts ${shortDate(data.sale.startsAt)}.`
                : "Everything shows its normal price. Sale prices are kept for the next sale."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void toggle()}
          disabled={busy}
          className={running ? "inline-flex h-11 items-center rounded-full bg-mercy px-5 text-sm font-semibold text-cream hover:bg-[#8f1921] disabled:opacity-50" : primaryBtn}
        >
          {busy ? "Saving…" : running ? "End sale now" : "Start sale now"}
        </button>
      </div>
      {error && (
        <span className="text-[13px] text-mercy" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

export function SaleTab() {
  const { data, setSale, products } = useStore();
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
  const bar =
    status === "live"
      ? `${s.title.toUpperCase()} · Prices slashed on selected styles${s.endsAt ? ` · Ends ${shortDate(s.endsAt)}` : ""}`
      : status === "upcoming"
        ? `${s.title.toUpperCase()} · Coming soon · Starts ${shortDate(s.startsAt)}`
        : "The sale bar is hidden. Everything shows its normal price.";
  const reduced = products.filter(hasSalePrice);
  const without = products.length - reduced.length;

  const save = async () => {
    if (s.startsAt && s.endsAt && Date.parse(s.endsAt) <= Date.parse(s.startsAt)) return setError("The end date must be after the start date.");
    setBusy(true);
    setError(null);
    try {
      await setSale({ ...s, title: s.title.trim() || "Sale", freeGiftMinPairs: Math.max(1, s.freeGiftMinPairs || 1) });
      setSaved(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const clearBtn = (k: "startsAt" | "endsAt" | "deliveryStarts") =>
    s[k] ? (
      <button type="button" onClick={() => set(k, "")} className="self-start text-xs font-medium text-muted underline underline-offset-2 hover:text-cocoa">
        Clear
      </button>
    ) : null;

  return (
    <>
      <h1 className="font-serif text-4xl font-semibold">Sale &amp; free gift</h1>
      <SaleSwitch key={String(data.sale.active)} />

      <div className={`${card} flex max-w-[680px] flex-col gap-4 p-5`}>
        <h2 className="font-serif text-2xl font-semibold">How the sale works</h2>
        <p className="-mt-2 text-sm text-muted">
          Each product has its own <strong>normal price</strong> and <strong>sale price</strong> (set in Products). While the sale is on, products with a sale price show
          the normal price struck through. {reduced.length} of {products.length} products have a sale price{without ? `; ${without} always show their normal price` : ""}.
        </p>
        <Toggle checked={s.active} onChange={(v) => set("active", v)} accent="accent-mercy">
          Sale is on <span className={hint}>(red bar, Sale pills and the free-gift bar)</span>
        </Toggle>
        <label className={labelCls}>
          Title
          <input value={s.title} onChange={(e) => set("title", e.target.value)} placeholder="End of Year Sale" className={input} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={labelCls}>
            Ends automatically (optional)
            <input type="datetime-local" value={toLocalInput(s.endsAt)} onChange={(e) => set("endsAt", fromLocalInput(e.target.value))} className={input} />
            <span className={hint}>Lagos time. Shows a countdown. Leave empty to run until you end it.</span>
            {clearBtn("endsAt")}
          </label>
          <label className={labelCls}>
            Starts (optional)
            <input type="datetime-local" value={toLocalInput(s.startsAt)} onChange={(e) => set("startsAt", fromLocalInput(e.target.value))} className={input} />
            <span className={hint}>For a future sale. Empty = already running.</span>
            {clearBtn("startsAt")}
          </label>
          <label className={labelCls}>
            Free gift from (pairs)
            <input type="number" min={1} value={s.freeGiftMinPairs} onChange={(e) => set("freeGiftMinPairs", Number(e.target.value))} className={input} />
          </label>
          <label className={labelCls}>
            Sale orders go into production from (optional)
            <input type="date" value={s.deliveryStarts} onChange={(e) => set("deliveryStarts", e.target.value)} className={input} />
            {clearBtn("deliveryStarts")}
          </label>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold tracking-[.06em] text-muted">PREVIEW</span>
          <div className={`rounded-lg px-2.5 py-2 text-center text-[11px] font-semibold tracking-[.06em] ${status === "live" || status === "upcoming" ? "bg-mercy text-cream" : "bg-sand text-muted"}`}>
            {bar}
          </div>
          {reduced[0] && status === "live" && (
            <span className="tabular text-sm">
              e.g. {reduced[0].name}: <s className="text-tan-ink">{naira(reduced[0].price)}</s> <strong>{naira(reduced[0].salePrice!)}</strong>
            </span>
          )}
        </div>
        <SaveBar busy={busy} saved={saved} error={error} onSave={() => void save()} label="Save sale settings" />
      </div>

      <div className={`${card} flex max-w-[680px] flex-col gap-2 p-5 text-sm`}>
        <span className="font-semibold">Preview the store</span>
        <p className="text-muted">Opens the store as a customer would see it. Only affects your own browser tab.</p>
        <div className="flex flex-wrap gap-2">
          {(["live", "ended"] as const).map((v) => (
            <a key={v} href={`/?preview=${v}`} target="_blank" className={`${ghostBtn} h-9 px-4`}>
              {v === "live" ? "With sale prices" : "Normal prices"} <ExternalIcon size={13} />
            </a>
          ))}
          <a href="/?preview=off" target="_blank" className={`${ghostBtn} h-9 px-4`}>
            As it is now <ExternalIcon size={13} />
          </a>
        </div>
      </div>
    </>
  );
}

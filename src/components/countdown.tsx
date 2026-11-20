"use client";

import { countdownParts } from "@/lib/format";
import { useNow, useSale } from "@/state/sale";

/** Each character re-mounts (and flips) only when it changes. */
export function FlipText({ text }: { text: string }) {
  return (
    <span className="inline-flex" aria-hidden="true">
      {[...text].map((ch, i) => (
        <span key={i + ch} data-anim="" className="inline-block animate-flip whitespace-pre">
          {ch}
        </span>
      ))}
    </span>
  );
}

export function useCountdown() {
  const { target } = useSale();
  const now = useNow();
  if (target == null || now == null) return { d: "--", h: "--", m: "--", s: "--", label: "" };
  const parts = countdownParts(target - now);
  return { ...parts, label: `${parts.d} days ${parts.h} hours ${parts.m} minutes` };
}

/** "02d 14h 08m 05s" */
export function InlineCountdown() {
  const c = useCountdown();
  return (
    <span className="tabular">
      <FlipText text={`${c.d}d ${c.h}h ${c.m}m ${c.s}s`} />
      <span className="sr-only">{c.label}</span>
    </span>
  );
}

export function BigCountdown({ size = "md" }: { size?: "md" | "lg" }) {
  const c = useCountdown();
  const lg = size === "lg";
  const unit = (v: string, label: string) => (
    <div className={`flex flex-col items-center ${lg ? "min-w-[76px]" : "min-w-[56px]"}`}>
      <span className={`font-semibold leading-none ${lg ? "text-[64px]" : "text-[46px]"}`}>
        <FlipText text={v} />
      </span>
      <span className={`font-sans font-semibold tracking-[.14em] text-cocoa ${lg ? "mt-1.5 text-[11px]" : "mt-1 text-[10px]"}`}>{label}</span>
    </div>
  );
  const colon = <span className={`leading-[1.1] text-tan ${lg ? "text-5xl" : "text-4xl"}`}>:</span>;
  return (
    <div className={`tabular flex items-start font-serif text-mercy ${lg ? "gap-2.5" : "gap-1.5"}`} role="timer" aria-label={c.label}>
      {unit(c.d, "DAYS")}
      {colon}
      {unit(c.h, "HRS")}
      {colon}
      {unit(c.m, "MINS")}
      {colon}
      {unit(c.s, "SECS")}
    </div>
  );
}

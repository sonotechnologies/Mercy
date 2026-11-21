"use client";

import Image from "next/image";
import { CheckIcon } from "../icons";

export const input =
  "h-11 w-full rounded-xl border border-cocoa/15 bg-white px-3 text-base text-cocoa outline-none transition-colors focus:border-gold lg:text-[15px]";
export const labelCls = "flex flex-col gap-1.5 text-[13px] font-medium";
export const card = "rounded-2xl border border-gold/45 bg-field";
export const primaryBtn =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-cocoa px-5 text-sm font-semibold text-cream transition-colors hover:bg-mercy disabled:opacity-50";
export const ghostBtn = "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-cocoa/20 px-5 text-sm font-semibold hover:border-cocoa";
export const hint = "font-normal text-muted";

export function Thumb({ src, className = "h-[50px] w-10", focus }: { src?: string; className?: string; focus?: string }) {
  return (
    <span className={`relative block flex-none overflow-hidden rounded-lg bg-sand ${className}`}>
      {src && <Image src={src} alt="" fill sizes="96px" unoptimized={src.startsWith("data:")} className="object-cover" style={{ objectPosition: focus ?? "50% 50%" }} />}
    </span>
  );
}

export function Toggle({ checked, onChange, children, accent = "accent-leaf" }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode; accent?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className={`mt-0.5 size-[18px] flex-none ${accent}`} />
      <span>{children}</span>
    </label>
  );
}

export function SaveBar({ busy, saved, error, onSave, label = "Save" }: { busy: boolean; saved: boolean; error: string | null; onSave: () => void; label?: string }) {
  return (
    <div className="flex flex-col gap-2">
      {error && (
        <span className="text-[13px] text-mercy" role="alert">
          {error}
        </span>
      )}
      <div className="flex flex-wrap items-center gap-2.5">
        <button type="button" onClick={onSave} disabled={busy} className={primaryBtn}>
          {busy ? "Saving…" : label}
        </button>
        {saved && !busy && (
          <span className="flex items-center gap-1 text-[13px] text-leaf" role="status">
            <CheckIcon size={16} />
            Saved. Live on the store.
          </span>
        )}
      </div>
    </div>
  );
}

/** Lagos time (UTC+1, no DST): "2026-11-26T00:00:00+01:00" <-> "2026-11-26T00:00" */
export const toLocalInput = (iso: string) => {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? "" : new Date(t + 3600e3).toISOString().slice(0, 16);
};
export const fromLocalInput = (v: string) => (v ? `${v}:00+01:00` : "");

/** Compresses a photo in the browser: JPEG, longest side ≤ max px. */
export function compressImage(file: File, max = 1600, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#F1E6D6";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't process that image."))), "image/jpeg", quality);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Couldn't read ${file.name}. Use a JPG or PNG photo.`));
    };
    img.src = url;
  });
}

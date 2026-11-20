"use client";

import { SIZE_GUIDE } from "@/lib/seed";
import { openWhatsApp } from "@/lib/whatsapp";
import { useStore } from "@/state/store";
import { ChatIcon, CloseIcon } from "./icons";
import { Backdrop, useOverlay } from "./ui";

export function SizeGuide({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data } = useStore();
  useOverlay(open, onClose);
  return (
    <>
      <Backdrop open={open} onClick={onClose} z="z-[60]" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Size guide"
        aria-hidden={!open}
        inert={!open}
        className={`fixed inset-x-0 bottom-0 z-[61] flex max-h-[90dvh] flex-col gap-4 overflow-y-auto rounded-t-3xl bg-cream px-5 pt-2.5 pb-6 transition-all duration-300 ease-out-soft lg:inset-x-auto lg:top-1/2 lg:bottom-auto lg:left-1/2 lg:w-[480px] lg:rounded-2xl lg:p-6 lg:shadow-soft ${
          open ? "translate-y-0 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:opacity-100" : "translate-y-[105%] lg:-translate-x-1/2 lg:-translate-y-[47%] lg:opacity-0 lg:pointer-events-none"
        }`}
      >
        <span className="h-1 w-10 self-center rounded-full bg-cocoa/15 lg:hidden" />
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-serif text-[28px] leading-tight font-semibold">Size guide</h2>
            <p className="text-sm text-muted">Measure your foot from heel to longest toe.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close size guide" className="grid size-11 place-items-center">
            <CloseIcon />
          </button>
        </div>
        <table className="tabular w-full border-collapse overflow-hidden rounded-2xl bg-field text-sm">
          <thead>
            <tr className="text-left text-xs tracking-[.06em] text-muted">
              <th className="px-4 py-2.5 font-semibold">EU SIZE</th>
              <th className="px-4 py-2.5 font-semibold">FOOT LENGTH (CM)</th>
            </tr>
          </thead>
          <tbody>
            {SIZE_GUIDE.map((r) => (
              <tr key={r.eu} className="border-t border-gold/30">
                <td className="px-4 py-2 font-semibold">{r.eu}</td>
                <td className="px-4 py-2">{r.cm}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-sm">
          Between sizes? Slides run true to size, so go up for a roomier fit. Mercy is happy to advise on WhatsApp.
        </p>
        <button
          type="button"
          onClick={() => openWhatsApp(data.settings.whatsappNumber, "Hello Mercy Footwears 👋 Please help me pick the right size.")}
          className="flex h-12 items-center justify-center gap-2 rounded-full bg-wa font-semibold text-cocoa"
        >
          <ChatIcon size={20} />
          Ask about sizing
        </button>
      </div>
    </>
  );
}

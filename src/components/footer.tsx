"use client";

import Link from "next/link";
import { displayPhone } from "@/lib/format";
import { buildChatMessage, openWhatsApp } from "@/lib/whatsapp";
import { useSale } from "@/state/sale";
import { useStore } from "@/state/store";
import { Logo } from "./logo";

export function Footer() {
  const { data } = useStore();
  const { status } = useSale();
  const { whatsappNumber, instagramHandle } = data.settings;
  const ig = `https://instagram.com/${instagramHandle}`;
  const chat = () => openWhatsApp(whatsappNumber, buildChatMessage());
  const head = "text-[11px] font-semibold tracking-[.16em] text-tan";
  return (
    <footer className="bg-cocoa text-cream">
      <div className="mx-auto grid max-w-[1240px] gap-6 px-5 pt-9 pb-6 lg:grid-cols-[2fr_1fr_1fr_1fr] lg:gap-8 lg:px-12 lg:pt-14 lg:pb-10">
        <div className="flex flex-col gap-4">
          <Logo size="footer" tone="cream" />
          <span className="font-serif text-[22px] text-[#E9DFD0]">Let your feet do the talking.</span>
        </div>
        <div className="grid grid-cols-2 gap-6 text-sm text-[#E9DFD0] lg:contents">
          <div className="flex flex-col gap-2.5">
            <span className={head}>SHOP</span>
            <Link href="/shop?g=women" className="hover:text-cream">Women</Link>
            <Link href="/shop?g=men-unisex" className="hover:text-cream">Men &amp; Unisex</Link>
            {status === "live" && <Link href="/shop?sale=1" className="hover:text-cream">Sale</Link>}
          </div>
          <div className="flex flex-col gap-2.5">
            <span className={head}>HELP</span>
            <Link href="/#about" className="hover:text-cream">About</Link>
            <button type="button" onClick={chat} className="text-left hover:text-cream">
              WhatsApp {displayPhone(whatsappNumber)}
            </button>
          </div>
          <div className="flex flex-col gap-2.5">
            <span className={head}>FOLLOW</span>
            <a href={ig} target="_blank" rel="noopener noreferrer" className="hover:text-cream">
              Instagram @{instagramHandle}
            </a>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-[1240px] px-5 pb-[calc(88px+env(safe-area-inset-bottom))] lg:px-12 lg:pb-8">
        <div className="flex flex-col gap-1 border-t border-hair pt-4 text-[13px] text-[#D9CCB9] sm:flex-row sm:justify-between">
          <span>© 2026 Mercy Footwears</span>
          <a href="https://instagram.com/sonotechnologies.dev" target="_blank" rel="noopener noreferrer" className="hover:text-cream">
            Site by Sono Technologies
          </a>
        </div>
      </div>
    </footer>
  );
}

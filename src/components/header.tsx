"use client";

import Link from "next/link";
import { useCallback, useState, useRef } from "react";
import { buildChatMessage, openWhatsApp } from "@/lib/whatsapp";
import { useCart } from "@/state/cart";
import { useSale } from "@/state/sale";
import { useStore } from "@/state/store";
import { InlineCountdown } from "./countdown";
import { BagIcon, ChatIcon, CloseIcon, InstagramIcon, MenuIcon } from "./icons";
import { Logo } from "./logo";
import { Backdrop, useOverlay } from "./ui";

export function SaleBar() {
  const { status, sale } = useSale();
  if (status !== "live" && status !== "upcoming") return null;
  return (
    <div className="tabular flex justify-center gap-[5px] whitespace-nowrap bg-mercy px-2.5 py-[7px] text-center text-[11px] font-semibold tracking-[.06em] text-cream lg:gap-1.5 lg:px-4 lg:py-[9px] lg:text-xs lg:tracking-[.08em]">
      <span className="hidden min-[420px]:inline">{sale.title.toUpperCase()} ·</span>
      <span>{sale.discountPercent}% OFF ·</span>
      <span>{status === "live" ? "Ends in" : "Starts in"}</span>
      <InlineCountdown />
    </div>
  );
}

export function BagButton({ className = "" }: { className?: string }) {
  const { count, bump, openCart } = useCart();
  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`Bag, ${count} ${count === 1 ? "item" : "items"}`}
      className={`grid size-11 place-items-center ${className}`}
    >
      <span className="relative inline-flex">
        <span key={"b" + bump} data-anim="" className={`inline-flex ${bump ? "animate-bounce-bag" : ""}`}>
          <BagIcon size={22} />
        </span>
        {count > 0 && (
          <span
            key={"c" + bump}
            data-anim=""
            className={`absolute -top-[5px] -right-2 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-mercy px-1 text-[10px] font-bold text-cream ${bump ? "animate-pop" : ""}`}
          >
            {count}
          </span>
        )}
      </span>
    </button>
  );
}

function useNavLinks() {
  const { status } = useSale();
  const links = [
    { href: "/shop?g=women", label: "Shop Women" },
    { href: "/shop?g=men-unisex", label: "Men & Unisex" },
  ];
  if (status === "live") links.push({ href: "/shop?sale=1", label: "Sale" });
  else if (status === "upcoming") links.push({ href: "/#sale", label: "Sale" });
  links.push({ href: "/#about", label: "About" });
  links.push({ href: "/track", label: "Track order" });
  return links;
}

export function Header() {
  const { data } = useStore();
  const [menu, setMenu] = useState(false);
  const close = useCallback(() => setMenu(false), []);
  const panelRef = useRef<HTMLDivElement>(null);
  useOverlay(menu, close, panelRef);
  const links = useNavLinks();
  const ig = `https://instagram.com/${data.settings.instagramHandle}`;
  const chat = () => openWhatsApp(data.settings.whatsappNumber, buildChatMessage());

  return (
    <>
      <header className="sticky top-0 z-30 border-hair bg-cream/95 backdrop-blur-md lg:border-b">
        <SaleBar />
        {/* Mobile */}
        <div className="grid grid-cols-[44px_1fr_44px] items-center border-b border-hair px-2.5 py-1.5 lg:hidden">
          <button type="button" onClick={() => setMenu(true)} aria-label="Menu" aria-expanded={menu} className="grid size-11 place-items-center">
            <MenuIcon size={22} />
          </button>
          <Link href="/" className="flex justify-center">
            <Logo size="sm" />
          </Link>
          <BagButton />
        </div>
        {/* Desktop */}
        <div className="mx-auto hidden max-w-[1240px] grid-cols-[1fr_auto_1fr] items-center gap-6 px-12 py-3 lg:grid">
          <nav className="flex gap-7 text-sm font-medium" aria-label="Main">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`border-b border-transparent py-1 transition-colors ${l.label === "Sale" ? "text-mercy hover:border-mercy" : "hover:border-gold"}`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <Link href="/">
            <Logo size="md" />
          </Link>
          <div className="flex items-center justify-end gap-3">
            <a href={ig} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="grid size-11 place-items-center hover:text-mercy">
              <InstagramIcon size={20} />
            </a>
            <button
              type="button"
              onClick={chat}
              className="flex h-10 items-center gap-2 rounded-full bg-wa px-4 text-[13px] font-semibold text-cocoa transition-colors hover:bg-[#3ee07a]"
            >
              <ChatIcon size={16} />
              Order on WhatsApp
            </button>
            <BagButton />
          </div>
        </div>
      </header>

      {/* Mobile menu drawer */}
      <Backdrop open={menu} onClick={close} z="z-50" />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        aria-hidden={!menu}
        inert={!menu}
        className={`fixed inset-y-0 left-0 z-50 flex w-[300px] max-w-[85vw] flex-col gap-4 bg-cream px-6 py-4 transition-transform duration-[350ms] ease-out-soft lg:hidden ${menu ? "translate-x-0" : "-translate-x-[102%]"}`}
      >
        <button type="button" onClick={close} aria-label="Close menu" className="-ml-2.5 grid size-11 place-items-center">
          <CloseIcon size={22} />
        </button>
        <nav className="flex flex-col font-serif text-[28px] font-semibold" aria-label="Mobile">
          <Link href="/" onClick={close} className="border-b border-hair py-3">
            Home
          </Link>
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={close} className={`border-b border-hair py-3 ${l.label === "Sale" ? "text-mercy" : ""}`}>
              {l.label}
            </Link>
          ))}
        </nav>
        <a href={ig} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-medium">
          <InstagramIcon size={18} />@{data.settings.instagramHandle}
        </a>
        <button
          type="button"
          onClick={chat}
          className="mt-auto flex h-[50px] items-center justify-center gap-2 rounded-full bg-wa text-[15px] font-semibold text-cocoa"
        >
          <ChatIcon size={20} />
          Chat on WhatsApp
        </button>
      </div>
    </>
  );
}

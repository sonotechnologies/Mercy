"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { markNavigation } from "@/lib/nav";
import { buildChatMessage, openWhatsApp } from "@/lib/whatsapp";
import { useCart } from "@/state/cart";
import { useStore } from "@/state/store";
import { ChatIcon } from "./icons";

/** Gold + red confetti burst and toast, once, when the free gift unlocks. */
export function GiftCelebration() {
  const { burst, cartOpen } = useCart();
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (!burst) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- start the timed burst
    setShown(burst);
    const t = setTimeout(() => setShown(0), 2600);
    return () => clearTimeout(t);
  }, [burst]);
  if (!shown) return null;
  return (
    <>
      <div
        key={"cf" + shown}
        data-confetti=""
        aria-hidden="true"
        className={`pointer-events-none fixed z-[70] size-0 ${cartOpen ? "top-[22%] left-1/2 lg:top-[18%] lg:right-[220px] lg:left-auto" : "top-[60px] right-8 lg:right-[max(70px,calc((100vw-1240px)/2+70px))]"}`}
      >
        {Array.from({ length: 24 }, (_, i) => {
          const a = (i / 24) * Math.PI * 2 + (i % 2) * 0.2;
          const dist = 50 + ((i * 37) % 60);
          return (
            <span
              key={i}
              className="absolute rounded-[2px]"
              style={
                {
                  width: i % 3 ? 6 : 8,
                  height: i % 3 ? 10 : 6,
                  background: ["#B8924A", "#B3202A", "#C89B6D"][i % 3],
                  "--dx": Math.round(Math.cos(a) * dist) + "px",
                  "--dy": Math.round(Math.sin(a) * dist + 50) + "px",
                  "--r": ((i * 47) % 360) + "deg",
                  animation: `mf-confetti 1.2s cubic-bezier(.15,.7,.3,1) ${i * 10}ms forwards`,
                } as React.CSSProperties
              }
            />
          );
        })}
      </div>
      {!cartOpen && (
        <div role="status" className="fixed top-[104px] left-1/2 z-[70] -translate-x-1/2 rounded-full bg-cocoa px-[18px] py-2.5 text-sm font-semibold whitespace-nowrap text-cream shadow-[0_8px_24px_rgba(43,31,26,.2)]">
          Free gift unlocked 🎁
        </div>
      )}
    </>
  );
}

/** "Chat with us" pill on every storefront page. Collapses to an icon once you scroll on phones. */
export function FloatingWhatsApp() {
  const { data } = useStore();
  const pathname = usePathname();
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 240);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);
  const onProduct = pathname.startsWith("/shop/");
  if (pathname.startsWith("/admin") || pathname === "/cart") return null;
  return (
    <button
      type="button"
      onClick={() => openWhatsApp(data.settings.whatsappNumber, buildChatMessage())}
      className={`fixed right-4 z-20 h-12 items-center justify-center gap-2 overflow-hidden rounded-full bg-wa text-sm font-semibold whitespace-nowrap text-cocoa shadow-[0_8px_24px_rgba(43,31,26,.18)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#3ee07a] lg:right-6 lg:bottom-6 lg:w-auto lg:pr-4 lg:pl-3.5 ${
        compact ? "w-12 px-0" : "w-[136px] pr-4 pl-3.5"
      } ${onProduct ? "hidden lg:flex" : "flex bottom-[calc(16px+env(safe-area-inset-bottom))]"}`}
    >
      <ChatIcon size={20} className="flex-none" />
      <span className={compact ? "sr-only lg:not-sr-only" : ""}>Chat with us</span>
      <span className="sr-only"> on WhatsApp</span>
    </button>
  );
}

/** "Added to bag" confirmation with a shortcut to the bag. */
export function AddedToast() {
  const { lastAdded, dismissAdded, openCart, cartOpen } = useCart();
  const { getProduct } = useStore();
  const pathname = usePathname();
  useEffect(() => {
    if (!lastAdded) return;
    const t = setTimeout(dismissAdded, 3500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restart the timer for each add
  }, [lastAdded?.n]);
  const p = lastAdded ? getProduct(lastAdded.productId) : undefined;
  const show = !!(lastAdded && p && !cartOpen);
  const img = p ? (p.colours[lastAdded!.colour]?.image ?? p.images[0]) : "";
  const onProduct = pathname.startsWith("/shop/");
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-x-3 z-[65] mx-auto max-w-[420px] transition-all duration-300 ease-out-soft lg:inset-x-auto lg:top-[120px] lg:right-6 lg:bottom-auto lg:w-[380px] ${
        onProduct ? "bottom-[92px]" : "bottom-[calc(76px+env(safe-area-inset-bottom))]"
      } ${show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"}`}
    >
      {show && p && (
        <div className="flex items-center gap-3 rounded-2xl bg-cocoa p-2.5 pr-3 text-cream shadow-[0_12px_32px_rgba(43,31,26,.28)]">
          <span className="relative h-14 w-11 flex-none overflow-hidden rounded-lg bg-sand">
            <Image src={img} alt="" fill sizes="44px" unoptimized={img.startsWith("data:")} className="object-cover" />
          </span>
          <span className="min-w-0 flex-1 text-sm leading-tight">
            <span className="block font-semibold">Added to bag</span>
            <span className="block truncate text-cream/75">
              {p.name} · EU {lastAdded!.size}
              {lastAdded!.qty > 1 ? ` · x${lastAdded!.qty}` : ""}
            </span>
          </span>
          <button type="button" onClick={openCart} className="h-9 flex-none rounded-full bg-cream px-3.5 text-[13px] font-semibold text-cocoa hover:bg-white">
            View bag
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Adds data-reveal="in" as elements scroll into view (staggered via --reveal-delay).
 * One observer for the whole visit: re-creating it on navigation dropped cards that
 * mounted mid-transition, leaving them invisible.
 */
export function RevealObserver() {
  useEffect(() => {
    document.documentElement.classList.add("js");
    if (!("IntersectionObserver" in window)) {
      document.documentElement.classList.remove("js");
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).dataset.reveal = "in";
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.12, rootMargin: "0px 0px -20px 0px" },
    );
    // observe() is a no-op for elements already being watched, so re-scanning is safe.
    const scan = () => document.querySelectorAll<HTMLElement>('[data-reveal=""]').forEach((el) => io.observe(el));
    scan();
    let queued = false;
    const mo = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        scan();
      });
    });
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-reveal"] });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);
  return null;
}

/** Records each route change (see lib/nav). */
export function NavTracker() {
  const pathname = usePathname();
  useEffect(() => {
    markNavigation();
  }, [pathname]);
  return null;
}

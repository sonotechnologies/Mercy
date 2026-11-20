"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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

/** "Chat with us" pill on every storefront page. */
export function FloatingWhatsApp() {
  const { data } = useStore();
  const pathname = usePathname();
  const onProduct = pathname.startsWith("/shop/");
  if (pathname.startsWith("/admin") || pathname === "/cart") return null;
  return (
    <button
      type="button"
      onClick={() => openWhatsApp(data.settings.whatsappNumber, buildChatMessage())}
      aria-label="Chat with us on WhatsApp"
      className={`fixed right-4 z-20 h-12 items-center gap-2 rounded-full bg-wa pr-4 pl-3.5 text-sm font-semibold text-cocoa shadow-[0_8px_24px_rgba(43,31,26,.18)] transition-transform hover:-translate-y-0.5 lg:right-6 lg:bottom-6 ${
        onProduct ? "hidden lg:flex" : "flex bottom-[calc(16px+env(safe-area-inset-bottom))]"
      }`}
    >
      <ChatIcon size={20} />
      Chat with us
    </button>
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

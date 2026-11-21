"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ChatIcon } from "./icons";

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Overlay behaviour for sheets, drawers and modals: locks page scroll, closes on
 * Escape, moves focus into the panel, keeps Tab inside it, and returns focus to
 * whatever opened it when it closes.
 */
export function useOverlay(open: boolean, onClose: () => void, panel?: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusFirst = requestAnimationFrame(() => {
      const el = panel?.current;
      if (!el || el.contains(document.activeElement)) return;
      const target = el.querySelector<HTMLElement>("[data-autofocus]") ?? el.querySelector<HTMLElement>(FOCUSABLE);
      (target ?? el).focus({ preventScroll: true });
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      const el = panel?.current;
      if (e.key !== "Tab" || !el) return;
      const items = [...el.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((x) => x.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(focusFirst);
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    };
  }, [open, onClose, panel]);
}

export function Backdrop({ open, onClick, z = "z-40" }: { open: boolean; onClick: () => void; z?: string }) {
  return (
    <div
      onClick={onClick}
      aria-hidden="true"
      className={`fixed inset-0 ${z} bg-cocoa/40 transition-opacity duration-300 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
    />
  );
}

const BTN = {
  primary: "bg-cocoa text-cream hover:bg-mercy",
  outline: "border border-cocoa bg-transparent text-cocoa hover:bg-cocoa hover:text-cream",
  sale: "bg-mercy text-cream hover:bg-[#8f1921]",
  wa: "bg-wa text-cocoa hover:bg-[#3ee07a]",
  cream: "bg-cream text-cocoa hover:bg-white",
} as const;

type BtnProps = {
  variant?: keyof typeof BTN;
  className?: string;
  children: React.ReactNode;
} & ({ href: string; external?: boolean } | ({ href?: undefined } & React.ButtonHTMLAttributes<HTMLButtonElement>));

export function Button({ variant = "primary", className = "", children, ...rest }: BtnProps) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${BTN[variant]} ${className}`;
  if ("href" in rest && rest.href) {
    const { href, external } = rest;
    return external ? (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
      </a>
    ) : (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  const { href: _h, ...btn } = rest as React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
  void _h;
  return (
    <button type="button" className={cls} {...btn}>
      {children}
    </button>
  );
}

export function WaButton({ onClick, children, className = "", size = 20 }: { onClick: () => void; children?: React.ReactNode; className?: string; size?: number }) {
  return (
    <Button variant="wa" onClick={onClick} className={className}>
      <ChatIcon size={size} />
      {children}
    </Button>
  );
}

export function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`text-[11px] font-semibold tracking-[.18em] text-ochre lg:text-xs ${className}`}>{children}</span>;
}

export function Hairline({ className = "" }: { className?: string }) {
  return <div className={`h-px bg-hair ${className}`} />;
}

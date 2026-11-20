"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ChatIcon } from "./icons";

/** Locks page scroll while an overlay is open and closes it on Escape. */
export function useOverlay(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);
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

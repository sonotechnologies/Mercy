"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { adminSession, adminSignIn, adminSignOut, hasSupabase, listOrders } from "@/lib/backend/client";
import { saleStatus } from "@/lib/sale";
import { readWhatsAppClicks } from "@/lib/whatsapp";
import { useNow } from "@/state/sale";
import { useStore } from "@/state/store";
import { ExternalIcon, LockIcon } from "../icons";
import { LogoMark } from "../logo";
import { OrdersTab } from "./orders";
import { ProductsTab } from "./products";
import { SaleTab } from "./sale";
import { SettingsTab } from "./settings";
import { card, input, labelCls, primaryBtn } from "./ui";

/** Demo passcode (demo mode only). Shared on the pitch call, never shown on the site. */
const PASSCODE = "mercy2026";
const AUTH_KEY = "mf.admin";

function Gate({ onOk }: { onOk: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setErr(null);
    if (!hasSupabase) {
      if (code.trim().toLowerCase() === PASSCODE) {
        try {
          sessionStorage.setItem(AUTH_KEY, "1");
        } catch {
          /* ignore */
        }
        onOk("");
      } else setErr("That passcode isn't right.");
      return;
    }
    setBusy(true);
    try {
      const s = await adminSignIn(email, code);
      onOk(s?.email ?? email);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-dvh place-items-center bg-cream px-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className={`${card} flex w-full max-w-sm flex-col gap-4 p-6`}
      >
        <div className="grid size-12 place-items-center rounded-xl bg-cocoa">
          <LogoMark width={30} tone="monogram" />
        </div>
        <div>
          <h1 className="font-serif text-3xl font-semibold">Mercy admin</h1>
          <p className="text-sm text-muted">{hasSupabase ? "Sign in to manage orders, products and settings." : "Enter the passcode to manage orders, products and settings."}</p>
        </div>
        {hasSupabase && (
          <label className={labelCls}>
            Email
            <input type="email" autoFocus autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
          </label>
        )}
        <label className={labelCls}>
          {hasSupabase ? "Password" : "Passcode"}
          <input
            type="password"
            autoFocus={!hasSupabase}
            autoComplete="current-password"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setErr(null);
            }}
            className={input}
          />
        </label>
        {err && (
          <span className="text-[13px] text-mercy" role="alert">
            {err}
          </span>
        )}
        <button type="submit" disabled={busy} className={primaryBtn}>
          <LockIcon size={16} />
          {busy ? "Signing in…" : hasSupabase ? "Sign in" : "Unlock"}
        </button>
        <Link href="/" className="text-center text-sm text-muted hover:text-cocoa">
          ← Back to the store
        </Link>
      </form>
    </div>
  );
}

type Tab = "orders" | "products" | "sale" | "settings";

export function AdminApp() {
  const { products, data, ready, mode } = useStore();
  const [auth, setAuth] = useState<{ email: string } | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>("orders");
  const [clicks, setClicks] = useState(0);
  const [newOrders, setNewOrders] = useState(0);
  const now = useNow() ?? 0;

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read browser-only state after mount
    setClicks(readWhatsAppClicks());
    if (hasSupabase) {
      adminSession()
        .then((s) => !cancelled && setAuth(s))
        .catch(() => !cancelled && setAuth(null));
    } else {
      try {
        setAuth(sessionStorage.getItem(AUTH_KEY) === "1" ? { email: "" } : null);
      } catch {
        setAuth(null);
      }
    }
    return () => {
      cancelled = true;
    };
  }, []);

  // Badge count for new orders, also while on other tabs.
  useEffect(() => {
    if (!auth) return;
    const tick = () =>
      listOrders()
        .then((l) => setNewOrders(l.filter((o) => o.status === "received").length))
        .catch(() => undefined);
    void tick();
    const t = setInterval(tick, 60000);
    return () => clearInterval(t);
  }, [auth]);

  const onCount = useCallback((n: number) => setNewOrders(n), []);

  const stats = useMemo(
    () => [
      { label: "New orders", value: String(newOrders), alert: newOrders > 0 },
      { label: "Products", value: String(products.length) },
      { label: "Sale", value: { off: "Off", upcoming: "Scheduled", live: "Live", ended: "Ended" }[saleStatus(data.sale, now)] },
      { label: "WhatsApp taps", value: String(clicks), hint: "this device" },
    ],
    [products, data.sale, clicks, now, newOrders],
  );

  if (auth === undefined || !ready) return <div className="min-h-dvh bg-cream" />;
  if (!auth) return <Gate onOk={(email) => setAuth({ email })} />;

  const tabs: [Tab, string][] = [
    ["orders", "Orders"],
    ["products", "Products"],
    ["sale", "Sale"],
    ["settings", "Settings"],
  ];

  return (
    <div className="min-h-dvh bg-cream">
      <header className="sticky top-0 z-30 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-hair bg-cream/95 px-5 py-3 backdrop-blur-md lg:px-7">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-[10px] bg-cocoa">
            <LogoMark width={24} tone="monogram" />
          </span>
          <span className="font-semibold">Mercy Footwears · Admin</span>
        </Link>
        <nav className="order-last flex w-full gap-1 sm:order-none sm:ml-auto sm:w-auto" aria-label="Admin sections">
          {tabs.map(([k, label]) => (
            <button
              key={k}
              type="button"
              aria-current={tab === k ? "page" : undefined}
              onClick={() => setTab(k)}
              className={`relative flex h-[38px] flex-1 items-center justify-center gap-1.5 rounded-full px-3.5 text-sm font-medium sm:flex-none ${tab === k ? "bg-cocoa text-cream" : "hover:bg-sand"}`}
            >
              {label}
              {k === "orders" && newOrders > 0 && (
                <span className="tabular grid h-5 min-w-5 place-items-center rounded-full bg-mercy px-1 text-[11px] font-bold text-cream" aria-label={`${newOrders} new`}>
                  {newOrders}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm text-muted sm:ml-0">
          <Link href="/" target="_blank" className="hidden items-center gap-1 hover:text-cocoa md:flex">
            View store <ExternalIcon size={14} />
          </Link>
          <button
            type="button"
            onClick={async () => {
              await adminSignOut();
              try {
                sessionStorage.removeItem(AUTH_KEY);
              } catch {
                /* ignore */
              }
              setAuth(null);
            }}
            className="hover:text-cocoa"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="mx-auto flex max-w-[1180px] flex-col gap-6 px-5 pt-6 pb-16 lg:px-7 lg:pt-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className={`${card} px-4 py-3 ${s.alert ? "border-mercy/50" : ""}`}>
              <span className="block text-xs font-semibold tracking-[.06em] text-muted">{s.label.toUpperCase()}</span>
              <span className={`tabular font-serif text-3xl font-semibold ${s.alert ? "text-mercy" : ""}`}>{s.value}</span>
              {s.hint && <span className="ml-1.5 text-xs text-muted">{s.hint}</span>}
            </div>
          ))}
        </div>
        {tab === "orders" ? <OrdersTab onCount={onCount} /> : tab === "products" ? <ProductsTab /> : tab === "sale" ? <SaleTab /> : <SettingsTab />}
        <p className="text-xs text-muted">
          {mode === "supabase"
            ? `Signed in as ${auth.email}. Changes are saved to the database and show on the store straight away.`
            : "Demo mode: changes and orders are saved in this browser only. Connect Supabase to share them across devices."}
        </p>
      </main>
    </div>
  );
}

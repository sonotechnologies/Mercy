"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { listOrders, setOrderStatus } from "@/lib/backend/client";
import { naira, displayPhone, normalisePhone } from "@/lib/format";
import { customerUpdateMessage, niceDate, STATUS_LABEL, STATUS_OPTIONS, statusTone } from "@/lib/orders";
import type { Order, OrderStatus } from "@/lib/types";
import { trackWhatsAppClick, waLink } from "@/lib/whatsapp";
import { useStore } from "@/state/store";
import { ChatIcon, ChevronDownIcon, StoreIcon, TruckIcon } from "../icons";
import { card, ghostBtn, Thumb } from "./ui";

type Filter = "open" | "all" | OrderStatus;

const OPEN: OrderStatus[] = ["received", "confirmed", "in-production", "ready", "out-for-delivery"];

const when = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const same = d.toDateString() === today.toDateString();
  return same
    ? `Today, ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lagos" })}`
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Africa/Lagos" });
};

function StatusSelect({ order, onChange, busy }: { order: Order; onChange: (s: OrderStatus) => void; busy: boolean }) {
  const tone = statusTone(order.status);
  return (
    <select
      value={order.status}
      disabled={busy}
      onChange={(e) => onChange(e.target.value as OrderStatus)}
      aria-label={`Status of ${order.ref}`}
      className="h-9 rounded-full border px-3 text-[13px] font-semibold disabled:opacity-60"
      style={{ background: tone.bg, color: tone.fg, borderColor: tone.border }}
    >
      {STATUS_OPTIONS.filter((s) => (order.fulfilment === "pickup" ? s !== "out-for-delivery" : s !== "ready")).map((s) => (
        <option key={s} value={s}>
          {STATUS_LABEL[s]}
        </option>
      ))}
    </select>
  );
}

function OrderRow({ order, onStatus, busy }: { order: Order; onStatus: (s: OrderStatus) => void; busy: boolean }) {
  const { data } = useStore();
  const [open, setOpen] = useState(false);
  const pairs = order.items.reduce((a, i) => a + i.qty, 0);
  const notify = waLink(normalisePhone(order.phone), customerUpdateMessage(order, data.settings));
  return (
    <li className="border-t border-gold/30 first:border-t-0">
      <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 px-4 py-3.5 lg:grid-cols-[110px_minmax(0,1.3fr)_minmax(0,1fr)_110px_120px_auto] lg:gap-4">
        <button type="button" onClick={() => setOpen((x) => !x)} aria-expanded={open} className="col-start-1 row-start-1 flex items-center gap-2 text-left lg:col-auto lg:row-auto lg:block">
          <span className="tabular block font-semibold">{order.ref}</span>
          <span className="text-xs text-muted">{when(order.createdAt)}</span>
          <ChevronDownIcon size={16} className={`text-muted transition-transform lg:hidden ${open ? "rotate-180" : ""}`} />
        </button>
        <div className="col-span-2 col-start-1 row-start-2 min-w-0 lg:col-span-1 lg:col-auto lg:row-auto">
          <span className="block truncate font-medium">{order.name}</span>
          <span className="tabular text-xs text-muted">{displayPhone(normalisePhone(order.phone))}</span>
        </div>
        <div className="col-span-2 col-start-1 row-start-3 min-w-0 text-sm lg:col-span-1 lg:col-auto lg:row-auto">
          <span className="line-clamp-2">
            {order.items.map((i) => `${i.name} (${i.size})${i.qty > 1 ? ` ×${i.qty}` : ""}`).join(", ")}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted">
            {order.fulfilment === "pickup" ? <StoreIcon size={13} /> : <TruckIcon size={13} />}
            {order.fulfilment === "pickup" ? "Pickup" : `Delivery · ${order.state || order.city}`} · ready {niceDate(order.expectedReady)}
          </span>
        </div>
        <span className="tabular col-start-2 row-start-1 text-right font-semibold lg:col-auto lg:row-auto">
          {naira(order.subtotal)}
          <span className="block text-xs font-normal text-muted">
            {pairs} {pairs === 1 ? "pair" : "pairs"}
            {order.giftUnlocked ? " · 🎁" : ""}
          </span>
        </span>
        <div className="col-start-1 row-start-4 lg:col-auto lg:row-auto">
          <StatusSelect order={order} onChange={onStatus} busy={busy} />
        </div>
        <a
          href={notify}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackWhatsAppClick()}
          className="col-start-2 row-start-4 inline-flex h-9 items-center justify-center gap-1.5 justify-self-end rounded-full bg-wa px-3.5 text-[13px] font-semibold whitespace-nowrap text-cocoa hover:bg-[#3ee07a] lg:col-auto lg:row-auto"
          title="Opens WhatsApp with an update for this status"
        >
          <ChatIcon size={15} />
          Notify
        </a>
      </div>
      {open && (
        <div className="grid gap-4 bg-sand/50 px-4 py-4 text-sm lg:grid-cols-2">
          <ul className="flex flex-col gap-2">
            {order.items.map((i, k) => (
              <li key={k} className="flex items-center gap-3">
                <Thumb src={i.image} className="h-12 w-10" />
                <span className="flex-1">
                  <span className="block font-medium">{i.name}</span>
                  <span className="text-muted">
                    {i.colour} · EU {i.size} · x{i.qty} · {naira(i.unitPrice)} each
                  </span>
                </span>
                <span className="tabular font-semibold">{naira(i.total)}</span>
              </li>
            ))}
          </ul>
          <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-1.5">
            <dt className="text-muted">Fulfilment</dt>
            <dd>{order.fulfilment === "pickup" ? "Pickup" : [order.address, order.city, order.state].filter(Boolean).join(", ")}</dd>
            <dt className="text-muted">Expected ready</dt>
            <dd>{niceDate(order.expectedReady)}</dd>
            {order.fullTotal > order.subtotal && (
              <>
                <dt className="text-muted">Sale saving</dt>
                <dd className="tabular">{naira(order.fullTotal - order.subtotal)}</dd>
              </>
            )}
            {order.note && (
              <>
                <dt className="text-muted">Note</dt>
                <dd>{order.note}</dd>
              </>
            )}
            <dt className="text-muted">Customer</dt>
            <dd>
              <a href={waLink(normalisePhone(order.phone), `Hi ${order.name.split(" ")[0]}, this is Mercy Footwears about your order ${order.ref}.`)} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                Message on WhatsApp
              </a>
            </dd>
          </dl>
        </div>
      )}
    </li>
  );
}

export function OrdersTab({ onCount }: { onCount: (n: number) => void }) {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("open");
  const [busyRef, setBusyRef] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    try {
      const list = await listOrders();
      setOrders(list);
      setError(null);
      onCount(list.filter((o) => o.status === "received").length);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [onCount]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch, then poll
    void load();
    const t = setInterval(load, 30000);
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(t);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders?.length ?? 0, open: 0 };
    orders?.forEach((o) => {
      c[o.status] = (c[o.status] ?? 0) + 1;
      if (OPEN.includes(o.status)) c.open++;
    });
    return c;
  }, [orders]);

  const shown = (orders ?? []).filter((o) => {
    const okFilter = filter === "all" ? true : filter === "open" ? OPEN.includes(o.status) : o.status === filter;
    const needle = q.trim().toLowerCase();
    const okQ = !needle || `${o.ref} ${o.name} ${o.phone}`.toLowerCase().includes(needle);
    return okFilter && okQ;
  });

  const changeStatus = async (o: Order, status: OrderStatus) => {
    setBusyRef(o.ref);
    const prev = orders;
    setOrders((list) => list?.map((x) => (x.ref === o.ref ? { ...x, status } : x)) ?? null);
    try {
      await setOrderStatus(o.ref, status);
      onCount((orders ?? []).filter((x) => (x.ref === o.ref ? status : x.status) === "received").length);
    } catch (e) {
      setOrders(prev);
      setError((e as Error).message);
    } finally {
      setBusyRef(null);
    }
  };

  const chips: { id: Filter; label: string }[] = [
    { id: "open", label: "Open" },
    { id: "received", label: "New" },
    { id: "confirmed", label: "Confirmed" },
    { id: "in-production", label: "In production" },
    { id: "ready", label: "Ready" },
    { id: "out-for-delivery", label: "Out for delivery" },
    { id: "completed", label: "Completed" },
    { id: "cancelled", label: "Cancelled" },
    { id: "all", label: "All" },
  ];

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-serif text-4xl font-semibold">Orders</h1>
        <div className="flex w-full gap-2 sm:w-auto">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ref, name, phone" aria-label="Search orders" className="h-10 min-w-0 flex-1 rounded-full border border-cocoa/15 bg-white px-4 text-base outline-none focus:border-gold sm:w-56 sm:flex-none lg:text-sm" />
          <button type="button" onClick={() => void load()} className={`${ghostBtn} h-10 px-4`}>
            Refresh
          </button>
        </div>
      </div>
      <div className="no-scrollbar -mx-5 flex gap-1.5 overflow-x-auto px-5" role="tablist" aria-label="Filter orders">
        {chips.map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={filter === c.id}
            onClick={() => setFilter(c.id)}
            className={`flex h-9 flex-none items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium ${
              filter === c.id ? "border-cocoa bg-cocoa text-cream" : "border-cocoa/15 hover:border-cocoa"
            }`}
          >
            {c.label}
            {(counts[c.id] ?? 0) > 0 && (
              <span className={`tabular rounded-full px-1.5 text-[11px] font-bold ${c.id === "received" ? "bg-mercy text-cream" : filter === c.id ? "bg-cream/20" : "bg-sand"}`}>
                {counts[c.id]}
              </span>
            )}
          </button>
        ))}
      </div>
      {error && (
        <p className="rounded-xl border border-mercy/40 px-4 py-3 text-sm text-mercy" role="alert">
          {error}
        </p>
      )}
      <div className={`${card} overflow-hidden`}>
        <div className="hidden grid-cols-[110px_minmax(0,1.3fr)_minmax(0,1fr)_110px_120px_auto] gap-4 border-b border-gold/30 px-4 py-3 text-xs font-semibold tracking-[.06em] text-muted lg:grid">
          <span>ORDER</span>
          <span>CUSTOMER</span>
          <span>ITEMS</span>
          <span className="text-right">TOTAL</span>
          <span>STATUS</span>
          <span />
        </div>
        {orders === null ? (
          <p className="px-4 py-10 text-center text-muted">Loading orders…</p>
        ) : shown.length ? (
          <ul>
            {shown.map((o) => (
              <OrderRow key={o.ref} order={o} busy={busyRef === o.ref} onStatus={(s) => void changeStatus(o, s)} />
            ))}
          </ul>
        ) : (
          <p className="px-4 py-10 text-center text-muted">{orders.length ? "No orders match this filter." : "No orders yet. They'll appear here as soon as customers place them."}</p>
        )}
      </div>
      <p className="text-xs text-muted">
        Change the status, then tap <strong>Notify</strong> to send the customer a ready-made WhatsApp update. Customers can follow progress on the Track order page.
      </p>
    </>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { naira, shortDate } from "@/lib/format";
import { hasInternalHistory } from "@/lib/nav";
import { isMadeToOrder, productionTimeOf } from "@/lib/orders";
import { buildSingleItemMessage, openWhatsApp } from "@/lib/whatsapp";
import { useCart } from "@/state/cart";
import { useSale } from "@/state/sale";
import { useStore } from "@/state/store";
import { ChatIcon, CheckIcon, ChevronLeftIcon, ClockIcon, GiftIcon, HammerIcon, RulerIcon, ShareIcon, StoreIcon, TruckIcon } from "./icons";
import { ColourPicker, QtyStepper, SizePicker } from "./pickers";
import { Badges, Price, ProductCard } from "./product-card";
import { ProductImage } from "./product-image";
import { SizeGuide } from "./size-guide";

type Slide = { src: string; fit: "cover" | "contain"; scale: number; origin: string; focus?: string };

export function ProductView({ slug }: { slug: string }) {
  const { getProduct, products, ready, data } = useStore();
  const { sale, status, giftMin, priceOf } = useSale();
  const { add } = useCart();
  const product = getProduct(slug);

  const [colour, setColour] = useState(0);
  const [size, setSize] = useState<number | null>(null);
  const [qty, setQty] = useState(1);
  const [hint, setHint] = useState(false);
  const [slide, setSlide] = useState(0);
  const [guide, setGuide] = useState(false);
  const [added, setAdded] = useState(false);
  const [shared, setShared] = useState(false);
  const router = useRouter();
  const gallery = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1500);
    return () => clearTimeout(t);
  }, [added]);

  useEffect(() => {
    if (!shared) return;
    const t = setTimeout(() => setShared(false), 2000);
    return () => clearTimeout(t);
  }, [shared]);

  if (!product) {
    if (!ready) return <div className="h-[80vh]" />;
    return (
      <div className="flex flex-col items-center gap-4 px-5 py-24 text-center">
        <h1 className="font-serif text-4xl font-semibold">We couldn&apos;t find that pair.</h1>
        <p className="text-muted">It may have sold out or been renamed.</p>
        <Link href="/shop" className="grid h-12 place-items-center rounded-full bg-cocoa px-7 font-semibold text-cream hover:bg-mercy">
          Back to shop
        </Link>
      </div>
    );
  }

  const main = product.colours[colour]?.image ?? product.images[0];
  const extra = product.images.filter((src) => src !== main);
  // One real still per product: add a close-up crop and a full view so the gallery has depth.
  const slides: Slide[] = [
    { src: main, fit: "cover", scale: 1, origin: "50% 50%", focus: product.focus },
    ...extra.map((src) => ({ src, fit: "cover" as const, scale: 1, origin: "50% 50%" })),
    ...(extra.length ? [] : [{ src: main, fit: "cover" as const, scale: 1.6, origin: "50% 62%" }]),
    { src: main, fit: "contain", scale: 1, origin: "50% 50%" },
  ];

  const pickColour = (i: number) => {
    setColour(i);
    setSlide(0);
    gallery.current?.scrollTo({ left: 0, behavior: "smooth" });
  };
  const goSlide = (i: number) => {
    setSlide(i);
    const g = gallery.current;
    if (g) g.scrollTo({ left: i * g.clientWidth, behavior: "smooth" });
  };

  const addToBag = () => {
    if (size == null) {
      setHint(true);
      return;
    }
    add(product.id, colour, size, qty);
    setAdded(true);
  };
  const orderNow = () => {
    if (size == null) {
      setHint(true);
      return;
    }
    const unit = priceOf(product);
    openWhatsApp(
      data.settings.whatsappNumber,
      buildSingleItemMessage(
        { name: product.name, colour: product.colours[colour]?.name ?? "", size, qty, total: unit * qty },
        { sale, status, giftMin },
        mto ? `🧵 Made to order · ready in ${prodTime}` : undefined,
      ),
    );
  };

  const goBack = () => {
    // Go back if the visitor came from within the store, otherwise open the shop.
    if (hasInternalHistory()) router.back();
    else router.push(`/shop?g=${product.gender}`);
  };
  const share = async () => {
    const url = location.href;
    const text = `${product.name} from Mercy Footwears, ${naira(priceOf(product))}`;
    try {
      if (navigator.share) await navigator.share({ title: product.name, text, url });
      else {
        await navigator.clipboard.writeText(url);
        setShared(true);
      }
    } catch {
      /* cancelled */
    }
  };

  const related = products
    .filter((p) => p.id !== product.id && p.gender === product.gender)
    .sort((a, b) => Number(b.style === product.style) - Number(a.style === product.style) || Number(b.isBestseller) - Number(a.isBestseller))
    .slice(0, 4);

  const mto = isMadeToOrder(product, data.settings);
  const prodTime = productionTimeOf(product, data.settings);
  const addLabel = !product.inStock ? "Unavailable" : added ? "Added to bag ✓" : "Add to bag";

  const slideImg = (s: Slide, i: number, sizes: string) => (
    <ProductImage
      src={s.src}
      alt={i === 0 ? `${product.name}, ${product.colours[colour]?.name}` : ""}
      sizes={sizes}
      priority={i === 0}
      fit={s.fit}
      focus={s.focus}
      style={{ transform: `scale(${s.scale})`, transformOrigin: s.origin }}
    />
  );

  return (
    <>
      <div className="lg:mx-auto lg:max-w-[1240px] lg:px-12">
        <div className="hidden pt-5 lg:block">
          <button type="button" onClick={goBack} className="inline-flex h-11 items-center gap-1.5 rounded-full border border-gold/60 pr-4 pl-2.5 text-sm font-medium hover:bg-sand">
            <ChevronLeftIcon size={18} />
            Back to shop
          </button>
        </div>

        <div className="lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start lg:gap-16 lg:pt-6 lg:pb-[72px]">
          {/* Gallery */}
          <div>
            {/* Mobile swipe */}
            <div className="relative lg:hidden">
              <div
                ref={gallery}
                onScroll={(e) => {
                  const g = e.currentTarget;
                  const i = Math.round(g.scrollLeft / g.clientWidth);
                  if (i !== slide) setSlide(i);
                }}
                className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
                aria-label="Product photos"
              >
                {slides.map((s, i) => (
                  <div key={i} className="relative aspect-[4/5] flex-[0_0_100%] snap-start overflow-hidden bg-sand">
                    {slideImg(s, i, "100vw")}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={goBack}
                aria-label="Back"
                className="absolute top-3.5 left-3.5 grid size-11 place-items-center rounded-full bg-cream/90 shadow-soft"
              >
                <ChevronLeftIcon />
              </button>
              <button
                type="button"
                onClick={share}
                aria-label={shared ? "Link copied" : "Share"}
                className="absolute top-3.5 right-3.5 grid size-11 place-items-center rounded-full bg-cream/90 shadow-soft"
              >
                {shared ? <CheckIcon size={20} /> : <ShareIcon size={20} />}
              </button>
              <span className="absolute top-[70px] left-3.5"><Badges product={product} inline /></span>
              <div className="absolute inset-x-0 bottom-2 flex justify-center">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Photo ${i + 1}`}
                    aria-current={i === slide}
                    onClick={() => goSlide(i)}
                    className="grid h-6 min-w-6 place-items-center px-[3px]"
                  >
                    <span
                      className="block h-1.5 rounded-full transition-[width] duration-250"
                      style={{ width: i === slide ? 18 : 6, background: i === slide ? "#2B1F1A" : "rgba(43,31,26,.28)" }}
                    />
                  </button>
                ))}
              </div>
            </div>
            {/* Desktop thumbs + main */}
            <div className="hidden grid-cols-[88px_minmax(0,1fr)] gap-4 lg:grid">
              <div className="flex flex-col gap-3">
                {slides.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Show photo ${i + 1}`}
                    aria-current={i === slide}
                    onClick={() => setSlide(i)}
                    className="relative aspect-[4/5] w-[88px] overflow-hidden rounded-xl border-[1.5px] bg-sand"
                    style={{ borderColor: i === slide ? "#B8924A" : "transparent" }}
                  >
                    {slideImg(s, i + 10, "88px")}
                  </button>
                ))}
              </div>
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-sand">
                {slideImg(slides[slide] ?? slides[0], 0, "(min-width:1240px) 560px, 45vw")}
                <Badges product={product} lg />
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col gap-5 px-5 pt-[22px] pb-7 lg:sticky lg:top-32 lg:gap-[22px] lg:px-0 lg:pt-2 lg:pb-0">
            <div className="flex flex-col gap-1.5 lg:gap-2">
              <span className="text-[11px] font-semibold tracking-[.18em] text-ochre lg:text-xs">
                {product.style.toUpperCase()}
                {product.gender === "men-unisex" ? " · MEN & UNISEX" : ""}
              </span>
              <div className="flex items-start justify-between gap-3">
                <h1 className="m-0 font-serif text-4xl leading-[1.05] font-semibold lg:text-[56px] lg:leading-none">{product.name}</h1>
                <button
                  type="button"
                  onClick={share}
                  className="mt-2 hidden h-10 flex-none items-center gap-1.5 rounded-full border border-gold/60 px-3.5 text-sm font-medium hover:bg-sand lg:flex"
                >
                  {shared ? <CheckIcon size={16} /> : <ShareIcon size={16} />}
                  {shared ? "Link copied" : "Share"}
                </button>
              </div>
              <div className="mt-0.5 flex items-center gap-2.5 lg:mt-1 lg:gap-3">
                <Price product={product} big />
                {!mto || !product.inStock ? (
                  <span className="ml-auto flex items-center gap-1.5 text-[13px] lg:text-sm">
                    <span className={`size-[7px] rounded-full ${product.inStock ? "bg-leaf" : "bg-tan"}`} />
                    {product.inStock ? "In stock" : "Unavailable"}
                  </span>
                ) : (
                  <span className="ml-auto rounded-full border border-gold px-2.5 py-0.5 text-[12px] font-semibold text-ochre">Made to order</span>
                )}
              </div>
              {mto && product.inStock && (
                <span className="mt-1.5 flex items-center gap-2 text-sm font-medium">
                  <ClockIcon size={17} className="text-gold" />
                  Ready in {prodTime}
                  {status === "live" && sale.deliveryStarts ? <span className="font-normal text-muted">· sale orders start {shortDate(sale.deliveryStarts)}</span> : null}
                </span>
              )}
              {giftMin != null && (
                <span className="mt-1 flex items-center gap-2 text-[13px] text-muted lg:text-sm">
                  <GiftIcon size={16} className="text-gold" />
                  Free gift when you order {giftMin} or more pairs
                </span>
              )}
            </div>
            <div className="h-px bg-hair" />
            <div className="flex flex-col gap-3">
              <span className="text-[13px] font-medium lg:text-sm">Colour · {product.colours[colour]?.name}</span>
              <ColourPicker product={product} value={colour} onChange={pickColour} />
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-[13px] font-medium lg:text-sm">
                <span>Size (EU)</span>
                {hint ? (
                  <span className="text-mercy" role="alert">
                    Please pick a size
                  </span>
                ) : (
                  <button type="button" onClick={() => setGuide(true)} className="flex items-center gap-1.5 border-b border-gold pb-px">
                    <RulerIcon size={15} />
                    Size guide
                  </button>
                )}
              </div>
              <SizePicker
                product={product}
                value={size}
                lg
                madeToOrder={mto}
                onChange={(z) => {
                  setSize(z);
                  setHint(false);
                }}
              />
              {hint && (
                <button type="button" onClick={() => setGuide(true)} className="flex items-center gap-1.5 self-start border-b border-gold pb-px text-[13px] font-medium">
                  <RulerIcon size={15} />
                  Size guide
                </button>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium lg:text-sm">Quantity</span>
              <QtyStepper value={qty} onChange={setQty} />
            </div>

            {/* Desktop CTAs */}
            <div className="hidden flex-col gap-3 lg:flex">
              <button
                type="button"
                onClick={addToBag}
                disabled={!product.inStock}
                className="h-14 rounded-full bg-cocoa text-base font-semibold text-cream transition-colors hover:bg-mercy disabled:opacity-50"
              >
                {addLabel}
              </button>
              <button
                type="button"
                onClick={orderNow}
                disabled={!product.inStock}
                className="flex h-14 items-center justify-center gap-2 rounded-full bg-wa text-[15px] font-semibold text-cocoa hover:bg-[#3ee07a] disabled:opacity-50"
              >
                <ChatIcon size={20} />
                Order on WhatsApp now
              </button>
            </div>

            {mto && product.inStock && <HowItWorks time={prodTime} pickup={data.settings.fulfilment.pickup} delivery={data.settings.fulfilment.delivery} />}
            <div className="h-px bg-hair" />
            <p className="m-0 text-pretty">{product.description}</p>
            <div className="flex flex-col gap-3 text-sm lg:text-[15px]">
              <div className="flex items-start gap-2.5">
                <TruckIcon size={18} className="mt-0.5 flex-none text-gold" />
                <span>
                  {data.settings.fulfilment.pickup && data.settings.fulfilment.delivery
                    ? "Pick up when it's ready, or have it delivered anywhere in Nigeria (fee confirmed on WhatsApp)."
                    : data.settings.fulfilment.pickup
                      ? "Pick up when it's ready. Location shared on WhatsApp."
                      : data.settings.deliveryNote}
                  {status === "live" && sale.deliveryStarts ? ` Sale orders go into production from ${shortDate(sale.deliveryStarts)}.` : ""}
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <ChatIcon size={18} strokeWidth={1.5} className="mt-0.5 flex-none text-gold" />
                <span>Not sure of your size? Message us and we&apos;ll help.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="border-t border-hair px-5 pt-10 pb-12 lg:mx-auto lg:max-w-[1240px] lg:px-12 lg:pt-16 lg:pb-24">
          <h2 className="m-0 font-serif text-[30px] leading-[1.1] font-semibold lg:text-[40px]">You may also like</h2>
          <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-6 lg:mt-6 lg:grid-cols-4 lg:gap-x-6">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} revealIndex={i} />
            ))}
          </div>
        </section>
      )}

      {/* Mobile sticky bar */}
      <div className="sticky bottom-0 z-20 flex gap-2.5 border-t border-hair bg-cream px-4 pt-3 pb-[calc(16px+env(safe-area-inset-bottom))] lg:hidden">
        <button
          type="button"
          onClick={addToBag}
          disabled={!product.inStock}
          className="h-[52px] flex-1 rounded-full bg-cocoa text-[15px] font-semibold text-cream transition-colors hover:bg-mercy disabled:opacity-50"
        >
          {addLabel}
          {product.inStock && !added && <span className="tabular font-normal opacity-80"> · {naira(priceOf(product) * qty)}</span>}
        </button>
        <button
          type="button"
          onClick={orderNow}
          disabled={!product.inStock}
          aria-label="Order on WhatsApp now"
          className="grid size-[52px] flex-none place-items-center rounded-full bg-wa text-cocoa disabled:opacity-50"
        >
          <ChatIcon size={22} />
        </button>
      </div>

      <SizeGuide open={guide} onClose={() => setGuide(false)} />
    </>
  );
}

/** Order → We make it → Ready for pickup or delivery */
function HowItWorks({ time, pickup, delivery }: { time: string; pickup: boolean; delivery: boolean }) {
  const last = pickup && delivery ? "Pickup or delivery" : pickup ? "Ready for pickup" : "Delivered to you";
  const steps = [
    { icon: ChatIcon, title: "You order", sub: "Confirm on WhatsApp" },
    { icon: HammerIcon, title: "We make it", sub: time },
    { icon: pickup ? StoreIcon : TruckIcon, title: last, sub: "We'll message you" },
  ];
  return (
    <div className="rounded-2xl bg-sand p-4">
      <span className="mb-3 block text-[11px] font-semibold tracking-[.16em] text-ochre">HOW MADE-TO-ORDER WORKS</span>
      <ol className="grid grid-cols-3 gap-2">
        {steps.map(({ icon: Icon, title, sub }, i) => (
          <li key={title} className="relative flex flex-col items-center gap-1.5 text-center">
            {i < 2 && <span className="absolute top-5 left-[calc(50%+24px)] h-px w-[calc(100%-48px)] bg-gold/50" aria-hidden="true" />}
            <span className="grid size-10 place-items-center rounded-full bg-cream text-gold">
              <Icon size={18} strokeWidth={1.5} />
            </span>
            <span className="text-[13px] leading-tight font-semibold">{title}</span>
            <span className="text-[12px] leading-tight text-muted">{sub}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

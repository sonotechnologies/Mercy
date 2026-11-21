"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { INSTAGRAM_TILES, STYLE_TILES } from "@/lib/seed";
import { buildChatMessage, buildNotifyMessage, openWhatsApp } from "@/lib/whatsapp";
import { useSale } from "@/state/sale";
import { useStore } from "@/state/store";
import { BigCountdown } from "./countdown";
import { BellIcon, ChatIcon, GemIcon, GiftIcon, HammerIcon, InstagramIcon, TruckIcon } from "./icons";
import { ProductCard } from "./product-card";

const H1 = "m-0 font-serif font-medium leading-[.95] tracking-[-.01em] text-[58px] lg:text-[92px] lg:leading-[.92]";
const H2 = "m-0 font-serif text-[30px] leading-[1.1] font-semibold lg:text-[40px]";
const btn = "grid h-[50px] place-items-center rounded-full text-[15px] font-semibold transition-colors lg:h-[54px] lg:px-[34px]";
const IMG_SIZES_HERO = "(min-width:1024px) 62vw, 100vw";

function HeroButtons({ light = false, className = "" }: { light?: boolean; className?: string }) {
  return (
    <div className={`flex gap-2.5 lg:gap-3 ${className}`}>
      <Link href="/shop?g=women" className={`${btn} flex-1 bg-cocoa text-cream hover:bg-mercy lg:flex-none`}>
        Shop Women
      </Link>
      <Link
        href="/shop?g=men-unisex"
        className={`${btn} flex-1 lg:flex-none ${light ? "bg-cream text-cocoa lg:border lg:border-cocoa lg:bg-transparent" : "border border-cocoa text-cocoa hover:bg-cocoa hover:text-cream"}`}
      >
        Shop Men
      </Link>
    </div>
  );
}

function Tagline({ center = false }: { center?: boolean }) {
  const { data } = useStore();
  return (
    <>
      <p className="m-0 text-base lg:text-[19px]">Your feet deserve the best.</p>
      {data.settings.madeToOrder && (
        <p className={`m-0 flex items-center gap-2 text-sm font-medium text-ochre lg:text-[15px] ${center ? "justify-center" : ""}`}>
          <HammerIcon size={16} />
          Every pair is handmade to order, just for you.
        </p>
      )}
    </>
  );
}

function HeroA() {
  return (
    <section className="relative lg:h-[640px] lg:overflow-hidden">
      <div className="relative h-[470px] overflow-hidden bg-sand lg:absolute lg:inset-y-0 lg:right-0 lg:h-auto lg:w-[62%]">
        <Image src="/products/mf-01.jpg" alt="Mercy Footwears H-slides held up in the shop" fill priority sizes={IMG_SIZES_HERO} className="object-cover" style={{ objectPosition: "50% 22%" }} />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(251,246,239,0)_38%,rgba(251,246,239,.82)_76%,#FBF6EF_100%)] lg:bg-[linear-gradient(90deg,#FBF6EF_0%,rgba(251,246,239,.75)_16%,rgba(251,246,239,0)_46%)]" />
      </div>
      <div className="relative -mt-[132px] flex flex-col gap-2 px-6 pb-2 lg:mx-auto lg:mt-0 lg:h-full lg:max-w-[1240px] lg:justify-center lg:gap-4 lg:px-12">
        <h1 className={H1}>Walk proud.</h1>
        <Tagline />
        <HeroButtons className="mt-3 lg:mt-4" />
      </div>
    </section>
  );
}

function HeroB() {
  return (
    <section className="flex flex-col gap-2 px-5 pt-7 pb-1 lg:mx-auto lg:grid lg:max-w-[1240px] lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-12 lg:pt-12 lg:pb-0">
      <div className="flex flex-col gap-2 lg:gap-3.5">
        <span className="text-[11px] font-semibold tracking-[.18em] text-ochre lg:text-xs">SLIDES FOR HER &amp; FOR HIM</span>
        <h1 className={H1}>Walk proud.</h1>
        <Tagline />
        <HeroButtons className="mt-4 hidden lg:flex" />
      </div>
      <div className="relative mt-4 aspect-[4/5] w-full overflow-hidden rounded-2xl bg-sand shadow-soft lg:mt-0 lg:max-w-[480px] lg:justify-self-end">
        <Image src="/products/mf-10.jpg" alt="A lineup of H-slides in red, plum, navy and black" fill priority sizes="(min-width:1024px) 480px, 100vw" className="object-cover" />
        <div className="pointer-events-none absolute inset-2.5 rounded-[10px] border border-cream/85 lg:inset-3" />
        <HeroButtons light className="absolute inset-x-[18px] bottom-[18px] lg:hidden" />
      </div>
    </section>
  );
}

function Arch({ src, h, focus, framed = false, className = "", priority = false }: { src: string; h: string; focus: string; framed?: boolean; className?: string; priority?: boolean }) {
  return (
    <div className={`relative overflow-hidden rounded-[999px_999px_16px_16px] bg-sand ${framed ? "border border-gold p-1 lg:p-[5px]" : ""} ${h} ${className}`}>
      <div className={`relative h-full w-full overflow-hidden ${framed ? "rounded-[999px_999px_12px_12px]" : ""}`}>
        <Image src={src} alt="" fill priority={priority} sizes="(min-width:1024px) 230px, 34vw" className="object-cover" style={{ objectPosition: focus }} />
      </div>
    </div>
  );
}

function HeroC() {
  return (
    <section className="flex flex-col items-center gap-2 px-5 pt-8 pb-1 text-center lg:mx-auto lg:max-w-[1240px] lg:gap-3 lg:px-12 lg:pt-14 lg:pb-0">
      <h1 className={`${H1} text-[60px]`}>Walk proud.</h1>
      <Tagline center />
      <HeroButtons className="order-last mt-[18px] w-full lg:order-none lg:mt-3.5 lg:w-auto" />
      <div className="mt-5 grid w-full grid-cols-[1fr_1.15fr_1fr] items-end gap-2 lg:mt-9 lg:grid-cols-5 lg:gap-4">
        <Arch src="/products/mf-13.jpg" h="h-[200px] lg:h-[300px]" focus="50% 70%" />
        <Arch src="/products/mf-04.jpg" h="h-[360px]" focus="50% 60%" className="hidden lg:block" />
        <Arch src="/products/mf-16.jpg" h="h-[260px] lg:h-[420px]" focus="50% 55%" framed priority />
        <Arch src="/products/mf-11.jpg" h="h-[360px]" focus="50% 55%" className="hidden lg:block" />
        <Arch src="/products/mf-04.jpg" h="h-[200px] lg:hidden" focus="50% 60%" />
        <Arch src="/products/mf-18.jpg" h="h-[300px]" focus="50% 60%" className="hidden lg:block" />
      </div>
    </section>
  );
}

function SaleCard() {
  const { status, sale } = useSale();
  const { data } = useStore();
  if (status !== "live" && status !== "upcoming") return null;
  const live = status === "live";
  const gift = `Free gift on orders above ${Math.max(0, sale.freeGiftMinPairs - 1)} pairs 🎁`;
  const cta = live ? (
    <Link href="/shop?sale=1" className="grid h-[46px] place-items-center rounded-full bg-mercy px-7 text-[15px] font-semibold text-cream hover:bg-[#8f1921] lg:h-12 lg:px-[30px]">
      Shop the sale
    </Link>
  ) : (
    <button
      type="button"
      onClick={() => openWhatsApp(data.settings.whatsappNumber, buildNotifyMessage(sale))}
      className="flex h-[46px] items-center gap-2 rounded-full bg-wa px-6 text-[15px] font-semibold text-cocoa hover:bg-[#3ee07a] lg:h-12"
    >
      <BellIcon size={18} />
      Get notified on WhatsApp
    </button>
  );
  return (
    <section id="sale" className="scroll-mt-28 px-5 pt-7 lg:mx-auto lg:max-w-[1240px] lg:px-12 lg:pt-16">
      <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-gold/40 bg-sand px-[18px] py-6 text-center lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center lg:gap-10 lg:px-12 lg:py-9 lg:text-left">
        <div className="flex flex-col items-center gap-1.5 lg:items-start">
          <span className="text-[11px] font-semibold tracking-[.18em] text-ochre lg:text-xs">{sale.title.toUpperCase()}</span>
          <span className="font-serif text-[30px] leading-[1.1] font-semibold lg:text-[40px] lg:leading-[1.05]">{sale.discountPercent}% off every pair</span>
          <span className="text-sm text-muted">{live ? "Ends in" : "Starts in"}</span>
        </div>
        <div className="mt-2 mb-1 lg:m-0">
          <div className="lg:hidden">
            <BigCountdown />
          </div>
          <div className="hidden lg:block">
            <BigCountdown size="lg" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-2.5 lg:items-end lg:gap-3 lg:text-right">
          <span className="mt-1 text-[15px] lg:mt-0 lg:text-base">{gift}</span>
          {cta}
        </div>
      </div>
    </section>
  );
}

function BestSellers() {
  const { products } = useStore();
  const [style, setStyle] = useState<string | null>(null);
  const ref = useRef<HTMLElement>(null);
  const women = products.filter((p) => p.gender === "women");
  const list = style ? products.filter((p) => p.style === style) : women.filter((p) => p.isBestseller).slice(0, 8);
  const pick = (name: string) => {
    setStyle((s) => (s === name ? null : name));
    requestAnimationFrame(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  return (
    <>
      <section className="pt-10 lg:mx-auto lg:max-w-[1240px] lg:px-12 lg:pt-20">
        <h2 className={`${H2} px-5 lg:px-0`}>Shop by style</h2>
        <div className="no-scrollbar flex gap-3.5 overflow-x-auto px-5 pt-4 pb-1 lg:grid lg:grid-cols-6 lg:gap-6 lg:overflow-visible lg:px-0 lg:pt-6">
          {STYLE_TILES.map((s) => (
            <button
              key={s.name}
              type="button"
              onClick={() => pick(s.name)}
              aria-pressed={style === s.name}
              className="group flex flex-none flex-col items-center gap-2 pt-[3px] text-[13px] font-medium lg:gap-3 lg:text-[15px]"
            >
              <span
                className="relative block size-[76px] overflow-hidden rounded-full border-[3px] border-cream bg-sand lg:aspect-square lg:size-auto lg:w-full lg:max-w-[150px] lg:border-4"
                style={{ boxShadow: style === s.name ? "0 0 0 2px #B8924A" : "0 0 0 1px rgba(184,146,74,.45)" }}
              >
                <Image src={s.image} alt="" fill sizes="(min-width:1024px) 150px, 76px" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" style={{ objectPosition: "50% 58%" }} />
              </span>
              <span>{s.name}</span>
            </button>
          ))}
        </div>
      </section>
      <section ref={ref} className="scroll-mt-28 px-5 pt-10 lg:mx-auto lg:max-w-[1240px] lg:px-12 lg:pt-20" aria-live="polite">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className={H2}>{style ?? "Bestsellers"}</h2>
          {style ? (
            <button type="button" onClick={() => setStyle(null)} className="border-b border-gold pb-0.5 text-[13px] font-medium lg:text-sm">
              Show all
            </button>
          ) : (
            <Link href="/shop?g=women" className="border-b border-gold pb-0.5 text-[13px] font-medium lg:text-sm">
              View all
            </Link>
          )}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-6 lg:mt-6 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-10">
          {list.map((p, i) => (
            <ProductCard key={p.id} product={p} revealIndex={i} />
          ))}
        </div>
      </section>
    </>
  );
}

function MenStrip() {
  const { products } = useStore();
  const men = products.filter((p) => p.gender === "men-unisex");
  if (!men.length) return null;
  return (
    <section className="pt-11 lg:mx-auto lg:max-w-[1240px] lg:px-12 lg:pt-[88px]">
      <div className="flex items-baseline justify-between gap-3 px-5 lg:px-0">
        <h2 className={H2}>Men &amp; Unisex</h2>
        <Link href="/shop?g=men-unisex" className="border-b border-gold pb-0.5 text-[13px] font-medium lg:text-sm">
          View all
        </Link>
      </div>
      <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pt-4 pb-1 lg:grid lg:grid-cols-5 lg:gap-6 lg:overflow-visible lg:px-0 lg:pt-6">
        {men.slice(0, 5).map((p, i) => (
          <ProductCard key={p.id} product={p} variant="strip" sizes="(min-width:1024px) 220px, 156px" revealIndex={i} />
        ))}
      </div>
    </section>
  );
}

function WhyMercy() {
  const { sale, status } = useSale();
  const { data } = useStore();
  const points = [
    { icon: GemIcon, label: "Quality you can feel" },
    data.settings.madeToOrder ? { icon: HammerIcon, label: "Made to order — crafted after you order" } : { icon: TruckIcon, label: "Nationwide delivery" },
    status === "live" || status === "upcoming"
      ? { icon: GiftIcon, label: `Free gift on ${sale.freeGiftMinPairs}+ pairs` }
      : { icon: ChatIcon, label: "Order in one WhatsApp tap" },
  ];
  return (
    <section className="mt-12 bg-sand lg:mt-24">
      <div className="px-5 py-9 lg:mx-auto lg:grid lg:max-w-[1240px] lg:grid-cols-[1.2fr_repeat(3,minmax(0,1fr))] lg:items-center lg:px-12 lg:py-14">
        <h2 className={`${H2} mb-[18px] lg:mb-0`}>Why Mercy</h2>
        {points.map(({ icon: Icon, label }, i) => (
          <div
            key={label}
            data-reveal=""
            style={{ "--reveal-delay": `${i * 70}ms` } as React.CSSProperties}
            className={`flex items-center gap-3.5 border-t border-hair py-3.5 lg:gap-4 lg:border-t-0 lg:border-l lg:border-gold/60 lg:px-7 lg:py-2 ${i === 2 ? "border-b lg:border-b-0" : ""}`}
          >
            <span className="grid size-11 flex-none place-items-center rounded-full bg-cream text-gold lg:size-[52px]">
              <Icon size={20} />
            </span>
            <span className="text-base font-medium lg:text-[17px]">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Instagram() {
  const { data } = useStore();
  const ig = `https://instagram.com/${data.settings.instagramHandle}`;
  return (
    <section className="px-5 pt-11 lg:mx-auto lg:max-w-[1240px] lg:px-12 lg:pt-[88px]">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className={H2}>On the shelf</h2>
        <a href={ig} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[13px] font-medium hover:text-mercy lg:gap-2 lg:text-sm">
          <InstagramIcon size={16} />@{data.settings.instagramHandle}
        </a>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-1.5 lg:mt-6 lg:grid-cols-6 lg:gap-3">
        {INSTAGRAM_TILES.map((src, i) => (
          <a
            key={src}
            href={ig}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Mercy Footwears on Instagram, photo ${i + 1}`}
            data-reveal=""
            style={{ "--reveal-delay": `${(i % 4) * 70}ms` } as React.CSSProperties}
            className="group relative block aspect-square overflow-hidden rounded-xl bg-sand lg:rounded-2xl"
          >
            <Image src={src} alt="" fill sizes="(min-width:1024px) 190px, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" style={{ objectPosition: "50% 55%" }} />
          </a>
        ))}
      </div>
    </section>
  );
}

function About() {
  const { data } = useStore();
  const ig = `https://instagram.com/${data.settings.instagramHandle}`;
  return (
    <section id="about" className="scroll-mt-28 px-5 pt-12 pb-11 lg:mx-auto lg:grid lg:max-w-[1240px] lg:grid-cols-2 lg:items-center lg:gap-[72px] lg:px-12 lg:py-24">
      <div className="relative hidden aspect-[4/5] w-full max-w-[460px] justify-self-end overflow-hidden rounded-2xl bg-sand lg:block">
        <Image src="/products/mf-08.jpg" alt="Slides lined up on Mercy's gold-trimmed shelves" fill sizes="460px" className="object-cover" style={{ objectPosition: "50% 45%" }} />
      </div>
      <div className="flex max-w-[460px] flex-col gap-3 lg:gap-4">
        <span className="text-[11px] font-semibold tracking-[.18em] text-ochre lg:text-xs">ABOUT MERCY</span>
        <h2 className="m-0 font-serif text-[32px] leading-[1.1] font-semibold lg:text-5xl lg:leading-[1.05]">Let your feet do the talking.</h2>
        <p className="m-0 text-pretty lg:text-[17px]">
          {data.settings.madeToOrder
            ? "Mercy Footwears is a slides boutique for women and men. Every pair is made by hand after you order it, in your size and colour. You order here, we confirm on WhatsApp, we make your pairs, and you pick them up or we deliver when they're ready."
            : "Mercy Footwears is a slides boutique for women and men. Every pair on our shelves is handpicked for quality and comfort, and every order is confirmed personally on WhatsApp and delivered to your door."}
        </p>
        <p className="m-0 text-sm text-muted">
          {data.settings.madeToOrder ? `Ready in ${data.settings.productionTime}. ${data.settings.paymentNote}` : data.settings.deliveryNote}
        </p>
        <div className="mt-2 flex flex-col gap-2.5 lg:flex-row lg:gap-3">
          <button
            type="button"
            onClick={() => openWhatsApp(data.settings.whatsappNumber, buildChatMessage())}
            className="flex h-[50px] items-center justify-center gap-2 rounded-full bg-wa px-6 text-[15px] font-semibold text-cocoa hover:bg-[#3ee07a]"
          >
            <ChatIcon size={20} />
            Chat on WhatsApp
          </button>
          <a href={ig} target="_blank" rel="noopener noreferrer" className="flex h-[50px] items-center justify-center rounded-full border border-cocoa px-6 font-semibold hover:bg-cocoa hover:text-cream">
            Follow on Instagram
          </a>
        </div>
      </div>
    </section>
  );
}

export function HomeView() {
  const { data } = useStore();
  const v = data.settings.heroVariant;
  return (
    <>
      {v === "b" ? <HeroB /> : v === "c" ? <HeroC /> : <HeroA />}
      <SaleCard />
      <BestSellers />
      <MenStrip />
      <WhyMercy />
      <Instagram />
      <About />
    </>
  );
}

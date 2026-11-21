import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import { CartDrawer } from "@/components/cart";
import { AddedToast, FloatingWhatsApp, GiftCelebration, NavTracker, RevealObserver } from "@/components/effects";
import { QuickAdd } from "@/components/quick-add";
import { CartProvider } from "@/state/cart";
import { SaleProvider } from "@/state/sale";
import { StoreProvider } from "@/state/store";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const siteUrl = SITE_URL;

const title = "Mercy Footwears · Walk proud";
const description = "Shop Mercy Footwears online — slides for her and for him. Order on WhatsApp, delivered nationwide. 10% off during the end-of-year sale, Nov 26–29.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: title, template: "%s · Mercy Footwears" },
  description,
  openGraph: {
    type: "website",
    siteName: "Mercy Footwears",
    title: "Shop Mercy Footwears online — order on WhatsApp",
    description,
    locale: "en_NG",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Mercy Footwears — shop online, order on WhatsApp" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shop Mercy Footwears online — order on WhatsApp",
    description,
    images: ["/og.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#FBF6EF",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/** Re-render static pages hourly so the server-rendered sale state stays current. */
export const revalidate = 3600;

/** Server render time (build or hourly revalidation), outside render for purity. */
const renderTime = () => new Date().getTime();

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${dmSans.variable}`}>
      <body>
        <StoreProvider>
          <SaleProvider renderedAt={renderTime()}>
            <CartProvider>
              {children}
              <QuickAdd />
              <CartDrawer />
              <FloatingWhatsApp />
              <AddedToast />
              <GiftCelebration />
              <RevealObserver />
              <NavTracker />
            </CartProvider>
          </SaleProvider>
        </StoreProvider>
      </body>
    </html>
  );
}

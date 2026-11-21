import type { Metadata } from "next";
import { ShopView } from "@/components/shop";

export const metadata: Metadata = {
  title: "Shop slides",
  description: "Browse Mercy Footwears slides for women, men and unisex: H-slides, bows, toe-rings, buckles, strappy and palm slides. Order on WhatsApp.",
  alternates: { canonical: "/shop" },
};

/**
 * Reading searchParams renders this page per request, so the grid is in the
 * server HTML (no empty first paint, no layout shift) for any tab or filter link.
 */
export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  await searchParams;
  return <ShopView />;
}

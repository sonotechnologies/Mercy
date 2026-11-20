import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopView } from "@/components/shop";

export const metadata: Metadata = {
  title: "Shop slides",
  description: "Browse Mercy Footwears slides for women, men and unisex: H-slides, bows, toe-rings, buckles, strappy and palm slides. Order on WhatsApp.",
};

export default function ShopPage() {
  return (
    <Suspense>
      <ShopView />
    </Suspense>
  );
}

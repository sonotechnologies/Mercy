import type { Metadata } from "next";
import { CartContents } from "@/components/cart";

export const metadata: Metadata = { title: "Your bag", robots: { index: false } };

export default function CartPage() {
  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-4 px-5 pt-6 lg:pt-12">
      <h1 className="m-0 font-serif text-[34px] font-semibold lg:text-6xl">Your bag</h1>
      <CartContents page />
    </div>
  );
}

import type { Metadata } from "next";
import { ProductView } from "@/components/product";
import { naira } from "@/lib/format";
import { SEED_PRODUCTS } from "@/lib/seed";

export function generateStaticParams() {
  return SEED_PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/shop/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = SEED_PRODUCTS.find((x) => x.slug === slug);
  if (!p) return { title: "Slides" };
  const title = `${p.name} – ${naira(p.price)}`;
  return {
    title: p.name,
    description: `${p.name} (${p.style}) from Mercy Footwears, ${naira(p.price)}. ${p.description} Order on WhatsApp.`,
    openGraph: { title, images: [{ url: p.images[0], width: 576, height: 1024, alt: p.name }] },
  };
}

export default async function ProductPage({ params }: PageProps<"/shop/[slug]">) {
  const { slug } = await params;
  return <ProductView slug={slug} />;
}

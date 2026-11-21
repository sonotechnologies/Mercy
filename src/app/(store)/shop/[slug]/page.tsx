import type { Metadata } from "next";
import { ProductView } from "@/components/product";
import { naira } from "@/lib/format";
import { SEED_PRODUCTS } from "@/lib/seed";
import { SITE_URL } from "@/lib/site";

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
    alternates: { canonical: `/shop/${p.slug}` },
    openGraph: { title, images: [{ url: p.images[0], width: 576, height: 1024, alt: p.name }] },
  };
}

export default async function ProductPage({ params }: PageProps<"/shop/[slug]">) {
  const { slug } = await params;
  const p = SEED_PRODUCTS.find((x) => x.slug === slug);
  const jsonLd = p && {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    image: p.images.map((i) => `${SITE_URL}${i}`),
    category: p.style,
    brand: { "@type": "Brand", name: "Mercy Footwears" },
    color: p.colours.map((c) => c.name).join(", "),
    offers: {
      "@type": "Offer",
      price: p.price,
      priceCurrency: "NGN",
      availability: p.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${SITE_URL}/shop/${p.slug}`,
    },
  };
  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />}
      <ProductView slug={slug} />
    </>
  );
}

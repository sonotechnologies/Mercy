import type { MetadataRoute } from "next";
import { SEED_PRODUCTS } from "@/lib/seed";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/shop`, changeFrequency: "daily", priority: 0.9 },
    ...SEED_PRODUCTS.map((p) => ({ url: `${SITE_URL}/shop/${p.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}

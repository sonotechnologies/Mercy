/**
 * Imports Mercy's product pack (products.json + images/) into the store.
 *
 *   npx tsx scripts/import-catalog.ts path/to/mercy-products
 *
 * Writes src/data/catalog.json. Photos are expected in public/products/catalog/
 * (resized + graded copies of images/). Re-run whenever she sends a new pack.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

type Pack = {
  sale?: { active?: boolean; title?: string; endsAt?: string | null };
  banners?: { image: string; caption?: string }[];
  products: {
    slug: string;
    name: string;
    gender: "women" | "men-unisex";
    style: string;
    price: number;
    salePrice?: number | null;
    colours: string[];
    sizes: number[];
    images: string[];
    orderType?: "made-to-order" | "ready-stock";
    published?: boolean;
  }[];
};

const dir = process.argv[2];
if (!dir) throw new Error("Usage: npx tsx scripts/import-catalog.ts path/to/mercy-products");
const pack = JSON.parse(readFileSync(path.join(dir, "products.json"), "utf8")) as Pack;
const root = path.resolve(import.meta.dirname, "..");

/** Swatch colours for her colour names (two-tone names use the first colour). */
const HEX: Record<string, string> = {
  beige: "#D8C3A5", black: "#1F1B19", blue: "#7FA7CF", "blue suede": "#8FB4D9", brown: "#6B4127", burgundy: "#6E1F2B",
  cream: "#EDE3CF", "dark brown": "#3E2619", grey: "#8D8B88", ivory: "#ECE5D6", khaki: "#A79B78", leopard: "#B98A4E",
  lilac: "#C3A6D3", mint: "#A9D8C0", mustard: "#E2B523", navy: "#24304F", nude: "#D9B48E", olive: "#6E6B45", orange: "#E07A2E",
  oxblood: "#5A1A1A", pink: "#E3A3B5", plum: "#7A2E55", red: "#C8232F", rose: "#D89AA5", "royal blue": "#2A4DA8", rust: "#A4502A",
  sage: "#B5C3A3", sand: "#D8C29E", "sky blue": "#9EC3E6", tan: "#B9804F", taupe: "#9C8B7A", white: "#F4F1EA",
};
const hexFor = (name: string) => HEX[name.toLowerCase()] ?? HEX[name.toLowerCase().split("/")[0].trim()] ?? "#B9804F";

/** Which photo shows which colour, where the pack's order doesn't line up 1:1 (checked by eye). */
const COLOUR_IMAGE: Record<string, Record<string, number>> = {
  "clasp-slide": { Black: 0, "Cream/Tan": 2, Tan: 4, White: 4, "Blue Suede": 3 },
  "woven-cross-slide": { Brown: 0, Burgundy: 2 },
  "knotted-strappy-slide": { Beige: 0, Sage: 1, Ivory: 2, Black: 2 },
};

/** Home page picks: bestsellers (in this order) and "New" badges. */
const BESTSELLERS = [
  "buckle-h-slide", "bow-slide", "clasp-slide", "knotted-strappy-slide", "crystal-knot-slide", "slingback-thong-sandal",
  "pleated-knot-slide", "mustard-bow-slide", "classic-h-slide", "knotted-thong-platform",
  "penny-loafer", "mens-cross-slide", "double-strap-cork-slide", "mens-cut-out-slide", "buckle-mule",
];
const NEW = ["knotted-thong-platform", "suede-tassel-slide", "wide-strap-slide", "penny-loafer", "crystal-h-slide", "mens-cut-out-slide", "double-buckle-platform"];

/** Card crop (CSS object-position) for photos where the default centre crop cuts the shoe. */
const FOCUS: Record<string, string> = {
  "quilted-slide": "50% 40%",
  "medallion-slide": "50% 45%",
  "mini-platform-thong": "50% 40%",
  "pointed-strappy-thong": "50% 45%",
  "mustard-bow-slide": "50% 40%",
};

const DESCRIPTIONS: Record<string, string> = {
  "H-Slides": "A clean, flat H-strap slide that goes with everything, from jeans to Sunday wears. Soft footbed, sturdy sole, easy slip-on fit.",
  "Bow & Knot": "A soft bow or knot on a comfortable flat sole. Dressy enough for owambe, easy enough for a market run.",
  "Toe-Ring": "A toe-ring or thong style that keeps your foot secure without straps everywhere. Light, neat and made for long days.",
  Buckle: "A structured strap finished with a polished buckle. Smart, sturdy and comfortable all day.",
  Strappy: "Fine straps that look delicate and hold firm. Pairs beautifully with dresses and wide-leg trousers.",
  "Cross-Strap": "Crossed straps for a secure fit and a clean look, on a cushioned sole.",
  Platform: "A raised sole that adds a little height without the wobble. Comfortable for long days out.",
  Cork: "A contoured cork footbed that moulds to your foot, with sturdy straps for everyday wear.",
  Slides: "An easy slip-on slide with a soft footbed. Simple, smart and made for every day.",
  Mules: "A closed-toe mule you can slip on and go. Polished enough for the office, easy enough for the weekend.",
  Loafers: "A classic penny loafer with a clean finish. Smart for work, sharp for occasions.",
};

const MIN_DATE = Date.UTC(2026, 10, 21);
const products = pack.products.map((p, i) => {
  const images = p.images.map((src) => `/products/catalog/${path.basename(src)}`);
  const map = COLOUR_IMAGE[p.slug];
  const oneToOne = !map && images.length === p.colours.length && images.length > 1;
  const colours = p.colours.map((name, ci) => {
    const idx = map ? map[name] : oneToOne ? ci : undefined;
    return { name, hex: hexFor(name), ...(idx != null && images[idx] ? { image: images[idx] } : {}) };
  });
  const best = BESTSELLERS.indexOf(p.slug);
  return {
    id: p.slug,
    name: p.name,
    slug: p.slug,
    gender: p.gender,
    style: p.style,
    price: p.price,
    ...(p.salePrice && p.salePrice < p.price ? { salePrice: p.salePrice } : {}),
    colours,
    sizes: p.sizes,
    soldOutSizes: [] as number[],
    inStock: p.published !== false,
    isNew: NEW.includes(p.slug),
    isBestseller: best >= 0,
    images,
    description: DESCRIPTIONS[p.style] ?? DESCRIPTIONS.Slides,
    focus: FOCUS[p.slug] ?? "50% 50%",
    orderType: p.orderType ?? "made-to-order",
    // Bestsellers first (in the order above), then the pack's order.
    createdAt: MIN_DATE - (best >= 0 ? best : BESTSELLERS.length + i) * 60000,
    sort: best >= 0 ? best : BESTSELLERS.length + i,
  };
});
products.sort((a, b) => a.sort - b.sort);

const banner = pack.banners?.[0];
writeFileSync(
  path.join(root, "src/data/catalog.json"),
  JSON.stringify(
    {
      importedAt: new Date().toISOString().slice(0, 10),
      banner: banner ? { image: `/products/catalog/${path.basename(banner.image)}`, caption: banner.caption ?? "" } : null,
      products: products.map((p) => {
        const { sort, ...rest } = p;
        void sort;
        return rest;
      }),
    },
    null,
    1,
  ) + "\n",
);
console.log(`Imported ${products.length} products (${products.filter((p) => p.isBestseller).length} bestsellers, ${products.filter((p) => p.colours.some((c) => c.image)).length} with colour photos)`);

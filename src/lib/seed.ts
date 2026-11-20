import type { Colour, Gender, Product, SaleConfig, Settings, StoreData } from "./types";

/** Bump when the seed shape changes so stale demo data in localStorage is discarded. */
export const DATA_VERSION = 1;

export const STYLES = ["H-Slides", "Bow & Knot", "Toe-Ring", "Buckle", "Strappy", "Cross-Strap", "Palm Slides"] as const;

/** Home "Shop by style" tiles (women's styles, Design Brief §6). */
export const STYLE_TILES: { name: string; image: string }[] = [
  { name: "H-Slides", image: "/products/mf-10.jpg" },
  { name: "Bow & Knot", image: "/products/mf-13.jpg" },
  { name: "Toe-Ring", image: "/products/mf-02.jpg" },
  { name: "Buckle", image: "/products/mf-08.jpg" },
  { name: "Strappy", image: "/products/mf-06.jpg" },
  { name: "Cross-Strap", image: "/products/mf-07.jpg" },
];

export const INSTAGRAM_TILES = ["mf-10", "mf-08", "mf-14", "mf-07", "mf-18", "mf-20"].map((n) => `/products/${n}.jpg`);

export const WOMEN_SIZES = [36, 37, 38, 39, 40, 41, 42];
export const MEN_SIZES = [40, 41, 42, 43, 44, 45];

const DESCRIPTIONS: Record<string, string> = {
  "H-Slides": "A clean, flat H-strap slide that goes with everything, from jeans to Sunday wears. Soft footbed, sturdy sole, and an easy slip-on fit.",
  "Bow & Knot": "A soft knotted bow on a comfortable flat sole. Dressy enough for owambe, easy enough for a market run.",
  "Toe-Ring": "A toe-ring slide that keeps your foot secure without straps everywhere. Light, neat and made for long days.",
  Buckle: "A structured strap finished with a polished buckle. Smart, polished and comfortable all day.",
  Strappy: "Fine straps that look delicate and hold firm. Pairs beautifully with dresses and wide-leg trousers.",
  "Cross-Strap": "Crossed straps for a secure fit, with a pop of colour that lifts a simple outfit.",
  "Palm Slides": "A classic palm slide with a wide strap and cushioned sole. Clean, simple and built for everyday.",
};

type Row = {
  img: string;
  name: string;
  style: string;
  price: number;
  colours: [string, string, string?][];
  gender?: Gender;
  best?: boolean;
  isNew?: boolean;
  focus?: string;
  inStock?: boolean;
};

const ROWS: Row[] = [
  { img: "mf-01", name: "Kemi H-Slide", style: "H-Slides", price: 9500, colours: [["Ivory", "#ECE5D6"]], best: true, focus: "50% 55%" },
  { img: "mf-16", name: "Tola H-Slide", style: "H-Slides", price: 9000, colours: [["Blush", "#E9B9C0"], ["Orange", "#D9772E"]], best: true, focus: "50% 60%" },
  { img: "ruby-red", name: "Ruby H-Slide", style: "H-Slides", price: 8500, colours: [["Red", "#C8232F", "/products/ruby-red.jpg"], ["Plum", "#8E2A4C", "/products/ruby-plum.jpg"]], best: true, isNew: true, focus: "50% 50%" },
  { img: "mf-04", name: "Ada Bow Slide", style: "Bow & Knot", price: 8000, colours: [["Caramel", "#C27A35"]], best: true },
  { img: "mf-13", name: "Sade Bow Mule", style: "Bow & Knot", price: 11000, colours: [["Mustard", "#E2B523"]], best: true, focus: "50% 72%" },
  { img: "mf-08", name: "Halima Buckle Strap", style: "Buckle", price: 9500, colours: [["Mocha & White", "#5B3626"]], best: true },
  { img: "mf-02", name: "Bisi Toe-Ring", style: "Toe-Ring", price: 6500, colours: [["Cognac", "#9C4F2E"]], best: true },
  { img: "mf-11", name: "Nneka Bow Slide", style: "Bow & Knot", price: 7500, colours: [["Black", "#1F1B19"]], best: true },
  { img: "mf-15", name: "Amaka Croc H-Slide", style: "H-Slides", price: 12500, colours: [["Cognac", "#9A5A33"], ["Nude", "#D9B48E"]], focus: "50% 78%" },
  { img: "navy-trim", name: "Zara Two-Tone H-Slide", style: "H-Slides", price: 10000, colours: [["Navy & Tan", "#2B3A7A"]], isNew: true, focus: "50% 50%" },
  { img: "mf-03", name: "Ife Knotted Toe-Ring", style: "Toe-Ring", price: 7000, colours: [["Brown", "#6B4127"]], focus: "50% 60%" },
  { img: "mf-18", name: "Funmi Bow Toe-Ring", style: "Toe-Ring", price: 7500, colours: [["Magenta", "#B0255E"]], isNew: true },
  { img: "mf-17", name: "Chioma Two-Tone Toe-Ring", style: "Toe-Ring", price: 8000, colours: [["Wine & Red", "#5E2B2B"]], inStock: false },
  { img: "mf-06", name: "Yemi Strappy Slide", style: "Strappy", price: 7000, colours: [["Pearl", "#E7E1D3"]] },
  { img: "mf-20", name: "Lola Lace-Up Sandal", style: "Strappy", price: 10500, colours: [["Tan", "#C07A50"]], isNew: true },
  { img: "mf-07", name: "Dami Cross-Strap", style: "Cross-Strap", price: 8500, colours: [["Sunset", "#D86A2C"]] },
  { img: "mf-00", name: "Tobi Palm Slide", style: "Palm Slides", price: 14000, colours: [["Espresso", "#3A2620"], ["Black", "#1F1B19"]], gender: "men-unisex", best: true, focus: "50% 70%" },
  { img: "mf-12", name: "Emeka Toe-Loop", style: "Toe-Ring", price: 13500, colours: [["Black", "#1F1B19"]], gender: "men-unisex", focus: "50% 60%" },
  { img: "mf-14", name: "Seun Buckle Slide", style: "Buckle", price: 16000, colours: [["Sand & Tan", "#C9B79A"]], gender: "men-unisex", isNew: true, focus: "50% 62%" },
  { img: "mf-19", name: "Kunle Braided Slide", style: "Strappy", price: 18000, colours: [["Black", "#1F1B19"]], gender: "men-unisex" },
];

const SOLD_OUT = [[38], [41], [37, 42], [39], [40, 44], [36, 43]];

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const SEED_PRODUCTS: Product[] = ROWS.map((r, i) => {
  const gender = r.gender ?? "women";
  const image = `/products/${r.img}.jpg`;
  const colours: Colour[] = r.colours.map(([name, hex, img]) => ({ name, hex, ...(img ? { image: img } : {}) }));
  const sizes = gender === "women" ? WOMEN_SIZES : MEN_SIZES;
  return {
    id: `p${String(i + 1).padStart(2, "0")}`,
    name: r.name,
    slug: slugify(r.name),
    gender,
    style: r.style,
    price: r.price,
    colours,
    sizes,
    soldOutSizes: SOLD_OUT[i % SOLD_OUT.length].filter((z) => sizes.includes(z)),
    inStock: r.inStock ?? true,
    isNew: !!r.isNew,
    isBestseller: !!r.best,
    images: [colours[0].image ?? image],
    description: DESCRIPTIONS[r.style] ?? "",
    focus: r.focus,
    createdAt: Date.UTC(2026, 10, 1 + i),
  };
});

export const SEED_SALE: SaleConfig = {
  active: true,
  title: "4-Day End of the Year Sale",
  discountPercent: 10,
  startsAt: "2026-11-26T00:00:00+01:00",
  endsAt: "2026-11-29T23:59:59+01:00",
  deliveryStarts: "2026-12-05",
  freeGiftMinPairs: 4, // "above 3 pairs"
};

export const SEED_SETTINGS: Settings = {
  whatsappNumber: "2349098964885",
  instagramHandle: "mercy_footwear",
  tagline: "Walk proud, your feet deserve the best.",
  deliveryNote: "We deliver nationwide. Delivery fee is confirmed on WhatsApp.",
  heroVariant: "a",
};

export function seedData(): StoreData {
  return {
    version: DATA_VERSION,
    products: SEED_PRODUCTS.map((p) => ({ ...p, colours: p.colours.map((c) => ({ ...c })), images: [...p.images] })),
    sale: { ...SEED_SALE },
    settings: { ...SEED_SETTINGS },
  };
}

export const SIZE_GUIDE: { eu: number; cm: string }[] = [
  { eu: 36, cm: "22.5" },
  { eu: 37, cm: "23.0" },
  { eu: 38, cm: "24.0" },
  { eu: 39, cm: "24.5" },
  { eu: 40, cm: "25.5" },
  { eu: 41, cm: "26.0" },
  { eu: 42, cm: "27.0" },
  { eu: 43, cm: "27.5" },
  { eu: 44, cm: "28.5" },
  { eu: 45, cm: "29.0" },
];

export const NIGERIAN_STATES = [
  "Lagos", "Abuja (FCT)", "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano",
  "Katsina", "Kebbi", "Kogi", "Kwara", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau",
  "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

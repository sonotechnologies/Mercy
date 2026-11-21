/** Broad colour families for the shop filter, worked out from each swatch's hex. */
export const FAMILIES = [
  { id: "black", label: "Black", swatch: "#1F1B19" },
  { id: "white", label: "White & cream", swatch: "#ECE5D6" },
  { id: "nude", label: "Nude & tan", swatch: "#D9B48E" },
  { id: "brown", label: "Brown", swatch: "#6B4127" },
  { id: "red", label: "Red & pink", swatch: "#C8232F" },
  { id: "yellow", label: "Yellow & orange", swatch: "#E2B523" },
  { id: "blue", label: "Blue & green", swatch: "#2B3A7A" },
] as const;

export type FamilyId = (typeof FAMILIES)[number]["id"];

export function familyOf(hex: string): FamilyId {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return "brown";
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d) {
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
  }
  if (h < 0) h += 360;

  if (l < 0.16) return "black";
  if (l > 0.82 && s < 0.5) return "white";
  if (h >= 150 && h < 290) return "blue";
  if (h >= 290 || h < 12) return "red";
  if (s > 0.35 && h >= 330) return "red";
  // warm hues (12°–150°)
  if (h >= 40 && h < 150 && s > 0.55 && l > 0.45) return "yellow";
  if (s > 0.6 && l > 0.45 && h < 40) return l > 0.7 ? "red" : "yellow";
  if (l > 0.55) return "nude";
  return "brown";
}

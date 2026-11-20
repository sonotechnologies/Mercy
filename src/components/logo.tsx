/** Her "M" mark with the red swoosh (simplified redraw from the box and flyer). */
export function LogoMark({
  width = 34,
  tone = "brand",
  className,
}: {
  width?: number;
  tone?: "brand" | "cream" | "monogram";
  className?: string;
}) {
  const m = tone === "brand" ? "#2B1F1A" : "#FBF6EF";
  const swoosh = tone === "cream" ? "#FBF6EF" : "#B3202A";
  return (
    <svg width={width} height={(width * 44) / 64} viewBox="0 0 64 44" aria-hidden="true" className={className}>
      <polygon points="4,40 18,6 30,26 42,6 56,40 47,40 40,22 30,38 20,22 13,40" fill={m} />
      <path d="M1 34 C 18 26 38 16 63 3" stroke={swoosh} strokeWidth={tone === "monogram" ? 4 : 3.5} fill="none" strokeLinecap="round" />
    </svg>
  );
}

const SIZES = {
  sm: { mark: 34, mercy: "text-[19px]", foot: "text-[7.5px] tracking-[.42em] mt-[3px]", gap: "gap-[7px]" },
  md: { mark: 46, mercy: "text-[25px]", foot: "text-[9px] tracking-[.44em] mt-1", gap: "gap-2.5" },
  footer: { mark: 44, mercy: "text-2xl", foot: "text-[9px] tracking-[.44em] mt-1", gap: "gap-2.5" },
} as const;

export function Logo({ size = "sm", tone = "brand" }: { size?: keyof typeof SIZES; tone?: "brand" | "cream" }) {
  const s = SIZES[size];
  return (
    <span className={`inline-flex items-center ${s.gap}`}>
      <LogoMark width={s.mark} tone={tone} />
      <span className="flex flex-col leading-none">
        <span className={`font-serif font-bold tracking-[.2em] ${s.mercy}`}>MERCY</span>
        <span className={`font-semibold ${s.foot}`}>FOOTWEARS</span>
      </span>
      <span className="sr-only">Mercy Footwears</span>
    </span>
  );
}

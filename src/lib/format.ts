export function naira(n: number): string {
  return "₦" + Math.round(n).toLocaleString("en-US");
}

export const pad2 = (n: number) => String(Math.max(0, Math.floor(n))).padStart(2, "0");

export type Parts = { d: string; h: string; m: string; s: string };

export function countdownParts(ms: number): Parts {
  const L = Math.max(0, ms);
  return {
    d: pad2(L / 864e5),
    h: pad2((L / 36e5) % 24),
    m: pad2((L / 6e4) % 60),
    s: pad2((L / 1e3) % 60),
  };
}

/** "Dec 5" from "2026-12-05" */
export function shortDate(isoDate: string): string {
  const d = new Date(isoDate.length <= 10 ? isoDate + "T12:00:00+01:00" : isoDate);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "Africa/Lagos" });
}

export function displayPhone(intl: string): string {
  // 2349098964885 -> 0909 896 4885
  const digits = intl.replace(/\D/g, "");
  const local = digits.startsWith("234") ? "0" + digits.slice(3) : digits;
  return local.length === 11 ? `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}` : local;
}

/** Accepts 0909…, +234…, 234… and returns 234… */
export function normalisePhone(input: string): string {
  const d = input.replace(/\D/g, "");
  if (d.startsWith("234")) return d;
  if (d.startsWith("0")) return "234" + d.slice(1);
  return d;
}

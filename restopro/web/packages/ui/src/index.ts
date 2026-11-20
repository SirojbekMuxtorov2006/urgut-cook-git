import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 92400 -> "92 400 so'm" */
export function formatSum(value: number | string, currency = "so'm"): string {
  const n = typeof value === "string" ? Number(value) : value;
  const negative = n < 0;
  const abs = Math.abs(n);
  const whole = Math.floor(abs);
  const frac = Math.round((abs - whole) * 100);
  const grouped = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${negative ? "-" : ""}${grouped}${frac ? "," + String(frac).padStart(2, "0") : ""} ${currency}`.trim();
}

/** ISO -> "20.11.2026" yoki "20.11.2026 14:35" */
export function formatDate(iso: string | Date, withTime = false): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const p = (x: number) => String(x).padStart(2, "0");
  const date = `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
  return withTime ? `${date} ${p(d.getHours())}:${p(d.getMinutes())}` : date;
}

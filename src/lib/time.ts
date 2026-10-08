// ═══════════════════════════════════════════════════════════════════════════
//  زمان "HH:mm" (سند طراحی §۱.۷) — نرمال‌سازی/اعتبارسنجی ورودی فرم‌ها
//  ارقام فارسی هم قبول است. خروجی همیشه صفرپرشده تا مقایسه رشته‌ای
//  دقیقاً معادل مقایسه زمانی باشد ("09:15" < "09:30").
// ═══════════════════════════════════════════════════════════════════════════
import { toEnglishDigits } from "@/validations/validators";

/** "۹:۳۰" → "09:30" · "16:00" → "16:00" · نامعتبر → null */
export function parseTime(raw: string): string | null {
  const m = toEnglishDigits(raw).trim().match(/^(\d{1,2}):(\d{1,2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

/** شروع < پایان (پس از نرمال‌سازی) */
export function isValidTimeRange(start: string, end: string): boolean {
  const s = parseTime(start);
  const e = parseTime(end);
  return s !== null && e !== null && s < e;
}

/** آیا بازه کاملاً داخل بازه کاری آموزشگاه است؟ (F4-AC5) */
export function isWithinHours(
  start: string,
  end: string,
  open: string,
  close: string,
): boolean {
  const s = parseTime(start);
  const e = parseTime(end);
  const o = parseTime(open);
  const c = parseTime(close);
  return s !== null && e !== null && o !== null && c !== null && s >= o && e <= c;
}

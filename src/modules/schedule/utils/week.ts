// ابزار هفته ایرانی (شنبه‌شروع) برای تقویم هفتگی — خالص و بدون DB
import { toJalaali } from "jalaali-js";
import { toPersianDigits } from "@/validations/validators";

export const JALALI_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

/** شنبه‌ی هفته‌ی حاوی d (نیمه‌شب UTC) */
export function saturdayOf(d: Date): Date {
  const dow = d.getUTCDay(); // 0=یکشنبه … 6=شنبه
  const offset = dow === 6 ? 0 : dow + 1;
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - offset),
  );
}

export function addDays(d: Date, n: number): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + n),
  );
}

/** هفت روز هفته از شنبه */
export function weekDays(saturday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(saturday, i));
}

/** «۱۲ تا ۱۸ شهریور ۱۴۰۵» — با مدیریت عبور از ماه */
export function formatWeekRange(saturday: Date): string {
  const end = addDays(saturday, 6);
  const s = toJalaali(saturday);
  const e = toJalaali(end);
  if (s.jy === e.jy && s.jm === e.jm) {
    return toPersianDigits(
      `${s.jd} تا ${e.jd} ${JALALI_MONTHS[s.jm - 1]} ${e.jy}`,
    );
  }
  return toPersianDigits(
    `${s.jd} ${JALALI_MONTHS[s.jm - 1]} تا ${e.jd} ${JALALI_MONTHS[e.jm - 1]} ${e.jy}`,
  );
}

/** پارامتر ?week=YYYY-MM-DD (میلادی) → Date نیمه‌شب UTC؛ نامعتبر → امروز */
export function parseWeekParam(raw: string | undefined): Date {
  if (raw) {
    const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  }
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

/** Date → "YYYY-MM-DD" (برای لینک‌های ناوبری هفته) */
export function toDateParam(d: Date): string {
  return d.toISOString().slice(0, 10);
}

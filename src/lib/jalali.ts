// ═══════════════════════════════════════════════════════════════════════════
//  تاریخ شمسی (D20): ذخیره‌سازی میلادی در DB · نمایش/ورودی شمسی در UI
//  تذکر 3.5: todayUtcDate قبلاً UTC بود؛ اگر سرور خارج ایران باشد روز اشتباه می‌شود.
//  حالا todayTehranDate با Asia/Tehran محاسبه می‌شود و DB هم با همان تاریخ مقایسه می‌شود.
// ═══════════════════════════════════════════════════════════════════════════
import { isValidJalaaliDate, toGregorian, toJalaali } from "jalaali-js";
import { toEnglishDigits, toPersianDigits } from "@/validations/validators";

/** Date → "۱۴۰۵/۰۶/۱۲" (نمایش) */
export function formatJalali(date: Date): string {
  const j = toJalaali(date);
  return toPersianDigits(
    `${j.jy}/${String(j.jm).padStart(2, "0")}/${String(j.jd).padStart(2, "0")}`,
  );
}

/** ورودی آزاد فرم شمسی → Date (نیمه‌شب UTC — برای @db.Date) یا null */
export function parseJalaliDate(input: string): Date | null {
  const m = toEnglishDigits(input)
    .trim()
    .match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/);
  if (!m) return null;
  const [jy, jm, jd] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (!isValidJalaaliDate(jy, jm, jd)) return null;
  const g = toGregorian(jy, jm, jd);
  return new Date(Date.UTC(g.gy, g.gm - 1, g.gd));
}

/** امروز به شمسی — پیش‌فرض فرم‌ها */
export function isValidJalaliDate(input: string): boolean {
  return parseJalaliDate(input) !== null;
}

export function todayJalali(): string {
  return formatJalali(new Date());
}

/** 3.5 — امروز به‌صورت Date نیمه‌شب UTC بر اساس تقویم تهران (Asia/Tehran)
 *  قرارداد DB: @db.Date با نیمه‌شب UTC ذخیره می‌شود، ولی «امروز» باید بر اساس تهران باشد
 *  مثال: اگر سرور UTC باشد و تهران ۰۰:۳۰ بامداد فردا باشد، UTC هنوز دیروز است.
 */
export function todayTehranDate(): Date {
  // en-CA → YYYY-MM-DD با TimeZone تهران
  const tehran = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tehran" });
  const [y, m, d] = tehran.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** @deprecated — برای سازگاری قدیم؛ از todayTehranDate استفاده کنید (3.5) */
export function todayUtcDate(): Date {
  return todayTehranDate();
}

/** برچسب امروز به فارسی — مثلاً «شنبه ۲۹ شهریور ۱۴۰۵» — بر اساس تهران */
export function getTodayLabel(): string {
  const now = new Date();
  // تاریخ شمسیِ «الانِ تهران» نه UTC
  const tehranStr = now.toLocaleDateString("en-CA", { timeZone: "Asia/Tehran" });
  const [gy, gm, gd] = tehranStr.split("-").map(Number);
  // برای محاسبه جلاالی از همان روز تهران استفاده می‌کنیم
  const jNow = toJalaali(new Date(Date.UTC(gy, gm - 1, gd)));
  const weekdays = ["شنبه","یکشنبه","دوشنبه","سه‌شنبه","چهارشنبه","پنجشنبه","جمعه"];
  const jsDay = new Date(Date.UTC(gy, gm - 1, gd)).getUTCDay();
  const shamsiDayIndex = (jsDay + 1) % 7;
  const monthsFa = ["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"];
  return `${weekdays[shamsiDayIndex]} ${toPersianDigits(String(jNow.jd))} ${monthsFa[jNow.jm-1]} ${toPersianDigits(String(jNow.jy))}`;
}

/** 3.5 — helper متمرکز برای نمایش مبلغ (جلوگیری از تکرار toPersianDigits + toLocaleString) */
export function formatMoney(amount: number): string {
  return toPersianDigits(amount.toLocaleString("fa-IR"));
}
export function formatPersianNumber(n: number): string {
  return toPersianDigits(String(n));
}

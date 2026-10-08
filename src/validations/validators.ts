// ═══════════════════════════════════════════════════════════════════════════
//  اعتبارسنج‌های دامنه (F2-AC2/AC3 و پایه فرم‌های آینده)
//  ورودی کاربر فارسی معمولاً ارقام فارسی دارد — همه‌جا نرمال‌سازی می‌کنیم
// ═══════════════════════════════════════════════════════════════════════════

/** تبدیل ارقام فارسی/عربی به انگلیسی */
export function toEnglishDigits(input: string): string {
  const fa = "۰۱۲۳۴۵۶۷۸۹";
  const ar = "٠١٢٣٤٥٦٧٨٩";
  return input.replace(/[۰-۹٠-٩]/g, (ch) => {
    const i = fa.indexOf(ch);
    return String(i >= 0 ? i : ar.indexOf(ch));
  });
}

/** تبدیل ارقام انگلیسی به فارسی — برای نمایش تاریخ/عدد در UI فارسی */
export function toPersianDigits(input: string): string {
  return input.replace(/[0-9]/g, (ch) => "۰۱۲۳۴۵۶۷۸۹"[Number(ch)]);
}

/** نرمال‌سازی شماره موبایل: ارقام فارسی→انگلیسی + حذف هر چیزی غیر رقم */
export function normalizeMobile(raw: string): string {
  return toEnglishDigits(raw).replace(/\D/g, "");
}

/** شماره موبایل ایرانی معتبر: 09 + ۹ رقم (F2-AC2) */
export function isValidMobile(raw: string): boolean {
  return /^09\d{9}$/.test(normalizeMobile(raw));
}

/**
 * کد ملی ایرانی معتبر (F2-AC3): ۱۰ رقم + رقم کنترل
 * الگوریتم: جمع وزنی ۹ رقم اول (وزن ۱۰ تا ۲)؛ باقیمانده بر ۱۱
 */
export function isValidNationalId(raw: string): boolean {
  const nid = toEnglishDigits(raw).replace(/\D/g, "");
  if (!/^\d{10}$/.test(nid)) return false;
  if (/^(\d)\1{9}$/.test(nid)) return false; // همه ارقام یکسان

  const digits = nid.split("").map(Number);
  const sum = digits
    .slice(0, 9)
    .reduce((acc, d, i) => acc + d * (10 - i), 0);
  const remainder = sum % 11;
  const check = digits[9];

  return remainder < 2 ? check === remainder : check === 11 - remainder;
}

/** شماره کارت بانکی ایران: ۱۶ رقم + Luhn (اختیاری سخت) */
export function isValidCardNumber(raw: string): boolean {
  const card = toEnglishDigits(raw).replace(/\D/g, "");
  if (!/^\d{16}$/.test(card)) return false;
  // Luhn
  let sum = 0;
  for (let i = 0; i < 16; i++) {
    let d = Number(card[15 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

/** شماره شبا ایران: IR + ۲۴ رقم (۲۶ کاراکتر) + کنترل IBAN */
export function isValidSheba(raw: string): boolean {
  const s = toEnglishDigits(raw).replace(/\s/g, "").toUpperCase();
  if (!/^IR\d{24}$/.test(s)) return false;
  // IBAN check: move first 4 chars to end, convert letters to numbers (I=18, R=27), mod 97 == 1
  const rearranged = s.slice(4) + s.slice(0, 4);
  const numeric = rearranged.replace(/[A-Z]/g, (ch) => String(ch.charCodeAt(0) - 55));
  // mod 97 iterative to avoid overflow
  let remainder = 0;
  for (let i = 0; i < numeric.length; i++) {
    remainder = (remainder * 10 + Number(numeric[i])) % 97;
  }
  return remainder === 1;
}

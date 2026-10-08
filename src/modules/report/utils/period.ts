// ── ابزار بازه زمانی گزارشات — شمسی ↔ میلادی
import { isValidJalaaliDate, jalaaliMonthLength, toGregorian, toJalaali } from "jalaali-js";
import { parseJalaliDate, formatJalali } from "@/lib/jalali";
import { toEnglishDigits, toPersianDigits } from "@/validations/validators";

export type PeriodMode = "month" | "term" | "custom" | "all";

export interface ResolvedPeriod {
  mode: PeriodMode;
  from: Date | null; // null = بدون حد
  to: Date | null;
  label: string;
  jalaliFrom?: string;
  jalaliTo?: string;
}

/** «۱۴۰۴/۰۶» → {from: 1404/06/01, to: 1404/06/31} میلادی UTC */
export function jalaliMonthToRange(jmStr: string): { from: Date; to: Date } | null {
  const normalized = toEnglishDigits(jmStr.trim());
  const m = normalized.match(/^(\d{4})\/(\d{1,2})$/);
  if (!m) return null;
  const jy = Number(m[1]), jm = Number(m[2]);
  if (jm < 1 || jm > 12) return null;
  // اعتبارسنجی سال شمسی (jalaali-js محدوده دارد)
  if (!isValidJalaaliDate(jy, jm, 1)) return null;
  const gFrom = toGregorian(jy, jm, 1);
  const lastDay = jalaaliMonthLength(jy, jm);
  const gTo = toGregorian(jy, jm, lastDay);
  return {
    from: new Date(Date.UTC(gFrom.gy, gFrom.gm - 1, gFrom.gd)),
    to: new Date(Date.UTC(gTo.gy, gTo.gm - 1, gTo.gd)),
  };
}

/** ماه جاری شمسی به فرمت ۱۴۰۴/۰۶ */
export function currentJalaliMonth(): string {
  const j = toJalaali(new Date());
  return `${j.jy}/${String(j.jm).padStart(2, "0")}`;
}

/** امروز شمسی ۱۴۰۴/۰۶/۲۶ */
export function todayJalaliStr(): string {
  const j = toJalaali(new Date());
  return `${j.jy}/${String(j.jm).padStart(2, "0")}/${String(j.jd).padStart(2, "0")}`;
}

/** تولید آرایه ماه‌های شمسی برای select — ۱۲ ماه اخیر */
export function lastJalaliMonths(count = 12): string[] {
  const cur = toJalaali(new Date());
  const out: string[] = [];
  let jy = cur.jy, jm = cur.jm;
  for (let i = 0; i < count; i++) {
    out.push(`${jy}/${String(jm).padStart(2, "0")}`);
    jm--;
    if (jm < 1) { jm = 12; jy--; }
  }
  return out;
}

/** query params → ResolvedPeriod */
export function resolvePeriodFromSearchParams(
  sp: Record<string, string | undefined>,
  term?: { name: string; startDate: Date; endDate: Date } | null,
): ResolvedPeriod {
  const mode = (sp.mode as PeriodMode) || "month";

  if (mode === "term" && term) {
    return {
      mode: "term",
      from: term.startDate,
      to: term.endDate,
      label: `ترم ${term.name}`,
      jalaliFrom: formatJalali(term.startDate),
      jalaliTo: formatJalali(term.endDate),
    };
  }

  if (mode === "custom") {
    const from = sp.from ? parseJalaliDate(sp.from) : null;
    const to = sp.to ? parseJalaliDate(sp.to) : null;
    if (from || to) {
      return {
        mode: "custom",
        from,
        to,
        label: from && to ? `${toPersianDigits(sp.from!)} تا ${toPersianDigits(sp.to!)}` : from ? `از ${toPersianDigits(sp.from!)}` : `تا ${toPersianDigits(sp.to!)}`,
        jalaliFrom: sp.from,
        jalaliTo: sp.to,
      };
    }
  }

  if (mode === "all") {
    return { mode: "all", from: null, to: null, label: "همه زمان‌ها" };
  }

  // پیش‌فرض: ماه جاری یا ماه انتخاب‌شده
  const monthStr = sp.month || currentJalaliMonth();
  const range = jalaliMonthToRange(monthStr);
  if (range) {
    return {
      mode: "month",
      from: range.from,
      to: range.to,
      label: toPersianDigits(monthStr),
      jalaliFrom: `${monthStr}/01`,
      jalaliTo: `${monthStr}/${String(jalaaliMonthLength(Number(monthStr.split("/")[0]), Number(monthStr.split("/")[1]))).padStart(2,"0")}`,
    };
  }
  // fallback
  const curRange = jalaliMonthToRange(currentJalaliMonth())!;
  return {
    mode: "month",
    from: curRange.from,
    to: curRange.to,
    label: toPersianDigits(currentJalaliMonth()),
  };
}

/** برای نمایش بازه در هدر */
export function formatPeriodLabel(p: ResolvedPeriod): string {
  return p.label;
}

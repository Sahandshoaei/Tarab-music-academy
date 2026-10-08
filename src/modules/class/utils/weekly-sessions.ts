// تولید تاریخ‌های جلسات سری هفتگی (سند طراحی §۶.۲) — خالص و بدون DB
// (هم در سرویس سرور استفاده می‌شود، هم برای پیش‌نمایش فرم در کلاینت — U3)
import type { Weekday } from "@prisma/client";

/** نگاشت enum پریسما (شنبه=SATURDAY) → getUTCDay جاوااسکریپت (یکشنبه=0) */
export const WEEKDAY_TO_JS: Record<Weekday, number> = {
  SATURDAY: 6,
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
};

/** نگاشت معکوس — برای نمایش روزِ یک Date */
export const JS_TO_WEEKDAY: Record<number, Weekday> = {
  0: "SUNDAY",
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
  6: "SATURDAY",
};

/** ترتیب نمایش هفته ایرانی — شنبه تا جمعه */
export const WEEKDAY_ORDER: Weekday[] = [
  "SATURDAY",
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
];

/**
 * §۶.۲ — همه تاریخ‌های weekday از max(شروع ترم، امروز) تا پایان ترم (شامل).
 * همه تاریخ‌ها نیمه‌شب UTC (قرارداد @db.Date).
 * توجه: «weekday تعطیل» قبلاً در سرویس رد می‌شود (§۶.4-2) — این تابع
 * فقط تاریخ می‌سازد و درباره تعطیلی تصمیم نمی‌گیرد.
 * بند ۱۰: تعطیلات رسمی (Holiday) در سرویس فیلتر می‌شود — این تابع خالص می‌ماند
 * ولی برای تست، پارامتر اختیاری holidayDates پشتیبانی می‌شود.
 */
export function generateWeeklySessionDates(opts: {
  termStart: Date;
  termEnd: Date;
  today: Date;
  weekday: Weekday;
  holidayDates?: Set<string>; // ISO YYYY-MM-DD
}): Date[] {
  const jsDay = WEEKDAY_TO_JS[opts.weekday];
  const start =
    opts.termStart.getTime() > opts.today.getTime()
      ? opts.termStart
      : opts.today;
  const dates: Date[] = [];
  for (
    let t = new Date(start.getTime());
    t.getTime() <= opts.termEnd.getTime();
    t = nextDay(t)
  ) {
    if (t.getUTCDay() !== jsDay) continue;
    if (opts.holidayDates?.has(t.toISOString().slice(0, 10))) continue; // بند ۱۰ — تعطیل رسمی جزو جلسه نیست
    dates.push(new Date(t.getTime()));
  }
  return dates;
}

/** فیلتر تعطیلات رسمی از لیست تاریخ‌ها — بند ۱۰ */
export function filterHolidays(dates: Date[], holidayDates: Set<string>): Date[] {
  if (holidayDates.size === 0) return dates;
  return dates.filter((d) => !holidayDates.has(d.toISOString().slice(0, 10)));
}

function nextDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1),
  );
}

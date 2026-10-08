// تست تولید تاریخ جلسات سری (§۶.۲) — خالص، بدون DB
import { describe, expect, it } from "vitest";
import { generateWeeklySessionDates } from "./weekly-sessions";

// ترم تابستان ۱۴۰۵ (seed): ۲۲ ژوئن تا ۲۲ سپتامبر ۲۰۲۶
const TERM_START = new Date("2026-06-22");
const TERM_END = new Date("2026-09-22");

describe("generateWeeklySessionDates (§۶.۲)", () => {
  it("از max(شروع ترم، امروز) شروع می‌کند — امروز دوشنبه ۱۴ سپتامبر", () => {
    const today = new Date("2026-09-14");
    // شنبه‌ها: فقط ۱۹ سپتامبر (۱۲ سپتامبر قبل از امروز است)
    expect(generateWeeklySessionDates({ termStart: TERM_START, termEnd: TERM_END, today, weekday: "SATURDAY" }))
      .toEqual([new Date("2026-09-19")]);
    // دوشنبه‌ها: ۱۴ و ۲۱
    expect(generateWeeklySessionDates({ termStart: TERM_START, termEnd: TERM_END, today, weekday: "MONDAY" }))
      .toEqual([new Date("2026-09-14"), new Date("2026-09-21")]);
  });

  it("وقتی امروز قبل از شروع ترم است، از شروع ترم می‌شمارد", () => {
    const today = new Date("2026-06-01");
    const dates = generateWeeklySessionDates({ termStart: TERM_START, termEnd: TERM_END, today, weekday: "WEDNESDAY" });
    // چهارشنبه‌ها از ۲۴ ژوئن شروع می‌شوند
    expect(dates[0]).toEqual(new Date("2026-06-24"));
    expect(dates.length).toBe(13); // ۲۴ ژوئن تا ۱۶ سپتامبر
  });

  it("پایان ترم شامل است (۲۲ سپتامبر سه‌شنبه)", () => {
    const today = new Date("2026-09-14");
    const dates = generateWeeklySessionDates({ termStart: TERM_START, termEnd: TERM_END, today, weekday: "TUESDAY" });
    expect(dates).toEqual([new Date("2026-09-15"), new Date("2026-09-22")]);
  });

  it("اگر ترم گذشته باشد، خالی برمی‌گرداند", () => {
    expect(
      generateWeeklySessionDates({ termStart: TERM_START, termEnd: TERM_END, today: new Date("2026-10-01"), weekday: "MONDAY" }),
    ).toEqual([]);
  });
});

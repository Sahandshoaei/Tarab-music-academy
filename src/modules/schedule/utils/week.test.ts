// تست ابزار هفته ایرانی — خالص
import { describe, expect, it } from "vitest";
import { addDays, formatWeekRange, parseWeekParam, saturdayOf, weekDays } from "./week";

describe("saturdayOf", () => {
  it("دوشنبه ۱۴ سپتامبر → شنبه ۱۲ سپتامبر", () => {
    expect(saturdayOf(new Date("2026-09-14"))).toEqual(new Date("2026-09-12"));
  });
  it("خود شنبه → خودش", () => {
    expect(saturdayOf(new Date("2026-09-12"))).toEqual(new Date("2026-09-12"));
  });
  it("جمعه ۱۱ سپتامبر → شنبه ۵ سپتامبر", () => {
    expect(saturdayOf(new Date("2026-09-11"))).toEqual(new Date("2026-09-05"));
  });
});

describe("weekDays", () => {
  it("۷ روز از شنبه تا جمعه", () => {
    const days = weekDays(new Date("2026-09-12"));
    expect(days).toHaveLength(7);
    expect(days[0]).toEqual(new Date("2026-09-12"));
    expect(days[6]).toEqual(new Date("2026-09-18"));
    expect(days.map((d) => d.getUTCDay())).toEqual([6, 0, 1, 2, 3, 4, 5]);
  });
});

describe("formatWeekRange", () => {
  it("داخل یک ماه", () => {
    expect(formatWeekRange(new Date("2026-09-12"))).toBe("۲۱ تا ۲۷ شهریور ۱۴۰۵");
  });
  it("عبور از ماه (۲۹ مرداد تا ۴ شهریور)", () => {
    expect(formatWeekRange(new Date("2026-08-20"))).toBe("۲۹ مرداد تا ۴ شهریور ۱۴۰۵");
  });
});

describe("parseWeekParam", () => {
  it("معتبر → همان تاریخ", () => {
    expect(parseWeekParam("2026-09-14")).toEqual(new Date("2026-09-14"));
  });
  it("نامعتبر/خالی → امروز", () => {
    const today = parseWeekParam(undefined);
    expect(today.getUTCHours()).toBe(0);
  });
  it("addDays رفت و برگشت", () => {
    expect(addDays(new Date("2026-09-12"), 7)).toEqual(new Date("2026-09-19"));
  });
});

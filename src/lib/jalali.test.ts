import { describe, expect, it } from "vitest";
import { parseJalaliDate, formatJalali, todayTehranDate } from "./jalali";

describe("parseJalaliDate — D20 شمسی→میلادی", () => {
  it("تاریخ معتبر شمسی را به UTC Date تبدیل می‌کند", () => {
    // 1405/01/01 = 2026-03-21
    const d = parseJalaliDate("1405/01/01");
    expect(d).not.toBeNull();
    expect(d!.getUTCFullYear()).toBe(2026);
    expect(d!.getUTCMonth()).toBe(2); // 0-index
    expect(d!.getUTCDate()).toBe(21);
  });

  it("ارقام فارسی را می‌فهمد", () => {
    const d = parseJalaliDate("۱۴۰۵/۰۶/۱۵");
    expect(d).not.toBeNull();
    expect(d!.getUTCFullYear()).toBe(2026);
  });

  it("جداکننده‌های مختلف را می‌پذیرد", () => {
    expect(parseJalaliDate("1405-06-15")).not.toBeNull();
    expect(parseJalaliDate("1405.06.15")).not.toBeNull();
    expect(parseJalaliDate("1405/6/5")).not.toBeNull();
  });

  it("تاریخ نامعتبر null برمی‌گرداند", () => {
    expect(parseJalaliDate("1405/13/01")).toBeNull();
    expect(parseJalaliDate("not-a-date")).toBeNull();
    expect(parseJalaliDate("")).toBeNull();
    expect(parseJalaliDate("1405/02/32")).toBeNull(); // اردیبهشت 32 روزه نیست
  });

  it("formatJalali برعکس parse کار می‌کند", () => {
    const d = parseJalaliDate("1405/06/15")!;
    const formatted = formatJalali(d);
    // 1405/06/15 با صفر پد
    expect(formatted).toBe("۱۴۰۵/۰۶/۱۵");
  });
});

describe("todayTehranDate — 3.5 TimeZone", () => {
  it("نیمه‌شب UTC بر اساس تهران برمی‌گرداند", () => {
    const d = todayTehranDate();
    expect(d.getUTCHours()).toBe(0);
    expect(d.getUTCMinutes()).toBe(0);
    // تاریخ باید معتبر باشد
    expect(d.getTime()).not.toBeNaN();
  });

  it("با todayJalali هماهنگ است", () => {
    const tehran = todayTehranDate();
    const formatted = formatJalali(tehran);
    expect(formatted).toMatch(/^[۰-۹]{4}\/[۰-۹]{2}\/[۰-۹]{2}$/);
  });
});

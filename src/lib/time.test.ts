// تست اعتبارسنج زمان "HH:mm" — خالص، بدون DB
import { describe, expect, it } from "vitest";
import { isWithinHours, isValidTimeRange, parseTime } from "./time";

describe("parseTime", () => {
  it("ارقام فارسی و تک‌رقمی را نرمال می‌کند", () => {
    expect(parseTime("۹:۳۰")).toBe("09:30");
    expect(parseTime("۱۶:۰۰")).toBe("16:00");
    expect(parseTime("9:5")).toBe("09:05");
    expect(parseTime("16:00")).toBe("16:00");
  });
  it("ورودی نامعتبر را null برمی‌گرداند", () => {
    expect(parseTime("24:00")).toBeNull();
    expect(parseTime("16:60")).toBeNull();
    expect(parseTime("1600")).toBeNull();
    expect(parseTime("")).toBeNull();
    expect(parseTime("۱۶")).toBeNull();
  });
});

describe("isValidTimeRange", () => {
  it("شروع < پایان", () => {
    expect(isValidTimeRange("09:00", "17:00")).toBe(true);
    expect(isValidTimeRange("17:00", "09:00")).toBe(false);
    expect(isValidTimeRange("16:00", "16:00")).toBe(false);
  });
});

describe("isWithinHours (F4-AC5)", () => {
  it("داخل بازه کاری", () => {
    expect(isWithinHours("09:00", "21:00", "09:00", "21:00")).toBe(true);
    expect(isWithinHours("16:00", "17:30", "09:00", "21:00")).toBe(true);
  });
  it("بیرون بازه کاری", () => {
    expect(isWithinHours("08:00", "10:00", "09:00", "21:00")).toBe(false);
    expect(isWithinHours("20:00", "22:00", "09:00", "21:00")).toBe(false);
  });
});

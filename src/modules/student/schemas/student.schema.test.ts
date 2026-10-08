// تست اسکیمای فرم هنرجو (F2) — اعتبارسنجی خالص، بدون DB
import { describe, expect, it } from "vitest";
import { studentSchema } from "./student.schema";

const valid = {
  fullName: "آرش کاظمی",
  nationalId: "1234567891", // رقم کنترل صحیح: جمع وزنی ۹ رقم اول = ۲۱۰ → check = 1
  phone: "09121112233",
  guardianPhone: "09123334455",
  registrationDate: "1405/06/15",
  instrumentIds: ["1"],
};

describe("studentSchema (F2-AC1..AC4)", () => {
  it("payload کامل معتبر پاس می‌شود", () => {
    expect(studentSchema.safeParse(valid).success).toBe(true);
  });

  it("کد ملی با رقم کنترل غلط رد می‌شود (F2-AC3)", () => {
    expect(studentSchema.safeParse({ ...valid, nationalId: "1234567892" }).success).toBe(false);
  });

  it("کد ملی با ارقام فارسی هم قبول می‌شود (نرمال‌سازی ورودی)", () => {
    expect(studentSchema.safeParse({ ...valid, nationalId: "۱۲۳۴۵۶۷۸۹۱" }).success).toBe(true);
  });

  it("موبایل نامعتبر رد می‌شود (F2-AC2)", () => {
    expect(studentSchema.safeParse({ ...valid, phone: "0912111223" }).success).toBe(false);
  });

  it("بدون ساز رد می‌شود (F2-AC4)", () => {
    expect(studentSchema.safeParse({ ...valid, instrumentIds: [] }).success).toBe(false);
  });

  it("منبع «سایر» بدون توضیح رد می‌شود", () => {
    expect(
      studentSchema.safeParse({ ...valid, referralSource: "OTHER" }).success,
    ).toBe(false);
  });

  it("منبع «سایر» با توضیح پاس می‌شود", () => {
    expect(
      studentSchema.safeParse({
        ...valid,
        referralSource: "OTHER",
        referralNote: "سایت آموزشگاه",
      }).success,
    ).toBe(true);
  });

  it("تاریخ ثبت‌نام نامعتبر رد می‌شود (ماه ۱۳)", () => {
    expect(
      studentSchema.safeParse({ ...valid, registrationDate: "1405/13/01" }).success,
    ).toBe(false);
  });

  it("تاریخ با جداکننده - و ارقام فارسی پاس می‌شود (D20)", () => {
    expect(
      studentSchema.safeParse({ ...valid, registrationDate: "۱۴۰۵-۶-۱۵" }).success,
    ).toBe(true);
  });
});

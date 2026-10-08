// تست اسکیمای حضور و غیاب (F5) — خالص، بدون DB
import { describe, expect, it } from "vitest";
import { setAttendanceSchema } from "./attendance.schema";

const valid = {
  sessionId: 1,
  entries: [
    { studentId: 1, status: "PRESENT" },
    { studentId: 2, status: "EXCUSED", note: "امتحان مدرسه" },
  ],
};

describe("setAttendanceSchema", () => {
  it("payload معتبر پاس می‌شود", () => {
    expect(setAttendanceSchema.safeParse(valid).success).toBe(true);
  });

  it("غیبت موجه بدون دلیل رد می‌شود (مصوب ایست ۲)", () => {
    expect(
      setAttendanceSchema.safeParse({
        sessionId: 1,
        entries: [{ studentId: 1, status: "EXCUSED" }],
      }).success,
    ).toBe(false);
  });

  it("status null مجاز است — حذف رکورد / برگشت به ثبت‌نشده (AC4)", () => {
    expect(
      setAttendanceSchema.safeParse({
        sessionId: 1,
        entries: [{ studentId: 1, status: null }],
      }).success,
    ).toBe(true);
  });

  it("وضعیت نامعتبر رد می‌شود", () => {
    expect(
      setAttendanceSchema.safeParse({
        sessionId: 1,
        entries: [{ studentId: 1, status: "LATE" }],
      }).success,
    ).toBe(false);
  });

  it("دلیل حداکثر ۲۰۰ کاراکتر", () => {
    expect(
      setAttendanceSchema.safeParse({
        sessionId: 1,
        entries: [{ studentId: 1, status: "EXCUSED", note: "ا".repeat(201) }],
      }).success,
    ).toBe(false);
  });
});

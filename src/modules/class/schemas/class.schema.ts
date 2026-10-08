// Zod — فرم کلاس (F4) و جلسه (ثبت دستی AD_HOC / ویرایش تک‌جلسه F4-AC7)
import { z } from "zod";
import { parseJalaliDate } from "@/lib/jalali";
import { parseTime } from "@/lib/time";

const WEEKDAY_VALUES = [
  "SATURDAY",
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
] as const;

const timeField = (label: string) =>
  z.string().refine((v) => parseTime(v) !== null, `${label} معتبر نیست (مثل ۱۶:۳۰)`);

export const classSchema = z
  .object({
    title: z.string().trim().max(100, "برچسب حداکثر ۱۰۰ کاراکتر").optional(),
    classType: z.enum(["PRIVATE", "GROUP", "SEMI_GROUP", "PRACTICE"]),
    scheduleType: z.enum(["WEEKLY", "SINGLE", "AD_HOC"]),
    instrumentId: z.string().min(1, "ساز الزامی است"),
    teacherId: z.string().min(1, "استاد الزامی است"),
    roomId: z.string().min(1, "اتاق الزامی است"),
    weekday: z.enum(WEEKDAY_VALUES).optional(),
    // تک‌جلسه — تاریخ دلخواه ادمین (شمسی YYYY/MM/DD)
    singleDate: z.string().optional(),
    startTime: timeField("ساعت شروع").optional(),
    endTime: timeField("ساعت پایان").optional(),
    notes: z.string().trim().max(500, "یادداشت حداکثر ۵۰۰ کاراکتر").optional(),
    studentIds: z.array(z.string()),
  })
  .superRefine((v, ctx) => {
    // WEEKLY: یک روز هفته + ساعت
    if (v.scheduleType === "WEEKLY") {
      if (!v.weekday)
        ctx.addIssue({ code: "custom", path: ["weekday"], message: "روز هفته الزامی است" });
      if (!v.startTime)
        ctx.addIssue({ code: "custom", path: ["startTime"], message: "ساعت شروع الزامی است" });
      if (!v.endTime)
        ctx.addIssue({ code: "custom", path: ["endTime"], message: "ساعت پایان الزامی است" });
      else if (v.startTime && parseTime(v.startTime)! >= parseTime(v.endTime)!) {
        ctx.addIssue({
          code: "custom",
          path: ["endTime"],
          message: "ساعت پایان باید بعد از ساعت شروع باشد",
        });
      }
    }
    // SINGLE: یک تاریخ دلخواه + ساعت
    if (v.scheduleType === "SINGLE") {
      if (!v.singleDate || parseJalaliDate(v.singleDate) === null) {
        ctx.addIssue({ code: "custom", path: ["singleDate"], message: "تاریخ جلسه الزامی است (مثل ۱۴۰۴/۱۰/۱۲)" });
      }
      if (!v.startTime)
        ctx.addIssue({ code: "custom", path: ["startTime"], message: "ساعت شروع الزامی است" });
      if (!v.endTime)
        ctx.addIssue({ code: "custom", path: ["endTime"], message: "ساعت پایان الزامی است" });
      else if (v.startTime && parseTime(v.startTime)! >= parseTime(v.endTime)!) {
        ctx.addIssue({
          code: "custom",
          path: ["endTime"],
          message: "ساعت پایان باید بعد از ساعت شروع باشد",
        });
      }
    }
  });

export type ClassFormValues = z.infer<typeof classSchema>;

// ── جلسه — ثبت دستی (AD_HOC) و ویرایش تک‌جلسه (F4-AC7) ──
export const sessionSchema = z
  .object({
    date: z
      .string()
      .refine((v) => parseJalaliDate(v) !== null, "تاریخ معتبر نیست (مثل ۱۴۰۵/۰۶/۲۰)"),
    startTime: timeField("ساعت شروع"),
    endTime: timeField("ساعت پایان"),
    roomId: z.string().min(1, "اتاق الزامی است"),
    teacherId: z.string().min(1, "استاد الزامی است"),
    notes: z.string().trim().max(500, "یادداشت حداکثر ۵۰۰ کاراکتر").optional(),
  })
  .refine((v) => parseTime(v.startTime)! < parseTime(v.endTime)!, {
    message: "ساعت پایان باید بعد از ساعت شروع باشد",
    path: ["endTime"],
  });

export type SessionFormValues = z.infer<typeof sessionSchema>;

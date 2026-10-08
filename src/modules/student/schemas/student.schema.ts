// Zod — فرم هنرجو (F2): AC1 فیلدهای الزامی · AC2 موبایل · AC3 کد ملی · AC4 چند ساز
import { z } from "zod";
import { parseJalaliDate } from "@/lib/jalali";
import { isValidMobile, isValidNationalId } from "@/validations/validators";

export const studentSchema = z
  .object({
    fullName: z.string().trim().min(2, "نام و نام‌خانوادگی الزامی است"),
    nationalId: z
      .string()
      .refine(isValidNationalId, "کد ملی معتبر نیست (۱۰ رقم با رقم کنترل صحیح)"),
    phone: z
      .string()
      .refine(isValidMobile, "شماره موبایل هنرجو معتبر نیست (۰۹xxxxxxxxx)"),
    guardianPhone: z
      .string()
      .refine(isValidMobile, "شماره موبایل قوم نزدیک معتبر نیست (۰۹xxxxxxxxx)"),
    address: z.string().trim().max(300, "آدرس حداکثر ۳۰۰ کاراکتر").optional(),
    registrationDate: z
      .string()
      .refine(
        (v) => parseJalaliDate(v) !== null,
        "تاریخ ثبت‌نام معتبر نیست (مثل ۱۴۰۵/۰۶/۱۵)",
      ),
    referralSource: z.enum(["FRIENDS", "INSTAGRAM", "SIGN", "OTHER"]).optional(),
    referralNote: z.string().trim().max(200, "توضیح حداکثر ۲۰۰ کاراکتر").optional(),
    notes: z.string().trim().max(500, "یادداشت حداکثر ۵۰۰ کاراکتر").optional(),
    instrumentIds: z
      .array(z.string())
      .min(1, "حداقل یک ساز انتخاب کنید (F2-AC4)"),
  })
  .refine((v) => v.referralSource !== "OTHER" || !!v.referralNote?.trim(), {
    message: "برای منبع «سایر»، توضیح الزامی است",
    path: ["referralNote"],
  });

export type StudentFormValues = z.infer<typeof studentSchema>;

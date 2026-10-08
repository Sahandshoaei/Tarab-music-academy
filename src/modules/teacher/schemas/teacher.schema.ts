// Zod — فرم استاد (F3 + پروفایل تکمیلی فاز ۶)
import { z } from "zod";
import { parseJalaliDate } from "@/lib/jalali";
import { isValidCardNumber, isValidMobile, isValidSheba } from "@/validations/validators";

export const teacherSchema = z.object({
  fullName: z.string().trim().min(2, "نام و نام‌خانوادگی الزامی است"),
  phone: z.string().refine(isValidMobile, "شماره موبایل معتبر نیست (۰۹xxxxxxxxx)"),
  instrumentIds: z.array(z.string()).min(1, "حداقل یک ساز تدریسی انتخاب کنید (F3-AC1)"),
  notes: z.string().trim().max(500, "یادداشت حداکثر ۵۰۰ کاراکتر").optional(),

  // ── پروفایل تکمیلی — همه اختیاری ──
  birthDate: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || parseJalaliDate(v) !== null, "تاریخ تولد معتبر نیست (مثل ۱۳۷۰/۰۱/۱۵)"),
  insuranceType: z.enum(["TAMIN_EJTEMAEI", "SALAMAT", "OTHER"]).optional(),
  insuranceNumber: z.string().trim().max(30, "شماره بیمه حداکثر ۳۰ کاراکتر").optional(),
  teachingExperienceYears: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || (/^\d+$/.test(v) && Number(v) >= 0 && Number(v) <= 60), "سابقه ۰ تا ۶۰ سال"),
  teachingExperienceNote: z.string().trim().max(500, "توضیح سابقه حداکثر ۵۰۰ کاراکتر").optional(),
  isQualified: z.string().optional(), // checkbox → "on" / undefined
  qualificationNote: z.string().trim().max(500, "توضیح صلاحیت حداکثر ۵۰۰ کاراکتر").optional(),
  cardNumber: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || isValidCardNumber(v), "شماره کارت معتبر نیست (۱۶ رقم)"),
  sheba: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || isValidSheba(v), "شماره شبا معتبر نیست (IR + ۲۴ رقم)"),
});

export type TeacherFormValues = z.infer<typeof teacherSchema>;

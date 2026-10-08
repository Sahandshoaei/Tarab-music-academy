// Zod — فرم تنظیمات آموزشگاه (ساعات کاری + روزهای تعطیل — F4-AC5) + نرخ شهریه
import { z } from "zod";
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

export const settingsSchema = z
  .object({
    schoolName: z.string().trim().max(100, "نام حداکثر ۱۰۰ کاراکتر").optional(),
    openTime: z.string().refine((v) => parseTime(v) !== null, "ساعت شروع معتبر نیست (مثل ۰۹:۰۰)"),
    closeTime: z.string().refine((v) => parseTime(v) !== null, "ساعت پایان معتبر نیست (مثل ۲۱:۰۰)"),
    closedDays: z.array(z.enum(WEEKDAY_VALUES)),
  })
  .refine((v) => parseTime(v.openTime)! < parseTime(v.closeTime)!, {
    message: "ساعت پایان باید بعد از ساعت شروع باشد",
    path: ["closeTime"],
  });

export const tuitionRatesSchema = z.object({
  privateRate: z.coerce.number().int().min(0, "نرخ نامعتبر").max(1_000_000_000).optional().nullable(),
  groupRate: z.coerce.number().int().min(0).max(1_000_000_000).optional().nullable(),
  semiGroupRate: z.coerce.number().int().min(0).max(1_000_000_000).optional().nullable(),
  practiceRate: z.coerce.number().int().min(0).max(1_000_000_000).optional().nullable(),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;
export type TuitionRatesFormValues = z.infer<typeof tuitionRatesSchema>;

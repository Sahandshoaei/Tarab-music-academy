// Zod — فرم ترم (F0-AC1)
import { z } from "zod";
import { parseJalaliDate } from "@/lib/jalali";

export const termSchema = z
  .object({
    name: z.string().trim().min(1, "نام ترم الزامی است"),
    startDate: z
      .string()
      .refine((v) => parseJalaliDate(v) !== null, "تاریخ شروع معتبر نیست (مثل ۱۴۰۵/۰۷/۰۱)"),
    endDate: z
      .string()
      .refine((v) => parseJalaliDate(v) !== null, "تاریخ پایان معتبر نیست"),
  })
  .refine(
    (d) => {
      const s = parseJalaliDate(d.startDate);
      const e = parseJalaliDate(d.endDate);
      return s !== null && e !== null && s < e;
    },
    { message: "تاریخ پایان باید بعد از تاریخ شروع باشد", path: ["endDate"] },
  );

export type TermFormValues = z.infer<typeof termSchema>;

import { z } from "zod";
import { isValidJalaliDate } from "@/lib/jalali";

export const tuitionPaymentSchema = z.object({
  studentId: z.coerce.number().int().positive(),
  amount: z.coerce.number().int().min(1000, "مبلغ حداقل ۱۰۰۰ تومان"),
  paidAt: z.string().refine(isValidJalaliDate, "تاریخ شمسی نامعتبر است (۱۴۰۴/۰۷/۰۸)"),
  note: z.string().max(500).optional().or(z.literal("")),
  classIds: z.array(z.coerce.number().int().positive()).min(1, "حداقل یک کلاس انتخاب کنید"),
});

export type TuitionPaymentInput = z.infer<typeof tuitionPaymentSchema>;

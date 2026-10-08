import { z } from "zod";

export const generalExpenseCategorySchema = z.enum([
  "CLEANING",
  "ELECTRICITY",
  "GAS",
  "WATER",
  "RENT",
  "OTHER",
]);

export const createGeneralExpenseSchema = z.object({
  title: z.string().trim().min(2, "عنوان حداقل ۲ حرف").max(100, "عنوان حداکثر ۱۰۰ حرف"),
  category: generalExpenseCategorySchema,
  amount: z.coerce.number().int("مبلغ عدد صحیح").min(1, "مبلغ باید مثبت باشد").max(1_000_000_000, "مبلغ بیش از حد مجاز"),
  paidAt: z.string().min(1, "تاریخ الزامی است"),
  note: z.string().trim().max(500, "توضیح حداکثر ۵۰۰ حرف").optional().or(z.literal("")),
});

export type CreateGeneralExpenseInput = z.infer<typeof createGeneralExpenseSchema>;

export const updateGeneralExpenseSchema = createGeneralExpenseSchema.partial().extend({
  id: z.coerce.number().int().positive(),
});

export type UpdateGeneralExpenseInput = z.infer<typeof updateGeneralExpenseSchema>;

import { z } from "zod";

export const audienceTypeEnum = z.enum(["INDIVIDUAL", "CLASS", "INSTRUMENT", "ALL_ACTIVE", "DYNAMIC"]);

export const composeSchema = z.object({
  label: z.string().trim().min(2, "عنوان ارسال الزامی است").max(100, "عنوان حداکثر ۱۰۰ کاراکتر"),
  audienceType: audienceTypeEnum,
  // بسته به نوع، یکی از این‌ها پر می‌شود (اعتبارسنجی در سرویس کامل می‌شود)
  audienceValue: z.string().trim().optional(),
  studentIds: z.array(z.string()).optional(), // برای INDIVIDUAL
  phoneTarget: z.enum(["STUDENT", "GUARDIAN"]),
  templateId: z.string().trim().optional(),
  body: z.string().trim().min(5, "متن پیام حداقل ۵ کاراکتر").max(1000, "متن حداکثر ۱۰۰۰ کاراکتر"),
});

export type ComposeFormValues = z.infer<typeof composeSchema>;

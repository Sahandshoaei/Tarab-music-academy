import { z } from "zod";

export const templateSchema = z.object({
  title: z.string().trim().min(2, "عنوان حداقل ۲ کاراکتر").max(100, "عنوان حداکثر ۱۰۰ کاراکتر"),
  body: z.string().trim().min(5, "متن قالب حداقل ۵ کاراکتر").max(500, "متن حداکثر ۵۰۰ کاراکتر"),
  isActive: z.boolean().optional().default(true),
});

export type TemplateFormValues = z.infer<typeof templateSchema>;

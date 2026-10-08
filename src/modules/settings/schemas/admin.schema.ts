import { z } from "zod";

export const adminAccountSchema = z
  .object({
    name: z.string().trim().min(2, "نام حداقل ۲ کاراکتر").max(100).optional().or(z.literal("")),
    email: z.string().trim().email("ایمیل نامعتبر").min(1, "ایمیل الزامی است"),
    currentPassword: z.string().min(1, "رمز فعلی الزامی است"),
    newPassword: z.string().trim().min(6, "رمز جدید حداقل ۶ کاراکتر").max(100).optional().or(z.literal("")),
    confirmNewPassword: z.string().trim().optional().or(z.literal("")),
  })
  .superRefine((v, ctx) => {
    if (v.newPassword) {
      if (!v.confirmNewPassword) {
        ctx.addIssue({ code: "custom", path: ["confirmNewPassword"], message: "تکرار رمز جدید الزامی است" });
      } else if (v.newPassword !== v.confirmNewPassword) {
        ctx.addIssue({ code: "custom", path: ["confirmNewPassword"], message: "تکرار رمز با رمز جدید مطابقت ندارد" });
      }
    }
  });

export type AdminAccountInput = z.infer<typeof adminAccountSchema>;

import { z } from "zod";

export const instrumentSchema = z.object({
  name: z.string().trim().min(1, "نام ساز الزامی است").max(50, "نام ساز حداکثر ۵۰ کاراکتر"),
});

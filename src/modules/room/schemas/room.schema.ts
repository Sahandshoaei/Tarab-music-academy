import { z } from "zod";

export const roomSchema = z.object({
  name: z.string().trim().min(1, "نام اتاق الزامی است").max(50),
});

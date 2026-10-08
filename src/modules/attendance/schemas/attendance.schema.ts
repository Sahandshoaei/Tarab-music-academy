// Zod — ثبت حضور و غیاب (F5) · AC1 سه وضعیت · دلیل موجه اجباری (مصوب ایست ۲)
import { z } from "zod";

export const attendanceEntrySchema = z
  .object({
    studentId: z.number().int(),
    // null = حذف رکورد → برگشت به «ثبت‌نشده» (AC4)
    status: z.enum(["PRESENT", "ABSENT", "EXCUSED"]).nullable(),
    note: z.string().trim().max(200, "دلیل حداکثر ۲۰۰ کاراکتر").optional(),
  })
  .refine((v) => v.status !== "EXCUSED" || !!v.note?.trim(), {
    message: "دلیل غیبت موجه الزامی است",
    path: ["note"],
  });

export const setAttendanceSchema = z.object({
  sessionId: z.number().int(),
  entries: z.array(attendanceEntrySchema),
});

export type AttendanceEntryValue = z.infer<typeof attendanceEntrySchema>;

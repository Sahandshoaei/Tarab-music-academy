import { prisma } from "@/lib/prisma";
import type { AttendanceStatus } from "@prisma/client";

export interface AttendanceWrite {
  studentId: number;
  status: AttendanceStatus | null; // null → حذف رکورد (برگشت به ثبت‌نشده — AC4)
  note?: string;
}

/**
 * ذخیره دسته‌ای در تراکنش — upsert روی (sessionId, studentId)؛
 * status=null یعنی حذف رکورد (ادمین اشتباه را به «ثبت‌نشده» برمی‌گرداند)
 */
export function saveAttendance(
  sessionId: number,
  entries: AttendanceWrite[],
  recordedById?: string,
) {
  return prisma.$transaction(async (tx) => {
    for (const e of entries) {
      if (e.status === null) {
        await tx.attendance.deleteMany({
          where: { sessionId, studentId: e.studentId },
        });
      } else {
        await tx.attendance.upsert({
          where: { sessionId_studentId: { sessionId, studentId: e.studentId } },
          update: {
            status: e.status,
            note: e.note ?? null,
            ...(recordedById ? { recordedById } : {}),
          },
          create: {
            sessionId,
            studentId: e.studentId,
            status: e.status,
            note: e.note ?? null,
            ...(recordedById ? { recordedById } : {}),
          },
        });
      }
    }
  });
}

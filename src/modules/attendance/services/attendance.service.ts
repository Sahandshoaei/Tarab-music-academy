// ═══════════════════════════════════════════════════════════════════════════
//  منطق کسب‌وکار حضور و غیاب (F5)
//  AC1 سه وضعیت برای جلسات برگزارشده · AC2 جلسه آینده ممنوع
//  (تصمیم ایست ۲: امروز مجاز — ثبت سر کلاس، U5) · AC4 نبود رکورد = ثبت‌نشده
// ═══════════════════════════════════════════════════════════════════════════
import { todayUtcDate } from "@/lib/jalali";
import { setAttendanceSchema } from "../schemas/attendance.schema";
import * as repo from "../repositories/attendance.repository";
import { findSessionById } from "@/modules/class/repositories/class.repository";

export class AttendanceServiceError extends Error {}

/**
 * ثبت/ویرایش دسته‌ای حضور و غیاب یک جلسه.
 * فقط برای هنرجویانِ دارای ثبت‌نام فعال در کلاس (F2-AC8).
 */
export async function setAttendance(
  input: unknown,
  recordedById?: string,
) {
  const values = setAttendanceSchema.parse(input);

  const session = await findSessionById(values.sessionId);
  if (!session) throw new AttendanceServiceError("جلسه یافت نشد.");

  // F5-AC2 — جلسات آینده قابل ثبت نیستند (امروز مجاز است — مصوب ایست ۲، U5)
  if (session.date.getTime() > todayUtcDate().getTime()) {
    throw new AttendanceServiceError(
      "جلسات آینده قابل ثبت حضور و غیاب نیستند (F5-AC2).",
    );
  }
  // جلسه لغوشده = برگزارنشده
  if (session.status === "CANCELLED") {
    throw new AttendanceServiceError("جلسه لغوشده قابل ثبت حضور و غیاب نیست.");
  }

  const activeIds = new Set(session.class.enrollments.map((e) => e.studentId));
  for (const e of values.entries) {
    if (!activeIds.has(e.studentId)) {
      throw new AttendanceServiceError(
        "یکی از هنرجویان در این کلاس ثبت‌نام فعال ندارد.",
      );
    }
  }

  await repo.saveAttendance(
    values.sessionId,
    values.entries.map((e) => ({
      studentId: e.studentId,
      status: e.status,
      note: e.status === "EXCUSED" ? e.note : undefined,
    })),
    recordedById,
  );

  // ── نوتیف لحظه‌ای — غیبت + ۳ غیبت متوالی ──
  try {
    const { notify } = await import("@/modules/notification/services/notification.service");
    const { prisma } = await import("@/lib/prisma");
    for (const e of values.entries) {
      if (e.status === "ABSENT") {
        const st = await prisma.student.findUnique({ where: { id: e.studentId }, select: { fullName: true } });
        if (st) await notify.absent(st.fullName, session.class.title || session.class.instrument.name, `/sessions/${session.id}`);
        // چک ۳ غیبت متوالی (ساده: ۳ جلسه اخیر همین کلاس)
        const recent = await prisma.classSession.findMany({
          where: { classId: session.classId, status: "SCHEDULED", date: { lt: new Date() } },
          orderBy: { date: "desc" },
          take: 3,
          select: { id: true, attendance: { where: { studentId: e.studentId }, select: { status: true } } },
        });
        const allAbsent = recent.length === 3 && recent.every((s) => s.attendance[0]?.status === "ABSENT");
        if (allAbsent) await notify.threeAbsences(st!.fullName, `/students/${e.studentId}`);
      }
    }
  } catch {}

}

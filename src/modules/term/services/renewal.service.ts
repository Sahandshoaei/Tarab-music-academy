import { prisma } from "@/lib/prisma";
import { todayUtcDate } from "@/lib/jalali";

export interface RenewalStudent {
  studentId: number;
  fullName: string;
  phone: string;
  classTitle: string;
  termName: string;
  termEndDate: Date;
}

/**
 * بند ۷ — هنرجویان ترم رو به اتمام (فقط یادآوری، آزادسازی دستی)
 * فعال‌ترین ترم + ثبت‌نام‌های فعال + پایان ترم در N روز آینده
 */
export async function getStudentsNeedingRenewal(daysBefore = 7): Promise<RenewalStudent[]> {
  const activeTerm = await prisma.term.findFirst({ where: { isActive: true } });
  if (!activeTerm) return [];

  const today = todayUtcDate();
  const endThreshold = new Date(today);
  endThreshold.setUTCDate(endThreshold.getUTCDate() + daysBefore);

  // اگر ترم هنوز خیلی مانده، خالی
  if (activeTerm.endDate > endThreshold) return [];

  // اگر ترم تمام شده، هم برگردان (برای یادآوری دیرکرد)
  const enrollments = await prisma.enrollment.findMany({
    where: {
      isActive: true,
      class: { termId: activeTerm.id, isActive: true },
      student: { isActive: true },
    },
    include: {
      student: { select: { id: true, fullName: true, phone: true } },
      class: { select: { title: true, instrument: { select: { name: true } } } },
    },
  });

  // dedupe by studentId (یک هنرجو ممکن است ۲ کلاس داشته باشد)
  const map = new Map<number, RenewalStudent>();
  for (const e of enrollments) {
    if (!map.has(e.studentId)) {
      map.set(e.studentId, {
        studentId: e.student.id,
        fullName: e.student.fullName,
        phone: e.student.phone,
        classTitle: e.class.title || e.class.instrument.name,
        termName: activeTerm.name,
        termEndDate: activeTerm.endDate,
      });
    }
  }
  return Array.from(map.values());
}

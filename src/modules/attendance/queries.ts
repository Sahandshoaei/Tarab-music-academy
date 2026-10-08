// ═══════════════════════════════════════════════════════════════════════════
//  کوئری‌های فقط-خواندنی حضور و غیاب — استثنای مستندشده در آناتومی ماژول‌ها
//  (مثل dashboard/schedule: قاعده کسب‌وکاری ندارد، service/repository جدا ندارد)
// ═══════════════════════════════════════════════════════════════════════════
import { prisma } from "@/lib/prisma";
import { todayTehranDate } from "@/lib/jalali";

/** مرورگر جلسات (F5-AC3) — فیلتر کلاس/بازه شمسی/فقط-ثبت‌نشده‌ها
 *  مرتب‌سازی پیش‌فرض: نزدیک‌ترین به امروز اول (برعکس desc قبلی)
 *  — diff به امروز صعودی؛ هم‌فاصله: گذشته قبل از آینده، سپس ساعت
 *  2.3 — pagination واقعی: take در DB نه slice
 */
export async function listAttendanceSessions(filters: {
  classId?: number;
  from?: Date;
  to?: Date;
  pendingOnly?: boolean;
}) {
  const today = todayTehranDate();
  const rows = await prisma.classSession.findMany({
    where: {
      ...(filters.classId ? { classId: filters.classId } : {}),
      ...(filters.from || filters.to
        ? {
            date: {
              ...(filters.from ? { gte: filters.from } : {}),
              ...(filters.to ? { lte: filters.to } : {}),
            },
          }
        : {}),
      // فقط ثبت‌نشده‌ها: گذشته + برنامه‌ریزی‌شده + بدون هیچ رکورد حضور (AC4)
      ...(filters.pendingOnly
        ? {
            status: "SCHEDULED",
            date: { lte: today },
            attendance: { none: {} },
          }
        : {}),
    },
    include: {
      class: {
        select: {
          id: true,
          title: true,
          instrument: { select: { name: true } },
          teacher: { select: { fullName: true } },
          _count: { select: { enrollments: { where: { isActive: true } } } },
        },
      },
      room: { select: { name: true } },
      _count: { select: { attendance: true } },
    },
    take: 200,
    orderBy: [{ date: "desc" }, { startTime: "desc" }],
  });

  rows.sort((a, b) => {
    const da = Math.abs(a.date.getTime() - today.getTime());
    const db = Math.abs(b.date.getTime() - today.getTime());
    if (da !== db) return da - db;
    const aPast = a.date.getTime() <= today.getTime();
    const bPast = b.date.getTime() <= today.getTime();
    if (aPast !== bPast) return aPast ? -1 : 1;
    if (a.date.getTime() !== b.date.getTime()) return a.date.getTime() - b.date.getTime();
    return a.startTime.localeCompare(b.startTime);
  });

  return rows;
}

/** فهرست کلاس‌ها برای فیلستران مرورگر */
export function listClassesForFilter() {
  return prisma.class.findMany({
    orderBy: { id: "desc" },
    select: {
      id: true,
      title: true,
      isActive: true,
      instrument: { select: { name: true } },
    },
  });
}

export interface StudentClassAttendance {
  classId: number;
  isActive: boolean;
  title: string;
  teacher: string;
  term: string;
  termId: number;
  type: string; // ClassType
  instrument: string;
  room: string;
  weekday: string | null;
  startTime: string | null;
  endTime: string | null;
  scheduleType: string;
  pastCount: number;
  remainingCount: number;
  unrecordedCount: number;
  counts: { PRESENT: number; ABSENT: number; EXCUSED: number };
  recent: {
    id: number;
    date: Date;
    status: string;
    attendance: string | null;
  }[];
  hasThreeConsecutiveAbsences: boolean;
  consecutiveAbsences: number;
}

/**
 * F5-AC3 + F2-AC9 — کلاس‌های هنرجو با آمار حضور و غیاب و جلسات مشتق‌شده.
 * «جلسه لغوشده نه گذشته است نه باقی‌مانده» (§۶.۵).
 */
export async function getStudentAttendanceProfile(
  studentId: number,
): Promise<StudentClassAttendance[]> {
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId },
    include: {
      class: {
        select: {
          id: true,
          title: true,
          type: true,
          instrument: { select: { name: true } },
          teacher: { select: { fullName: true } },
          term: { select: { id: true, name: true } },
          room: { select: { name: true } },
          weekday: true,
          startTime: true,
          endTime: true,
          scheduleType: true,
        },
      },
    },
    orderBy: { enrolledAt: "asc" },
  });
  if (enrollments.length === 0) return [];

  const sessions = await prisma.classSession.findMany({
    where: { classId: { in: enrollments.map((e) => e.classId) } },
    select: {
      id: true,
      date: true,
      status: true,
      classId: true,
      attendance: {
        where: { studentId },
        select: { status: true },
      },
    },
    orderBy: [{ date: "desc" }, { startTime: "desc" }],
  });

  const today = todayTehranDate();
  return enrollments.map((e) => {
    const cls = sessions.filter((s) => s.classId === e.classId);
    const past = cls.filter(
      (s) => s.status === "SCHEDULED" && s.date.getTime() < today.getTime(),
    );
    const remaining = cls.filter(
      (s) => s.status === "SCHEDULED" && s.date.getTime() >= today.getTime(),
    );
    const counts = { PRESENT: 0, ABSENT: 0, EXCUSED: 0 };
    for (const s of past) {
      const a = s.attendance[0]?.status;
      if (a === "PRESENT" || a === "ABSENT" || a === "EXCUSED") counts[a]++;
    }
    // بند ۱۲ — ۳ غیبت متوالی
    const pastAsc = [...past].sort((a,b)=>a.date.getTime()-b.date.getTime());
    let streak = 0, maxStreak = 0;
    for (const s of pastAsc) {
      const a = s.attendance[0]?.status;
      if (a === "ABSENT") {
        streak++;
        if (streak > maxStreak) maxStreak = streak;
      } else {
        streak = 0;
      }
    }
    const hasThree = maxStreak >= 3;
    return {
      classId: e.classId,
      isActive: e.isActive,
      title: e.class.title || e.class.instrument.name,
      teacher: e.class.teacher.fullName,
      term: e.class.term.name,
      termId: e.class.term.id,
      type: e.class.type,
      instrument: e.class.instrument.name,
      room: e.class.room.name,
      weekday: e.class.weekday,
      startTime: e.class.startTime,
      endTime: e.class.endTime,
      scheduleType: e.class.scheduleType,
      pastCount: past.length,
      remainingCount: remaining.length,
      unrecordedCount:
        past.length - counts.PRESENT - counts.ABSENT - counts.EXCUSED,
      counts,
      recent: cls.slice(0, 5).map((s) => ({
        id: s.id,
        date: s.date,
        status: s.status,
        attendance: s.attendance[0]?.status ?? null,
      })),
      hasThreeConsecutiveAbsences: hasThree,
      consecutiveAbsences: maxStreak,
    };
  });
}

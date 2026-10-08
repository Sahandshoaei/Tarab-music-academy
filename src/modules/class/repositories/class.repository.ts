import { prisma } from "@/lib/prisma";
import type {
  ClassType,
  ScheduleType,
  Weekday,
} from "@prisma/client";
import { todayUtcDate } from "@/lib/jalali";

/** داده یک جلسه‌ی جدید (room/teacher هر جلسه مستقل ذخیره می‌شوند) */
export interface SessionInsert {
  date: Date;
  startTime: string;
  endTime: string;
  roomId: number;
  teacherId: number;
}

export interface ClassWriteData {
  title?: string | null;
  classType: ClassType;
  scheduleType: ScheduleType;
  teacherId: number;
  roomId: number;
  instrumentId: number;
  termId: number;
  weekday?: Weekday | null;
  startTime?: string | null;
  endTime?: string | null;
  notes?: string | null;
  studentIds: number[];
  sessions: SessionInsert[];
}

// ── خواندن ──

export function listClasses(includeInactive = false) {
  const today = todayUtcDate();
  return prisma.class.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { id: "desc" },
    include: {
      term: { select: { name: true } },
      teacher: { select: { fullName: true } },
      room: { select: { name: true } },
      instrument: { select: { name: true } },
      _count: {
        select: {
          sessions: { where: { status: "SCHEDULED", date: { gte: today } } },
          enrollments: { where: { isActive: true } },
        },
      },
    },
  });
}

export function findClassById(id: number) {
  return prisma.class.findUnique({
    where: { id },
    include: {
      term: true,
      teacher: true,
      room: true,
      instrument: true,
      sessions: {
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
        include: {
          room: { select: { name: true } },
          teacher: { select: { fullName: true } },
        },
      },
      enrollments: {
        include: {
          student: { select: { id: true, fullName: true, phone: true, isActive: true } },
        },
      },
    },
  });
}

/**
 * §۶.۱ — جلسات متداخل با بازه جدید (استاد یا اتاق مشترک، همان تاریخ‌ها).
 * جلسات لغوشده حساب نمی‌شوند. take=1 چون برای پیام خطا فقط اولین تداخل
 * کافی است (U2). excludeClassId برای جریان بازتولید سری (قبل از حذف
 * جلسات قدیمیِ خود کلاس صدا می‌شود).
 */
export function findConflicts(p: {
  dates: Date[];
  startTime: string;
  endTime: string;
  roomId: number;
  teacherId: number;
  excludeSessionId?: number;
  excludeClassId?: number;
}) {
  if (p.dates.length === 0) return Promise.resolve([]);
  return prisma.classSession.findMany({
    where: {
      date: { in: p.dates },
      status: "SCHEDULED",
      ...(p.excludeSessionId ? { id: { not: p.excludeSessionId } } : {}),
      ...(p.excludeClassId ? { classId: { not: p.excludeClassId } } : {}),
      OR: [{ roomId: p.roomId }, { teacherId: p.teacherId }],
      startTime: { lt: p.endTime },
      endTime: { gt: p.startTime },
    },
    include: {
      class: {
        select: {
          title: true,
          instrument: { select: { name: true } },
          teacher: { select: { fullName: true } },
        },
      },
      room: { select: { name: true } },
    },
    take: 1,
  });
}

/** جلسات کلاس روی تاریخ‌های داده‌شده — برای تشخیص تاریخ‌های «نگه‌داشته‌شده» در بازتولید */
export function findSessionDates(classId: number, dates: Date[]) {
  if (dates.length === 0) return Promise.resolve([]);
  return prisma.classSession.findMany({
    where: { classId, date: { in: dates } },
    select: { date: true, status: true, isOverridden: true },
  });
}

// ── ایجاد/ویرایش کلاس (تراکنشی) ──

export function createClass(data: ClassWriteData) {
  return prisma.$transaction(async (tx) => {
    return tx.class.create({
      data: {
        title: data.title ?? null,
        type: data.classType,
        scheduleType: data.scheduleType,
        teacherId: data.teacherId,
        roomId: data.roomId,
        instrumentId: data.instrumentId,
        termId: data.termId,
        weekday: data.weekday ?? null,
        startTime: data.startTime ?? null,
        endTime: data.endTime ?? null,
        notes: data.notes ?? null,
        enrollments: {
          create: data.studentIds.map((studentId) => ({ studentId })),
        },
        sessions: {
          create: data.sessions.map((s) => ({
            date: s.date,
            startTime: s.startTime,
            endTime: s.endTime,
            roomId: s.roomId,
            teacherId: s.teacherId,
          })),
        },
      },
      select: { id: true },
    });
  });
}

export function updateClass(
  id: number,
  data: Omit<ClassWriteData, "termId" | "sessions"> & {
    /** بازتولید جلسات آینده (§۶.۳) — فقط وقتی الگوی سری عوض شود */
    regenerate?: { sessions: SessionInsert[] };
  },
) {
  return prisma.$transaction(async (tx) => {
    if (data.regenerate) {
      // جلسات آیندهِ عادی حذف و بازساخته می‌شوند؛
      // گذشته، بازنویسی‌شده (isOverridden) و لغوشده (CANCELLED) دست نمی‌خورند
      await tx.classSession.deleteMany({
        where: {
          classId: id,
          date: { gte: todayUtcDate() },
          isOverridden: false,
          status: "SCHEDULED",
        },
      });
      if (data.regenerate.sessions.length > 0) {
        await tx.classSession.createMany({
          data: data.regenerate.sessions.map((s) => ({ ...s, classId: id })),
        });
      }
    }

    await syncEnrollments(tx, id, data.studentIds);

    return tx.class.update({
      where: { id },
      data: {
        title: data.title ?? null,
        type: data.classType,
        teacherId: data.teacherId,
        roomId: data.roomId,
        instrumentId: data.instrumentId,
        weekday: data.weekday ?? null,
        startTime: data.startTime ?? null,
        endTime: data.endTime ?? null,
        notes: data.notes ?? null,
      },
    });
  });
}

/** همگام‌سازی ثبت‌نام‌ها با مجموعه دلخواه — حذف = غیرفعال‌سازی (سابقه می‌ماند) */
async function syncEnrollments(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  classId: number,
  studentIds: number[],
) {
  const current = await tx.enrollment.findMany({
    where: { classId },
    select: { studentId: true, isActive: true },
  });
  const desired = new Set(studentIds);
  for (const c of current) {
    const want = desired.has(c.studentId);
    if (want !== c.isActive) {
      await tx.enrollment.update({
        where: { classId_studentId: { classId, studentId: c.studentId } },
        data: { isActive: want },
      });
    }
  }
  const existing = new Set(current.map((c) => c.studentId));
  for (const studentId of studentIds) {
    if (!existing.has(studentId)) {
      await tx.enrollment.create({ data: { classId, studentId } });
    }
  }
}

// ── فعال/غیرفعال‌سازی سری (§۶.۳) ──

/** لغو سری: جلسات آینده عادی → CANCELLED؛ جلسات گذشته و بازنویسی‌شده حفظ می‌شوند */
export function deactivateClass(id: number) {
  return prisma.$transaction(async (tx) => {
    await tx.classSession.updateMany({
      where: {
        classId: id,
        date: { gte: todayUtcDate() },
        isOverridden: false,
        status: "SCHEDULED",
      },
      data: { status: "CANCELLED" },
    });
    return tx.class.update({ where: { id }, data: { isActive: false } });
  });
}

/** فعال‌سازی مجدد + درج جلسات بازتولیدشده (فقط تاریخ‌های بدون جلسه) */
export function reactivateClass(id: number, sessions: SessionInsert[]) {
  return prisma.$transaction(async (tx) => {
    if (sessions.length > 0) {
      await tx.classSession.createMany({
        data: sessions.map((s) => ({ ...s, classId: id })),
      });
    }
    return tx.class.update({ where: { id }, data: { isActive: true } });
  });
}

// ── جلسات ──

export function findSessionById(id: number) {
  return prisma.classSession.findUnique({
    where: { id },
    include: {
      class: {
        select: {
          id: true,
          title: true,
          type: true,
          scheduleType: true,
          instrumentId: true,
          instrument: { select: { name: true } },
          term: { select: { name: true, startDate: true, endDate: true } },
          enrollments: {
            where: { isActive: true },
            include: { student: { select: { id: true, fullName: true } } },
          },
        },
      },
      room: { select: { id: true, name: true } },
      teacher: { select: { id: true, fullName: true } },
      attendance: {
        include: { student: { select: { id: true, fullName: true } } },
      },
    },
  });
}

export function createSession(
  classId: number,
  data: SessionInsert & { notes?: string | null; isOverridden?: boolean },
) {
  return prisma.classSession.create({
    data: { ...data, notes: data.notes ?? null, isOverridden: data.isOverridden ?? false, classId },
  });
}

export function updateSession(
  id: number,
  data: SessionInsert & { notes?: string | null; isOverridden?: boolean },
) {
  return prisma.classSession.update({
    where: { id },
    data: {
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      roomId: data.roomId,
      teacherId: data.teacherId,
      notes: data.notes ?? null,
      ...(data.isOverridden !== undefined ? { isOverridden: data.isOverridden } : {}),
    },
  });
}

export function cancelSession(id: number) {
  return prisma.classSession.update({
    where: { id },
    data: { status: "CANCELLED" },
  });
}

// ── ثبت‌نام (Enrollment) ──

export function countActiveEnrollments(classId: number) {
  return prisma.enrollment.count({ where: { classId, isActive: true } });
}

/** افزودن/فعال‌سازی مجدد — رکورد تکراری نمی‌سازد (upsert روی PK ترکیبی) */
export function addEnrollment(classId: number, studentId: number) {
  return prisma.enrollment.upsert({
    where: { classId_studentId: { classId, studentId } },
    update: { isActive: true },
    create: { classId, studentId },
  });
}

export function setEnrollmentActive(
  classId: number,
  studentId: number,
  isActive: boolean,
) {
  return prisma.enrollment.update({
    where: { classId_studentId: { classId, studentId } },
    data: { isActive },
  });
}

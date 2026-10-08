// ═══════════════════════════════════════════════════════════════════════════
//  منطق کسب‌وکار کلاس و جلسات (F4) — الگوریتم‌های §۶.۱ تا §۶.۴ سند طراحی
//  AC1 سری هفتگی · AC2 جلسه‌به‌جلسه · AC3/AC4 تداخل · AC5 بازه کاری
//  AC6 تقویم (ماژول schedule) · AC7 بازنویسی/لغو تک‌جلسه
// ═══════════════════════════════════════════════════════════════════════════
import { prisma } from "@/lib/prisma";
import type { ClassType, Weekday } from "@prisma/client";
import { formatJalali, parseJalaliDate, todayUtcDate } from "@/lib/jalali";
import { isWithinHours, parseTime } from "@/lib/time";
import { weekdayLabels } from "@/lib/constants";
import { classSchema, sessionSchema } from "../schemas/class.schema";
import { toJalaali } from "jalaali-js";
import {
  generateWeeklySessionDates,
  JS_TO_WEEKDAY,
  WEEKDAY_TO_JS,
} from "../utils/weekly-sessions";
import * as repo from "../repositories/class.repository";

export class ClassServiceError extends Error {}

// ── خواندن ──

export async function getClasses(includeInactive = false) {
  return repo.listClasses(includeInactive);
}

export async function getClass(id: number) {
  const c = await repo.findClassById(id);
  if (!c) throw new ClassServiceError("کلاس یافت نشد.");
  return c;
}

export async function getSession(id: number) {
  const s = await repo.findSessionById(id);
  if (!s) throw new ClassServiceError("جلسه یافت نشد.");
  return s;
}

// ── قواعد مشترک (§۶.۴) ──

/** ظرفیت MVP-1 (مصوب ایست ۲): خصوصی دقیقاً ۱ · بقیه حداقل ۱ (§۶.4-6) */
function assertCapacity(classType: ClassType, count: number) {
  if (classType === "PRIVATE" && count !== 1) {
    throw new ClassServiceError(
      count === 0
        ? "کلاس خصوصی دقیقاً یک هنرجو دارد — هنرجو را انتخاب کنید."
        : "کلاس خصوصی دقیقاً یک هنرجو دارد.",
    );
  }
  if (classType !== "PRIVATE" && count < 1) {
    throw new ClassServiceError("حداقل یک هنرجو انتخاب کنید.");
  }
}

/** مرجع‌های فعال + استاد باید سازِ کلاس را تدریس کند (F3-AC3) + هنرجویان فعال (F2-AC8) */
async function assertRefsValid(p: {
  instrumentId: number;
  roomId: number;
  teacherId: number;
  studentIds: number[];
}) {
  const instrument = await prisma.instrument.findFirst({
    where: { id: p.instrumentId, isActive: true },
  });
  if (!instrument) throw new ClassServiceError("ساز انتخابی نامعتبر یا غیرفعال است.");

  const room = await prisma.room.findFirst({
    where: { id: p.roomId, isActive: true },
  });
  if (!room) throw new ClassServiceError("اتاق انتخابی نامعتبر یا غیرفعال است.");

  const teacher = await prisma.teacher.findFirst({
    where: {
      id: p.teacherId,
      isActive: true,
      instruments: { some: { instrumentId: p.instrumentId } },
    },
  });
  if (!teacher) {
    throw new ClassServiceError("استاد انتخابی این ساز را تدریس نمی‌کند یا غیرفعال است.");
  }

  if (p.studentIds.length > 0) {
    const found = await prisma.student.count({
      where: { id: { in: p.studentIds }, isActive: true },
    });
    if (found !== p.studentIds.length) {
      throw new ClassServiceError("یکی از هنرجویان نامعتبر یا غیرفعال است.");
    }
  }
}

/** §۶.4-1 — بازه در ساعات کاری (F4-AC5)؛ تنظیمات را برمی‌گرداند */
async function assertTimeValid(p: { startTime: string; endTime: string }) {
  const settings = await prisma.schoolSettings.findUnique({ where: { id: 1 } });
  if (!settings) throw new ClassServiceError("تنظیمات آموزشگاه یافت نشد.");
  if (!isWithinHours(p.startTime, p.endTime, settings.openTime, settings.closeTime)) {
    throw new ClassServiceError(
      `زمان باید در بازه کاری آموزشگاه (${settings.openTime} تا ${settings.closeTime}) باشد.`,
    );
  }
  return settings;
}

/** §۶.4-2 — روز هفته/تاریخ نباید تعطیل آموزشگاه باشد (F4-AC5) */
async function assertWeekdayOpen(weekday: Weekday, closedDays: Weekday[]) {
  if (closedDays.includes(weekday)) {
    throw new ClassServiceError(
      `${weekdayLabels[weekday]} تعطیل آموزشگاه است — روز دیگری انتخاب کنید.`,
    );
  }
}

/** تعداد جلسات مورد نیاز بر اساس نوع کلاس — مصوب ۱۴۰۴/۰۷/۰۸
 *  خصوصی: ۱۰ جلسه
 *  گروهی: ۱۰ جلسه
 *  نیمه‌گروهی: ۱۰ جلسه
 *  تمرینی: ۸ جلسه
 */
function requiredSessionsCount(classType: ClassType): number {
  if (classType === "PRACTICE") return 8;
  return 10; // PRIVATE, GROUP, SEMI_GROUP
}

/** تولید تاریخ‌ها بر اساس تعداد مورد نیاز — بدون فیلتر تعطیلات (بند ۱۰ حذف شد) */
function generateWeeklyDates(opts: {
  termStart: Date;
  termEnd: Date;
  today: Date;
  weekdays: Weekday[];
  count: number;
}): Date[] {
  const jsDays = new Set(opts.weekdays.map((w) => WEEKDAY_TO_JS[w]));
  const start = opts.termStart.getTime() > opts.today.getTime() ? opts.termStart : opts.today;
  const dates: Date[] = [];
  for (let t = new Date(start.getTime()); t.getTime() <= opts.termEnd.getTime() && dates.length < opts.count; t = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate() + 1))) {
    if (jsDays.has(t.getUTCDay())) dates.push(new Date(t.getTime()));
  }
  return dates;
}

function jalaliMonthsBetween(start: Date, end: Date): number {
  const s = toJalaali(start); const e = toJalaali(end);
  return (e.jy - s.jy) * 12 + (e.jm - s.jm) + 1;
}

/** پیام تداخل قابل‌اقدام (U2) — نام کلاس + زمان + اتاق جلسه متداخل */
function conflictMessage(
  c: Awaited<ReturnType<typeof repo.findConflicts>>[number],
): string {
  const label = c.class.title || c.class.instrument.name;
  const day = weekdayLabels[JS_TO_WEEKDAY[c.date.getUTCDay()]];
  return `تداخل با «${label}» — ${day} ${formatJalali(c.date)}، ${c.startTime} تا ${c.endTime}، ${c.room.name}. زمان یا اتاق را تغییر دهید.`;
}

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ── ایجاد کلاس (F4-AC1/AC2) ──

export async function createClass(input: unknown) {
  const values = classSchema.parse(input);
  const instrumentId = Number(values.instrumentId);
  const roomId = Number(values.roomId);
  const teacherId = Number(values.teacherId);
  const studentIds = values.studentIds.map(Number).filter(Number.isInteger);
  if ([instrumentId, roomId, teacherId].some((n) => !Number.isInteger(n))) {
    throw new ClassServiceError("شناسه‌های انتخابی نامعتبر است.");
  }

  assertCapacity(values.classType, studentIds.length);
  await assertRefsValid({ instrumentId, roomId, teacherId, studentIds });

  // §۶.4-4 — کلاس به ترم فعال تعلق دارد (ترم از دیتابیس، نه فرم)
  const term = await prisma.term.findFirst({ where: { isActive: true } });
  if (!term) {
    throw new ClassServiceError("ترم فعالی وجود ندارد — ابتدا در صفحه ترم‌ها یک ترم را فعال کنید.");
  }

  let sessions: repo.SessionInsert[] = [];

  if (values.scheduleType === "WEEKLY") {
    const startTime = parseTime(values.startTime!)!;
    const endTime = parseTime(values.endTime!)!;
    const weekday = values.weekday as Weekday;
    const classType = values.classType as ClassType;

    const settings = await assertTimeValid({ startTime, endTime });
    await assertWeekdayOpen(weekday, settings.closedDays);

    const required = requiredSessionsCount(classType);
    const dates = generateWeeklyDates({
      termStart: term.startDate,
      termEnd: term.endDate,
      today: todayUtcDate(),
      weekdays: [weekday],
      count: required,
    });
    if (dates.length === 0) {
      throw new ClassServiceError("در بازه باقی‌مانده ترم فعلی، جلسه‌ای روی این روز هفته نمی‌افتد — روز دیگری انتخاب کنید.");
    }
    // منعطف: اگر کمتر از تعداد استاندارد (۱۰/۸) جا شد، ارور بلاک‌کننده نده — هرچه هست بساز، هشدار فقط در UI
    // if (dates.length < required) warn only

    const conflict = await repo.findConflicts({ dates, startTime, endTime, roomId, teacherId });
    if (conflict.length > 0) throw new ClassServiceError(conflictMessage(conflict[0]));

    sessions = dates.map((date) => ({ date, startTime, endTime, roomId, teacherId }));
  } else if (values.scheduleType === "SINGLE") {
    const startTime = parseTime(values.startTime!)!;
    const endTime = parseTime(values.endTime!)!;
    const singleDate = parseJalaliDate((values as { singleDate: string }).singleDate!)!;

    const settings = await assertTimeValid({ startTime, endTime });
    if (singleDate < term.startDate || singleDate > term.endDate) {
      throw new ClassServiceError(`تاریخ باید در بازه ترم «${term.name}» باشد.`);
    }
    await assertWeekdayOpen(JS_TO_WEEKDAY[singleDate.getUTCDay()], settings.closedDays);

    const conflict = await repo.findConflicts({ dates: [singleDate], startTime, endTime, roomId, teacherId });
    if (conflict.length > 0) throw new ClassServiceError(conflictMessage(conflict[0]));

    sessions = [{ date: singleDate, startTime, endTime, roomId, teacherId }];
  }

  return repo.createClass({
    title: values.title,
    classType: values.classType,
    scheduleType: values.scheduleType,
    teacherId,
    roomId,
    instrumentId,
    termId: term.id,
    weekday: values.scheduleType === "WEEKLY" ? (values.weekday as Weekday) : null,
    startTime: values.scheduleType === "WEEKLY" || values.scheduleType === "SINGLE" ? parseTime(values.startTime!)! : null,
    endTime: values.scheduleType === "WEEKLY" || values.scheduleType === "SINGLE" ? parseTime(values.endTime!)! : null,
    notes: values.notes,
    studentIds,
    sessions,
  });
}

// ── ویرایش کلاس ──

export async function updateClass(id: number, input: unknown) {
  const values = classSchema.parse(input);
  const existing = await repo.findClassById(id);
  if (!existing) throw new ClassServiceError("کلاس یافت نشد.");

  // الگوی زمان‌بندی بعد از ایجاد تغییر نمی‌کند — معنای «سری» و تولید جلسات به آن وابسته است
  if (values.scheduleType !== existing.scheduleType) {
    throw new ClassServiceError("الگوی زمان‌بندی بعد از ایجاد قابل تغییر نیست — یک کلاس جدید بسازید.");
  }

  const instrumentId = Number(values.instrumentId);
  const roomId = Number(values.roomId);
  const teacherId = Number(values.teacherId);
  const studentIds = values.studentIds.map(Number).filter(Number.isInteger);
  if ([instrumentId, roomId, teacherId].some((n) => !Number.isInteger(n))) {
    throw new ClassServiceError("شناسه‌های انتخابی نامعتبر است.");
  }

  assertCapacity(values.classType, studentIds.length);
  await assertRefsValid({ instrumentId, roomId, teacherId, studentIds });

  let regenerate: { sessions: repo.SessionInsert[] } | undefined;

  if (values.scheduleType === "WEEKLY") {
    const weekday = values.weekday as Weekday;
    const startTime = parseTime(values.startTime!)!;
    const endTime = parseTime(values.endTime!)!;
    const classType = values.classType as ClassType;

    const settings = await assertTimeValid({ startTime, endTime });
    await assertWeekdayOpen(weekday, settings.closedDays);

    const patternChanged =
      existing.weekday !== weekday ||
      existing.startTime !== startTime ||
      existing.endTime !== endTime ||
      existing.roomId !== roomId ||
      existing.teacherId !== teacherId ||
      existing.type !== classType;

    if (patternChanged) {
      const required = requiredSessionsCount(classType);
      let dates = generateWeeklyDates({
        termStart: existing.term.startDate,
        termEnd: existing.term.endDate,
        today: todayUtcDate(),
        weekdays: [weekday],
        count: required,
      });
      // برای ویرایش، فقط جلسات آینده که هنوز نداریم رو می‌سازیم — ولی باید دوباره چک کنیم که آیا کافی هست
      const rows = await repo.findSessionDates(id, dates);
      const kept = new Set(
        rows
          .filter((r) => r.isOverridden || r.status === "CANCELLED")
          .map((r) => dateKey(r.date)),
      );
      const newDates = dates.filter((d) => !kept.has(dateKey(d)));
      // منعطف: مثل ایجاد، حتی اگر کمتر از ۱۰ باشد بلاک نکن

      const conflict = await repo.findConflicts({
        dates: newDates,
        startTime,
        endTime,
        roomId,
        teacherId,
        excludeClassId: id,
      });
      if (conflict.length > 0) throw new ClassServiceError(conflictMessage(conflict[0]));

      regenerate = {
        sessions: newDates.map((date) => ({ date, startTime, endTime, roomId, teacherId })),
      };
    }
  }

  await repo.updateClass(id, {
    title: values.title,
    classType: values.classType,
    scheduleType: values.scheduleType,
    teacherId,
    roomId,
    instrumentId,
    weekday: values.scheduleType === "WEEKLY" ? (values.weekday as Weekday) : null,
    startTime: values.scheduleType === "WEEKLY" ? parseTime(values.startTime!)! : null,
    endTime: values.scheduleType === "WEEKLY" ? parseTime(values.endTime!)! : null,
    notes: values.notes,
    studentIds,
    regenerate,
  });
}

// ── لغو / فعال‌سازی سری (§۶.۳) ──

export async function setClassActive(id: number, isActive: boolean) {
  const existing = await repo.findClassById(id);
  if (!existing) throw new ClassServiceError("کلاس یافت نشد.");

  if (!isActive) {
    await repo.deactivateClass(id);
    return;
  }

  // فعال‌سازی مجدد سری هفتگی: جلسات گمشده آینده بازتولید می‌شوند؛
  if (existing.scheduleType === "WEEKLY" && existing.weekday && existing.startTime && existing.endTime) {
    const settings = await assertTimeValid({
      startTime: existing.startTime,
      endTime: existing.endTime,
    });
    await assertWeekdayOpen(existing.weekday, settings.closedDays);

    const weekdays = [existing.weekday].filter(Boolean) as import("@prisma/client").Weekday[];
    const required = requiredSessionsCount(existing.type as import("@prisma/client").ClassType);
    let dates = generateWeeklyDates({
      termStart: existing.term.startDate,
      termEnd: existing.term.endDate,
      today: todayUtcDate(),
      weekdays,
      count: required,
    });
    const rows = await repo.findSessionDates(id, dates);
    const taken = new Set(rows.map((r) => dateKey(r.date)));
    const newDates = dates.filter((d) => !taken.has(dateKey(d)));

    const conflict = await repo.findConflicts({
      dates: newDates,
      startTime: existing.startTime,
      endTime: existing.endTime,
      roomId: existing.roomId,
      teacherId: existing.teacherId,
      excludeClassId: id,
    });
    if (conflict.length > 0) throw new ClassServiceError(conflictMessage(conflict[0]));

    await repo.reactivateClass(
      id,
      newDates.map((date) => ({
        date,
        startTime: existing.startTime!,
        endTime: existing.endTime!,
        roomId: existing.roomId,
        teacherId: existing.teacherId,
      })),
    );
    return;
  }

  await repo.reactivateClass(id, []);
}

// ── جلسه‌به‌جلسه (AD_HOC — F4-AC2) ──

export async function addSession(classId: number, input: unknown) {
  const values = sessionSchema.parse(input);
  const cls = await repo.findClassById(classId);
  if (!cls) throw new ClassServiceError("کلاس یافت نشد.");
  if (cls.scheduleType !== "AD_HOC") {
    throw new ClassServiceError(
      "جلسات کلاس تکرارشونده خودکار تولید می‌شوند — برای تغییر یک جلسه، آن را ویرایش کنید (F4-AC7).",
    );
  }

  const date = parseJalaliDate(values.date)!;
  const startTime = parseTime(values.startTime)!;
  const endTime = parseTime(values.endTime)!;
  const roomId = Number(values.roomId);
  const teacherId = Number(values.teacherId);

  await assertRefsValid({ instrumentId: cls.instrumentId, roomId, teacherId, studentIds: [] });
  const settings = await assertTimeValid({ startTime, endTime });

  // تاریخ باید در بازه ترمِ همین کلاس باشد (نه ترم فعال — کلاس به ترم خودش وابسته است)
  if (date < cls.term.startDate || date > cls.term.endDate) {
    throw new ClassServiceError(`تاریخ باید در بازه ترم «${cls.term.name}» باشد.`);
  }
  await assertWeekdayOpen(JS_TO_WEEKDAY[date.getUTCDay()], settings.closedDays);

  const conflict = await repo.findConflicts({ dates: [date], startTime, endTime, roomId, teacherId });
  if (conflict.length > 0) throw new ClassServiceError(conflictMessage(conflict[0]));

  return repo.createSession(classId, {
    date,
    startTime,
    endTime,
    roomId,
    teacherId,
    notes: values.notes,
  });
}

// ── ویرایش/لغو تک‌جلسه (F4-AC7) ──

export async function updateSession(sessionId: number, input: unknown) {
  const values = sessionSchema.parse(input);
  const session = await repo.findSessionById(sessionId);
  if (!session) throw new ClassServiceError("جلسه یافت نشد.");

  const date = parseJalaliDate(values.date)!;
  const startTime = parseTime(values.startTime)!;
  const endTime = parseTime(values.endTime)!;
  const roomId = Number(values.roomId);
  const teacherId = Number(values.teacherId);

  await assertRefsValid({
    instrumentId: session.class.instrumentId,
    roomId,
    teacherId,
    studentIds: [],
  });
  const settings = await assertTimeValid({ startTime, endTime });

  if (date < session.class.term.startDate || date > session.class.term.endDate) {
    throw new ClassServiceError(`تاریخ باید در بازه ترم «${session.class.term.name}» باشد.`);
  }
  await assertWeekdayOpen(JS_TO_WEEKDAY[date.getUTCDay()], settings.closedDays);

  const conflict = await repo.findConflicts({
    dates: [date],
    startTime,
    endTime,
    roomId,
    teacherId,
    excludeSessionId: sessionId,
  });
  if (conflict.length > 0) throw new ClassServiceError(conflictMessage(conflict[0]));

  // از این پس این جلسه مستقل از الگوی سری است — بازتولید بعدی دست نمی‌زند
  const isOverridden = session.class.scheduleType === "WEEKLY" ? true : undefined;

  await repo.updateSession(sessionId, {
    date,
    startTime,
    endTime,
    roomId,
    teacherId,
    notes: values.notes,
    isOverridden,
  });
}

export async function cancelSession(sessionId: number) {
  const session = await repo.findSessionById(sessionId);
  if (!session) throw new ClassServiceError("جلسه یافت نشد.");
  if (session.status === "CANCELLED") return; // idempotent
  await repo.cancelSession(sessionId);
  try {
    const { notify } = await import("@/modules/notification/services/notification.service");
    const { formatJalali } = await import("@/lib/jalali");
    await notify.classCancelled(session.class.title || session.class.instrument.name, formatJalali(session.date), `/sessions/${sessionId}`);
  } catch {}
}


export async function createMakeupSession(originalSessionId: number, input: unknown) {
  const session = await repo.findSessionById(originalSessionId);
  if (!session) throw new ClassServiceError("جلسه اصلی یافت نشد.");
  if (session.status !== "CANCELLED") throw new ClassServiceError("فقط جلسات لغوشده جلسه جبرانی دارند (بند ۱۱).");

  // input فقط تاریخ شمسی جدید
  const parsed = sessionSchema.pick({ date: true }).parse(input);
  // برای جبرانی، زمان/اتاق/استاد همان جلسه اصلی است — فقط تاریخ عوض می‌شود
  const date = parseJalaliDate(parsed.date)!;
  const startTime = session.startTime;
  const endTime = session.endTime;
  const roomId = session.roomId;
  const teacherId = session.teacherId;
  const classId = session.classId;

  // اعتبارسنجی‌های مشترک بند ۱۰-۱۱ و F4-AC5
  if (date < session.class.term.startDate || date > session.class.term.endDate) {
    throw new ClassServiceError(`تاریخ جبرانی باید در بازه ترم «${session.class.term.name}» باشد.`);
  }
  const settings = await assertTimeValid({ startTime, endTime });
  await assertWeekdayOpen(JS_TO_WEEKDAY[date.getUTCDay()], settings.closedDays);

  const conflict = await repo.findConflicts({ dates: [date], startTime, endTime, roomId, teacherId });
  if (conflict.length > 0) throw new ClassServiceError(conflictMessage(conflict[0]));

  // جلسه جبرانی مستقل از سری — isOverridden=true تا بازتولید بعدی پاکش نکند
  const created = await repo.createSession(classId, {
    date,
    startTime,
    endTime,
    roomId,
    teacherId,
    notes: `جبرانی جلسه لغوشده ${session.date.toISOString().slice(0,10)} (بند ۱۱)`,
    isOverridden: true,
  });
  try {
    const { notify } = await import("@/modules/notification/services/notification.service");
    const { formatJalali } = await import("@/lib/jalali");
    await notify.classMakeup(session.class.title || session.class.instrument.name, formatJalali(date), `/sessions/${created.id}`);
  } catch {}
  return created;
}

// ── مدیریت هنرجویان کلاس (مصوب ایست ۲) ──

export async function addStudentToClass(classId: number, studentId: number) {
  const cls = await repo.findClassById(classId);
  if (!cls) throw new ClassServiceError("کلاس یافت نشد.");
  const student = await prisma.student.findFirst({
    where: { id: studentId, isActive: true },
  });
  if (!student) throw new ClassServiceError("هنرجو نامعتبر یا غیرفعال است (F2-AC8).");

  if (cls.type === "PRIVATE") {
    const others = cls.enrollments.filter(
      (e) => e.isActive && e.studentId !== studentId,
    );
    if (others.length >= 1) {
      throw new ClassServiceError("کلاس خصوصی فقط یک هنرجو دارد.");
    }
  }
  await repo.addEnrollment(classId, studentId);
}

/** حذف = غیرفعال‌سازی ثبت‌نام (soft) — سابقه حضور F5 حفظ می‌شود؛ افزودن مجدد همان رکورد را فعال می‌کند */
export async function removeStudentFromClass(classId: number, studentId: number) {
  const exists = await prisma.enrollment.findUnique({
    where: { classId_studentId: { classId, studentId } },
  });
  if (!exists) throw new ClassServiceError("این هنرجو در این کلاس ثبت‌نام ندارد.");
  await repo.setEnrollmentActive(classId, studentId, false);
}

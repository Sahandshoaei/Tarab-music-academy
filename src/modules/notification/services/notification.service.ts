import type { NotificationType } from "@prisma/client";
import * as repo from "../repositories/notification.repository";

// ایجاد برای یک کاربر
export async function notifyUser(p: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  link?: string | null;
}) {
  return repo.createNotification(p);
}

// ایجاد برای همه ادمین‌ها (admin_only)
export async function notifyAllAdmins(p: {
  type: NotificationType;
  title: string;
  body?: string | null;
  link?: string | null;
}) {
  const admins = await repo.getAdminUserIds();
  if (admins.length === 0) return;
  await repo.createManyNotifications(
    admins.map((a) => ({
      userId: a.id,
      type: p.type,
      title: p.title,
      body: p.body ?? null,
      link: p.link ?? null,
    })),
  );
}

// Helper های معنایی
export const notify = {
  absent: (studentName: string, className: string, link?: string) =>
    notifyAllAdmins({
      type: "ABSENT",
      title: `غیبت: ${studentName}`,
      body: `${studentName} در کلاس ${className} غایب ثبت شد.`,
      link: link ?? "/attendance",
    }),
  threeAbsences: (studentName: string, link?: string) =>
    notifyAllAdmins({
      type: "THREE_ABSENCES",
      title: `⚠️ ۳ غیبت متوالی: ${studentName}`,
      body: `${studentName} سه جلسه متوالی غایب بوده — نیاز به پیگیری (بند ۱۲).`,
      link,
    }),
  overdue: (count: number) =>
    notifyAllAdmins({
      type: "OVERDUE",
      title: `بدهکاران: ${count} نفر`,
      body: `${count} هنرجو مانده شهریه دارند.`,
      link: "/debtors",
    }),
  classCancelled: (className: string, dateLabel: string, link?: string) =>
    notifyAllAdmins({
      type: "CLASS_CANCELLED",
      title: `کلاس لغو شد: ${className}`,
      body: `جلسه ${dateLabel} لغو شد.`,
      link,
    }),
  classMakeup: (className: string, dateLabel: string, link?: string) =>
    notifyAllAdmins({
      type: "CLASS_MAKEUP",
      title: `جبرانی ثبت شد: ${className}`,
      body: `جلسه جبرانی ${dateLabel} برای ${className} ساخته شد.`,
      link,
    }),
  newStudent: (studentName: string, link?: string) =>
    notifyAllAdmins({
      type: "NEW_STUDENT",
      title: `هنرجوی جدید: ${studentName}`,
      body: `${studentName} ثبت‌نام شد.`,
      link,
    }),
  termRenewal: (count: number) =>
    notifyAllAdmins({
      type: "TERM_RENEWAL",
      title: `یادآوری تمدید ترم: ${count} هنرجو`,
      body: `${count} هنرجو در ترم فعال رو به اتمام هستند — نیاز به تمدید.`,
      link: "/terms",
    }),
  dailyDigest: (stats: { absentToday: number; overdue: number; cancelledToday: number; newStudentsWeek: number }) =>
    notifyAllAdmins({
      type: "DAILY_DIGEST",
      title: `خلاصه روزانه — ${new Date().toLocaleDateString("fa-IR")}`,
      body: `غایبان امروز: ${stats.absentToday} · بدهکاران: ${stats.overdue} · لغو امروز: ${stats.cancelledToday} · ثبت‌نام هفته: ${stats.newStudentsWeek}`,
      link: "/dashboard",
    }),
};

export async function getNotifications(userId: string, opts?: { unreadOnly?: boolean }) {
  return repo.listNotifications(userId, opts);
}
export async function getUnreadCount(userId: string) {
  return repo.countUnread(userId);
}
export async function markAsRead(id: string, userId: string) {
  return repo.markAsRead(id, userId);
}
export async function markAllAsRead(userId: string) {
  return repo.markAllAsRead(userId);
}

// خلاصه روزانه — دیتای زنده
export async function generateDailyDigest() {
  const { todayUtcDate } = await import("@/lib/jalali");
  const today = todayUtcDate();
  const weekAgo = new Date(today);
  weekAgo.setUTCDate(weekAgo.getUTCDate() - 7);

  const [absentToday, overdueCount, cancelledToday, newStudentsWeek] = await Promise.all([
    // غایبان امروز
    (await import("@/lib/prisma")).prisma.attendance.count({
      where: { status: "ABSENT", session: { date: today } },
    }),
    // بدهکاران (مانده شهریه)
    (async () => {
      const { getDebtors } = await import("@/modules/finance/services/finance.service");
      const debtors = await getDebtors();
      return debtors.length;
    })(),
    // لغو امروز
    (await import("@/lib/prisma")).prisma.classSession.count({
      where: { status: "CANCELLED", date: today },
    }),
    // ثبت‌نام هفته
    (await import("@/lib/prisma")).prisma.student.count({
      where: { registrationDate: { gte: weekAgo } },
    }),
  ]);

  await notify.dailyDigest({ absentToday, overdue: overdueCount, cancelledToday, newStudentsWeek });
  return { absentToday, overdue: overdueCount, cancelledToday, newStudentsWeek };
}

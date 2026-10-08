// 1.4 — بررسی ناسازگاری isActive کلاس vs وضعیت جلسات
// هر کلاس غیرفعال نباید جلسه SCHEDULED آینده داشته باشد
// این تابع را می‌توان در cron روزانه یا در /api/health صدا زد

import { prisma } from "@/lib/prisma";

export interface InconsistencyReport {
  inconsistentClasses: { id: number; title: string | null; futureScheduled: number }[];
  ok: boolean;
}

export async function checkClassConsistency(): Promise<InconsistencyReport> {
  // از VIEW که در مایگریشن 20261004000001 ساخته شد استفاده می‌کنیم
  // اگر VIEW نبود، fallback به کوئری مستقیم
  try {
    const rows = (await prisma.$queryRawUnsafe(
      `SELECT id, title, future_scheduled as "futureScheduled" FROM "v_inconsistent_classes"`,
    )) as { id: number; title: string | null; futureScheduled: number }[];
    return { inconsistentClasses: rows, ok: rows.length === 0 };
  } catch {
    // fallback — بدون VIEW
    const bad = await prisma.class.findMany({
      where: { isActive: false },
      select: {
        id: true,
        title: true,
        _count: { select: { sessions: { where: { status: "SCHEDULED", date: { gte: new Date() } } } } },
      },
    });
    const filtered = bad
      .filter((c) => c._count.sessions > 0)
      .map((c) => ({ id: c.id, title: c.title, futureScheduled: c._count.sessions }));
    return { inconsistentClasses: filtered, ok: filtered.length === 0 };
  }
}

// برای استفاده در Server Action یا API
export async function assertClassConsistencyOrThrow() {
  const report = await checkClassConsistency();
  if (!report.ok) {
    console.error("[consistency] کلاس‌های ناسازگار:", report.inconsistentClasses);
    // در MVP فقط لاگ می‌کنیم، در آینده می‌توان throw کرد یا به Sentry فرستاد
  }
  return report;
}

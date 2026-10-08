import { prisma } from "@/lib/prisma";
import { todayUtcDate } from "@/lib/jalali";

export interface RefundPreview {
  classId: number;
  classTitle: string;
  pastCount: number;
  refundPercent: number; // 90, 50, 0
  rule: string;
}

/**
 * بند ۵-۶ — محاسبه درصد استرداد بر اساس تعداد جلسات گذشته
 * 0 جلسه: 90% | 1-2 جلسه: 50% | >=3 جلسه: 0%
 * ملاک: تعداد جلسات SCHEDULED با date < today برای هر ثبت‌نام فعال هنرجو
 */
export async function getRefundPreview(studentId: number): Promise<RefundPreview[]> {
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId, isActive: true },
    include: {
      class: {
        select: {
          id: true,
          title: true,
          instrument: { select: { name: true } },
          term: { select: { name: true } },
        },
      },
    },
  });

  if (enrollments.length === 0) return [];

  const today = todayUtcDate();
  const previews: RefundPreview[] = [];

  for (const e of enrollments) {
    const pastCount = await prisma.classSession.count({
      where: {
        classId: e.classId,
        status: "SCHEDULED",
        date: { lt: today },
      },
    });

    let refundPercent: number;
    let rule: string;
    if (pastCount === 0) {
      refundPercent = 90;
      rule = "انصراف قبل از شروع کلاس — ۹۰٪ استرداد (بند ۵)";
    } else if (pastCount <= 2) {
      refundPercent = 50;
      rule = `پس از ${pastCount} جلسه — ۵۰٪ استرداد (بند ۵)`;
    } else {
      refundPercent = 0;
      rule = `پس از ${pastCount} جلسه — عدم استرداد (بند ۶)`;
    }

    previews.push({
      classId: e.classId,
      classTitle: e.class.title || e.class.instrument.name,
      pastCount,
      refundPercent,
      rule,
    });
  }

  return previews;
}

export function refundLabel(percent: number): string {
  if (percent === 90) return "۹۰٪ بازگشت";
  if (percent === 50) return "۵۰٪ بازگشت";
  return "بدون بازگشت";
}

// سرویس گیرندگان — تبدیل audienceType به لیست هنرجویان واقعی
// هر فیلتر یک تابع خالص است (سند 05-sms-feature §۵)

import { prisma } from "@/lib/prisma";
import { isValidMobile } from "@/validations/validators";
import { todayUtcDate } from "@/lib/jalali";

export interface AudienceStudent {
  id: number;
  fullName: string;
  phone: string;
  guardianPhone: string;
}

/** فقط فعال‌ها — هم‌راستا با F2-AC8 */
async function activeStudents(where: Record<string, unknown> = {}): Promise<AudienceStudent[]> {
  return prisma.student.findMany({
    where: { isActive: true, ...where },
    select: { id: true, fullName: true, phone: true, guardianPhone: true },
    orderBy: { fullName: "asc" },
  });
}

export async function resolveAudience(p: {
  audienceType: "INDIVIDUAL" | "CLASS" | "INSTRUMENT" | "ALL_ACTIVE" | "DYNAMIC";
  audienceValue?: string;
  studentIds?: string[];
}): Promise<{ students: AudienceStudent[]; ref: string }> {
  switch (p.audienceType) {
    case "INDIVIDUAL": {
      const ids = (p.studentIds ?? []).map(Number).filter(Number.isInteger);
      if (ids.length === 0) return { students: [], ref: "تک‌تک: هیچ‌کدام" };
      const students = await activeStudents({ id: { in: ids } });
      return { students, ref: `تک‌تک: ${students.length} نفر` };
    }
    case "CLASS": {
      const classId = Number(p.audienceValue);
      if (!Number.isInteger(classId)) return { students: [], ref: "کلاس نامعتبر" };
      const enrollments = await prisma.enrollment.findMany({
        where: { classId, isActive: true, student: { isActive: true } },
        select: { student: { select: { id: true, fullName: true, phone: true, guardianPhone: true } } },
      });
      const students = enrollments.map((e) => e.student);
      const cls = await prisma.class.findUnique({ where: { id: classId }, select: { title: true, instrument: { select: { name: true } } } });
      const label = cls?.title || cls?.instrument.name || `کلاس #${classId}`;
      return { students, ref: `کلاس: ${label}` };
    }
    case "INSTRUMENT": {
      const instrumentId = Number(p.audienceValue);
      if (!Number.isInteger(instrumentId)) return { students: [], ref: "ساز نامعتبر" };
      const rows = await prisma.studentInstrument.findMany({
        where: { instrumentId, student: { isActive: true } },
        select: { student: { select: { id: true, fullName: true, phone: true, guardianPhone: true } } },
      });
      const students = rows.map((r) => r.student);
      const inst = await prisma.instrument.findUnique({ where: { id: instrumentId }, select: { name: true } });
      return { students, ref: `ساز: ${inst?.name ?? instrumentId}` };
    }
    case "ALL_ACTIVE": {
      const students = await activeStudents();
      return { students, ref: "همه هنرجوهای فعال" };
    }
    case "DYNAMIC": {
      // فیلترهای هوشمند — فعلاً ۲ تا فعال (بدهکاران غیرفعال)
      if (p.audienceValue === "absent_today") {
        const today = todayUtcDate();
        const absents = await prisma.attendance.findMany({
          where: { status: "ABSENT", session: { date: today } },
          select: { student: { select: { id: true, fullName: true, phone: true, guardianPhone: true } } },
        });
        // فقط فعال‌ها + یکتا
        const map = new Map<number, AudienceStudent>();
        for (const a of absents) {
          const s = a.student as AudienceStudent & { isActive?: boolean };
          // isActive قبلاً چک نشده — دوباره فیلتر
          const full = await prisma.student.findUnique({ where: { id: s.id }, select: { isActive: true } });
          if (full?.isActive) map.set(s.id, s);
        }
        return { students: [...map.values()], ref: "غایبان امروز" };
      }
      if (p.audienceValue === "no_active_class") {
        const activeTerm = await prisma.term.findFirst({ where: { isActive: true }, select: { id: true } });
        const students = await prisma.student.findMany({
          where: {
            isActive: true,
            enrollments: { none: { isActive: true, ...(activeTerm ? { class: { termId: activeTerm.id } } : {}) } },
          },
          select: { id: true, fullName: true, phone: true, guardianPhone: true },
        });
        return { students, ref: "بدون کلاس فعال" };
      }
      if (p.audienceValue === "debtors") {
        // بدهکاران = مانده شهریه >0 (سیستم جدید بدون اقساط)
        const { getDebtors } = await import("@/modules/finance/services/finance.service");
        const debtors = await getDebtors();
        if (debtors.length === 0) return { students: [], ref: "بدهکاران: هیچ‌کدام" };
        const ids = debtors.map((d) => d.studentId);
        const students = await activeStudents({ id: { in: ids } });
        return { students, ref: `بدهکاران: ${students.length} نفر` };
      }
      return { students: [], ref: "فیلتر نامعتبر" };
    }
    default:
      return { students: [], ref: "نامشخص" };
  }
}

/** فیلتر شماره نامعتبر — قبل از ارسال (F7-AC7) */
export function pickPhone(s: AudienceStudent, target: "STUDENT" | "GUARDIAN"): string | null {
  const raw = target === "GUARDIAN" ? s.guardianPhone : s.phone;
  return isValidMobile(raw) ? raw : null;
}

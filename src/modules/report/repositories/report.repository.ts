// ── ریپازیتوری گزارشات — فقط-خواندنی، مستقیم Prisma
// درآمد از TuitionPayment (شهریه منعطف) — نه StudentReceipt قدیمی
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

function dateFilter(range: DateRange): Prisma.DateTimeFilter | undefined {
  if (!range.from && !range.to) return undefined;
  if (range.from && range.to) return { gte: range.from, lte: range.to };
  if (range.from) return { gte: range.from };
  if (range.to) return { lte: range.to };
  return undefined;
}

// ── شهریه‌ها — منبع جدید: TuitionPayment (پرداخت منعطف با رسید الزامی)
export function listTuitionPayments(range: DateRange) {
  const f = dateFilter(range);
  const where: Prisma.TuitionPaymentWhereInput = f ? { paidAt: f } : {};
  return prisma.tuitionPayment.findMany({
    where,
    include: {
      student: {
        select: {
          id: true,
          fullName: true,
          instruments: { include: { instrument: { select: { id: true, name: true } } } },
        },
      },
      allocations: {
        include: { class: { include: { instrument: { select: { id: true, name: true } } } } },
      },
    },
    orderBy: [{ paidAt: "desc" }, { id: "desc" }],
  });
}

// برای سازگاری قدیمی — alias
export const listStudentReceipts = listTuitionPayments;

export function listTuitionPaymentsFiltered(range: DateRange, opts: { studentId?: number; instrumentId?: number; q?: string }) {
  const f = dateFilter(range);
  const where: Prisma.TuitionPaymentWhereInput = {};
  if (f) where.paidAt = f;
  if (opts.studentId) where.studentId = opts.studentId;

  return prisma.tuitionPayment.findMany({
    where,
    include: {
      student: {
        select: {
          id: true,
          fullName: true,
          instruments: { include: { instrument: { select: { id: true, name: true } } } },
        },
      },
      allocations: {
        include: { class: { include: { instrument: { select: { id: true, name: true } } } } },
      },
    },
    orderBy: [{ paidAt: "desc" }, { id: "desc" }],
  });
}

export const listStudentReceiptsFiltered = listTuitionPaymentsFiltered;

export async function countTuitionPayments(range: DateRange) {
  const f = dateFilter(range);
  const where: Prisma.TuitionPaymentWhereInput = f ? { paidAt: f } : {};
  const agg = await prisma.tuitionPayment.aggregate({ where, _sum: { amount: true }, _count: { _all: true } });
  return { total: agg._sum?.amount ?? 0, count: agg._count?._all ?? 0 };
}

export const countStudentReceipts = countTuitionPayments;

// ── هزینه‌های جانبی (GeneralExpense) — ثبت دستی ادمین
export function listGeneralExpenses(range: DateRange) {
  const f = dateFilter(range);
  const where: Prisma.GeneralExpenseWhereInput = f ? { paidAt: f } : {};
  return prisma.generalExpense.findMany({
    where,
    orderBy: [{ paidAt: "desc" }, { id: "desc" }],
  });
}

export async function countGeneralExpenses(range: DateRange) {
  const f = dateFilter(range);
  const where: Prisma.GeneralExpenseWhereInput = f ? { paidAt: f } : {};
  const agg = await prisma.generalExpense.aggregate({ where, _sum: { amount: true }, _count: { _all: true } });
  return { total: agg._sum?.amount ?? 0, count: agg._count?._all ?? 0 };
}

// ── حقوق اساتید (بدون تغییر)
export function listTeacherReceipts(range: DateRange) {
  const f = dateFilter(range);
  const where: Prisma.TeacherReceiptWhereInput = f ? { paidAt: f } : {};
  return prisma.teacherReceipt.findMany({
    where,
    include: {
      teacher: { select: { id: true, fullName: true } },
    },
    orderBy: [{ paidAt: "desc" }, { id: "desc" }],
  });
}

export async function countTeacherReceipts(range: DateRange) {
  const f = dateFilter(range);
  const where: Prisma.TeacherReceiptWhereInput = f ? { paidAt: f } : {};
  const agg = await prisma.teacherReceipt.aggregate({ where, _sum: { amount: true }, _count: { _all: true } });
  return { total: agg._sum?.amount ?? 0, count: agg._count?._all ?? 0 };
}

// ── ترم‌ها برای فیلتر
export function listTerms() {
  return prisma.term.findMany({ orderBy: { startDate: "desc" } });
}

export function findTermById(id: number) {
  return prisma.term.findUnique({ where: { id } });
}

export function findActiveTerm() {
  return prisma.term.findFirst({ where: { isActive: true } });
}

// ── برای نمودار ماهانه — واکشی خام و گروه‌بندی در سرویس (حجم کم)
export function listAllReceiptsForSeries(range: DateRange) {
  return Promise.all([listTuitionPayments(range), listTeacherReceipts(range), listGeneralExpenses(range)]);
}

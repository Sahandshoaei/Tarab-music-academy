import { prisma } from "@/lib/prisma";
import { parseJalaliDate } from "@/lib/jalali";
import * as repo from "../repositories/finance.repository";
import type { TuitionPayment, TuitionPaymentAllocation } from "@prisma/client";

export class FinanceServiceError extends Error {}

export interface ClassTuitionRow {
  classId: number;
  title: string | null;
  instrument: string;
  teacher: string;
  term: string;
  type: string;
  tuition: number;
  paid: number;
  remaining: number;
  isZeroTuition: boolean;
}

export interface TuitionSummary {
  classes: ClassTuitionRow[];
  totalTuition: number;
  totalPaid: number;
  totalRemaining: number;
  hasZeroTuition: boolean;
  payments: Array<{
    id: number;
    amount: number;
    paidAt: Date;
    receiptImageUrl: string;
    allocations: Array<{ classId: number; amount: number; class: { title: string | null; instrument: { name: string } } }>;
  }>;
}

type TuitionRates = {
  privateRate: number | null;
  groupRate: number | null;
  semiGroupRate: number | null;
  practiceRate: number | null;
} | null;

export function tuitionForClassType(type: string, rates: TuitionRates): number {
  if (!rates) return 0;
  if (type === "PRIVATE") return rates.privateRate ?? 0;
  if (type === "GROUP") return rates.groupRate ?? 0;
  if (type === "SEMI_GROUP") return rates.semiGroupRate ?? 0;
  if (type === "PRACTICE") return rates.practiceRate ?? 0;
  return 0;
}

/** 4.4 — جزئیات مالی per-class برای یک هنرجو — بدون any */
export async function getStudentTuitionSummary(studentId: number): Promise<TuitionSummary> {
  const rates = await repo.getTuitionRates();
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId, isActive: true, class: { isActive: true } },
    include: {
      class: {
        include: {
          instrument: { select: { name: true } },
          teacher: { select: { fullName: true } },
          term: { select: { name: true } },
        },
      },
    },
  });

  const payments = await repo.listTuitionPaymentsByStudent(studentId);

  const paidByClass = new Map<number, number>();
  for (const p of payments) {
    const allocs = (p as unknown as { allocations: { classId: number; amount: number }[] }).allocations;
    for (const a of allocs) {
      paidByClass.set(a.classId, (paidByClass.get(a.classId) ?? 0) + a.amount);
    }
  }

  const classes: ClassTuitionRow[] = enrollments.map((e) => {
    const cls = e.class as unknown as { id: number; title: string | null; type: string; instrument: { name: string }; teacher: { fullName: string }; term: { name: string } };
    const tuition = tuitionForClassType(cls.type, rates);
    const paid = paidByClass.get(cls.id) ?? 0;
    const isZeroTuition = tuition === 0;
    return {
      classId: cls.id,
      title: cls.title,
      instrument: cls.instrument.name,
      teacher: cls.teacher.fullName,
      term: cls.term.name,
      type: cls.type,
      tuition,
      paid,
      remaining: Math.max(0, tuition - paid),
      isZeroTuition,
    };
  });

  const totalTuition = classes.reduce((s, c) => s + c.tuition, 0);
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const totalRemaining = classes.reduce((s, c) => s + c.remaining, 0);
  const hasZeroTuition = classes.some((c) => c.isZeroTuition);

  return { classes, totalTuition, totalPaid, totalRemaining, hasZeroTuition, payments: payments as TuitionSummary["payments"] };
}

export const getStudentFinanceSummary = getStudentTuitionSummary;

/** 2.1 — بدهکاران بدون N+1: همه enrollments + payments یکبار */
export async function getDebtors() {
  const rates = await repo.getTuitionRates();
  const safeRates: NonNullable<TuitionRates> = rates ?? { privateRate: 0, groupRate: 0, semiGroupRate: 0, practiceRate: 0 };

  const [students, enrollments, payments] = await Promise.all([
    prisma.student.findMany({
      where: { isActive: true },
      select: { id: true, fullName: true, phone: true },
    }),
    prisma.enrollment.findMany({
      where: { isActive: true, class: { isActive: true } },
      select: {
        studentId: true,
        class: { select: { id: true, type: true } },
      },
    }),
    prisma.tuitionPayment.findMany({
      select: {
        studentId: true,
        amount: true,
        allocations: { select: { classId: true, amount: true } },
      },
    }),
  ]);

  const tuitionByClass = new Map<number, number>();
  for (const e of enrollments) {
    const t = tuitionForClassType((e.class as unknown as { type: string }).type, safeRates);
    tuitionByClass.set((e.class as unknown as { id: number }).id, t);
  }

  const enrollByStudent = new Map<number, number[]>();
  for (const e of enrollments) {
    const arr = enrollByStudent.get(e.studentId) ?? [];
    arr.push((e.class as unknown as { id: number }).id);
    enrollByStudent.set(e.studentId, arr);
  }

  const paidByStudentClass = new Map<string, number>();
  for (const p of payments) {
    const allocs = (p as unknown as { allocations: { classId: number; amount: number }[] }).allocations;
    for (const a of allocs) {
      const key = `${p.studentId}:${a.classId}`;
      paidByStudentClass.set(key, (paidByStudentClass.get(key) ?? 0) + a.amount);
    }
  }

  const result: { studentId: number; studentName: string; phone: string; overdueAmount: number; overdueCount: number }[] = [];
  for (const s of students) {
    const classIds = enrollByStudent.get(s.id) ?? [];
    if (classIds.length === 0) continue;
    let overdueAmount = 0;
    let overdueCount = 0;
    for (const cid of classIds) {
      const tuition = tuitionByClass.get(cid) ?? 0;
      const paid = paidByStudentClass.get(`${s.id}:${cid}`) ?? 0;
      const remaining = Math.max(0, tuition - paid);
      if (remaining > 0) {
        overdueAmount += remaining;
        overdueCount++;
      }
    }
    if (overdueAmount > 0) {
      result.push({ studentId: s.id, studentName: s.fullName, phone: s.phone, overdueAmount, overdueCount });
    }
  }
  return result.sort((a, b) => b.overdueAmount - a.overdueAmount);
}

/** 2.5 — تقسیم نسبی به نسبت شهریه */
export async function createTuitionPayment(input: {
  studentId: number;
  amount: number;
  paidAt: string;
  receiptImageUrl: string;
  note?: string;
  classIds: number[];
}) {
  const paidAt = parseJalaliDate(input.paidAt);
  if (!paidAt) throw new FinanceServiceError("تاریخ پرداخت نامعتبر است.");
  if (input.amount < 1000) throw new FinanceServiceError("مبلغ نادرست است.");
  if (!input.receiptImageUrl) throw new FinanceServiceError("رسید الزامی است.");
  if (!input.classIds.length) throw new FinanceServiceError("حداقل یک کلاس انتخاب کنید.");

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: input.studentId, isActive: true, classId: { in: input.classIds } },
    select: { classId: true },
  });
  const enrolledIds = new Set(enrollments.map((e) => e.classId));
  for (const cid of input.classIds) {
    if (!enrolledIds.has(cid)) throw new FinanceServiceError(`کلاس ${cid} برای این هنرجو فعال نیست.`);
  }

  const rates = await repo.getTuitionRates();
  const classTuitions = await prisma.class.findMany({
    where: { id: { in: input.classIds } },
    select: { id: true, type: true },
  });
  const tuitionMap = new Map<number, number>();
  for (const c of classTuitions) tuitionMap.set(c.id, tuitionForClassType(c.type, rates));
  const totalTuition = input.classIds.reduce((s, cid) => s + (tuitionMap.get(cid) ?? 0), 0);

  let allocations: { classId: number; amount: number }[];
  if (totalTuition === 0) {
    const perClass = Math.floor(input.amount / input.classIds.length);
    const remainder = input.amount - perClass * input.classIds.length;
    allocations = input.classIds.map((cid, idx) => ({ classId: cid, amount: perClass + (idx === 0 ? remainder : 0) }));
  } else {
    allocations = input.classIds.map((cid) => ({
      classId: cid,
      amount: Math.floor((input.amount * (tuitionMap.get(cid) ?? 0)) / totalTuition),
    }));
    let allocated = allocations.reduce((s, a) => s + a.amount, 0);
    let remainder = input.amount - allocated;
    const sorted = [...input.classIds].sort((a, b) => (tuitionMap.get(b) ?? 0) - (tuitionMap.get(a) ?? 0));
    let idx = 0;
    while (remainder > 0) {
      const cid = sorted[idx % sorted.length];
      const al = allocations.find((x) => x.classId === cid)!;
      al.amount += 1;
      remainder--;
      idx++;
    }
  }

  return repo.createTuitionPaymentWithAllocations({
    studentId: input.studentId,
    amount: input.amount,
    paidAt,
    receiptImageUrl: input.receiptImageUrl,
    note: input.note,
    allocations,
  });
}

export async function deleteTuitionPayment(id: number) {
  await repo.deleteTuitionPayment(id);
}

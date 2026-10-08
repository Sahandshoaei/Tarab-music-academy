import { prisma } from "@/lib/prisma";

// ── Tuition payments (flexible, receipt required, manual class allocation) ──
export function listTuitionPaymentsByStudent(studentId: number) {
  return prisma.tuitionPayment.findMany({
    where: { studentId },
    orderBy: { paidAt: "desc" },
    include: { allocations: { include: { class: { include: { instrument: true } } } } },
  });
}

export function getTuitionRates() {
  return prisma.schoolSettings.findFirst({
    select: { privateRate: true, groupRate: true, semiGroupRate: true, practiceRate: true },
  });
}

export async function createTuitionPaymentWithAllocations(p: {
  studentId: number;
  amount: number;
  paidAt: Date;
  receiptImageUrl: string;
  note?: string;
  allocations: { classId: number; amount: number }[];
}) {
  return prisma.tuitionPayment.create({
    data: {
      studentId: p.studentId,
      amount: p.amount,
      paidAt: p.paidAt,
      receiptImageUrl: p.receiptImageUrl,
      note: p.note ?? null,
      allocations: { create: p.allocations.map((a) => ({ classId: a.classId, amount: a.amount })) },
    },
    include: { allocations: true },
  });
}

export function deleteTuitionPayment(id: number) {
  return prisma.tuitionPayment.delete({ where: { id } });
}

export function findTuitionPaymentById(id: number) {
  return prisma.tuitionPayment.findUnique({ where: { id }, include: { allocations: true } });
}

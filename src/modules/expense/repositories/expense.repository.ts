import { prisma } from "@/lib/prisma";
import type { Prisma, GeneralExpenseCategory } from "@prisma/client";

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

export function listGeneralExpenses(range?: DateRange, opts?: { q?: string; category?: GeneralExpenseCategory }) {
  const where: Prisma.GeneralExpenseWhereInput = {};
  if (range) {
    const f = dateFilter(range);
    if (f) where.paidAt = f;
  }
  if (opts?.category) where.category = opts.category;
  if (opts?.q) {
    const q = opts.q.trim();
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { note: { contains: q, mode: "insensitive" } },
      ];
    }
  }
  return prisma.generalExpense.findMany({
    where,
    orderBy: [{ paidAt: "desc" }, { id: "desc" }],
  });
}

export function countGeneralExpenses(range: DateRange) {
  const f = dateFilter(range);
  const where: Prisma.GeneralExpenseWhereInput = f ? { paidAt: f } : {};
  return prisma.generalExpense.aggregate({
    where,
    _sum: { amount: true },
    _count: { _all: true },
  });
}

export function createGeneralExpense(data: {
  title: string;
  category: GeneralExpenseCategory;
  amount: number;
  paidAt: Date;
  note?: string;
}) {
  return prisma.generalExpense.create({ data });
}

export function updateGeneralExpense(
  id: number,
  data: Partial<{ title: string; category: GeneralExpenseCategory; amount: number; paidAt: Date; note: string | null }>,
) {
  return prisma.generalExpense.update({ where: { id }, data });
}

export function deleteGeneralExpense(id: number) {
  return prisma.generalExpense.delete({ where: { id } });
}

export function findGeneralExpenseById(id: number) {
  return prisma.generalExpense.findUnique({ where: { id } });
}

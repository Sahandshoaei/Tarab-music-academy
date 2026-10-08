// دسترسی داده ترم — فقط CRUD
import { prisma } from "@/lib/prisma";
import type { Term } from "@prisma/client";

export function listTerms() {
  return prisma.term.findMany({
    orderBy: { startDate: "desc" },
    include: { _count: { select: { classes: true } } },
  });
}

export function findTermById(id: number) {
  return prisma.term.findUnique({ where: { id } });
}

export function createTerm(data: { name: string; startDate: Date; endDate: Date }): Promise<Term> {
  return prisma.term.create({ data });
}

/** F0-AC2: فعال‌سازی ترم — ترم فعال قبلی در همان تراکنش غیرفعال می‌شود */
export function activateTerm(id: number) {
  return prisma.$transaction([
    prisma.term.updateMany({ where: { isActive: true }, data: { isActive: false } }),
    prisma.term.update({ where: { id }, data: { isActive: true } }),
  ]);
}

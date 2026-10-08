// کوئری‌های فقط-خواندنی SMS (مثل dashboard)
import { prisma } from "@/lib/prisma";

export function listBatchesForHistory() {
  return prisma.smsBatch.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { messages: true } }, messages: { select: { status: true } } },
    take: 100,
  });
}

export function getBatchDetail(id: string) {
  return prisma.smsBatch.findUnique({
    where: { id },
    include: { messages: { include: { student: { select: { id: true, fullName: true } } }, orderBy: { id: "asc" } } },
  });
}

export function listActiveStudentsForCompose(q?: string) {
  return prisma.student.findMany({
    where: { isActive: true, ...(q ? { fullName: { contains: q, mode: "insensitive" } } : {}) },
    select: { id: true, fullName: true, phone: true, guardianPhone: true },
    orderBy: { fullName: "asc" },
    take: 100,
  });
}

export function listClassesForCompose() {
  return prisma.class.findMany({
    where: { isActive: true },
    select: { id: true, title: true, instrument: { select: { name: true } } },
    orderBy: { id: "desc" },
  });
}

export function listInstrumentsForCompose() {
  return prisma.instrument.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { sortOrder: "asc" } });
}

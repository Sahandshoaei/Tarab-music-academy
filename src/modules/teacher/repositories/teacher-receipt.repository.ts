import { prisma } from "@/lib/prisma";

export function listReceiptsByTeacherId(teacherId: number) {
  return prisma.teacherReceipt.findMany({
    where: { teacherId },
    orderBy: [{ paidAt: "desc" }, { id: "desc" }],
  });
}

export function createReceipt(data: { teacherId: number; imageUrl: string; amount: number; paidAt: Date; note?: string }) {
  return prisma.teacherReceipt.create({ data });
}

export function deleteReceipt(id: number, teacherId: number) {
  return prisma.teacherReceipt.delete({ where: { id, teacherId } as never });
}

export function findReceiptById(id: number) {
  return prisma.teacherReceipt.findUnique({ where: { id } });
}

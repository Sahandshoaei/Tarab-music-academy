// فقط امضا — فیش‌های قدیمی حذف شد (TuitionPayment جایگزین شد)
import { prisma } from "@/lib/prisma";

export function updateSignature(studentId: number, imageUrl: string | null) {
  return prisma.student.update({
    where: { id: studentId },
    data: { signatureImageUrl: imageUrl },
  });
}

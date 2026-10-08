// سرویس فیش حقوق استاد — همان الگوی StudentReceipt
import { parseJalaliDate } from "@/lib/jalali";
import { saveUpload, UploadError } from "@/lib/upload";
import * as repo from "../repositories/teacher-receipt.repository";
import { findTeacherById } from "../repositories/teacher.repository";

export class TeacherReceiptServiceError extends Error {}

export async function addReceipt(input: { teacherId: number; file: File; amountRaw: string; paidAtRaw: string; note?: string }) {
  const teacher = await findTeacherById(input.teacherId);
  if (!teacher) throw new TeacherReceiptServiceError("استاد یافت نشد.");
  if (!input.file || input.file.size === 0) throw new TeacherReceiptServiceError("عکس فیش الزامی است.");
  const amount = Number(String(input.amountRaw).replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[^0-9]/g, ""));
  if (!Number.isInteger(amount) || amount <= 0) throw new TeacherReceiptServiceError("مبلغ معتبر نیست.");
  if (amount > 1_000_000_000) throw new TeacherReceiptServiceError("مبلغ بیش از حد مجاز است.");
  const paidAt = parseJalaliDate(input.paidAtRaw);
  if (!paidAt) throw new TeacherReceiptServiceError("تاریخ پرداخت معتبر نیست.");
  let url: string;
  try {
    url = await saveUpload(input.file, "teachers/receipts");
  } catch (e) {
    if (e instanceof UploadError) throw new TeacherReceiptServiceError(e.message);
    throw e;
  }
  return repo.createReceipt({ teacherId: input.teacherId, imageUrl: url, amount, paidAt, note: input.note?.trim() || undefined });
}

export async function removeReceipt(receiptId: number, teacherId: number) {
  const r = await repo.findReceiptById(receiptId);
  if (!r || r.teacherId !== teacherId) throw new TeacherReceiptServiceError("فیش یافت نشد.");
  await repo.deleteReceipt(receiptId, teacherId);
}

export async function listReceipts(teacherId: number) {
  return repo.listReceiptsByTeacherId(teacherId);
}

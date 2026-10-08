// سرویس امضای هنرجو — فیش‌های قدیمی حذف شد
import { saveUpload, UploadError } from "@/lib/upload";
import * as receiptRepo from "../repositories/student-receipt.repository";
import { findStudentById } from "../repositories/student.repository";

export class ReceiptServiceError extends Error {}

export async function setSignature(studentId: number, file: File | null) {
  const student = await findStudentById(studentId);
  if (!student) throw new ReceiptServiceError("هنرجو یافت نشد.");
  if (!file || file.size === 0) throw new ReceiptServiceError("فایل امضا الزامی است.");

  let url: string;
  try {
    url = await saveUpload(file, "students/signatures");
  } catch (e) {
    if (e instanceof UploadError) throw new ReceiptServiceError((e as Error).message);
    throw e;
  }
  await receiptRepo.updateSignature(studentId, url);
}

export async function clearSignature(studentId: number) {
  const student = await findStudentById(studentId);
  if (!student) throw new ReceiptServiceError("هنرجو یافت نشد.");
  await receiptRepo.updateSignature(studentId, null);
}

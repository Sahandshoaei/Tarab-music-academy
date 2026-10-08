"use server";
import { revalidatePath } from "next/cache";
import { saveUpload } from "@/lib/upload";
import { tuitionPaymentSchema } from "../schemas/finance.schema";
import { createTuitionPayment, deleteTuitionPayment } from "../services/finance.service";

export async function createTuitionPaymentAction(_prev: unknown, formData: FormData) {
  const classIds = formData.getAll("classIds").map((v) => Number(v)).filter((n) => Number.isInteger(n) && n > 0);
  const raw = {
    studentId: formData.get("studentId"),
    amount: formData.get("amount"),
    paidAt: formData.get("paidAt"),
    note: formData.get("note") ?? "",
    classIds,
  };
  const parsed = tuitionPaymentSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ورودی نامعتبر" };
  }
  const file = formData.get("receipt") as File | null;
  if (!file || file.size === 0) return { error: "عکس رسید الزامی است." };
  let receiptUrl: string;
  try {
    receiptUrl = await saveUpload(file, "students/receipts");
  } catch (e: unknown) {
    return { error: (e as Error).message ?? "آپلود رسید ناموفق" };
  }

  try {
    await createTuitionPayment({ ...parsed.data, receiptImageUrl: receiptUrl });
  } catch (e: unknown) {
    return { error: (e as Error).message ?? "خطا در ثبت پرداخت" };
  }
  revalidatePath(`/students/${parsed.data.studentId}`);
  revalidatePath("/debtors");
  return { success: true };
}

export async function deleteTuitionPaymentAction(formData: FormData) {
  const id = Number(formData.get("id"));
  const studentId = Number(formData.get("studentId"));
  if (!Number.isInteger(id)) return { error: "شناسه نامعتبر" };
  await deleteTuitionPayment(id);
  if (Number.isInteger(studentId)) revalidatePath(`/students/${studentId}`);
  revalidatePath("/debtors");
  return { success: true };
}

export async function createInvoiceAction() {
  return { error: "صدور فاکتور با اقساط حذف شده — از پرداخت منعطف در پروفایل هنرجو استفاده کنید." };
}

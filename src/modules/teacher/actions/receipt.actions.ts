"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth/session";
import type { ActionState } from "@/types/action";
import * as service from "../services/teacher-receipt.service";

export async function uploadTeacherReceiptAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const teacherId = Number(formData.get("teacherId"));
  const file = formData.get("receipt") as File | null;
  if (!Number.isInteger(teacherId)) return { error: "شناسه نامعتبر" };
  if (!file || file.size === 0) return { error: "عکس فیش الزامی است." };
  try {
    await service.addReceipt({
      teacherId,
      file,
      amountRaw: String(formData.get("amount") ?? ""),
      paidAtRaw: String(formData.get("paidAt") ?? ""),
      note: String(formData.get("note") ?? "") || undefined,
    });
    revalidatePath(`/teachers/${teacherId}`);
    return { success: true };
  } catch (e) {
    if (e instanceof service.TeacherReceiptServiceError) return { error: e.message };
    return { error: "خطای ناشناخته" };
  }
}

export async function deleteTeacherReceiptAction(formData: FormData) {
  await requireAdmin();
  const teacherId = Number(formData.get("teacherId"));
  const receiptId = Number(formData.get("receiptId"));
  if (!Number.isInteger(teacherId) || !Number.isInteger(receiptId)) return;
  try {
    await service.removeReceipt(receiptId, teacherId);
  } catch {}
  revalidatePath(`/teachers/${teacherId}`);
}

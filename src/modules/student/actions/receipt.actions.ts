"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth/session";
import type { ActionState } from "@/types/action";
import * as service from "../services/student-receipt.service";

export async function uploadSignatureAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const studentId = Number(formData.get("studentId"));
  const file = formData.get("signature") as File | null;
  if (!Number.isInteger(studentId)) return { error: "شناسه هنرجو نامعتبر است." };
  try {
    await service.setSignature(studentId, file);
    revalidatePath(`/students/${studentId}`);
    return { success: true };
  } catch (e) {
    if (e instanceof service.ReceiptServiceError) return { error: (e as Error).message };
    return { error: "خطای ناشناخته" };
  }
}

export async function clearSignatureAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const studentId = Number(formData.get("studentId"));
  if (!Number.isInteger(studentId)) return { error: "شناسه هنرجو نامعتبر است." };
  try {
    await service.clearSignature(studentId);
    revalidatePath(`/students/${studentId}`);
    return { success: true };
  } catch (e) {
    if (e instanceof service.ReceiptServiceError) return { error: (e as Error).message };
    return { error: "خطای ناشناخته" };
  }
}

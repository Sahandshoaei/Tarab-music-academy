"use server";

// Server Actions هنرجو — نازک: گارد + سرویس + revalidate
import { ZodError } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/server/auth/session";
import type { ActionState } from "@/types/action";
import * as service from "../services/student.service";

function parseForm(formData: FormData) {
  return {
    fullName: String(formData.get("fullName") ?? ""),
    nationalId: String(formData.get("nationalId") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    guardianPhone: String(formData.get("guardianPhone") ?? ""),
    address: String(formData.get("address") ?? "") || undefined,
    registrationDate: String(formData.get("registrationDate") ?? ""),
    referralSource: String(formData.get("referralSource") ?? "") || undefined,
    referralNote: String(formData.get("referralNote") ?? "") || undefined,
    notes: String(formData.get("notes") ?? "") || undefined,
    instrumentIds: formData.getAll("instrumentIds").map(String),
  };
}

export async function createStudentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  try {
    const student = await service.createStudent(parseForm(formData));
    revalidatePath("/students");
    redirect(`/students/${student.id}`);
  } catch (e) {
    if (e instanceof ZodError) return { error: e.issues[0]?.message ?? "داده فرم نامعتبر است." };
    if (e instanceof service.StudentServiceError) return { error: e.message };
    throw e; // NEXT_REDIRECT
  }
}

export async function updateStudentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const id = Number(formData.get("studentId"));
  try {
    if (!Number.isInteger(id)) return { error: "شناسه هنرجو نامعتبر است." };
    await service.updateStudent(id, parseForm(formData));
    revalidatePath("/students");
    revalidatePath(`/students/${id}`);
    return { success: true };
  } catch (e) {
    if (e instanceof ZodError) return { error: e.issues[0]?.message ?? "داده فرم نامعتبر است." };
    if (e instanceof service.StudentServiceError) return { error: e.message };
    return { error: "خطای ناشناخته" };
  }
}

export async function toggleStudentActiveAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const next = String(formData.get("next")) === "true";
  if (Number.isInteger(id)) {
    await service.setStudentActive(id, next);
    revalidatePath("/students");
    revalidatePath(`/students/${id}`);
  }
}

export async function deleteStudentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const id = Number(formData.get("studentId"));
  try {
    if (!Number.isInteger(id)) return { error: "شناسه هنرجو نامعتبر است." };
    await service.deleteStudent(id);
    revalidatePath("/students");
    redirect("/students");
  } catch (e) {
    if (e instanceof service.StudentServiceError) return { error: e.message };
    throw e; // NEXT_REDIRECT
  }
}

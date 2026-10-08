"use server";

import { ZodError } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/server/auth/session";
import type { ActionState } from "@/types/action";
import * as service from "../services/teacher.service";

function parseForm(formData: FormData) {
  return {
    fullName: String(formData.get("fullName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    notes: String(formData.get("notes") ?? "") || undefined,
    instrumentIds: formData.getAll("instrumentIds").map(String),
    birthDate: String(formData.get("birthDate") ?? "") || undefined,
    insuranceType: String(formData.get("insuranceType") ?? "") || undefined,
    insuranceNumber: String(formData.get("insuranceNumber") ?? "") || undefined,
    teachingExperienceYears: String(formData.get("teachingExperienceYears") ?? "") || undefined,
    teachingExperienceNote: String(formData.get("teachingExperienceNote") ?? "") || undefined,
    isQualified: String(formData.get("isQualified") ?? "") || undefined,
    qualificationNote: String(formData.get("qualificationNote") ?? "") || undefined,
    cardNumber: String(formData.get("cardNumber") ?? "") || undefined,
    sheba: String(formData.get("sheba") ?? "") || undefined,
  };
}

export async function createTeacherAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  try {
    const resume = formData.get("resume") as File | null;
    const teacher = await service.createTeacher(parseForm(formData), resume);
    revalidatePath("/teachers");
    redirect(`/teachers/${teacher.id}`);
  } catch (e) {
    if (e instanceof ZodError) return { error: e.issues[0]?.message ?? "داده نامعتبر" };
    if (e instanceof service.TeacherServiceError) return { error: e.message };
    throw e;
  }
}

export async function updateTeacherAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = Number(formData.get("teacherId"));
  try {
    if (!Number.isInteger(id)) return { error: "شناسه استاد نامعتبر است." };
    const resume = formData.get("resume") as File | null;
    await service.updateTeacher(id, parseForm(formData), resume);
    revalidatePath(`/teachers/${id}`);
    revalidatePath("/teachers");
    return { success: true };
  } catch (e) {
    if (e instanceof ZodError) return { error: e.issues[0]?.message ?? "داده نامعتبر" };
    if (e instanceof service.TeacherServiceError) return { error: e.message };
    return { error: "خطای ناشناخته" };
  }
}

export async function toggleTeacherActiveAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const next = String(formData.get("next")) === "true";
  if (Number.isInteger(id)) {
    await service.setTeacherActive(id, next);
    revalidatePath("/teachers");
    revalidatePath(`/teachers/${id}`);
  }
}

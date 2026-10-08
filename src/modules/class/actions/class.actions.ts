"use server";

// Server Actions کلاس/جلسه — نازک: گارد + سرویس + revalidate
import { ZodError } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/server/auth/session";
import type { ActionState } from "@/types/action";
import * as service from "../services/class.service";

function parseClassForm(formData: FormData) {
  return {
    title: String(formData.get("title") ?? "") || undefined,
    classType: String(formData.get("classType") ?? ""),
    scheduleType: String(formData.get("scheduleType") ?? ""),
    instrumentId: String(formData.get("instrumentId") ?? ""),
    teacherId: String(formData.get("teacherId") ?? ""),
    roomId: String(formData.get("roomId") ?? ""),
    weekday: String(formData.get("weekday") ?? "") || undefined,
    singleDate: String(formData.get("singleDate") ?? "") || undefined,
    startTime: String(formData.get("startTime") ?? "") || undefined,
    endTime: String(formData.get("endTime") ?? "") || undefined,
    notes: String(formData.get("notes") ?? "") || undefined,
    studentIds: formData.getAll("studentIds").map(String),
  };
}

function parseSessionForm(formData: FormData) {
  return {
    date: String(formData.get("date") ?? ""),
    startTime: String(formData.get("startTime") ?? ""),
    endTime: String(formData.get("endTime") ?? ""),
    roomId: String(formData.get("roomId") ?? ""),
    teacherId: String(formData.get("teacherId") ?? ""),
    notes: String(formData.get("notes") ?? "") || undefined,
  };
}

function revalidateClassViews(classId?: number) {
  revalidatePath("/classes");
  revalidatePath("/schedule");
  revalidatePath("/dashboard");
  if (classId) revalidatePath(`/classes/${classId}`);
}

export async function createClassAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  try {
    const cls = await service.createClass(parseClassForm(formData));
    revalidateClassViews(cls.id);
    redirect(`/classes/${cls.id}`);
  } catch (e) {
    if (e instanceof ZodError) return { error: e.issues[0]?.message ?? "داده فرم نامعتبر است." };
    if (e instanceof service.ClassServiceError) return { error: e.message };
    throw e; // NEXT_REDIRECT
  }
}

export async function updateClassAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const id = Number(formData.get("classId"));
  try {
    if (!Number.isInteger(id)) return { error: "شناسه کلاس نامعتبر است." };
    await service.updateClass(id, parseClassForm(formData));
    revalidateClassViews(id);
    return { success: true };
  } catch (e) {
    if (e instanceof ZodError) return { error: e.issues[0]?.message ?? "داده فرم نامعتبر است." };
    if (e instanceof service.ClassServiceError) return { error: e.message };
    return { error: "خطای ناشناخته" };
  }
}

export async function toggleClassActiveAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const next = String(formData.get("next")) === "true";
  if (Number.isInteger(id)) {
    try {
      await service.setClassActive(id, next);
    } catch (e) {
      // خطای دامنه (مثل تداخل در فعال‌سازی مجدد) — لاگ سرور؛ UI از رفرش بعدی پیام نمی‌گیرد
      if (e instanceof service.ClassServiceError) {
        console.error("[class toggle]", e.message);
        return;
      }
      throw e;
    }
    revalidateClassViews(id);
  }
}

export async function addSessionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const classId = Number(formData.get("classId"));
  try {
    if (!Number.isInteger(classId)) return { error: "شناسه کلاس نامعتبر است." };
    await service.addSession(classId, parseSessionForm(formData));
    revalidateClassViews(classId);
    return { success: true };
  } catch (e) {
    if (e instanceof ZodError) return { error: e.issues[0]?.message ?? "داده فرم نامعتبر است." };
    if (e instanceof service.ClassServiceError) return { error: e.message };
    return { error: "خطای ناشناخته" };
  }
}

export async function updateSessionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const sessionId = Number(formData.get("sessionId"));
  try {
    if (!Number.isInteger(sessionId)) return { error: "شناسه جلسه نامعتبر است." };
    await service.updateSession(sessionId, parseSessionForm(formData));
    revalidatePath(`/sessions/${sessionId}`);
    revalidateClassViews();
    return { success: true };
  } catch (e) {
    if (e instanceof ZodError) return { error: e.issues[0]?.message ?? "داده فرم نامعتبر است." };
    if (e instanceof service.ClassServiceError) return { error: e.message };
    return { error: "خطای ناشناخته" };
  }
}

export async function cancelSessionAction(formData: FormData) {
  await requireAdmin();
  const sessionId = Number(formData.get("sessionId"));
  if (Number.isInteger(sessionId)) {
    await service.cancelSession(sessionId);
    revalidatePath(`/sessions/${sessionId}`);
    revalidateClassViews();
  }
}


export async function createMakeupSessionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const sessionId = Number(formData.get("sessionId"));
  try {
    if (!Number.isInteger(sessionId)) return { error: "شناسه جلسه نامعتبر است." };
    const date = String(formData.get("date") ?? "");
    await service.createMakeupSession(sessionId, { date });
    revalidatePath(`/sessions/${sessionId}`);
    revalidateClassViews();
    return { success: true };
  } catch (e) {
    if (e instanceof ZodError) return { error: e.issues[0]?.message ?? "داده فرم نامعتبر است." };
    if (e instanceof service.ClassServiceError) return { error: e.message };
    return { error: "خطای ناشناخته" };
  }
}

export async function addStudentToClassAction(formData: FormData) {
  await requireAdmin();
  const classId = Number(formData.get("classId"));
  const studentId = Number(formData.get("studentId"));
  if (Number.isInteger(classId) && Number.isInteger(studentId)) {
    try {
      await service.addStudentToClass(classId, studentId);
    } catch (e) {
      if (e instanceof service.ClassServiceError) {
        console.error("[addStudent]", e.message);
        return;
      }
      throw e;
    }
    revalidateClassViews(classId);
  }
}

export async function removeStudentFromClassAction(formData: FormData) {
  await requireAdmin();
  const classId = Number(formData.get("classId"));
  const studentId = Number(formData.get("studentId"));
  if (Number.isInteger(classId) && Number.isInteger(studentId)) {
    await service.removeStudentFromClass(classId, studentId);
    revalidateClassViews(classId);
  }
}

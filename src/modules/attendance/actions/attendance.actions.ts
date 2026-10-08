"use server";

// Server Action حضور و غیاب — نازک: گارد + سرویس + revalidate
import { ZodError } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth/session";
import type { ActionState } from "@/types/action";
import * as service from "../services/attendance.service";

export async function setAttendanceAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireAdmin();
  try {
    const sessionId = Number(formData.get("sessionId"));
    let entries: unknown = [];
    try {
      entries = JSON.parse(String(formData.get("entries") ?? "[]"));
    } catch {
      return { error: "داده فرم نامعتبر است." };
    }
    await service.setAttendance(
      { sessionId, entries },
      typeof session.user?.id === "string" ? session.user.id : undefined,
    );
    revalidatePath(`/sessions/${sessionId}`);
    revalidatePath("/attendance");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    if (e instanceof ZodError) {
      return { error: e.issues[0]?.message ?? "داده فرم نامعتبر است." };
    }
    if (e instanceof service.AttendanceServiceError) return { error: e.message };
    return { error: "خطای ناشناخته" };
  }
}

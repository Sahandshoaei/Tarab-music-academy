"use server";

import { ZodError } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth/session";
import type { ActionState } from "@/types/action";
import * as service from "../services/settings.service";

export async function updateSettingsAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  try {
    await service.updateSettings({
      schoolName: String(formData.get("schoolName") ?? "") || undefined,
      openTime: String(formData.get("openTime") ?? ""),
      closeTime: String(formData.get("closeTime") ?? ""),
      closedDays: formData.getAll("closedDays").map(String),
    });
    // ساعات کاری روی اعتبارسنجی کلاس‌ها اثر دارد — صفحات مرتبط تازه شوند
    revalidatePath("/settings");
    revalidatePath("/classes");
    revalidatePath("/classes/new");
    return { success: true };
  } catch (e) {
    if (e instanceof ZodError) return { error: e.issues[0]?.message ?? "داده فرم نامعتبر است." };
    if (e instanceof service.SettingsServiceError) return { error: e.message };
    return { error: "خطای ناشناخته" };
  }
}


export async function updateTuitionRatesAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  try {
    const parse = (v: FormDataEntryValue | null) => {
      const s = String(v ?? "").trim();
      if (!s) return null;
      const n = Number(s.replace(/[^0-9]/g, ""));
      return Number.isFinite(n) ? n : null;
    };
    await service.updateTuitionRates({
      privateRate: parse(formData.get("privateRate")),
      groupRate: parse(formData.get("groupRate")),
      semiGroupRate: parse(formData.get("semiGroupRate")),
      practiceRate: parse(formData.get("practiceRate")),
    });
    revalidatePath("/settings");
    return { success: true };
  } catch (e) {
    if (e instanceof ZodError) return { error: e.issues[0]?.message ?? "داده نامعتبر است." };
    if (e instanceof service.SettingsServiceError) return { error: e.message };
    return { error: "خطای ناشناخته" };
  }
}

export async function updateAdminAccountAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const { auth } = await import("@/lib/auth");
  const session = await auth();
  const userId = (session?.user as { id: string } | undefined)?.id as string | undefined;
  if (!userId) return { error: "نشست یافت نشد — دوباره وارد شوید." };
  try {
    const { updateAdminAccount } = await import("../services/admin.service");
    await updateAdminAccount(userId, {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      currentPassword: String(formData.get("currentPassword") ?? ""),
      newPassword: String(formData.get("newPassword") ?? ""),
      confirmNewPassword: String(formData.get("confirmNewPassword") ?? ""),
    });
    revalidatePath("/settings");
    return { success: true };
  } catch (e) {
    if (e instanceof ZodError) return { error: e.issues[0]?.message ?? "داده نامعتبر است." };
    const { AdminServiceError } = await import("../services/admin.service");
    if (e instanceof AdminServiceError) return { error: e.message };
    if (e instanceof service.SettingsServiceError) return { error: e.message };
    return { error: "خطای ناشناخته" };
  }
}

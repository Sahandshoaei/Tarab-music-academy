// Server Actions ترم — نازک: گارد + سرویس + revalidate
"use server";

import { ZodError } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth/session";
import type { ActionState } from "@/types/action";
import * as service from "../services/term.service";

export async function createTermAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  try {
    await service.createTerm({
      name: String(formData.get("name") ?? ""),
      startDate: String(formData.get("startDate") ?? ""),
      endDate: String(formData.get("endDate") ?? ""),
    });
    revalidatePath("/terms");
    return { success: true };
  } catch (e) {
    if (e instanceof ZodError) {
      return { error: e.issues[0]?.message ?? "داده فرم نامعتبر است." };
    }
    return { error: e instanceof Error ? e.message : "خطای ناشناخته" };
  }
}

export async function activateTermAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("termId"));
  if (Number.isInteger(id)) {
    await service.activateTerm(id);
    revalidatePath("/terms");
  }
}

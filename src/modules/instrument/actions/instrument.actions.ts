"use server";

import { ZodError } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth/session";
import type { ActionState } from "@/types/action";
import * as service from "../services/instrument.service";

export async function createInstrumentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  try {
    await service.createInstrument({ name: String(formData.get("name") ?? "") });
    revalidatePath("/instruments");
    return { success: true };
  } catch (e) {
    if (e instanceof ZodError) return { error: e.issues[0]?.message ?? "داده نامعتبر" };
    return { error: e instanceof Error ? e.message : "خطای ناشناخته" };
  }
}

export async function toggleInstrumentActiveAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const next = String(formData.get("next")) === "true";
  if (Number.isInteger(id)) {
    await service.setInstrumentActive(id, next);
    revalidatePath("/instruments");
  }
}

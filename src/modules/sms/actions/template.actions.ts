"use server";

import { ZodError } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth/session";
import type { ActionState } from "@/types/action";
import * as service from "../services/template.service";

export async function createTemplateAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  try {
    await service.createTemplate({
      title: String(formData.get("title") ?? ""),
      body: String(formData.get("body") ?? ""),
      isActive: String(formData.get("isActive") ?? "on") === "on",
    });
    revalidatePath("/sms/templates");
    return { success: true };
  } catch (e) {
    if (e instanceof ZodError) return { error: e.issues[0]?.message ?? "داده نامعتبر" };
    if (e instanceof service.TemplateServiceError) return { error: e.message };
    return { error: "خطای ناشناخته" };
  }
}

export async function updateTemplateAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return { error: "شناسه نامعتبر" };
  try {
    await service.updateTemplate(id, {
      title: String(formData.get("title") ?? ""),
      body: String(formData.get("body") ?? ""),
      isActive: String(formData.get("isActive") ?? "on") === "on",
    });
    revalidatePath("/sms/templates");
    return { success: true };
  } catch (e) {
    if (e instanceof ZodError) return { error: e.issues[0]?.message ?? "داده نامعتبر" };
    if (e instanceof service.TemplateServiceError) return { error: e.message };
    return { error: "خطای ناشناخته" };
  }
}

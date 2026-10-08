"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth/session";
import type { ActionState } from "@/types/action";
import type { GeneralExpenseCategory } from "@prisma/client";
import * as service from "../services/expense.service";

const ALLOWED_CATEGORIES: GeneralExpenseCategory[] = ["CLEANING", "ELECTRICITY", "GAS", "WATER", "RENT", "OTHER"];

export async function createGeneralExpenseAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const categoryRaw = String(formData.get("category") ?? "OTHER") as GeneralExpenseCategory;
  const category = ALLOWED_CATEGORIES.includes(categoryRaw) ? categoryRaw : "OTHER";
  const amount = String(formData.get("amount") ?? "");
  const paidAt = String(formData.get("paidAt") ?? "");
  const note = String(formData.get("note") ?? "");

  if (!title) return { error: "عنوان الزامی است." };
  try {
    await service.createExpense({ title, category, amountRaw: amount, paidAtRaw: paidAt, note });
    revalidatePath("/reports/expenses");
    revalidatePath("/reports");
    revalidatePath("/reports/profit-loss");
    return { success: true };
  } catch (e) {
    if (e instanceof service.GeneralExpenseServiceError) return { error: e.message };
    return { error: "خطای ناشناخته" };
  }
}

export async function updateGeneralExpenseAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return { error: "شناسه نامعتبر" };
  const title = String(formData.get("title") ?? "").trim() || undefined;
  const categoryRaw = String(formData.get("category") ?? "") as GeneralExpenseCategory;
  const category = categoryRaw && ALLOWED_CATEGORIES.includes(categoryRaw) ? categoryRaw : undefined;
  const amount = formData.get("amount") != null ? String(formData.get("amount")) : undefined;
  const paidAt = formData.get("paidAt") != null ? String(formData.get("paidAt")) : undefined;
  const note = formData.get("note") != null ? String(formData.get("note")) : undefined;

  try {
    await service.updateExpense(id, {
      title,
      category,
      amountRaw: amount,
      paidAtRaw: paidAt,
      note,
    });
    revalidatePath("/reports/expenses");
    revalidatePath("/reports");
    revalidatePath("/reports/profit-loss");
    return { success: true };
  } catch (e) {
    if (e instanceof service.GeneralExpenseServiceError) return { error: e.message };
    return { error: "خطای ناشناخته" };
  }
}

export async function deleteGeneralExpenseAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  try {
    await service.removeExpense(id);
  } catch {}
  revalidatePath("/reports/expenses");
  revalidatePath("/reports");
  revalidatePath("/reports/profit-loss");
}

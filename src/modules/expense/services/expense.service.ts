import { parseJalaliDate } from "@/lib/jalali";
import * as repo from "../repositories/expense.repository";
import type { GeneralExpenseCategory } from "@prisma/client";

export class GeneralExpenseServiceError extends Error {}

function normalizeAmount(raw: string): number {
  const normalized = String(raw)
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[^0-9]/g, "");
  const n = Number(normalized);
  return n;
}

export async function createExpense(input: {
  title: string;
  category: GeneralExpenseCategory;
  amountRaw: string;
  paidAtRaw: string;
  note?: string;
}) {
  const title = input.title.trim();
  if (title.length < 2) throw new GeneralExpenseServiceError("عنوان حداقل ۲ حرف باشد.");
  if (title.length > 100) throw new GeneralExpenseServiceError("عنوان حداکثر ۱۰۰ حرف.");

  const amount = normalizeAmount(input.amountRaw);
  if (!Number.isInteger(amount) || amount <= 0) throw new GeneralExpenseServiceError("مبلغ معتبر نیست.");
  if (amount > 1_000_000_000) throw new GeneralExpenseServiceError("مبلغ بیش از حد مجاز است.");

  const paidAt = parseJalaliDate(input.paidAtRaw);
  if (!paidAt) throw new GeneralExpenseServiceError("تاریخ پرداخت معتبر نیست (۱۴۰۴/۰۱/۱۵).");

  const note = input.note?.trim() || undefined;

  return repo.createGeneralExpense({
    title,
    category: input.category,
    amount,
    paidAt,
    note,
  });
}

export async function updateExpense(
  id: number,
  input: { title?: string; category?: GeneralExpenseCategory; amountRaw?: string; paidAtRaw?: string; note?: string },
) {
  const existing = await repo.findGeneralExpenseById(id);
  if (!existing) throw new GeneralExpenseServiceError("هزینه یافت نشد.");

  const data: Parameters<typeof repo.updateGeneralExpense>[1] = {};

  if (input.title !== undefined) {
    const t = input.title.trim();
    if (t.length < 2) throw new GeneralExpenseServiceError("عنوان حداقل ۲ حرف باشد.");
    data.title = t;
  }
  if (input.category !== undefined) data.category = input.category;
  if (input.amountRaw !== undefined) {
    const amount = normalizeAmount(input.amountRaw);
    if (!Number.isInteger(amount) || amount <= 0) throw new GeneralExpenseServiceError("مبلغ معتبر نیست.");
    data.amount = amount;
  }
  if (input.paidAtRaw !== undefined) {
    const paidAt = parseJalaliDate(input.paidAtRaw);
    if (!paidAt) throw new GeneralExpenseServiceError("تاریخ معتبر نیست.");
    data.paidAt = paidAt;
  }
  if (input.note !== undefined) {
    data.note = input.note.trim() || null;
  }

  return repo.updateGeneralExpense(id, data);
}

export async function removeExpense(id: number) {
  const existing = await repo.findGeneralExpenseById(id);
  if (!existing) throw new GeneralExpenseServiceError("هزینه یافت نشد.");
  await repo.deleteGeneralExpense(id);
}

export async function listExpenses(range?: { from: Date | null; to: Date | null }, opts?: { q?: string; category?: GeneralExpenseCategory }) {
  return repo.listGeneralExpenses(range, opts);
}

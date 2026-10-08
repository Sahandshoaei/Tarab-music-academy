// منطق کسب‌وکار ترم (F0)
import { parseJalaliDate } from "@/lib/jalali";
import { termSchema } from "../schemas/term.schema";
import * as repo from "../repositories/term.repository";

export class TermServiceError extends Error {}

export async function getTerms() {
  return repo.listTerms();
}

/** ایجاد ترم جدید (F0-AC1) — ترم جدید به‌صورت پیش‌فرض فعال نیست */
export async function createTerm(input: unknown) {
  const values = termSchema.parse(input); // خطای اعتبارسنجی → ZodError
  // تبدیل شمسی→میلادی (نیمه‌شب UTC). قبلاً new Date(رشته خام) بود که
  // «۱۴۰۵» را سالِ میلادی می‌گرفت — یعنی ۶۲۱ سال خطا!
  const startDate = parseJalaliDate(values.startDate);
  const endDate = parseJalaliDate(values.endDate);
  if (!startDate || !endDate) throw new TermServiceError("تاریخ ترم نامعتبر است.");
  return repo.createTerm({ name: values.name, startDate, endDate });
}

/** فعال‌سازی ترم (F0-AC2) — حداکثر یک ترم فعال، در تراکنش */
export async function activateTerm(id: number) {
  const term = await repo.findTermById(id);
  if (!term) throw new TermServiceError("ترم یافت نشد.");
  await repo.activateTerm(id);
}



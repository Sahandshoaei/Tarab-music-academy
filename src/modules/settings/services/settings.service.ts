// تنظیمات آموزشگاه (تک‌ردیفی id=1) — اعتبارسنجی ساعات کاری (F4-AC5) + نرخ شهریه
import { parseTime } from "@/lib/time";
import { settingsSchema, tuitionRatesSchema } from "../schemas/settings.schema";
import * as repo from "../repositories/settings.repository";

export class SettingsServiceError extends Error {}

export async function getSettings() {
  return repo.findSettings();
}

export async function updateSettings(input: unknown) {
  const values = settingsSchema.parse(input);
  const existing = await repo.findSettings();
  if (!existing) {
    throw new SettingsServiceError("ردیف تنظیمات یافت نشد — pnpm db:seed را اجرا کنید.");
  }
  await repo.updateSettings({
    schoolName: values.schoolName?.trim() || null,
    openTime: parseTime(values.openTime)!,
    closeTime: parseTime(values.closeTime)!,
    closedDays: values.closedDays,
  });
}

export async function updateTuitionRates(input: unknown) {
  const values = tuitionRatesSchema.parse(input);
  const existing = await repo.findSettings();
  if (!existing) throw new SettingsServiceError("ردیف تنظیمات یافت نشد.");
  const toNull = (v: number | null | undefined) => (v == null || isNaN(v as number) ? null : v);
  await repo.updateTuitionRates({
    privateRate: toNull(values.privateRate as number | null),
    groupRate: toNull(values.groupRate as number | null),
    semiGroupRate: toNull(values.semiGroupRate as number | null),
    practiceRate: toNull(values.practiceRate as number | null),
  });
}

// 4.4 — محاسبه سن از تاریخ تولد (برای تست‌پذیری جدا شد)
import { toPersianDigits } from "@/validations/validators";

/** سن به سال — بر اساس تاریخ امروز تهران (یا now برای تست) */
export function calcAge(birthDate: Date | null, now: Date = new Date()): string | null {
  if (!birthDate) return null;
  let age = now.getUTCFullYear() - birthDate.getUTCFullYear();
  const m = now.getUTCMonth() - birthDate.getUTCMonth();
  const d = now.getUTCDate() - birthDate.getUTCDate();
  if (m < 0 || (m === 0 && d < 0)) age--;
  return toPersianDigits(String(age));
}

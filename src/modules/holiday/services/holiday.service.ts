import { prisma } from "@/lib/prisma";
import { parseJalaliDate } from "@/lib/jalali";
import * as repo from "../repositories/holiday.repository";

export class HolidayServiceError extends Error {}

export async function getHolidays() {
  return repo.listHolidays();
}

export async function addHoliday(input: { date: string; title: string }) {
  const date = parseJalaliDate(input.date);
  if (!date) throw new HolidayServiceError("تاریخ شمسی نامعتبر است (مثل ۱۴۰۵/۰۱/۰۱)");
  if (!input.title?.trim()) throw new HolidayServiceError("عنوان تعطیلی الزامی است");
  
  const exists = await repo.findHolidayByDate(date);
  if (exists) throw new HolidayServiceError("این تاریخ قبلاً به عنوان تعطیل ثبت شده است");
  
  return repo.createHoliday({ date, title: input.title.trim() });
}

export async function removeHoliday(id: number) {
  const holiday = await repo.findHolidayById(id);
  if (!holiday) throw new HolidayServiceError("تعطیلی یافت نشد");
  return repo.deleteHoliday(id);
}

export async function isHoliday(date: Date): Promise<boolean> {
  const found = await prisma.holiday.findUnique({ where: { date } });
  return !!found;
}

export async function getHolidayDatesSet(): Promise<Set<string>> {
  const holidays = await repo.listHolidays();
  return new Set(holidays.map(h => h.date.toISOString().slice(0,10)));
}

import { prisma } from "@/lib/prisma";

export function listHolidays() {
  return prisma.holiday.findMany({ orderBy: { date: "asc" } });
}

export function findHolidayByDate(date: Date) {
  return prisma.holiday.findUnique({ where: { date } });
}

export function createHoliday(data: { date: Date; title: string }) {
  return prisma.holiday.create({ data });
}

export function deleteHoliday(id: number) {
  return prisma.holiday.delete({ where: { id } });
}

export function findHolidayById(id: number) {
  return prisma.holiday.findUnique({ where: { id } });
}

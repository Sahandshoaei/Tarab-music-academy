import { prisma } from "@/lib/prisma";
import type { Weekday } from "@prisma/client";

export function findSettings() {
  return prisma.schoolSettings.findUnique({ where: { id: 1 } });
}

export function updateSettings(data: {
  schoolName?: string | null;
  openTime: string;
  closeTime: string;
  closedDays: Weekday[];
}) {
  return prisma.schoolSettings.update({ where: { id: 1 }, data });
}

export function updateTuitionRates(data: {
  privateRate?: number | null;
  groupRate?: number | null;
  semiGroupRate?: number | null;
  practiceRate?: number | null;
}) {
  return prisma.schoolSettings.update({ where: { id: 1 }, data });
}

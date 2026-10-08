import { prisma } from "@/lib/prisma";
import type { InsuranceType } from "@prisma/client";

export function listTeachers(includeInactive = false) {
  return prisma.teacher.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { fullName: "asc" },
    include: {
      instruments: { include: { instrument: true } },
      _count: { select: { classes: true } },
    },
  });
}

export function findTeacherById(id: number) {
  return prisma.teacher.findUnique({
    where: { id },
    include: {
      instruments: { include: { instrument: true } },
      _count: { select: { classes: true } },
    },
  });
}

export function hasActiveClasses(teacherId: number) {
  return prisma.class.count({ where: { teacherId, isActive: true } }).then((c) => c > 0);
}

export interface TeacherWriteData {
  fullName: string;
  phone: string;
  notes?: string;
  instrumentIds: number[];
  birthDate?: Date | null;
  resumeImageUrl?: string | null;
  insuranceType?: InsuranceType | null;
  insuranceNumber?: string | null;
  teachingExperienceYears?: number | null;
  teachingExperienceNote?: string | null;
  isQualified?: boolean;
  qualificationNote?: string | null;
  cardNumber?: string | null;
  sheba?: string | null;
}

export function createTeacher(data: TeacherWriteData) {
  return prisma.teacher.create({
    data: {
      fullName: data.fullName,
      phone: data.phone,
      notes: data.notes,
      birthDate: data.birthDate ?? null,
      resumeImageUrl: data.resumeImageUrl ?? null,
      insuranceType: data.insuranceType ?? null,
      insuranceNumber: data.insuranceNumber ?? null,
      teachingExperienceYears: data.teachingExperienceYears ?? null,
      teachingExperienceNote: data.teachingExperienceNote ?? null,
      isQualified: data.isQualified ?? false,
      qualificationNote: data.qualificationNote ?? null,
      cardNumber: data.cardNumber ?? null,
      sheba: data.sheba ?? null,
      instruments: {
        create: data.instrumentIds.map((id) => ({ instrumentId: id })),
      },
    },
  });
}

export function updateTeacher(id: number, data: TeacherWriteData) {
  return prisma.$transaction(async (tx) => {
    await tx.teacherInstrument.deleteMany({ where: { teacherId: id } });
    return tx.teacher.update({
      where: { id },
      data: {
        fullName: data.fullName,
        phone: data.phone,
        notes: data.notes,
        birthDate: data.birthDate ?? null,
        // resumeImageUrl: اگر null نیامده، دست نزن (برای ویرایش بدون آپلود جدید)
        ...(data.resumeImageUrl !== undefined ? { resumeImageUrl: data.resumeImageUrl } : {}),
        insuranceType: data.insuranceType ?? null,
        insuranceNumber: data.insuranceNumber ?? null,
        teachingExperienceYears: data.teachingExperienceYears ?? null,
        teachingExperienceNote: data.teachingExperienceNote ?? null,
        isQualified: data.isQualified ?? false,
        qualificationNote: data.qualificationNote ?? null,
        cardNumber: data.cardNumber ?? null,
        sheba: data.sheba ?? null,
        instruments: {
          create: data.instrumentIds.map((iid) => ({ instrumentId: iid })),
        },
      },
    });
  });
}

export function setTeacherActive(id: number, isActive: boolean) {
  return prisma.teacher.update({ where: { id }, data: { isActive } });
}

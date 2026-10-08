// منطق اساتید (F3 + پروفایل تکمیلی فاز ۶)
import { prisma } from "@/lib/prisma";
import { parseJalaliDate, todayUtcDate } from "@/lib/jalali";
import { saveUpload, UploadError } from "@/lib/upload";
import { teacherSchema } from "../schemas/teacher.schema";
import * as repo from "../repositories/teacher.repository";

export class TeacherServiceError extends Error {}

export async function getTeachers(includeInactive = false) {
  return repo.listTeachers(includeInactive);
}

export async function getTeacher(id: number) {
  const teacher = await repo.findTeacherById(id);
  if (!teacher) throw new TeacherServiceError("استاد یافت نشد.");
  return teacher;
}

export async function createTeacher(input: unknown, resumeFile?: File | null) {
  const values = teacherSchema.parse(input);
  const ids = values.instrumentIds.map(Number).filter(Number.isInteger);
  await assertInstrumentsValid(ids);

  let resumeImageUrl: string | null = null;
  if (resumeFile && resumeFile.size > 0) {
    try {
      resumeImageUrl = await saveUpload(resumeFile, "teachers/resumes");
    } catch (e) {
      if (e instanceof UploadError) throw new TeacherServiceError(e.message);
      throw e;
    }
  }

  return repo.createTeacher({
    fullName: values.fullName,
    phone: values.phone,
    notes: values.notes,
    instrumentIds: ids,
    birthDate: values.birthDate ? parseJalaliDate(values.birthDate) : null,
    resumeImageUrl,
    insuranceType: (values.insuranceType as never) ?? null,
    insuranceNumber: values.insuranceNumber?.trim() || null,
    teachingExperienceYears: values.teachingExperienceYears ? Number(values.teachingExperienceYears) : null,
    teachingExperienceNote: values.teachingExperienceNote?.trim() || null,
    isQualified: values.isQualified === "on",
    qualificationNote: values.qualificationNote?.trim() || null,
    cardNumber: values.cardNumber ? values.cardNumber.replace(/\D/g, "") : null,
    sheba: values.sheba ? values.sheba.replace(/\s/g, "").toUpperCase() : null,
  });
}

export async function updateTeacher(id: number, input: unknown, resumeFile?: File | null) {
  const values = teacherSchema.parse(input);
  const ids = values.instrumentIds.map(Number).filter(Number.isInteger);
  await assertInstrumentsValid(ids);

  let resumeImageUrl: string | null | undefined = undefined; // undefined = بدون تغییر
  if (resumeFile && resumeFile.size > 0) {
    try {
      resumeImageUrl = await saveUpload(resumeFile, "teachers/resumes");
    } catch (e) {
      if (e instanceof UploadError) throw new TeacherServiceError(e.message);
      throw e;
    }
  }

  await repo.updateTeacher(id, {
    fullName: values.fullName,
    phone: values.phone,
    notes: values.notes,
    instrumentIds: ids,
    birthDate: values.birthDate ? parseJalaliDate(values.birthDate) : null,
    ...(resumeImageUrl !== undefined ? { resumeImageUrl } : {}),
    insuranceType: (values.insuranceType as never) ?? null,
    insuranceNumber: values.insuranceNumber?.trim() || null,
    teachingExperienceYears: values.teachingExperienceYears ? Number(values.teachingExperienceYears) : null,
    teachingExperienceNote: values.teachingExperienceNote?.trim() || null,
    isQualified: values.isQualified === "on",
    qualificationNote: values.qualificationNote?.trim() || null,
    cardNumber: values.cardNumber ? values.cardNumber.replace(/\D/g, "") : null,
    sheba: values.sheba ? values.sheba.replace(/\s/g, "").toUpperCase() : null,
  });
}

/** F3-AC4 — Soft Delete؛ استادِ دارای کلاس فعال غیرفعال نمی‌شود */
export async function setTeacherActive(id: number, isActive: boolean) {
  if (!isActive && (await repo.hasActiveClasses(id))) {
    throw new TeacherServiceError("این استاد کلاس فعال دارد؛ ابتدا کلاس‌هایش را مدیریت کنید.");
  }
  await repo.setTeacherActive(id, isActive);
}

async function assertInstrumentsValid(ids: number[]) {
  if (ids.length === 0) throw new TeacherServiceError("حداقل یک ساز انتخاب کنید.");
  const found = await prisma.instrument.count({
    where: { id: { in: ids }, isActive: true },
  });
  if (found !== ids.length) throw new TeacherServiceError("یکی از سازهای انتخابی نامعتبر است.");
}


export interface TeacherClassProfile {
  classId: number;
  title: string;
  type: string;
  instrument: string;
  term: string;
  termId: number;
  room: string;
  weekday: string | null;
  startTime: string | null;
  endTime: string | null;
  scheduleType: string;
  isActive: boolean;
  studentCount: number;
  pastCount: number;
  remainingCount: number;
  totalSessions: number;
}

export async function getTeacherClassesProfile(teacherId: number): Promise<TeacherClassProfile[]> {
  const classes = await prisma.class.findMany({
    where: { teacherId },
    orderBy: { id: "desc" },
    select: {
      id: true,
      title: true,
      type: true,
      isActive: true,
      instrument: { select: { name: true } },
      term: { select: { id: true, name: true } },
      room: { select: { name: true } },
      weekday: true,
      startTime: true,
      endTime: true,
      scheduleType: true,
      _count: { select: { enrollments: { where: { isActive: true } } } },
    },
  });
  if (classes.length === 0) return [];
  const today = todayUtcDate();
  const sessions = await prisma.classSession.findMany({
    where: { classId: { in: classes.map((c) => c.id) } },
    select: { classId: true, date: true, status: true },
  });
  return classes.map((c) => {
    const clsSessions = sessions.filter((s) => s.classId === c.id);
    const past = clsSessions.filter((s) => s.status === "SCHEDULED" && s.date.getTime() < today.getTime());
    const remaining = clsSessions.filter((s) => s.status === "SCHEDULED" && s.date.getTime() >= today.getTime());
    return {
      classId: c.id,
      title: c.title || c.instrument.name,
      type: c.type,
      instrument: c.instrument.name,
      term: c.term.name,
      termId: c.term.id,
      room: c.room.name,
      weekday: c.weekday,
      startTime: c.startTime,
      endTime: c.endTime,
      scheduleType: c.scheduleType,
      isActive: c.isActive,
      studentCount: c._count.enrollments,
      pastCount: past.length,
      remainingCount: remaining.length,
      totalSessions: clsSessions.filter((s) => s.status === "SCHEDULED").length,
    };
  });
}

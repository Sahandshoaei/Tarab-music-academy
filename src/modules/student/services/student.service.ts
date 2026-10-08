// منطق کسب‌وکار هنرجو (F2) — AC3 کد ملی یکتا · AC4 چند ساز · AC5 جستجو · AC7 Soft Delete
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { parseJalaliDate } from "@/lib/jalali";
import { normalizeMobile, toEnglishDigits } from "@/validations/validators";
import { studentSchema } from "../schemas/student.schema";
import * as repo from "../repositories/student.repository";

export class StudentServiceError extends Error {}

export type StudentStatusFilter = "active" | "inactive" | "all";

/**
 * F2-AC5 — جستجو در یک فیلد: نام / کد ملی / تماس (موبایل هنرجو یا قوم نزدیک)
 * + فیلتر وضعیت. جستجوی ارقام، ارقام فارسی را هم می‌فهمد.
 * 2.3 — pagination واقعی
 */
export async function getStudents(opts: { q?: string; status?: StudentStatusFilter; page?: number; pageSize?: number }) {
  const q = opts.q?.trim();
  const where: Prisma.StudentWhereInput = {};

  if (opts.status === "active") where.isActive = true;
  else if (opts.status === "inactive") where.isActive = false;

  if (q) {
    const needle = toEnglishDigits(q);
    where.OR = [
      { fullName: { contains: q, mode: "insensitive" } },
      { nationalId: { contains: needle } },
      { phone: { contains: needle } },
      { guardianPhone: { contains: needle } },
    ];
  }

  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, opts.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  const [items, total] = await Promise.all([
    repo.listStudents(where, { skip, take: pageSize }),
    repo.countStudents(where),
  ]);
  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getStudent(id: number) {
  const student = await repo.findStudentById(id);
  if (!student) throw new StudentServiceError("هنرجو یافت نشد.");
  return student;
}

export async function createStudent(input: unknown) {
  const values = studentSchema.parse(input);
  const instrumentIds = values.instrumentIds.map(Number).filter(Number.isInteger);
  await assertInstrumentsValid(instrumentIds);

  // F2-AC3 — یکتایی کد ملی با پیام دوستانه (قیود DB هم پشتیبان است)
  const nationalId = toEnglishDigits(values.nationalId).replace(/\D/g, "");
  if (await repo.findStudentByNationalId(nationalId)) {
    throw new StudentServiceError("این کد ملی قبلاً ثبت شده است.");
  }

  const registrationDate = parseJalaliDate(values.registrationDate);
  if (!registrationDate) throw new StudentServiceError("تاریخ ثبت‌نام نامعتبر است.");

  const created = await repo.createStudent({
    ...values,
    nationalId,
    phone: normalizeMobile(values.phone),
    guardianPhone: normalizeMobile(values.guardianPhone),
    registrationDate,
    instrumentIds,
  });
  try {
    const { notify } = await import("@/modules/notification/services/notification.service");
    await notify.newStudent(values.fullName, `/students/${created.id}`);
  } catch {}
  return created;
}

export async function updateStudent(id: number, input: unknown) {
  const values = studentSchema.parse(input);
  const instrumentIds = values.instrumentIds.map(Number).filter(Number.isInteger);
  await assertInstrumentsValid(instrumentIds);

  const nationalId = toEnglishDigits(values.nationalId).replace(/\D/g, "");
  const existing = await repo.findStudentByNationalId(nationalId);
  if (existing && existing.id !== id) {
    throw new StudentServiceError("این کد ملی برای هنرجوی دیگری ثبت شده است.");
  }

  const registrationDate = parseJalaliDate(values.registrationDate);
  if (!registrationDate) throw new StudentServiceError("تاریخ ثبت‌نام نامعتبر است.");

  await repo.updateStudent(id, {
    ...values,
    nationalId,
    phone: normalizeMobile(values.phone),
    guardianPhone: normalizeMobile(values.guardianPhone),
    registrationDate,
    instrumentIds,
  });
}

/** F2-AC7 — Soft Delete؛ همیشه مجاز چون قابل برگشت است */
export async function setStudentActive(id: number, isActive: boolean) {
  await repo.setStudentActive(id, isActive);
}

/**
 * حذف کامل — استثنای مصوب فاز ۶ (سند طراحی §۱.۵):
 * فقط برای هنرجوی بدون هیچ سابقه‌ای (اصلاح ثبت اشتباه/تستی)؛
 * با اولین رکورد ثبت‌نام/حضور/مالی/پیامک، حذف کامل برای همیشه بسته می‌شود.
 */
export async function deleteStudent(id: number) {
  const student = await repo.findStudentById(id);
  if (!student) throw new StudentServiceError("هنرجو یافت نشد.");
  const c = student._count as Record<string, number>;
  const total =
    (c.enrollments ?? 0) + (c.attendances ?? 0) + (c.tuitionPayments ?? 0) + (c.smsMessages ?? 0);
  if (total > 0) {
    throw new StudentServiceError(
      "این هنرجو سابقه (کلاس/حضور/مالی/پیامک) دارد — فقط غیرفعال‌سازی ممکن است.",
    );
  }
  await repo.deleteStudent(id);
}

/** سازهای انتخابی باید واقعی و فعال باشند */
async function assertInstrumentsValid(ids: number[]) {
  if (ids.length === 0) throw new StudentServiceError("حداقل یک ساز انتخاب کنید.");
  const found = await prisma.instrument.count({
    where: { id: { in: ids }, isActive: true },
  });
  if (found !== ids.length) {
    throw new StudentServiceError("یکی از سازهای انتخابی نامعتبر است.");
  }
}

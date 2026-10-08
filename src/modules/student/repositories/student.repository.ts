import { prisma } from "@/lib/prisma";
import type { Prisma, ReferralSource } from "@prisma/client";

export interface StudentWriteData {
  fullName: string;
  nationalId: string;
  phone: string;
  guardianPhone: string;
  address?: string;
  registrationDate: Date;
  referralSource?: ReferralSource;
  referralNote?: string;
  notes?: string;
  instrumentIds: number[];
}

export function listStudents(where: Prisma.StudentWhereInput, opts?: { skip?: number; take?: number }) {
  return prisma.student.findMany({
    where,
    orderBy: [{ registrationDate: "desc" }, { id: "desc" }],
    include: { instruments: { include: { instrument: true } } },
    ...(opts?.skip != null ? { skip: opts.skip } : {}),
    ...(opts?.take != null ? { take: opts.take } : {}),
  });
}

export function countStudents(where: Prisma.StudentWhereInput) {
  return prisma.student.count({ where });
}

export const STUDENT_DATA_RELATIONS = [
  "enrollments",
  "attendances",
  "tuitionPayments",
  "smsMessages",
] as const;

export function findStudentById(id: number) {
  return prisma.student.findUnique({
    where: { id },
    include: {
      instruments: { include: { instrument: true } },
      _count: { select: { enrollments: true, attendances: true, tuitionPayments: true, smsMessages: true } },
    },
  });
}

export function findStudentByNationalId(nationalId: string) {
  return prisma.student.findUnique({
    where: { nationalId },
    select: { id: true },
  });
}

export function createStudent(data: StudentWriteData) {
  return prisma.student.create({
    data: {
      fullName: data.fullName,
      nationalId: data.nationalId,
      phone: data.phone,
      guardianPhone: data.guardianPhone,
      address: data.address ?? null,
      registrationDate: data.registrationDate,
      referralSource: data.referralSource ?? null,
      referralNote: data.referralNote ?? null,
      notes: data.notes ?? null,
      instruments: {
        create: data.instrumentIds.map((id) => ({ instrumentId: id })),
      },
    },
  });
}

export function updateStudent(id: number, data: StudentWriteData) {
  return prisma.$transaction(async (tx) => {
    await tx.studentInstrument.deleteMany({ where: { studentId: id } });
    return tx.student.update({
      where: { id },
      data: {
        fullName: data.fullName,
        nationalId: data.nationalId,
        phone: data.phone,
        guardianPhone: data.guardianPhone,
        address: data.address ?? null,
        registrationDate: data.registrationDate,
        referralSource: data.referralSource ?? null,
        referralNote: data.referralNote ?? null,
        notes: data.notes ?? null,
        instruments: {
          create: data.instrumentIds.map((iid) => ({ instrumentId: iid })),
        },
      },
    });
  });
}

export function setStudentActive(id: number, isActive: boolean) {
  return prisma.student.update({ where: { id }, data: { isActive } });
}

export function deleteStudent(id: number) {
  return prisma.student.delete({ where: { id } });
}

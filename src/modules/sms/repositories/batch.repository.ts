import { prisma } from "@/lib/prisma";
import type { SmsAudienceType, SmsRecipientPhone, SmsStatus } from "@prisma/client";

export function listBatches() {
  return prisma.smsBatch.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { messages: true } },
      messages: { select: { status: true } },
    },
    take: 100,
  });
}

export function findBatchById(id: string) {
  return prisma.smsBatch.findUnique({
    where: { id },
    include: {
      messages: {
        include: { student: { select: { id: true, fullName: true } } },
        orderBy: { id: "asc" },
      },
    },
  });
}

export function listMessagesByStudentId(studentId: number) {
  return prisma.smsMessage.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
    include: { batch: { select: { label: true, createdAt: true } }, template: { select: { title: true } } },
    take: 20,
  });
}

export function createBatchWithMessages(data: {
  label: string;
  audienceType: SmsAudienceType;
  audienceRef?: string;
  totalCount: number;
  sentById: string;
  messages: {
    studentId: number;
    phone: string;
    phoneTarget: SmsRecipientPhone;
    templateId?: number | null;
    body: string;
    status: SmsStatus;
    providerRef?: string | null;
  }[];
}) {
  return prisma.smsBatch.create({
    data: {
      label: data.label,
      audienceType: data.audienceType,
      audienceRef: data.audienceRef,
      totalCount: data.totalCount,
      sentById: data.sentById,
      messages: { create: data.messages },
    },
  });
}

export function updateMessageStatus(id: number, status: SmsStatus, providerRef?: string) {
  return prisma.smsMessage.update({
    where: { id },
    data: { status, ...(providerRef ? { providerRef } : {}), ...(status === "SENT" ? { sentAt: new Date() } : {}), ...(status === "DELIVERED" ? { deliveredAt: new Date() } : {}) },
  });
}

export function findFailedMessagesByBatchId(batchId: string) {
  return prisma.smsMessage.findMany({ where: { batchId, status: "FAILED" } });
}

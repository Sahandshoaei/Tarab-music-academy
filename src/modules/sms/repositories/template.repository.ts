import { prisma } from "@/lib/prisma";

export function listTemplates(includeInactive = true) {
  return prisma.smsTemplate.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { createdAt: "desc" },
  });
}

export function findTemplateById(id: number) {
  return prisma.smsTemplate.findUnique({ where: { id } });
}

export function findTemplateByTitle(title: string) {
  return prisma.smsTemplate.findUnique({ where: { title } });
}

export function createTemplate(data: { title: string; body: string; isActive?: boolean }) {
  return prisma.smsTemplate.create({ data });
}

export function updateTemplate(id: number, data: { title: string; body: string; isActive: boolean }) {
  return prisma.smsTemplate.update({ where: { id }, data });
}

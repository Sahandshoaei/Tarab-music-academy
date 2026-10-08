import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@prisma/client";

export function createNotification(data: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  link?: string | null;
}) {
  return prisma.notification.create({ data });
}

export function createManyNotifications(
  data: { userId: string; type: NotificationType; title: string; body?: string | null; link?: string | null }[],
) {
  if (data.length === 0) return Promise.resolve({ count: 0 });
  return prisma.notification.createMany({ data });
}

export function listNotifications(userId: string, opts?: { unreadOnly?: boolean; take?: number }) {
  return prisma.notification.findMany({
    where: { userId, ...(opts?.unreadOnly ? { isRead: false } : {}) },
    orderBy: { createdAt: "desc" },
    take: opts?.take ?? 50,
  });
}

export function countUnread(userId: string) {
  return prisma.notification.count({ where: { userId, isRead: false } });
}

export function markAsRead(id: string, userId: string) {
  return prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } });
}

export function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
}

export function getAdminUserIds() {
  return prisma.user.findMany({ where: { role: "ADMIN", isActive: true }, select: { id: true } });
}

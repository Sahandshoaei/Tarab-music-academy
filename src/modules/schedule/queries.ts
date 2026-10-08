// ═══════════════════════════════════════════════════════════════════════════
//  کوئری‌های تقویم هفتگی (F4-AC6) — فقط-خواندنی
//  استثنای مستندشده مانند dashboard/queries: قاعده کسب‌وکاری ندارد،
//  پس service/repository جدا ندارد (آناتومی ماژول‌ها).
// ═══════════════════════════════════════════════════════════════════════════
import { prisma } from "@/lib/prisma";

export function getWeekSessions(
  weekStart: Date,
  weekEnd: Date,
  filters: { roomId?: number; teacherId?: number } = {},
) {
  return prisma.classSession.findMany({
    where: {
      date: { gte: weekStart, lte: weekEnd },
      // جلسات لغوشده هم دیده می‌شوند (خط‌خورده — وایرفریم U6)
      roomId: filters.roomId,
      teacherId: filters.teacherId,
    },
    include: {
      class: {
        select: {
          id: true,
          title: true,
          type: true,
          instrument: { select: { name: true } },
        },
      },
      room: { select: { id: true, name: true } },
      teacher: { select: { id: true, fullName: true } },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
}

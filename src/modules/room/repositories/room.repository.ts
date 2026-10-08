import { prisma } from "@/lib/prisma";

export function listRooms() {
  return prisma.room.findMany({
    orderBy: { id: "asc" },
    include: { _count: { select: { classes: true, sessions: true } } },
  });
}

export function findRoomByName(name: string) {
  return prisma.room.findUnique({ where: { name } });
}

export function createRoom(name: string) {
  return prisma.room.create({ data: { name } });
}

export function setRoomActive(id: number, isActive: boolean) {
  return prisma.room.update({ where: { id }, data: { isActive } });
}

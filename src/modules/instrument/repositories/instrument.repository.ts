import { prisma } from "@/lib/prisma";

export function listInstruments() {
  return prisma.instrument.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { students: true, teachers: true, classes: true } },
    },
  });
}

export function findInstrumentByName(name: string) {
  return prisma.instrument.findUnique({ where: { name } });
}

export function createInstrument(name: string) {
  const maxOrder = prisma.instrument.aggregate({ _max: { sortOrder: true } });
  return maxOrder.then((r) =>
    prisma.instrument.create({
      data: { name, sortOrder: (r._max.sortOrder ?? 0) + 1 },
    }),
  );
}

export function setInstrumentActive(id: number, isActive: boolean) {
  return prisma.instrument.update({ where: { id }, data: { isActive } });
}

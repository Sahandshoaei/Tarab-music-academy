// ═══════════════════════════════════════════════════════════════════════════
//  کلاینت Prisma — Singleton
//  در Next.js با HMR باید یک نمونه глобی نگه داشته شود تا اتصال دیتابیس
//  در هر بار Reload توسعه، انباشته نشود.
// ═══════════════════════════════════════════════════════════════════════════
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

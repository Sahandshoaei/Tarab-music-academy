import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { adminAccountSchema } from "../schemas/admin.schema";

export class AdminServiceError extends Error {}

export async function getCurrentAdmin(userId: string) {
  return prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true } });
}

export async function updateAdminAccount(userId: string, input: unknown) {
  const values = adminAccountSchema.parse(input);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.passwordHash) throw new AdminServiceError("کاربر یافت نشد.");
  const ok = await bcrypt.compare(values.currentPassword, user.passwordHash);
  if (!ok) throw new AdminServiceError("رمز فعلی نادرست است.");

  // email uniqueness
  const normalizedEmail = values.email.trim().toLowerCase();
  if (normalizedEmail !== user.email.toLowerCase()) {
    const exists = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (exists) throw new AdminServiceError("این ایمیل قبلاً ثبت شده است.");
  }

  const data: { name?: string | null; email?: string; passwordHash?: string } = {};
  if (values.name !== undefined) data.name = values.name.trim() || null;
  data.email = normalizedEmail;
  if (values.newPassword) {
    data.passwordHash = await bcrypt.hash(values.newPassword, 10);
  }

  await prisma.user.update({ where: { id: userId }, data });
}

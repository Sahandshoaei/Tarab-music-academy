"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth/session";
import { auth } from "@/lib/auth";
import * as service from "../services/notification.service";

export async function markNotificationReadAction(formData: FormData) {
  await requireAdmin();
  const session = await auth();
  const userId = (session?.user as { id: string } | undefined)?.id as string;
  const id = String(formData.get("id") ?? "");
  if (!id || !userId) return;
  await service.markAsRead(id, userId);
  revalidatePath("/notifications");
}

export async function markAllNotificationsReadAction() {
  await requireAdmin();
  const session = await auth();
  const userId = (session?.user as { id: string } | undefined)?.id as string;
  if (!userId) return;
  await service.markAllAsRead(userId);
  revalidatePath("/notifications");
}

export async function generateDailyDigestAction() {
  await requireAdmin();
  await service.generateDailyDigest();
  revalidatePath("/notifications");
  revalidatePath("/dashboard");
}

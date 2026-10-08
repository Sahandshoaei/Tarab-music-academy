"use server";

import { ZodError } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/server/auth/session";
import { prisma } from "@/lib/prisma";
import type { ActionState } from "@/types/action";
import * as service from "../services/sms.service";

export async function sendSmsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  let sentById: string | undefined = (session.user as unknown as { id: string })?.id;
  if (!sentById && session.user?.email) {
    const u = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
    sentById = u?.id;
  }
  if (!sentById) return { error: "کاربر یافت نشد — دوباره وارد شوید." };
  try {
    const studentIds = formData.getAll("studentIds").map(String).filter(Boolean);
    const result = await service.sendSms(
      {
        label: String(formData.get("label") ?? ""),
        audienceType: String(formData.get("audienceType") ?? ""),
        audienceValue: String(formData.get("audienceValue") ?? "") || undefined,
        studentIds: studentIds.length ? studentIds : undefined,
        phoneTarget: String(formData.get("phoneTarget") ?? "STUDENT"),
        templateId: String(formData.get("templateId") ?? "") || undefined,
        body: String(formData.get("body") ?? ""),
      },
      sentById as string,
    );
    revalidatePath("/sms/history");
    // برای نمایش هشدار نامعتبرها، پیام موفقیت را با جزئیات برمی‌گردانیم
    if (result.invalidCount > 0) {
      return { success: true, error: `ارسال شد (${result.sent} نفر) — ${result.invalidCount} شماره نامعتبر نادیده گرفته شد.` } as ActionState;
    }
    redirect(`/sms/history/${result.batchId}`);
  } catch (e) {
    if (e instanceof Error && e.message === "NEXT_REDIRECT") throw e;
    if (e instanceof ZodError) return { error: e.issues[0]?.message ?? "داده نامعتبر" };
    if (e instanceof service.SmsServiceError) return { error: e.message };
    console.error("[sendSmsAction] failed:", e);
    return { error: e instanceof Error ? e.message : "خطای ناشناخته" };
  }
}

export async function retryFailedAction(formData: FormData) {
  await requireAdmin();
  const batchId = String(formData.get("batchId") ?? "");
  if (!batchId) return;
  await service.retryFailed(batchId);
  revalidatePath(`/sms/history/${batchId}`);
  revalidatePath("/sms/history");
}

export async function syncStatusAction(formData: FormData) {
  await requireAdmin();
  const batchId = String(formData.get("batchId") ?? "");
  if (!batchId) return;
  await service.syncBatchStatus(batchId);
  revalidatePath(`/sms/history/${batchId}`);
}

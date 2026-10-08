"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth/session";
import { prisma } from "@/lib/prisma";
import type { ActionState } from "@/types/action";
import * as renewal from "../services/renewal.service";
import * as smsService from "@/modules/sms/services/sms.service";

export async function sendRenewalReminderAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  let sentById: string | undefined = (session.user as unknown as { id: string })?.id;
  if (!sentById && session.user?.email) {
    const u = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
    sentById = u?.id;
  }
  if (!sentById) return { error: "کاربر یافت نشد" };

  const days = Number(formData.get("days") ?? 7);
  const list = await renewal.getStudentsNeedingRenewal(Number.isInteger(days) ? days : 7);
  if (list.length === 0) return { error: "هنرجویی برای یادآوری یافت نشد (ترم هنوز به پایان نزدیک نیست)" };

  const bodyTemplate =
    String(formData.get("body") ?? "").trim() ||
    "هنرجوی گرامی {نام هنرجو}، ترم {نام کلاس} شما در آموزشگاه {نام آموزشگاه} رو به اتمام است. لطفاً برای تمدید و حفظ وقت کلاس اقدام فرمایید.";

  try {
    const result = await smsService.sendSms(
      {
        label: `یادآوری تمدید ترم — ${list.length} هنرجو`,
        audienceType: "INDIVIDUAL",
        studentIds: list.map((s) => String(s.studentId)),
        phoneTarget: "STUDENT",
        body: bodyTemplate,
      },
      sentById
    );
    revalidatePath("/terms");
    revalidatePath("/sms/history");
    return { success: true, sent: result.sent };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "خطا در ارسال" };
  }
}

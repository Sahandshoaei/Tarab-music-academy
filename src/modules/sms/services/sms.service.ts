// سرویس ارسال پیامک — اعتبارسنجی → حل گیرندگان → رندر متن → ساخت Batch → ارسال با Provider فعال → ذخیره

import { prisma } from "@/lib/prisma";
import { composeSchema } from "../schemas/compose.schema";
import { resolveAudience, pickPhone } from "./audience.service";
import { getSmsProvider } from "../adapters/sms-provider";
import * as batchRepo from "../repositories/batch.repository";

export class SmsServiceError extends Error {}

/** جایگزینی متغیرهای قالب با داده واقعی */
async function renderBody(
  raw: string,
  student: { id: number; fullName: string },
): Promise<string> {
  let body = raw;
  // {نام هنرجو}
  body = body.replaceAll("{نام هنرجو}", student.fullName);

  // {نام آموزشگاه}
  const settings = await prisma.schoolSettings.findUnique({ where: { id: 1 } });
  const schoolName = settings?.schoolName || "آموزشگاه موسیقی";
  body = body.replaceAll("{نام آموزشگاه}", schoolName);

  // متغیرهای کلاسی — از اولین کلاس فعال هنرجو در ترم فعال
  const activeTerm = await prisma.term.findFirst({ where: { isActive: true }, select: { id: true } });
  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId: student.id, isActive: true, ...(activeTerm ? { class: { termId: activeTerm.id } } : {}) },
    select: {
      class: {
        select: {
          title: true,
          instrument: { select: { name: true } },
          teacher: { select: { fullName: true } },
          weekday: true,
          startTime: true,
        },
      },
    },
    orderBy: { enrolledAt: "asc" },
  });

  const className = enrollment?.class.title || enrollment?.class.instrument.name || "—";
  const teacherName = enrollment?.class.teacher.fullName || "—";
  const weekdayMap: Record<string, string> = {
    SATURDAY: "شنبه",
    SUNDAY: "یکشنبه",
    MONDAY: "دوشنبه",
    TUESDAY: "سه‌شنبه",
    WEDNESDAY: "چهارشنبه",
    THURSDAY: "پنجشنبه",
    FRIDAY: "جمعه",
  };
  const weekdayFa = enrollment?.class.weekday ? weekdayMap[enrollment.class.weekday] : "—";
  const time = enrollment?.class.startTime || "—";

  body = body.replaceAll("{نام کلاس}", className);
  body = body.replaceAll("{نام استاد}", teacherName);
  body = body.replaceAll("{روز کلاس}", weekdayFa);
  body = body.replaceAll("{ساعت کلاس}", time);

  // متغیرهای مالی — بعداً (MVP-2) پر می‌شود؛ فعلاً — نگه می‌داریم
  // {تاریخ سررسید} و {مبلغ} را دست نمی‌زنیم تا ادمین خودش پر کند

  return body;
}

/** محاسبه تعداد بخش پیامک فارسی (هر بخش ۷۰ کاراکتر یونیکد) */
export function countSmsParts(text: string): number {
  return Math.max(1, Math.ceil([...text].length / 70));
}

export async function sendSms(input: unknown, sentById: string) {
  const v = composeSchema.parse(input);

  // حل گیرندگان
  const { students, ref } = await resolveAudience({
    audienceType: v.audienceType,
    audienceValue: v.audienceValue,
    studentIds: v.studentIds,
  });

  if (students.length === 0) throw new SmsServiceError("هیچ گیرنده فعالی یافت نشد.");

  // انتخاب شماره و فیلتر نامعتبرها
  const targets: { student: (typeof students)[number]; phone: string }[] = [];
  const invalid: string[] = [];
  for (const s of students) {
    const phone = pickPhone(s, v.phoneTarget);
    if (phone) targets.push({ student: s, phone });
    else invalid.push(s.fullName);
  }

  if (targets.length === 0) throw new SmsServiceError("هیچ شماره معتبری برای ارسال یافت نشد (همه نامعتبر).");

  // رندر متن نهایی برای هر گیرنده (Snapshot)
  const bodies: string[] = [];
  for (const t of targets) {
    bodies.push(await renderBody(v.body, t.student));
  }

  // Provider و تنظیمات را پیش از ساخت Batch بررسی کن تا خطای تنظیمات، رکورد PENDING جا نگذارد.
  const provider = await getSmsProvider();
  const settings = await prisma.schoolSettings.findUnique({ where: { id: 1 } });
  const senderLine = settings?.smsSenderLine ?? undefined;

  // ساخت Batch + Messages (PENDING)
  const batch = await batchRepo.createBatchWithMessages({
    label: v.label,
    audienceType: v.audienceType as never,
    audienceRef: ref,
    totalCount: targets.length,
    sentById,
    messages: targets.map((t, i) => ({
      studentId: t.student.id,
      phone: t.phone,
      phoneTarget: v.phoneTarget as never,
      templateId: v.templateId ? Number(v.templateId) : null,
      body: bodies[i],
      status: "PENDING" as const,
    })),
  });

  // ارسال از طریق Provider انتخاب‌شده (Mock یا Kavenegar)
  // متن‌ها ممکن است به‌خاطر متغیرهای شخصی متفاوت باشند؛ بنابراین هر گیرنده جداگانه فرستاده می‌شود.
  for (let i = 0; i < targets.length; i++) {
    const msg = (await prisma.smsMessage.findFirst({ where: { batchId: batch.id, studentId: targets[i].student.id }, orderBy: { id: "desc" } }))!;
    try {
      const [res] = await provider.sendToMany({ numbers: [targets[i].phone], text: bodies[i], senderLine });
      await prisma.smsMessage.update({
        where: { id: msg.id },
        data: {
          status: res.ok ? "SENT" : "FAILED",
          providerRef: res.ref,
          errorMessage: res.error,
          sentAt: res.ok ? new Date() : null,
        },
      });
    } catch (e) {
      await prisma.smsMessage.update({
        where: { id: msg.id },
        data: { status: "FAILED", errorMessage: e instanceof Error ? e.message : "خطای ارسال" },
      });
    }
  }

  return { batchId: batch.id, sent: targets.length, invalidCount: invalid.length, invalidNames: invalid, parts: Math.max(...bodies.map(countSmsParts)) };
}

export async function retryFailed(batchId: string) {
  const failed = await batchRepo.findFailedMessagesByBatchId(batchId);
  if (failed.length === 0) throw new SmsServiceError("پیام ناموفقی برای بازارسال یافت نشد.");
  const provider = await getSmsProvider();
  const settings = await prisma.schoolSettings.findUnique({ where: { id: 1 } });
  for (const m of failed) {
    try {
      const [res] = await provider.sendToMany({ numbers: [m.phone], text: m.body, senderLine: settings?.smsSenderLine ?? undefined });
      await prisma.smsMessage.update({
        where: { id: m.id },
        data: { status: res.ok ? "SENT" : "FAILED", providerRef: res.ref, errorMessage: res.error, sentAt: res.ok ? new Date() : null },
      });
    } catch (e) {
      await prisma.smsMessage.update({ where: { id: m.id }, data: { status: "FAILED", errorMessage: e instanceof Error ? e.message : "خطا" } });
    }
  }
}

export async function syncBatchStatus(batchId: string) {
  const batch = await batchRepo.findBatchById(batchId);
  if (!batch) throw new SmsServiceError("دسته یافت نشد.");
  const provider = await getSmsProvider();
  for (const m of batch.messages) {
    // رکوردهای Mock قدیمی به سرویس‌دهنده واقعی نرفته‌اند؛ تحویل‌شده فرضشان نکن.
    if (provider.id === "kavenegar" && m.providerRef?.startsWith("mock-")) {
      if (m.status !== "FAILED" || !m.errorMessage) {
        await prisma.smsMessage.update({
          where: { id: m.id },
          data: {
            status: "FAILED",
            errorMessage: "این پیام در حالت Mock ثبت شده و به کاوه‌نگار ارسال نشده است.",
            sentAt: null,
            deliveredAt: null,
          },
        });
      }
      continue;
    }

    if (m.providerRef && (m.status === "SENT" || m.status === "PENDING")) {
      const st = await provider.getMessageStatus(m.providerRef);
      // گزارش ناقص/ناموفق API نباید وضعیت SENT را به PENDING برگرداند.
      if (st !== m.status && !(st === "PENDING" && m.status === "SENT")) {
        await prisma.smsMessage.update({
          where: { id: m.id },
          data: { status: st, ...(st === "DELIVERED" ? { deliveredAt: new Date() } : {}) },
        });
      }
    }
  }
}

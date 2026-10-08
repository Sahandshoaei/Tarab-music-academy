// Adapter سرویس پیامک — Kavenegar از طریق REST و Mock برای توسعه
// نیاز به SDK یا package اختصاصی Kavenegar ندارد؛ از fetch داخلی Node استفاده می‌شود.

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export interface SmsSendResult {
  ref: string;
  ok: boolean;
  error?: string;
}

export interface SmsProviderAdapter {
  readonly id: string;
  sendToMany(p: { numbers: string[]; text: string; senderLine?: string }): Promise<SmsSendResult[]>;
  getMessageStatus(ref: string): Promise<"PENDING" | "SENT" | "DELIVERED" | "FAILED">;
  getCredit(): Promise<number | null>;
}

type KavenegarEntry = {
  messageid?: string | number;
  status?: string | number;
  statustext?: string;
  remaincredit?: string | number;
};

type KavenegarResponse = {
  return?: { status?: string | number; message?: string };
  entries?: KavenegarEntry[] | KavenegarEntry | null;
};

function entriesOf(data: KavenegarResponse | null): KavenegarEntry[] {
  if (!data?.entries) return [];
  return Array.isArray(data.entries) ? data.entries : [data.entries];
}

export function mapKavenegarStatus(value: string | number | undefined): "PENDING" | "SENT" | "DELIVERED" | "FAILED" {
  switch (Number(value)) {
    case 1: // در صف ارسال
    case 2: // زمان‌بندی‌شده
      return "PENDING";
    case 4: // ارسال به مخابرات
    case 5: // وضعیت میانی/ارسال به مخابرات در برخی متدها
      return "SENT";
    case 10: // رسیده به گیرنده
      return "DELIVERED";
    case 6: // خطای ارسال از سمت سرشماره
    case 11: // نرسیده به گیرنده
    case 13: // لغو شده
    case 14: // بلاک/فیلتر شده
    case 100: // شناسه نامعتبر
      return "FAILED";
    default:
      // وضعیت ناشناخته هرگز به‌عنوان تحویل‌شده ثبت نشود.
      return "PENDING";
  }
}

/** Mock — فقط برای توسعه؛ refهای آن با mock- شروع می‌شوند و ارسال واقعی نیستند. */
class MockSmsProvider implements SmsProviderAdapter {
  readonly id = "mock";

  async sendToMany(p: { numbers: string[] }): Promise<SmsSendResult[]> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return p.numbers.map((_, index) => ({
      ref: `mock-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
      ok: true,
    }));
  }

  async getMessageStatus(): Promise<"DELIVERED"> {
    // شبیه‌سازی محلی؛ در حالت Mock این وضعیت گزارش اپراتور نیست.
    return "DELIVERED";
  }

  async getCredit(): Promise<number | null> {
    return 9999;
  }
}

class KavenegarAdapter implements SmsProviderAdapter {
  readonly id = "kavenegar";

  constructor(
    private readonly apiKey: string,
    private readonly defaultSender?: string,
  ) {}

  async sendToMany(p: { numbers: string[]; text: string; senderLine?: string }): Promise<SmsSendResult[]> {
    const results: SmsSendResult[] = [];

    // const sender = p.senderLine?.trim() || this.defaultSender?.trim();

    // for (const number of p.numbers) {
    //   const form = new URLSearchParams({ receptor: number, message: p.text });
    //   // اگر sender خالی باشد، Kavenegar از خط پیش‌فرض حساب استفاده می‌کند.
    //   if (sender) form.set("sender", sender);
    const sender = p.senderLine?.trim() || this.defaultSender?.trim();

for (const number of p.numbers) {
  logger.info(
    {
      sender,
      receptor: number,
    },
    "Kavenegar SMS request",
  );

  const form = new URLSearchParams({
    receptor: number,
    message: p.text,
  });

  if (sender) {
    form.set("sender", sender);
  }

      try {
        const response = await fetch(`https://api.kavenegar.com/v1/${encodeURIComponent(this.apiKey)}/sms/send.json`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: form.toString(),
        });
        const data = (await response.json().catch(() => null)) as KavenegarResponse | null;
        const apiStatus = Number(data?.return?.status);
        const entry = entriesOf(data)[0];

        if (apiStatus !== 200 || !data?.return) {
          const error = entry?.statustext || data?.return?.message || `پاسخ HTTP ${response.status} از کاوه‌نگار`;
          logger.warn({ provider: "kavenegar", status: apiStatus || response.status, error }, "ارسال پیامک رد شد");
          results.push({ ref: String(entry?.messageid ?? ""), ok: false, error });
          continue;
        }

        const status = Number(entry?.status);
        const acceptedStatuses = [1, 2, 4, 5, 10];
        const accepted = Boolean(entry?.messageid) && acceptedStatuses.includes(status);
        if (!accepted) {
          const error = entry?.statustext || `وضعیت ارسال کاوه‌نگار ناموفق است: ${String(entry?.status ?? "نامشخص")}`;
          logger.warn({ provider: "kavenegar", status: entry?.status, error }, "ارسال پیامک تأیید نشد");
          results.push({ ref: String(entry?.messageid ?? ""), ok: false, error });
          continue;
        }

        results.push({ ref: String(entry.messageid), ok: true });
      } catch (cause) {
        const error = cause instanceof Error ? cause.message : "خطای شبکه در ارتباط با کاوه‌نگار";
        logger.error({ provider: "kavenegar", error }, "خطای ارتباط با سرویس پیامک");
        results.push({ ref: "", ok: false, error });
      }
    }

    return results;
  }

  async getMessageStatus(ref: string): Promise<"PENDING" | "SENT" | "DELIVERED" | "FAILED"> {
    if (!ref || ref.startsWith("mock-")) return "FAILED";

    try {
      const response = await fetch(`https://api.kavenegar.com/v1/${encodeURIComponent(this.apiKey)}/sms/status.json`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ messageid: ref }).toString(),
      });
      const data = (await response.json().catch(() => null)) as KavenegarResponse | null;
      if (Number(data?.return?.status) !== 200) return "PENDING";
      return mapKavenegarStatus(entriesOf(data)[0]?.status);
    } catch {
      return "PENDING";
    }
  }

  async getCredit(): Promise<number | null> {
    try {
      const response = await fetch(`https://api.kavenegar.com/v1/${encodeURIComponent(this.apiKey)}/account/info.json`);
      const data = (await response.json().catch(() => null)) as KavenegarResponse | null;
      if (Number(data?.return?.status) !== 200) return null;
      const credit = entriesOf(data)[0]?.remaincredit;
      return credit == null ? null : Number(credit);
    } catch {
      return null;
    }
  }
}

const mock = new MockSmsProvider();

/** Factory — تنظیمات از SchoolSettings خوانده می‌شود؛ خطای تنظیمات به Mock پنهان نمی‌شود. */
export async function getSmsProvider(): Promise<SmsProviderAdapter> {
  const settings = await prisma.schoolSettings.findUnique({
    where: { id: 1 },
    select: { smsProvider: true, smsApiKey: true, smsSenderLine: true },
  });
  const provider = settings?.smsProvider?.trim().toLowerCase();

  if (!provider || provider === "mock") return mock;

  if (provider === "kavenegar") {
    const apiKey = settings?.smsApiKey?.trim();
    const senderLine = settings?.smsSenderLine?.trim() || undefined;
    if (!apiKey) throw new Error("کلید API کاوه‌نگار در تنظیمات ثبت نشده است.");
    return new KavenegarAdapter(apiKey, senderLine);
  }

  throw new Error(`سرویس پیامکی «${provider}» پشتیبانی نمی‌شود؛ مقدار smsProvider را بررسی کنید.`);
}

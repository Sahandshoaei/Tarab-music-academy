import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/form";
import { prisma } from "@/lib/prisma";
import { listTemplates } from "@/modules/sms/repositories/template.repository";
import { listActiveStudentsForCompose, listClassesForCompose, listInstrumentsForCompose } from "@/modules/sms/queries";
import { ComposeForm } from "@/modules/sms/components/compose-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "ارسال پیامک" };

export default async function ComposePage() {
  const [templates, classes, instruments, students, settings] = await Promise.all([
    listTemplates(false),
    listClassesForCompose(),
    listInstrumentsForCompose(),
    listActiveStudentsForCompose(),
    prisma.schoolSettings.findUnique({
      where: { id: 1 },
      select: { smsProvider: true, smsApiKey: true },
    }),
  ]);

  const provider = settings?.smsProvider?.trim().toLowerCase() ?? "";
  const hasApiKey = Boolean(settings?.smsApiKey?.trim());
  const providerLabel = provider === "kavenegar"
    ? hasApiKey ? "کاوه‌نگار" : "کاوه‌نگار — کلید ثبت نشده"
    : !provider || provider === "mock"
      ? "Mock — آزمایشی"
      : "سرویس پیامکی ناشناخته";

  return (
    <>
      <PageHeader title="ارسال پیامک">
        <Badge variant="outline">F7-2</Badge>
        <Badge variant={provider === "kavenegar" && hasApiKey ? "default" : "secondary"}>{providerLabel}</Badge>
        <Badge variant="secondary">۵ شیوه گیرنده</Badge>
      </PageHeader>
      <ComposeForm templates={templates} classes={classes} instruments={instruments} students={students} />
      <p className="text-xs text-muted-foreground">
        {provider === "kavenegar" && hasApiKey
          ? "ارسال کاوه‌نگار فعال است. قبل از ارسال گروهی، ابتدا یک پیام آزمایشی بفرستید. اگر خط فرستنده خالی باشد، از خط پیش‌فرض حساب استفاده می‌شود."
          : !provider || provider === "mock"
            ? "حالت آزمایشی Mock فعال است؛ پیام واقعی ارسال نمی‌شود."
            : "تنظیمات سرویس پیامکی را بررسی کنید؛ ارسال تا انتخاب Provider معتبر انجام نمی‌شود."}
      </p>
    </>
  );
}

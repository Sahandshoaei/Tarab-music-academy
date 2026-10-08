import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/form";
import { formatJalali } from "@/lib/jalali";
import { toPersianDigits } from "@/validations/validators";
import { getBatchDetail } from "@/modules/sms/queries";
import { retryFailedAction, syncStatusAction } from "@/modules/sms/actions/sms.actions";

export const dynamic = "force-dynamic";

export default async function BatchDetailPage({ params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;
  const batch = await getBatchDetail(batchId);
  if (!batch) notFound();

  const failed = batch.messages.filter((m) => m.status === "FAILED").length;

  return (
    <>
      <PageHeader title={batch.label}>
        <Badge>{batch.audienceType}</Badge>
        <Button asChild variant="ghost" size="sm">
          <Link href="/sms/history">← تاریخچه</Link>
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">جزئیات دسته</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>گیرندگان: {batch.audienceRef ?? batch.audienceType} — {toPersianDigits(String(batch.totalCount))} نفر</p>
          <p>تاریخ: {formatJalali(batch.createdAt)}</p>
          <p>پیام‌ها: {toPersianDigits(String(batch.messages.length))}</p>
          <div className="flex gap-2">
            <form action={syncStatusAction}>
              <input type="hidden" name="batchId" value={batch.id} />
              <Button type="submit" variant="outline" size="sm">
                به‌روزرسانی وضعیت
              </Button>
            </form>
            {failed > 0 ? (
              <form action={retryFailedAction}>
                <input type="hidden" name="batchId" value={batch.id} />
                <Button type="submit" variant="outline" size="sm">
                  بازارسال {toPersianDigits(String(failed))} ناموفق
                </Button>
              </form>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">پیام‌های تک‌تک</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {batch.messages.map((m) => (
            <div key={m.id} className="space-y-1 rounded border px-3 py-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold">{m.student.fullName}</span>
                <span dir="ltr" className="text-xs text-muted-foreground">
                  {m.phone} ({m.phoneTarget === "STUDENT" ? "خود هنرجو" : "قوم نزدیک"})
                </span>
                <span className="flex-1 text-xs">{m.body.slice(0, 60)}</span>
                <Badge variant={m.status === "FAILED" ? "destructive" : m.status === "DELIVERED" ? "default" : "secondary"}>{m.status}</Badge>
              </div>
              {m.errorMessage ? <p className="text-xs text-destructive">خطا: {m.errorMessage}</p> : null}
              {m.providerRef && !m.providerRef.startsWith("mock-") ? (
                <p dir="ltr" className="text-xs text-muted-foreground">شناسه سرویس‌دهنده: {m.providerRef}</p>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

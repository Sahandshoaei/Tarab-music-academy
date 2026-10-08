import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/form";
import { formatJalali } from "@/lib/jalali";
import { toPersianDigits } from "@/validations/validators";
import { listBatchesForHistory } from "@/modules/sms/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "تاریخچه پیامک" };

export default async function HistoryPage() {
  const batches = await listBatchesForHistory();

  return (
    <>
      <PageHeader title="تاریخچه پیامک">
        <Badge variant="outline">F7-3</Badge>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">دسته‌های ارسال (هر ارسال = یک دسته)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {batches.length === 0 ? (
            <p className="text-muted-foreground">هنوز ارسالی نیست — از «ارسال پیامک» شروع کنید.</p>
          ) : (
            batches.map((b) => {
              const counts = { SENT: 0, DELIVERED: 0, FAILED: 0, PENDING: 0 } as Record<string, number>;
              for (const m of b.messages) counts[m.status] = (counts[m.status] ?? 0) + 1;
              return (
                <Link key={b.id} href={`/sms/history/${b.id}`} className="flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2.5 hover:bg-muted/50">
                  <span className="font-bold">{b.label}</span>
                  <span className="text-xs text-muted-foreground">{b.audienceRef ?? b.audienceType}</span>
                  <span className="text-xs text-muted-foreground">{formatJalali(b.createdAt)}</span>
                  <span className="ms-auto flex gap-1 text-xs">
                    <Badge variant="default">{toPersianDigits(String(b._count.messages))} پیام</Badge>
                    {counts.FAILED > 0 ? <Badge variant="destructive">{toPersianDigits(String(counts.FAILED))} ناموفق</Badge> : null}
                    {counts.SENT > 0 ? <Badge variant="secondary">{toPersianDigits(String(counts.SENT))} ارسال‌شده</Badge> : null}
                    {counts.DELIVERED > 0 ? <Badge>{toPersianDigits(String(counts.DELIVERED))} تحویل‌شده</Badge> : null}
                  </span>
                </Link>
              );
            })
          )}
        </CardContent>
      </Card>
    </>
  );
}

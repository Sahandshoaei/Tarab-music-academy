import Link from "next/link";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {formatJalali, formatMoney} from "@/lib/jalali";
import {toPersianDigits} from "@/validations/validators";

export function StudentFinanceCard({
  summary,
  studentId,
}: {
  studentId: number;
  summary: {
    classes: {
      classId: number;
      title: string | null;
      instrument: string;
      teacher: string;
      term: string;
      type: string;
      tuition: number;
      paid: number;
      remaining: number;
      isZeroTuition?: boolean;
   }[];
    totalTuition: number;
    totalPaid: number;
    totalRemaining: number;
    hasZeroTuition?: boolean;
    payments: { id: number; amount: number; paidAt: Date; receiptImageUrl: string; allocations: { classId: number; amount: number; class: { title: string | null; instrument: { name: string } } }[] }[];
 };
}) {
  const hasDebt = summary.totalRemaining > 0;
  const noTuition = summary.totalTuition === 0;
  const hasZero = (summary as { hasZeroTuition?: boolean }).hasZeroTuition || summary.classes.some((c) => c.tuition === 0);

  return (
    <Card className={hasDebt ? "border-amber-500/40" : ""}>
      <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30 py-3">
        <CardTitle className="text-sm font-bold">وضعیت مالی — جزئیات شهریه</CardTitle>
        <span className="text-xs text-muted-foreground">{toPersianDigits(String(summary.classes.length))} کلاس فعال</span>
      </CardHeader>
      <CardContent className="space-y-4 p-4 text-sm">
        <div className="grid grid-cols-3 gap-3 rounded-xl border bg-card p-3 text-center">
          <div>
            <p className="text-xs text-muted-foreground">کل شهریه</p>
            <p className="font-bold tabular-nums">
              {formatMoney(summary.totalTuition)} <span className="text-[11px] font-normal">تومان</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">پرداخت‌شده</p>
            <p className="font-bold tabular-nums text-emerald-700">{formatMoney(summary.totalPaid)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">مانده</p>
            <p className={`font-bold tabular-nums ${summary.totalRemaining === 0 ? "text-emerald-700" : "text-destructive"}`}>
              {formatMoney(summary.totalRemaining)}
            </p>
          </div>
        </div>

        {hasZero ? (
          <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-700">
            ⚠️ نرخ شهریه برای یک یا چند نوع کلاس در تنظیمات صفر است — شهریه ۰ حساب شده. از <a href="/settings" className="underline">تنظیمات → نرخ شهریه</a> آن را وارد کنید.
          </p>
        ) : null}
        {noTuition && !hasZero ? (
          <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
            هنرجو کلاس فعالی ندارد — برای محاسبه شهریه، هنرجو را در کلاسی ثبت‌نام کنید.
          </p>
        ) : null}

        {summary.classes.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-medium">جزئیات هر کلاس</p>
            {summary.classes.map((c) => (
              <div key={c.classId} className="rounded-xl border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link href={`/classes/${c.classId}`} className="font-medium hover:text-primary hover:underline">
                    {c.title}
                  </Link>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{c.type} · {c.instrument}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {c.teacher} · {c.term} · شهریه: {formatMoney(c.tuition)} تومان
                  {(c as { isZeroTuition?: boolean }).isZeroTuition ? <span className="ms-1 text-amber-600">⚠️ نرخ صفر</span> : null}
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-muted/40 p-2">
                    <p className="text-muted-foreground">شهریه</p>
                    <p className="font-bold tabular-nums">{formatMoney(c.tuition)}</p>
                  </div>
                  <div className="rounded-lg bg-emerald-500/10 p-2">
                    <p className="text-muted-foreground">پرداخت</p>
                    <p className="font-bold tabular-nums text-emerald-700">{formatMoney(c.paid)}</p>
                  </div>
                  <div className={`rounded-lg p-2 ${c.remaining === 0 ? "bg-emerald-500/10" : "bg-destructive/10"}`}>
                    <p className="text-muted-foreground">مانده</p>
                    <p className={`font-bold tabular-nums ${c.remaining === 0 ? "text-emerald-700" : "text-destructive"}`}>{formatMoney(c.remaining)}</p>
                  </div>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-emerald-500"
                    style={{width: `${c.tuition === 0 ? 0 : Math.min(100, Math.round((c.paid / c.tuition) * 100))}%`}}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {summary.payments.length > 0 ? (
          <div className="space-y-1.5 border-t pt-3">
            <p className="text-xs font-medium">آخرین پرداخت‌ها ({toPersianDigits(String(summary.payments.length))})</p>
            {summary.payments.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-xs">
                <div>
                  <span>{formatJalali(p.paidAt)} — {formatMoney(p.amount)} تومان</span>
                  <span className="ms-2 text-muted-foreground">→ {p.allocations.map((a: { classId: number; amount: number; class: { title: string | null; instrument: { name: string } } }) => (a.class.title || a.class.instrument.name)).join("، ") || "—"}</span>
                </div>
                <a href={p.receiptImageUrl} target="_blank" className="text-primary hover:underline">
                  رسید
                </a>
              </div>
            ))}
          </div>
        ) : (
          <p className="border-t pt-3 text-xs text-muted-foreground">هنوز پرداختی ثبت نشده.</p>
        )}
      </CardContent>
    </Card>
  );
}

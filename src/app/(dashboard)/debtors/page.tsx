import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/form";
import { toPersianDigits } from "@/validations/validators";
import { formatMoney } from "@/lib/jalali";
import { getDebtors } from "@/modules/finance/services/finance.service";

export const dynamic = "force-dynamic";

export default async function DebtorsPage() {
  const debtors = await getDebtors();

  return (
    <>
      <PageHeader title="بدهکاران" />
      {debtors.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">بدهکاری یافت نشد — همه شهریه‌ها تسویه هستند 🎉</CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="border-b bg-muted/30 py-3">
            <CardTitle className="text-sm">لیست بدهکاران (مانده شهریه)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {debtors.map((d) => (
                <Link key={d.studentId} href={`/students/${d.studentId}`} className="flex items-center justify-between gap-4 p-4 hover:bg-muted/40">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{d.studentName}</p>
                    <p className="text-xs tabular-nums text-muted-foreground" dir="ltr">{toPersianDigits(d.phone)}</p>
                    <p className="text-xs text-muted-foreground">کلاس بدهکار: {toPersianDigits(String(d.overdueCount))} کلاس</p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-destructive">{formatMoney(d.overdueAmount)} <span className="text-xs font-normal">تومان</span></p>
                    <p className="text-xs text-muted-foreground">مانده کل</p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

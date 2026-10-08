import { formatMoney } from "@/lib/jalali";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PeriodFilter } from "@/modules/report/components/period-filter";
import { KpiCards } from "@/modules/report/components/kpi-cards";
import { MonthlyBarChart } from "@/modules/report/components/monthly-bar-chart";
import { CumulativeAreaChart } from "@/modules/report/components/cumulative-area-chart";
import { InstrumentPie, TeacherPie } from "@/modules/report/components/pie-charts";
import { resolvePeriodFromSearchParams } from "@/modules/report/utils/period";
import { getOverview, getActiveTerm, getTerms, getTermById } from "@/modules/report/services/report.service";
import { getDebtors } from "@/modules/finance/services/finance.service";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toPersianDigits } from "@/validations/validators";

export const dynamic = "force-dynamic";
export const metadata = { title: "گزارشات — نمای کلی مالی" };

export default async function ReportsOverviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const terms = await getTerms();

  // اگر mode=term و termId داریم، ترم را بگیر
  let termForPeriod: { name: string; startDate: Date; endDate: Date } | null = null;
  if (sp.mode === "term" && sp.termId) {
    const tid = Number(sp.termId);
    if (!Number.isNaN(tid)) {
      const t = await getTermById(tid);
      if (t) termForPeriod = { name: t.name, startDate: t.startDate, endDate: t.endDate };
    }
  } else if (sp.mode === "term" && !sp.termId) {
    const active = await getActiveTerm();
    if (active) termForPeriod = { name: active.name, startDate: active.startDate, endDate: active.endDate };
  }

  const period = resolvePeriodFromSearchParams(sp as Record<string, string | undefined>, termForPeriod);
  const range = { from: period.from, to: period.to };
  const [overview, debtors] = await Promise.all([getOverview(range), getDebtors()]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">گزارشات — نمای کلی مالی</h1>
          <p className="text-sm text-muted-foreground">
            بازه: <span className="font-medium text-foreground">{period.label}</span>
            {period.jalaliFrom && period.jalaliTo && period.mode !== "all" && (
              <span className="mr-2 text-xs">({period.jalaliFrom} تا {period.jalaliTo})</span>
            )}
          </p>
        </div>
        <Badge variant="secondary">نقدی — فیش‌های ثبت‌شده</Badge>
      </div>

      <PeriodFilter terms={terms.map(t => ({ id: t.id, name: t.name }))} />

      <KpiCards
        incomeTotal={overview.incomeTotal}
        expenseTotal={overview.expenseTotal}
        expenseTeacherTotal={overview.expenseTeacherTotal}
        expenseGeneralTotal={overview.expenseGeneralTotal}
        profit={overview.profit}
        incomeCount={overview.incomeCount}
        expenseCount={overview.expenseCount}
        expenseTeacherCount={overview.expenseTeacherCount}
        expenseGeneralCount={overview.expenseGeneralCount}
        avgIncome={overview.avgIncome}
        avgExpense={overview.avgExpense}
      />

      <MonthlyBarChart data={overview.monthly} />

      <div className="grid gap-4 lg:grid-cols-2">
        <CumulativeAreaChart data={overview.cumulative} />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">نکات مدیریتی</CardTitle>
            <CardDescription>بر اساس همین بازه — تصمیم سریع</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm leading-6">
            {overview.monthly.length === 0 ? (
              <p className="text-muted-foreground">داده‌ای برای این بازه نیست.</p>
            ) : (
              <>
                <p>• بهترین ماه درآمد: <b>{overview.monthly.reduce((a,b)=> a.income>b.income?a:b).label}</b></p>
                <p>• بیشترین هزینه حقوق: <b>{overview.monthly.reduce((a,b)=> a.expense>b.expense?a:b).label}</b></p>
                <p>• میانگین سود ماهانه: <b>{formatMoney(Math.round(overview.monthly.reduce((s,m)=>s+m.profit,0)/overview.monthly.length))} تومان</b></p>
              </>
            )}
            <hr className="my-2" />
            <p className="text-xs text-muted-foreground">
              فرمول فعلی: سود = شهریه − (حقوق اساتید {toPersianDigits(overview.expenseTeacherTotal.toLocaleString("en-US"))} + جانبی {toPersianDigits(overview.expenseGeneralTotal.toLocaleString("en-US"))} = کل {toPersianDigits(overview.expenseTotal.toLocaleString("en-US"))}).
            </p>
            <p className="text-xs text-muted-foreground">
              حقوق مختلط (ثابت/ساعتی): الان فقط جمع فیش‌ها نمایش داده می‌شود؛ مغایرت ساعتی در گزارش تکمیلی فاز ۲ می‌آید.
            </p>
            <p className="text-xs text-muted-foreground">
              بدهکاران (مانده شهریه منعطف): {debtors.length > 0 ? `${debtors.length} هنرجو بدهکار — ` : "همه به‌روز — "}
              <Link href="/debtors" className="text-primary hover:underline">مشاهده لیست بدهکاران →</Link>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <InstrumentPie data={overview.incomeByInstrument} />
        <TeacherPie data={overview.expenseByTeacher} />
      </div>

      {overview.expenseByCategory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">هزینه جانبی به تفکیک دسته</CardTitle>
            <CardDescription>جمع {toPersianDigits(overview.expenseGeneralTotal.toLocaleString("en-US"))} تومان — {toPersianDigits(String(overview.expenseGeneralCount))} ردیف</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm sm:grid-cols-3">
            {overview.expenseByCategory.map(c => (
              <div key={c.name} className="flex items-center justify-between rounded-lg border px-3 py-2">
                <span className="text-muted-foreground">{c.name}</span>
                <span className="font-bold">{toPersianDigits(c.value.toLocaleString("en-US"))} تومان</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-sm">گزارش‌های تکمیلی</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
          <Link href="/debtors" className="hover:text-foreground hover:underline">• بدهکاران (مانده شهریه) — فعال ✓</Link>
          <span>• مغایرت حقوق ساعتی vs پرداخت‌شده (به‌زودی)</span>
          <Link href="/reports/expenses" className="hover:text-foreground hover:underline">• هزینه‌های جانبی — فعال ✓</Link>
        </CardContent>
      </Card>
    </div>
  );
}

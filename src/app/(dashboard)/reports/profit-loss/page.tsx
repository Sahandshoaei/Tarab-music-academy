import { formatMoney } from "@/lib/jalali";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PeriodFilter } from "@/modules/report/components/period-filter";
import { MonthlyBarChart } from "@/modules/report/components/monthly-bar-chart";
import { resolvePeriodFromSearchParams } from "@/modules/report/utils/period";
import { getProfitLossRows, getTerms, getTermById, getActiveTerm, getOverview } from "@/modules/report/services/report.service";
import { toPersianDigits } from "@/validations/validators";

export const dynamic = "force-dynamic";
export const metadata = { title: "صورت سود و زیان" };

export default async function ProfitLossPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const terms = await getTerms();

  let termForPeriod: { name: string; startDate: Date; endDate: Date } | null = null;
  if (sp.mode === "term" && sp.termId) {
    const t = await getTermById(Number(sp.termId));
    if (t) termForPeriod = { name: t.name, startDate: t.startDate, endDate: t.endDate };
  } else if (sp.mode === "term" && !sp.termId) {
    const active = await getActiveTerm();
    if (active) termForPeriod = { name: active.name, startDate: active.startDate, endDate: active.endDate };
  }

  const period = resolvePeriodFromSearchParams(sp as Record<string, string | undefined>, termForPeriod);
  const range = { from: period.from, to: period.to };

  const rows = await getProfitLossRows(range);
  const overview = await getOverview(range);

  const totalIncome = rows.reduce((s, r) => s + r.income, 0);
  const totalExpense = rows.reduce((s, r) => s + r.expense, 0);
  const totalExpenseTeacher = rows.reduce((s, r) => s + (r.expenseTeacher ?? 0), 0);
  const totalExpenseGeneral = rows.reduce((s, r) => s + (r.expenseGeneral ?? 0), 0);
  const totalProfit = totalIncome - totalExpense;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">صورت سود و زیان</h1>
        <p className="text-sm text-muted-foreground">
          بازه: <b className="text-foreground">{period.label}</b> · درآمد {formatMoney(totalIncome)} − هزینه {formatMoney(totalExpense)} = سود {formatMoney(totalProfit)} تومان
        </p>
      </div>

      <PeriodFilter terms={terms.map(t => ({ id: t.id, name: t.name }))} />

      <MonthlyBarChart data={overview.monthly} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">جدول ماهانه</CardTitle>
          <CardDescription>هر سطر یک ماه شمسی — اعداد به تومان</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">داده‌ای برای این بازه نیست.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-y bg-muted/50 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-right">ماه شمسی</th>
                    <th className="px-3 py-2 text-right">درآمد</th>
                    <th className="px-3 py-2 text-right">حقوق اساتید</th>
                    <th className="px-3 py-2 text-right">هزینه جانبی</th>
                    <th className="px-3 py-2 text-right">کل هزینه</th>
                    <th className="px-3 py-2 text-right">سود خالص</th>
                    <th className="px-3 py-2 text-right">حاشیه سود</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.key} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-2 font-medium">{r.label}</td>
                      <td className="px-3 py-2 text-green-700">{formatMoney(r.income)}</td>
                      <td className="px-3 py-2 text-red-700">{formatMoney(r.expense)}</td>
                      <td className={`px-3 py-2 font-bold ${r.profit >= 0 ? "text-blue-700" : "text-red-700"}`}>{formatMoney(r.profit)}</td>
                      <td className="px-3 py-2 text-xs">{r.income ? toPersianDigits(((r.profit / r.income) * 100).toFixed(1)) : "۰"}٪</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/50 font-bold">
                  <tr>
                    <td className="px-3 py-2">جمع کل</td>
                    <td className="px-3 py-2">{formatMoney(totalIncome)}</td>
                    <td className="px-3 py-2">{formatMoney(totalExpense)}</td>
                    <td className="px-3 py-2">{formatMoney(totalProfit)}</td>
                    <td className="px-3 py-2 text-xs font-normal">{totalIncome ? toPersianDigits(((totalProfit/totalIncome)*100).toFixed(1)) : "۰"}٪</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-sm">یادداشت فرمول</CardTitle>
        </CardHeader>
        <CardContent className="text-xs leading-6 text-muted-foreground">
          <p>سود = مجموع شهریه منعطف هنرجوها (TuitionPayment) منهای مجموع حقوق اساتید (TeacherReceipt) و هزینه‌های جانبی (GeneralExpense — نظافت/برق/گاز/آب/اجاره/سایر) در بازه انتخاب‌شده. فرمول: <code>سود = شهریه − (حقوق + هزینه جانبی)</code>.</p>
        </CardContent>
      </Card>
    </div>
  );
}

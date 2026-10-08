import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toPersianDigits } from "@/validations/validators";

function fmt(n: number) {
  return toPersianDigits(n.toLocaleString("en-US"));
}

export function KpiCards({
  incomeTotal,
  expenseTotal,
  expenseTeacherTotal,
  expenseGeneralTotal,
  profit,
  incomeCount,
  expenseCount,
  expenseTeacherCount,
  expenseGeneralCount,
  avgIncome,
  avgExpense,
}: {
  incomeTotal: number;
  expenseTotal: number;
  expenseTeacherTotal?: number;
  expenseGeneralTotal?: number;
  profit: number;
  incomeCount: number;
  expenseCount: number;
  expenseTeacherCount?: number;
  expenseGeneralCount?: number;
  avgIncome: number;
  avgExpense: number;
}) {
  const profitPositive = profit >= 0;
  const hasBreakdown = expenseTeacherTotal !== undefined && expenseGeneralTotal !== undefined;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">درآمد دوره</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{fmt(incomeTotal)} <span className="text-sm font-normal text-muted-foreground">تومان</span></div>
          <p className="text-xs text-muted-foreground mt-1">{fmt(incomeCount)} فیش · میانگین {fmt(avgIncome)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">کل هزینه دوره</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{fmt(expenseTotal)} <span className="text-sm font-normal text-muted-foreground">تومان</span></div>
          <p className="text-xs text-muted-foreground mt-1">
            {hasBreakdown ? (
              <>{fmt(expenseTeacherTotal!)} حقوق + {fmt(expenseGeneralTotal!)} جانبی · {fmt(expenseCount)} تراکنش</>
            ) : (
              <>{fmt(expenseCount)} فیش · میانگین {fmt(avgExpense)}</>
            )}
          </p>
          {hasBreakdown && expenseGeneralCount !== undefined && (
            <p className="text-xs text-muted-foreground">{fmt(expenseTeacherCount!)} حقوق + {fmt(expenseGeneralCount)} جانبی · میانگین {fmt(avgExpense)}</p>
          )}
        </CardContent>
      </Card>

      <Card className={profitPositive ? "border-green-200 bg-green-50/50 dark:bg-green-950/20" : "border-red-200 bg-red-50/50 dark:bg-red-950/20"}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">سود خالص</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${profitPositive ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
            {fmt(profit)} <span className="text-sm font-normal">تومان</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {profitPositive ? "سودآور" : "زیان"} · حاشیه {incomeTotal ? toPersianDigits(((profit / incomeTotal) * 100).toFixed(1)) : "۰"}٪
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">تعداد تراکنش‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{fmt(incomeCount + expenseCount)}</div>
          <p className="text-xs text-muted-foreground mt-1">{fmt(incomeCount)} شهریه + {fmt(expenseCount)} هزینه</p>
        </CardContent>
      </Card>
    </div>
  );
}

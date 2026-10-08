"use client";

import { formatMoney } from "@/lib/jalali";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { toPersianDigits } from "@/validations/validators";

export function MonthlyBarChart({ data }: { data: { label: string; income: number; expense: number; profit: number }[] }) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">درآمد vs هزینه vs سود — ماهانه</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground py-8 text-center">داده‌ای برای این بازه نیست — بازه را تغییر دهید.</p></CardContent>
      </Card>
    );
  }

  const fmt = (n: number) => toPersianDigits((n/1000000).toFixed(1)) + "م";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">درآمد vs هزینه vs سود — ماهانه</CardTitle>
        <CardDescription>مبالغ به میلیون تومان — ماه شمسی</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px] ltr" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v) => fmt(v as number)} tick={{ fontSize: 11 }} />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, name: any) => [formatMoney(Number(value)) + " تومان", name === "income" ? "درآمد" : name === "expense" ? "هزینه" : "سود"]}
              labelFormatter={(label) => `ماه ${label}`}
              contentStyle={{ direction: "rtl", textAlign: "right" }}
            />
            <Legend formatter={(value) => value === "income" ? "درآمد" : value === "expense" ? "هزینه" : "سود"} />
            <Bar dataKey="income" fill="#16a34a" name="income" radius={[4,4,0,0]} />
            <Bar dataKey="expense" fill="#dc2626" name="expense" radius={[4,4,0,0]} />
            <Bar dataKey="profit" fill="#2563eb" name="profit" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

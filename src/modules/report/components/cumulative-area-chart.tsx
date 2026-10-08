"use client";

import { formatMoney } from "@/lib/jalali";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { toPersianDigits } from "@/validations/validators";

export function CumulativeAreaChart({ data }: { data: { label: string; income: number; profit: number }[] }) {
  if (data.length === 0) return null;
  const fmt = (n: number) => toPersianDigits((n/1000000).toFixed(1)) + "م";
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">روند تجمعی — درآمد و سود</CardTitle>
        <CardDescription>از ابتدای بازه تا هر ماه — رشد را نشان می‌دهد</CardDescription>
      </CardHeader>
      <CardContent className="h-[280px] ltr" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v) => fmt(v as number)} tick={{ fontSize: 11 }} />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, name: any) => [formatMoney(Number(value)) + " تومان", name === "income" ? "درآمد تجمعی" : "سود تجمعی"]}
              labelFormatter={(label) => `تا ماه ${label}`}
              contentStyle={{ direction: "rtl", textAlign: "right" }}
            />
            <Legend formatter={(value) => value === "income" ? "درآمد تجمعی" : "سود تجمعی"} />
            <Area type="monotone" dataKey="income" stroke="#16a34a" fill="#dcfce7" strokeWidth={2} name="income" />
            <Area type="monotone" dataKey="profit" stroke="#2563eb" fill="#dbeafe" strokeWidth={2} name="profit" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

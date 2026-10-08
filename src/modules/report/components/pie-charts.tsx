"use client";

import { formatMoney } from "@/lib/jalali";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { toPersianDigits } from "@/validations/validators";

const COLORS = ["#16a34a","#2563eb","#d97706","#9333ea","#db2777","#0891b2","#65a30d","#ea580c"];

export function InstrumentPie({ data }: { data: { name: string; value: number }[] }) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">درآمد به تفکیک ساز</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground py-6 text-center">داده‌ای نیست</p></CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">درآمد به تفکیک ساز</CardTitle>
        <CardDescription>سهم هر ساز از کل شهریه این بازه {data.length>1 ? `— ${data.length} ساز` : ""}</CardDescription>
      </CardHeader>
      <CardContent className="h-[280px] ltr" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${((percent ?? 0)*100).toFixed(0)}%`}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <Tooltip formatter={(value: any) => formatMoney(Number(value)) + " تومان"} contentStyle={{ direction: "rtl" }} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function TeacherPie({ data }: { data: { name: string; value: number }[] }) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">هزینه به تفکیک استاد</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground py-6 text-center">داده‌ای نیست</p></CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">هزینه به تفکیک استاد</CardTitle>
        <CardDescription>سهم هر استاد از کل حقوق این بازه</CardDescription>
      </CardHeader>
      <CardContent className="h-[280px] ltr" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${((percent ?? 0)*100).toFixed(0)}%`}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[(i+2) % COLORS.length]} />)}
            </Pie>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <Tooltip formatter={(value: any) => formatMoney(Number(value)) + " تومان"} contentStyle={{ direction: "rtl" }} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/shared/form";
import { createInvoiceAction } from "../actions/finance.actions";
import { todayJalali } from "@/lib/jalali";
import type { ActionState } from "@/types/action";

export function InvoiceForm({
  students,
  terms,
  defaultStudentId,
}: {
  students: { id: number; fullName: string }[];
  terms: { id: number; name: string }[];
  defaultStudentId?: number;
}) {
  const [state, action] = useActionState<ActionState, FormData>(createInvoiceAction, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">صدور فاکتور جدید</CardTitle>
        <p className="text-xs text-muted-foreground">مبلغ کل به‌صورت مساوی بین اقساط تقسیم می‌شود — سررسید هر قسط یک ماه بعد از قبلی.</p>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>هنرجو *</Label>
              <select name="studentId" required defaultValue={defaultStudentId ? String(defaultStudentId) : ""} className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="">انتخاب کنید</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>ترم *</Label>
              <select name="termId" required className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="">انتخاب کنید</option>
                {terms.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>مبلغ کل (تومان) *</Label>
              <Input name="totalAmount" type="number" min={1000} placeholder="مثلاً 5000000" required dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>تعداد اقساط *</Label>
              <select name="installmentsCount" defaultValue={3} className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
                {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
                  <option key={n} value={n}>
                    {n} قسط
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>سررسید قسط اول (شمسی YYYY/MM/DD) *</Label>
              <Input name="firstDueDate" placeholder="۱۴۰۵/۰۲/۱۵" defaultValue={todayJalali()} required dir="ltr" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>یادداشت</Label>
              <Input name="note" placeholder="اختیاری" />
            </div>
          </div>
          {state.error ? <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{state.error}</p> : null}
          <SubmitButton>صدور فاکتور</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}

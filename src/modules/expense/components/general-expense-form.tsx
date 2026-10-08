"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage, SubmitButton } from "@/components/shared/form";
import { todayJalali } from "@/lib/jalali";
import { generalExpenseCategoryOptions } from "@/lib/constants";
import { createGeneralExpenseAction, updateGeneralExpenseAction } from "../actions/expense.actions";

export function GeneralExpenseForm({ defaultPaidAt }: { defaultPaidAt?: string }) {
  const [state, action] = useActionState(createGeneralExpenseAction, {});
  const [category, setCategory] = useState("OTHER");

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="text-base">افزودن هزینه جانبی جدید</CardTitle>
        <p className="text-xs text-muted-foreground">مثل: قبض برق، نظافت، گاز، اجاره — در سود/زیان لحاظ می‌شود</p>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>عنوان *</Label>
              <Input name="title" placeholder="مثلاً: قبض برق مرداد" required maxLength={100} />
            </div>
            <div className="space-y-1">
              <Label>دسته</Label>
              <select
                name="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                {generalExpenseCategoryOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>مبلغ (تومان) *</Label>
              <Input name="amount" placeholder="مثلاً ۲٬۵۰۰٬۰۰۰" dir="ltr" className="text-right" required />
            </div>
            <div className="space-y-1">
              <Label>تاریخ پرداخت (شمسی) *</Label>
              <Input name="paidAt" defaultValue={defaultPaidAt ?? todayJalali()} placeholder="۱۴۰۴/۰۶/۱۵" dir="ltr" className="text-right" required />
            </div>
          </div>

          <div className="space-y-1">
            <Label>توضیح (اختیاری)</Label>
            <Input name="note" placeholder="توضیح کوتاه..." maxLength={500} />
          </div>

          <FormMessage error={state.error} success={state.success} successText="هزینه ذخیره شد ✓" />
          <SubmitButton>ثبت هزینه</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}

export function GeneralExpenseEditForm({
  expense,
  onDone,
}: {
  expense: { id: number; title: string; category: string; amount: number; paidAt: string; note: string | null };
  onDone?: () => void;
}) {
  const [state, action] = useActionState(updateGeneralExpenseAction, {});

  useEffect(() => {
    if (state.success && onDone) {
      const t = setTimeout(() => onDone(), 600);
      return () => clearTimeout(t);
    }
  }, [state.success, onDone]);

  return (
    <form action={action} className="space-y-2 rounded-lg border bg-muted/30 p-3 text-sm">
      <input type="hidden" name="id" value={expense.id} />
      <div className="grid gap-2 sm:grid-cols-2">
        <Input name="title" defaultValue={expense.title} placeholder="عنوان" required />
        <select name="category" defaultValue={expense.category} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
          {generalExpenseCategoryOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Input name="amount" defaultValue={String(expense.amount)} placeholder="مبلغ" dir="ltr" className="text-right" required />
        <Input name="paidAt" defaultValue={expense.paidAt} placeholder="۱۴۰۴/۰۶/۱۵" dir="ltr" className="text-right" required />
      </div>
      <Input name="note" defaultValue={expense.note ?? ""} placeholder="توضیح" />
      <FormMessage error={state.error} success={state.success} successText="ویرایش شد ✓" />
      <div className="flex gap-2">
        <SubmitButton>ذخیره ویرایش</SubmitButton>
        {onDone && (
          <Button type="button" variant="ghost" size="sm" onClick={onDone}>
            انصراف
          </Button>
        )}
      </div>
    </form>
  );
}

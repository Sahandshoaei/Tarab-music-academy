"use client";
import { useActionState, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/shared/form";
import { createTuitionPaymentAction } from "../actions/finance.actions";
import { todayJalali } from "@/lib/jalali";
import type { ActionState } from "@/types/action";
import { classTypeLabels } from "@/lib/constants";

export function PaymentForm({
  studentId,
  classes,
}: {
  studentId: number;
  classes: { id: number; title: string | null; type: string; instrument: string }[];
}) {
  const [state, action] = useActionState<ActionState, FormData>(createTuitionPaymentAction, {});
  const [selected, setSelected] = useState<number[]>([]);

  function toggleClass(id: number, checked: boolean) {
    setSelected((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
  }

  return (
    <form action={action} className="space-y-3 rounded-xl border bg-card p-4">
      <p className="text-sm font-medium">ثبت پرداخت منعطف</p>
      <p className="text-xs text-muted-foreground">هر مبلغی وارد کنید از بدهی کم می‌شود — رسید الزامی است — کلاس‌ها را انتخاب کنید تا سهم هر کلاس محاسبه شود.</p>
      <input type="hidden" name="studentId" value={studentId} />

      <div className="space-y-1.5">
        <Label>برای کدام کلاس(ها)؟ * (حداقل یکی)</Label>
        {classes.length === 0 ? (
          <p className="rounded-md bg-amber-500/10 p-2 text-xs text-amber-700">این هنرجو کلاس فعالی ندارد.</p>
        ) : (
          <div className="max-h-32 space-y-1.5 overflow-y-auto rounded-md border p-3">
            {classes.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="classIds"
                  value={c.id}
                  checked={selected.includes(c.id)}
                  onChange={(e) => toggleClass(c.id, e.target.checked)}
                  className="size-4 accent-primary"
                />
                <span className="flex-1">{c.title || c.instrument}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{classTypeLabels[c.type as keyof typeof classTypeLabels] ?? c.type}</span>
              </label>
            ))}
          </div>
        )}
        {selected.length > 1 ? (
          <p className="text-xs text-muted-foreground">مبلغ به‌صورت مساوی بین {selected.length} کلاس تقسیم می‌شود.</p>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <Label>مبلغ (تومان) *</Label>
          <Input name="amount" type="number" min={1000} required dir="ltr" placeholder="مثلاً 1500000" />
        </div>
        <div className="space-y-1">
          <Label>تاریخ پرداخت (شمسی) *</Label>
          <Input name="paidAt" placeholder="۱۴۰۴/۰۷/۰۸" defaultValue={todayJalali()} required dir="ltr" />
        </div>
      </div>

      <div className="space-y-1">
        <Label>عکس رسید * (الزامی)</Label>
        <Input name="receipt" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required className="block w-full text-sm file:me-2 file:rounded-md file:border file:bg-muted file:px-3 file:py-1" />
        <p className="text-xs text-muted-foreground">فایل تا ۵ مگ، jpg/png/webp/pdf</p>
      </div>

      <div className="space-y-1">
        <Label>یادداشت (اختیاری)</Label>
        <Input name="note" placeholder="مثلاً: پرداخت علی‌الحساب" />
      </div>

      {state?.error ? <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{state.error}</p> : null}
      {state?.success ? <p className="rounded-md bg-emerald-500/10 p-2 text-sm text-emerald-700">پرداخت ثبت شد و از بدهی کم شد.</p> : null}
      <SubmitButton>ثبت پرداخت</SubmitButton>
    </form>
  );
}

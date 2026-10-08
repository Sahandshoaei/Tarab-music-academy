"use client";
import { formatMoney } from "@/lib/jalali";
import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage, SubmitButton } from "@/components/shared/form";
import { updateTuitionRatesAction } from "../actions/settings.actions";

export function TuitionRatesForm({
  rates,
}: {
  rates: {
    privateRate: number | null;
    groupRate: number | null;
    semiGroupRate: number | null;
    practiceRate: number | null;
  };
}) {
  const [state, formAction] = useActionState(updateTuitionRatesAction, {});

  const fmt = (n: number | null) => (n == null ? "" : String(n));

  return (
    <form action={formAction} className="space-y-4">
      <p className="text-xs leading-6 text-muted-foreground">
        نرخ پیش‌فرض شهریه هر نوع کلاس (تومان) — هنگام صدور فاکتور به‌عنوان پیشنهاد پر می‌شود. خالی بگذارید یعنی بدون پیش‌فرض.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="tr-private">خصوصی (۱۰ جلسه)</Label>
          <Input id="tr-private" name="privateRate" defaultValue={fmt(rates.privateRate)} placeholder="مثلا 5000000" inputMode="numeric" dir="ltr" className="text-right" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tr-group">گروهی (۱۰ جلسه)</Label>
          <Input id="tr-group" name="groupRate" defaultValue={fmt(rates.groupRate)} placeholder="مثلا 2000000" inputMode="numeric" dir="ltr" className="text-right" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tr-semi">نیمه‌گروهی (۱۰ جلسه)</Label>
          <Input id="tr-semi" name="semiGroupRate" defaultValue={fmt(rates.semiGroupRate)} placeholder="مثلا 3000000" inputMode="numeric" dir="ltr" className="text-right" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tr-practice">تمرینی (۸ جلسه)</Label>
          <Input id="tr-practice" name="practiceRate" defaultValue={fmt(rates.practiceRate)} placeholder="مثلا 1500000" inputMode="numeric" dir="ltr" className="text-right" />
        </div>
      </div>
      {rates.privateRate != null || rates.groupRate != null ? (
        <p className="rounded-md bg-muted/40 p-2 text-xs tabular-nums text-muted-foreground">
          فعلی: خصوصی {rates.privateRate != null ? formatMoney(rates.privateRate) : "—"} · گروهی {rates.groupRate != null ? formatMoney(rates.groupRate) : "—"} · نیمه‌گروهی {rates.semiGroupRate != null ? formatMoney(rates.semiGroupRate) : "—"} · تمرینی {rates.practiceRate != null ? formatMoney(rates.practiceRate) : "—"} تومان
        </p>
      ) : null}
      <FormMessage error={state.error} success={state.success} successText="نرخ‌ها ذخیره شد ✓" />
      <SubmitButton className="w-full">ذخیره نرخ‌ها</SubmitButton>
    </form>
  );
}

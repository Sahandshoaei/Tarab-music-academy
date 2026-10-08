"use client";

// فرم ایجاد ترم (F0-AC1) — ورودی تاریخ شمسی (D20)
import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage, SubmitButton } from "@/components/shared/form";
import { todayJalali } from "@/lib/jalali";
import { createTermAction } from "../actions/term.actions";

export function TermForm() {
  const [state, formAction] = useActionState(createTermAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="term-name">نام ترم *</Label>
        <Input id="term-name" name="name" placeholder="مثلاً: پاییز ۱۴۰۵" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="term-start">تاریخ شروع *</Label>
          <Input
            id="term-start"
            name="startDate"
            placeholder="۱۴۰۵/۰۷/۰۱"
            defaultValue={todayJalali()}
            dir="ltr"
            className="text-right"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="term-end">تاریخ پایان *</Label>
          <Input
            id="term-end"
            name="endDate"
            placeholder="۱۴۰۵/۱۰/۳۰"
            dir="ltr"
            className="text-right"
            required
          />
        </div>
      </div>
      <FormMessage error={state.error} success={state.success} successText="ترم ثبت شد ✓" />
      <SubmitButton className="w-full">ثبت ترم</SubmitButton>
    </form>
  );
}

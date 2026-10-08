"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage, SubmitButton } from "@/components/shared/form";
import { createMakeupSessionAction } from "../actions/class.actions";

export function MakeupSessionForm({ sessionId }: { sessionId: number }) {
  const [state, formAction] = useActionState(createMakeupSessionAction, {});

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="sessionId" value={sessionId} />
      <div className="space-y-2">
        <Label htmlFor="mk-date">تاریخ جبرانی (شمسی) *</Label>
        <Input id="mk-date" name="date" placeholder="۱۴۰۵/۰۷/۲۰" dir="ltr" className="text-right" required />
        <p className="text-xs leading-relaxed text-muted-foreground">
          جلسه جبرانی با همان ساعت و اتاق جلسه لغوشده ساخته می‌شود (بند ۱۱). تاریخ باید در بازه ترم و روز غیرتعطیل باشد.
        </p>
      </div>
      <FormMessage error={state.error} success={state.success} successText="جلسه جبرانی ساخته شد ✓ — در تقویم ببینید" />
      <SubmitButton className="w-full">ایجاد جلسه جبرانی</SubmitButton>
    </form>
  );
}

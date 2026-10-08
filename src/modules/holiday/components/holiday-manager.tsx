"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormMessage, SubmitButton } from "@/components/shared/form";
import { createHolidayAction, deleteHolidayAction } from "../actions/holiday.actions";
import type { ActionState } from "@/types/action";

interface HolidayItem {
  id: number;
  date: string; // already formatted jalali from server, but we pass raw
  title: string;
  dateLabel: string;
}

export function HolidayManager({ holidays }: { holidays: HolidayItem[] }) {
  const [state, formAction] = useActionState(createHolidayAction, {} as ActionState);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">تعطیلات رسمی تقویم — بند ۱۰</CardTitle>
        <p className="text-xs leading-relaxed text-muted-foreground">
          تاریخ‌های زیر جزو ۱۰ جلسه محسوب نمی‌شوند و هنگام ساخت کلاس‌های هفتگی خودکار رد می‌شوند. لیست ۱۴۰۵ به‌صورت خودکار پر شده و قابل ویرایش است.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* لیست */}
        {holidays.length === 0 ? (
          <p className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">تعطیلی ثبت نشده</p>
        ) : (
          <div className="space-y-2">
            {holidays.map((h) => (
              <div key={h.id} className="flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm">
                <span className="font-medium tabular-nums">{h.dateLabel}</span>
                <span className="flex-1 text-muted-foreground">{h.title}</span>
                <form action={deleteHolidayAction}>
                  <input type="hidden" name="id" value={h.id} />
                  <Button type="submit" variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive">
                    حذف
                  </Button>
                </form>
              </div>
            ))}
          </div>
        )}

        {/* افزودن */}
        <form action={formAction} className="space-y-3 rounded-lg border bg-muted/20 p-4">
          <p className="text-sm font-medium">افزودن تعطیلی</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="h-date">تاریخ شمسی *</Label>
              <Input id="h-date" name="date" placeholder="۱۴۰۵/۰۱/۱۳" dir="ltr" className="text-right" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="h-title">عنوان *</Label>
              <Input id="h-title" name="title" placeholder="روز طبیعت" required />
            </div>
          </div>
          <FormMessage error={state.error} success={state.success} successText="تعطیلی ثبت شد ✓" />
          <SubmitButton>ثبت تعطیلی</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}

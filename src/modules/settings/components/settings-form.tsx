"use client";

// فرم تنظیمات آموزشگاه — ساعات کاری + روزهای تعطیل (F4-AC5)
import { useActionState } from "react";
import type { Weekday } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage, SubmitButton } from "@/components/shared/form";
import { weekdayLabels } from "@/lib/constants";
import { updateSettingsAction } from "../actions/settings.actions";
import { WEEKDAY_ORDER } from "@/modules/class/utils/weekly-sessions";

export function SettingsForm({
  settings,
}: {
  settings: {
    schoolName: string | null;
    openTime: string;
    closeTime: string;
    closedDays: Weekday[];
  };
}) {
  const [state, formAction] = useActionState(updateSettingsAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="st-name">نام آموزشگاه</Label>
        <Input id="st-name" name="schoolName" defaultValue={settings.schoolName ?? ""} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="st-open">ساعت شروع کار *</Label>
          <Input
            id="st-open"
            name="openTime"
            defaultValue={settings.openTime}
            placeholder="۰۹:۰۰"
            dir="ltr"
            className="text-right"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="st-close">ساعت پایان کار *</Label>
          <Input
            id="st-close"
            name="closeTime"
            defaultValue={settings.closeTime}
            placeholder="۲۱:۰۰"
            dir="ltr"
            className="text-right"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>روزهای تعطیل آموزشگاه (هیچ‌کدام هم می‌تواند باشد)</Label>
        <div className="flex flex-wrap gap-x-4 gap-y-2 rounded-md border p-3">
          {WEEKDAY_ORDER.map((d) => (
            <label key={d} className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                name="closedDays"
                value={d}
                defaultChecked={settings.closedDays.includes(d)}
                className="size-4 accent-primary"
              />
              {weekdayLabels[d]}
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          کلاس/جلسه در روز تعطیل قابل ثبت نیست و تولید جلسات سری از آن می‌پرد (F4-AC5 · §۶.4-2).
        </p>
      </div>

      <FormMessage error={state.error} success={state.success} successText="تنظیمات ذخیره شد ✓" />
      <SubmitButton className="w-full">ذخیره تنظیمات</SubmitButton>
    </form>
  );
}

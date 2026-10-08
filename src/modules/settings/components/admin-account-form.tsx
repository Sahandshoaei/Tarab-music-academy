"use client";
import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage, SubmitButton } from "@/components/shared/form";
import { updateAdminAccountAction } from "../actions/settings.actions";

export function AdminAccountForm({
  admin,
}: {
  admin: { name: string | null; email: string };
}) {
  const [state, formAction] = useActionState(updateAdminAccountAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ad-name">نام نمایشی</Label>
          <Input id="ad-name" name="name" defaultValue={admin.name ?? ""} placeholder="نام ادمین" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ad-email">ایمیل (یوزر) *</Label>
          <Input id="ad-email" name="email" defaultValue={admin.email} type="email" required dir="ltr" className="text-right" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="ad-current">رمز فعلی * (برای تأیید)</Label>
        <Input id="ad-current" name="currentPassword" type="password" required dir="ltr" placeholder="••••••••" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ad-new">رمز جدید (اختیاری)</Label>
          <Input id="ad-new" name="newPassword" type="password" dir="ltr" placeholder="حداقل ۶ کاراکتر — خالی = بدون تغییر" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ad-confirm">تکرار رمز جدید</Label>
          <Input id="ad-confirm" name="confirmNewPassword" type="password" dir="ltr" placeholder="تکرار" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">برای تغییر ایمیل/نام هم باید رمز فعلی را وارد کنید. اگر رمز جدید را خالی بگذارید، رمز قبلی می‌ماند.</p>
      <FormMessage error={state.error} success={state.success} successText="اکانت به‌روز شد ✓ — با اطلاعات جدید وارد شوید" />
      <SubmitButton className="w-full">ذخیره اکانت ادمین</SubmitButton>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormMessage, SubmitButton } from "@/components/shared/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendRenewalReminderAction } from "../actions/renewal.actions";
import type { RenewalStudent } from "../services/renewal.service";

export function RenewalCard({ students, termName }: { students: RenewalStudent[]; termName: string }) {
  const [state, formAction] = useActionState(sendRenewalReminderAction, {});

  if (students.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">یادآوری تمدید ترم — بند ۷</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            ترم فعال «{termName}» هنوز به پایان نزدیک نیست (بیش از ۷ روز مانده). وقتی به ۷ روز پایانی برسد، لیست هنرجویان اینجا نشان داده می‌شود.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">نکته: آزادسازی وقت کلاس دستی توسط ادمین انجام می‌شود، فقط پیامک یادآوری ارسال می‌گردد.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardHeader>
        <CardTitle className="text-base">یادآوری تمدید ترم — {students.length} هنرجو</CardTitle>
        <p className="text-xs leading-relaxed text-muted-foreground">
          ترم «{termName}» رو به اتمام است. این هنرجویان ثبت‌نام فعال دارند — پیامک یادآوری ارسال کنید. آزادسازی کلاس پس از اتمام، دستی است.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-48 space-y-1 overflow-auto rounded-lg border bg-card p-2">
          {students.map((s) => (
            <div key={s.studentId} className="flex items-center justify-between gap-2 rounded px-2 py-1 text-sm hover:bg-muted/50">
              <span className="font-medium">{s.fullName}</span>
              <span className="text-xs text-muted-foreground">
                {s.classTitle} · <span dir="ltr">{s.phone}</span>
              </span>
            </div>
          ))}
        </div>

        <form action={formAction} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="renew-body">متن پیامک (متغیرها: {"{نام هنرجو}"}، {"{نام کلاس}"}، {"{نام آموزشگاه}"})</Label>
            <Input
              id="renew-body"
              name="body"
              defaultValue="هنرجوی گرامی {نام هنرجو}، ترم {نام کلاس} شما رو به اتمام است. لطفاً برای حفظ وقت کلاس نسبت به تمدید اقدام فرمایید. {نام آموزشگاه}"
            />
          </div>
          <FormMessage error={state.error} success={state.success} successText="پیامک یادآوری ارسال شد ✓" />
          <SubmitButton className="w-full">ارسال پیامک یادآوری به {students.length} نفر</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}

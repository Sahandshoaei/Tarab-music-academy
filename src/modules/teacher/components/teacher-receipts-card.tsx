"use client";

import {useActionState} from "react";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {FormMessage, SubmitButton} from "@/components/shared/form";
import {formatJalali, todayJalali, formatMoney} from "@/lib/jalali";
import {toPersianDigits} from "@/validations/validators";
import {deleteTeacherReceiptAction, uploadTeacherReceiptAction} from "../actions/receipt.actions";

type Receipt = {id: number; imageUrl: string; amount: number; paidAt: Date; note: string | null};

export function TeacherReceiptsCard({teacherId, receipts}: {teacherId: number; receipts: Receipt[]}) {
  const [upState, upAction] = useActionState(uploadTeacherReceiptAction, {});
  const total = receipts.reduce((s, r) => s + r.amount, 0);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">فیش‌های پرداخت حقوق (اقساطی)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {receipts.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              مجموع پرداختی: {formatMoney(total)} تومان — {toPersianDigits(String(receipts.length))} فیش
            </p>
            {receipts.map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-lg border p-2">
                <a href={r.imageUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
                  {r.imageUrl.endsWith(".pdf") ? <span className="grid size-16 place-items-center rounded border bg-muted text-xs">PDF</span> : <img src={r.imageUrl} alt="فیش" className="size-16 rounded border object-cover" />}
                </a>
                <div className="flex-1 leading-5">
                  <p>{formatMoney(r.amount)} تومان — {formatJalali(r.paidAt)}</p>
                  {r.note ? <p className="text-xs text-muted-foreground">{r.note}</p> : null}
                </div>
                <form action={deleteTeacherReceiptAction}>
                  <input type="hidden" name="teacherId" value={teacherId} />
                  <input type="hidden" name="receiptId" value={r.id} />
                  <Button type="submit" variant="ghost" size="sm">
                    حذف
                  </Button>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">هنوز فیشی ثبت نشده.</p>
        )}
        <form action={upAction} className="space-y-3 rounded-lg border bg-muted/30 p-3">
          <input type="hidden" name="teacherId" value={teacherId} />
          <p className="text-xs font-bold">افزودن فیش جدید</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>مبلغ (تومان) *</Label>
              <Input name="amount" placeholder="مثلاً ۵٬۰۰۰٬۰۰۰" dir="ltr" className="text-right" required />
            </div>
            <div className="space-y-1">
              <Label>تاریخ پرداخت (شمسی) *</Label>
              <Input name="paidAt" defaultValue={todayJalali()} placeholder="۱۴۰۵/۰۶/۱۵" dir="ltr" className="text-right" required />
            </div>
          </div>
          <div className="space-y-1">
            <Label>توضیح</Label>
            <Input name="note" placeholder="مثلاً: حقوق مرداد" />
          </div>
          <div className="space-y-1">
            <Label>عکس فیش *</Label>
            <input type="file" name="receipt" accept="image/jpeg,image/png,image/webp,application/pdf" className="block w-full text-sm file:me-2 file:rounded-md file:border file:bg-muted file:px-3 file:py-1" required />
            <p className="text-xs text-muted-foreground">jpg / png / webp / pdf — حداکثر ۵ MB</p>
          </div>
          <FormMessage error={upState.error} success={upState.success} successText="فیش ذخیره شد ✓" />
          <SubmitButton>آپلود فیش</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}

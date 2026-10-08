"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormMessage, SubmitButton } from "@/components/shared/form";
import { clearSignatureAction, uploadSignatureAction } from "../actions/receipt.actions";

export function StudentSignatureCard({
  studentId,
  imageUrl,
}: {
  studentId: number;
  imageUrl: string | null;
}) {
  const [upState, upAction] = useActionState(uploadSignatureAction, {});
  const [delState, delAction] = useActionState(clearSignatureAction, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">امضای هنرجو</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {imageUrl ? (
          <div className="space-y-2">
            <img src={imageUrl} alt="امضای هنرجو" className="max-h-40 rounded border bg-white object-contain p-2" />
            <form action={delAction} className="flex items-center gap-2">
              <input type="hidden" name="studentId" value={studentId} />
              <Button type="submit" variant="outline" size="sm">
                حذف امضا
              </Button>
              <FormMessage error={delState.error} success={delState.success} successText="حذف شد" />
            </form>
          </div>
        ) : (
          <p className="text-muted-foreground">هنوز امضایی ثبت نشده.</p>
        )}

        <form action={upAction} className="space-y-2">
          <input type="hidden" name="studentId" value={studentId} />
          <input type="file" name="signature" accept="image/jpeg,image/png,image/webp,application/pdf" className="block w-full text-sm file:me-2 file:rounded-md file:border file:bg-muted file:px-3 file:py-1" required />
          <p className="text-xs text-muted-foreground">jpg / png / webp / pdf — حداکثر ۵ MB</p>
          <FormMessage error={upState.error} success={upState.success} successText="امضا ذخیره شد ✓" />
          <SubmitButton>{imageUrl ? "جایگزینی امضا" : "آپلود امضا"}</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toggleStudentActiveAction } from "../actions/student.actions";

interface Preview {
  classId: number;
  classTitle: string;
  pastCount: number;
  refundPercent: number;
  rule: string;
}

export function WithdrawalCard({ studentId, studentName, previews }: { studentId: number; studentName: string; previews: Preview[] }) {
  if (previews.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-sm font-bold">انصراف و استرداد — بند ۵-۶</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">هنرجو ثبت‌نام فعالی ندارد — استردادی مطرح نیست.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/30 py-3">
        <CardTitle className="text-sm font-bold">انصراف و استرداد — بند ۵ و ۶</CardTitle>
        <p className="text-xs leading-relaxed text-muted-foreground">
          انصراف توسط ادمین انجام می‌شود. سیستم خودکار درصد استرداد را بر اساس تعداد جلسات گذشته حساب می‌کند.
        </p>
      </CardHeader>
      <CardContent className="space-y-3 p-4 text-sm">
        {previews.map((p) => (
          <div key={p.classId} className="rounded-lg border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold">{p.classTitle}</span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  p.refundPercent === 90
                    ? "bg-emerald-500/15 text-emerald-700"
                    : p.refundPercent === 50
                      ? "bg-amber-500/15 text-amber-700"
                      : "bg-destructive/10 text-destructive"
                }`}
              >
                {p.refundPercent === 90 ? "۹۰٪ بازگشت" : p.refundPercent === 50 ? "۵۰٪ بازگشت" : "بدون بازگشت"}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              جلسات گذشته: {p.pastCount} جلسه — {p.rule}
            </p>
          </div>
        ))}

        <form
          action={toggleStudentActiveAction}
          onSubmit={(e) => {
            const first = previews[0];
            const msg = `انصراف ${studentName}؟\n${first.rule}\nادامه می‌دهید؟`;
            if (!window.confirm(msg)) e.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={studentId} />
          <input type="hidden" name="next" value="false" />
          <Button type="submit" variant="destructive" size="sm" className="w-full">
            ثبت انصراف و غیرفعال‌سازی هنرجو
          </Button>
        </form>
        <p className="text-center text-xs text-muted-foreground">پس از انصراف، هنرجو غیرفعال می‌شود ولی سابقه کلاس و حضور حفظ می‌گردد.</p>
      </CardContent>
    </Card>
  );
}

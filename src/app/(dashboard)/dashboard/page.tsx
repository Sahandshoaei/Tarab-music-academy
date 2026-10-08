// ═══════════════════════════════════════════════════════════════════════════
//  داشبورد — پالت کرم-گردویی — ۴ کارت + جدول جلسات امروز
//  هدر سراسری حالا در layout است (کلمه «داشبورد» حذف شد)
// ═══════════════════════════════════════════════════════════════════════════
import Link from "next/link";
import { BookOpen, ClipboardCheck, Clock, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDashboardKpis, getTodaySessions } from "@/modules/dashboard/queries";
import { toPersianDigits } from "@/validations/validators";

export const dynamic = "force-dynamic";
export const metadata = { title: "داشبورد" };

const classTypeFa: Record<string, string> = {
  PRIVATE: "خصوصی",
  GROUP: "گروهی",
  SEMI_GROUP: "نیمه‌خصوصی",
  PRACTICE: "تمرینی",
};

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export default async function DashboardPage() {
  const [kpis, todaySessionsRaw] = await Promise.all([getDashboardKpis(), getTodaySessions()]);
  // مرتب‌سازی قطعی بر اساس زمان (رشته «HH:MM» → دقیقه) — مستقل از ترتیب DB
  const todaySessions = [...todaySessionsRaw].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  return (
    <div className="space-y-6">
      {/* ── ۴ کارت آمار ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* هنرجویان فعال */}
        <Card className="relative overflow-hidden border bg-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="grid size-9 place-items-center rounded-xl bg-[#F5EEE6] text-primary dark:bg-primary/15">
                <Users className="size-[18px]" />
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">هنرجویان فعال</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-primary">
              {toPersianDigits(String(kpis.activeStudents))}
            </p>
            <div className="mt-3 flex items-center gap-1 border-t pt-3 text-xs text-muted-foreground">
              <span className={kpis.studentsGrowth >= 0 ? "text-success" : "text-destructive"}>
                {kpis.studentsGrowth >= 0 ? "↗" : "↘"} {toPersianDigits(String(Math.abs(kpis.studentsGrowth)))} نفر بیشتر از ماه قبل
              </span>
              {kpis.studentsGrowth === 0 && <span>— بدون تغییر</span>}
            </div>
          </CardContent>
        </Card>

        {/* کلاس‌های فعال */}
        <Card className="relative overflow-hidden border bg-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="grid size-9 place-items-center rounded-xl bg-[#F5EEE6] text-primary dark:bg-primary/15">
                <BookOpen className="size-[18px]" />
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">کلاس‌های فعال</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-primary">
              {toPersianDigits(String(kpis.activeClasses))}
            </p>
            <div className="mt-3 border-t pt-3 text-xs text-muted-foreground">هماهنگ با لیست کلاس‌ها</div>
          </CardContent>
        </Card>

        {/* جلسات امروز */}
        <Card className="relative overflow-hidden border bg-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="grid size-9 place-items-center rounded-xl bg-[#F5EEE6] text-primary dark:bg-primary/15">
                <Clock className="size-[18px]" />
              </div>
              <span className="text-xs text-muted-foreground">
                {toPersianDigits(String(kpis.todaySessionsRemaining))} جلسه باقی مانده
              </span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">جلسات امروز</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-primary">
              {toPersianDigits(String(kpis.todaySessionsTotal))}
            </p>
            <div className="mt-3 border-t pt-3 text-xs text-muted-foreground">
              {kpis.todaySessionsTotal > 0 ? `${toPersianDigits(String(kpis.todaySessionsRemaining))} جلسه باقی مانده` : "امروز جلسه‌ای نیست"}
            </div>
          </CardContent>
        </Card>

        {/* حضور و غیاب ثبت نشده */}
        <Card className="relative overflow-hidden border bg-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="grid size-9 place-items-center rounded-xl bg-[#FFF1E6] text-warning dark:bg-warning/15">
                <ClipboardCheck className="size-[18px] text-warning" />
              </div>
              {kpis.pendingAttendances > 0 && (
                <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">نیاز به بررسی</span>
              )}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">حضور و غیاب ثبت نشده</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-primary">
              {toPersianDigits(String(kpis.pendingAttendances))}
            </p>
            <div className="mt-3 border-t pt-3 text-xs text-muted-foreground">
              {kpis.pendingAttendances === 0 ? "همه ثبت شده ✓" : "جلسات گذشته بدون ثبت"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── جلسه‌های امروز — جدول ── */}
      <Card className="overflow-hidden border">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-[#FAF6F0] px-4 py-3 dark:bg-card">
          <div>
            <h2 className="text-[15px] font-bold">جلسه‌های امروز</h2>
            <p className="text-xs text-muted-foreground">برنامه {kpis.todayLabel}</p>
          </div>
          <Button asChild variant="outline" size="sm" className="rounded-full bg-card text-xs">
            <Link href="/schedule">
              مشاهده تقویم <span className="mr-1">‹</span>
            </Link>
          </Button>
        </div>

        {todaySessions.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm text-muted-foreground">امروز جلسه‌ای برنامه‌ریزی نشده — تقویم هفتگی را ببینید.</p>
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link href="/schedule">رفتن به تقویم</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-[#F5EEE6]/60 text-xs text-muted-foreground dark:bg-muted/30">
                  <th className="w-[90px] whitespace-nowrap px-4 py-3 text-center font-medium">زمان</th>
                  <th className="px-4 py-3 text-right font-medium">کلاس</th>
                  <th className="px-4 py-3 text-right font-medium">مدرس</th>
                  <th className="px-4 py-3 text-center font-medium">اتاق</th>
                  <th className="px-4 py-3 text-center font-medium">نوع</th>
                  <th className="px-4 py-3 text-center font-medium">وضعیت</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {todaySessions.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/20">
                    <td className="w-[90px] whitespace-nowrap px-4 py-3.5 text-center font-medium tabular-nums tracking-wide" dir="ltr">
                      {toPersianDigits(s.startTime)}
                    </td>
                    <td className="px-4 py-3.5">
                      <Link href={`/sessions/${s.id}`} className="font-medium hover:text-primary hover:underline">
                        {s.class.title || s.class.instrument.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">{s.teacher.fullName}</td>
                    <td className="px-4 py-3.5 text-center text-muted-foreground">{s.room.name}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="text-muted-foreground">{classTypeFa[s.class.type] ?? s.class.type}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <Badge variant="secondary" className="rounded-full bg-[#E8F5E0] px-2.5 py-0.5 text-xs font-normal text-success hover:bg-[#E8F5E0] dark:bg-success/15 dark:text-success">
                        فعال
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

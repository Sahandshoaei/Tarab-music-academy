// لیست کلاس‌ها (F4) — سری‌ها + لغو/فعال‌سازی + جلسات باقی‌مانده
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ActiveBadge, PageHeader } from "@/components/shared/form";
import { classTypeLabels, scheduleTypeLabels, weekdayLabels } from "@/lib/constants";
import { getClasses } from "@/modules/class/services/class.service";
import { toggleClassActiveAction } from "@/modules/class/actions/class.actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "کلاس‌ها" };

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ inactive?: string }>;
}) {
  const { inactive } = await searchParams;
  const showInactive = inactive === "1";
  const classes = await getClasses(showInactive);

  return (
    <>
      <PageHeader title="کلاس‌ها">
        <Badge variant="outline">F4</Badge>
        <Button asChild size="sm">
          <Link href="/classes/new">＋ کلاس جدید</Link>
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{classes.length} کلاس</p>
            <Button asChild variant="ghost" size="sm">
              <Link href={showInactive ? "/classes" : "/classes?inactive=1"}>
                {showInactive ? "پنهان کردن لغوشده‌ها" : "نمایش لغوشده‌ها"}
              </Link>
            </Button>
          </div>

          {classes.map((c) => (
            <div
              key={c.id}
              className="flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2.5 text-sm"
            >
              <Link href={`/classes/${c.id}`} className="font-bold hover:underline">
                {c.title || c.instrument.name}
              </Link>
              <Badge variant="secondary">{classTypeLabels[c.type]}</Badge>
              <Badge variant="outline">{scheduleTypeLabels[c.scheduleType]}</Badge>
              <span className="text-xs text-muted-foreground">{c.teacher.fullName}</span>
              <span className="text-xs text-muted-foreground">{c.room.name}</span>
              {c.scheduleType === "WEEKLY" && c.weekday && c.startTime && c.endTime ? (
                <span className="text-xs text-muted-foreground">
                  {weekdayLabels[c.weekday]} {c.startTime}–{c.endTime}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">بدون الگوی هفتگی</span>
              )}
              <span className="text-xs text-muted-foreground">
                {c._count.sessions} جلسه آینده · {c._count.enrollments} هنرجو
              </span>
              <span className="text-xs text-muted-foreground">ترم {c.term.name}</span>
              <ActiveBadge active={c.isActive} />
              <form action={toggleClassActiveAction} className="ms-auto">
                <input type="hidden" name="id" value={c.id} />
                <input type="hidden" name="next" value={String(!c.isActive)} />
                <Button type="submit" size="sm" variant="outline">
                  {c.isActive ? "لغو سری" : "فعال‌سازی"}
                </Button>
              </form>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            لغو سری = غیرفعال‌سازی کلاس + لغو جلسات آینده (جلسات گذشته و
            بازنویسی‌شده حفظ می‌شوند — §۶.۳) · جلسه‌به‌جلسه‌ها از صفحه کلاس
            مدیریت می‌شوند.
          </p>
        </CardContent>
      </Card>
    </>
  );
}

// لیست اساتید (F3) — Soft Delete و فیلتر غیرفعال‌ها
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ActiveBadge, PageHeader } from "@/components/shared/form";
import { getTeachers } from "@/modules/teacher/services/teacher.service";
import { toggleTeacherActiveAction } from "@/modules/teacher/actions/teacher.actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "اساتید" };

export default async function TeachersPage({
  searchParams,
}: {
  searchParams: Promise<{ inactive?: string }>;
}) {
  const { inactive } = await searchParams;
  const showInactive = inactive === "1";
  const teachers = await getTeachers(showInactive);

  return (
    <>
      <PageHeader title="اساتید">
        <Badge variant="outline">F3</Badge>
        <Button asChild size="sm">
          <Link href="/teachers/new">＋ استاد جدید</Link>
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{teachers.length} استاد</p>
            <Button asChild variant="ghost" size="sm">
              <Link href={showInactive ? "/teachers" : "/teachers?inactive=1"}>
                {showInactive ? "پنهان کردن غیرفعال‌ها" : "نمایش غیرفعال‌ها"}
              </Link>
            </Button>
          </div>

          {teachers.map((t) => (
            <div
              key={t.id}
              className="flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2.5 text-sm"
            >
              <Link href={`/teachers/${t.id}`} className="font-bold hover:underline">
                {t.fullName}
              </Link>
              <span className="text-xs text-muted-foreground" dir="ltr">
                {t.phone}
              </span>
              <span className="flex flex-wrap gap-1">
                {t.instruments.map((ti) => (
                  <span
                    key={ti.instrumentId}
                    className="rounded-full bg-muted px-2 py-0.5 text-xs"
                  >
                    {ti.instrument.name}
                  </span>
                ))}
              </span>
              <span className="text-xs text-muted-foreground">
                {t._count.classes} کلاس
              </span>
              <ActiveBadge active={t.isActive} />
              <form action={toggleTeacherActiveAction} className="ms-auto">
                <input type="hidden" name="id" value={t.id} />
                <input type="hidden" name="next" value={String(!t.isActive)} />
                <Button type="submit" size="sm" variant="outline">
                  {t.isActive ? "غیرفعال‌سازی" : "فعال‌سازی"}
                </Button>
              </form>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            حذف استاد = غیرفعال‌سازی (Soft Delete — F3-AC4) · استاد دارای کلاس
            فعال قابل غیرفعال‌سازی نیست.
          </p>
        </CardContent>
      </Card>
    </>
  );
}

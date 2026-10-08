// صفحه کلاس — جزئیات + جلسات + مدیریت هنرجویان + ویرایش درجا
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActiveBadge, PageHeader } from "@/components/shared/form";
import {
  classTypeLabels,
  scheduleTypeLabels,
  sessionStatusLabels,
  weekdayLabels,
} from "@/lib/constants";
import { formatJalali } from "@/lib/jalali";
import { prisma } from "@/lib/prisma";
import { JS_TO_WEEKDAY } from "@/modules/class/utils/weekly-sessions";
import { getClass } from "@/modules/class/services/class.service";
import { toggleClassActiveAction } from "@/modules/class/actions/class.actions";
import { ClassForm } from "@/modules/class/components/class-form";
import { EnrollmentManager } from "@/modules/class/components/enrollment-manager";

export const dynamic = "force-dynamic";

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  const id = Number(classId);
  const cls = await getClass(id).catch(() => null);
  if (!cls) notFound();

  const [instruments, rooms, teachers, students, settings] = await Promise.all([
    prisma.instrument.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
    prisma.room.findMany({ where: { isActive: true }, select: { id: true, name: true } }),
    prisma.teacher.findMany({
      where: { isActive: true },
      include: { instruments: { select: { instrumentId: true } } },
      orderBy: { fullName: "asc" },
    }),
    prisma.student.findMany({
      where: { isActive: true },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true },
    }),
    prisma.schoolSettings.findUnique({ where: { id: 1 } }),
  ]);

  const activelyEnrolled = new Set(
    cls.enrollments.filter((e) => e.isActive).map((e) => e.studentId),
  );
  const availableStudents = students.filter((s) => !activelyEnrolled.has(s.id));

  return (
    <>
      <PageHeader title={cls.title || cls.instrument.name}>
        <ActiveBadge active={cls.isActive} />
        <form action={toggleClassActiveAction}>
          <input type="hidden" name="id" value={cls.id} />
          <input type="hidden" name="next" value={String(!cls.isActive)} />
          <Button type="submit" variant="outline" size="sm">
            {cls.isActive ? "لغو سری" : "فعال‌سازی"}
          </Button>
        </form>
        <Button asChild variant="ghost" size="sm">
          <Link href="/classes">← بازگشت به لیست</Link>
        </Button>
      </PageHeader>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">جزئیات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                نوع: {classTypeLabels[cls.type]} · {scheduleTypeLabels[cls.scheduleType]}
              </p>
              <p>ساز: {cls.instrument.name}</p>
              <p>استاد: {cls.teacher.fullName}</p>
              <p>اتاق: {cls.room.name}</p>
              <p>ترم: {cls.term.name}</p>
              {cls.scheduleType === "WEEKLY" && cls.weekday ? (
                <p>
                  الگو: {weekdayLabels[cls.weekday]} {cls.startTime} تا {cls.endTime} — {cls.type === "PRACTICE" ? "تمرینی ۸ جلسه" : `${classTypeLabels[cls.type]} ۱۰ جلسه`}
                </p>
              ) : cls.scheduleType === "SINGLE" ? (
                <p>
                  الگو: تک‌جلسه — {cls.sessions[0] ? `${formatJalali(cls.sessions[0].date)} ${cls.startTime} تا ${cls.endTime}` : `${cls.startTime} تا ${cls.endTime}`}
                </p>
              ) : (
                <p>الگو: بدون برنامه هفتگی — جلسات از پایین اضافه می‌شوند</p>
              )}
              {cls.notes ? <p className="text-muted-foreground">{cls.notes}</p> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                جلسات ({cls.sessions.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-sm">
              {cls.sessions.length === 0 ? (
                <p className="text-muted-foreground">جلسه‌ای ثبت نشده است.</p>
              ) : (
                cls.sessions.map((s) => (
                  <Link
                    key={s.id}
                    href={`/sessions/${s.id}`}
                    className={`flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 hover:bg-muted/50 ${
                      s.status === "CANCELLED" ? "opacity-60" : ""
                    }`}
                  >
                    <span className={s.status === "CANCELLED" ? "line-through" : ""}>
                      {weekdayLabels[JS_TO_WEEKDAY[s.date.getUTCDay()]]}{" "}
                      {formatJalali(s.date)}
                    </span>
                    <span dir="ltr" className="text-xs text-muted-foreground">
                      {s.startTime}–{s.endTime}
                    </span>
                    <span className="text-xs text-muted-foreground">{s.room.name}</span>
                    {s.status === "CANCELLED" ? (
                      <Badge variant="destructive">{sessionStatusLabels.CANCELLED}</Badge>
                    ) : null}
                    {s.isOverridden ? <Badge variant="outline">بازنویسی‌شده</Badge> : null}
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">هنرجویان</CardTitle>
            </CardHeader>
            <CardContent>
              <EnrollmentManager
                classId={cls.id}
                classType={cls.type}
                enrollments={cls.enrollments.map((e) => ({
                  studentId: e.studentId,
                  isActive: e.isActive,
                  student: { fullName: e.student.fullName, phone: e.student.phone },
                }))}
                availableStudents={availableStudents}
              />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">ویرایش اطلاعات</CardTitle>
          </CardHeader>
          <CardContent>
            <ClassForm
              instruments={instruments}
              teachers={teachers.map((t) => ({
                id: t.id,
                fullName: t.fullName,
                instrumentIds: t.instruments.map((ti) => ti.instrumentId),
              }))}
              rooms={rooms}
              term={{
                name: cls.term.name,
                startDate: cls.term.startDate.toISOString(),
                endDate: cls.term.endDate.toISOString(),
              }}
              students={students}
              settings={{
                openTime: settings?.openTime ?? "09:00",
                closeTime: settings?.closeTime ?? "21:00",
                closedDays: settings?.closedDays ?? [],
              }}
              class={{
                id: cls.id,
                title: cls.title,
                classType: cls.type,
                scheduleType: cls.scheduleType,
                instrumentId: cls.instrumentId,
                teacherId: cls.teacherId,
                roomId: cls.roomId,
                weekday: cls.weekday,
                startTime: cls.startTime,
                endTime: cls.endTime,
                notes: cls.notes,
                studentIds: [...activelyEnrolled],
              }}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

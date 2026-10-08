// صفحه جلسه — جزئیات + ویرایش/لغو تک‌جلسه (F4-AC7) + ثبت حضور و غیاب (F5)
// طبق وایرفریم: جلسه از تقویم/داشبورد قابل دسترسی است، نه از نوار کنار
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/form";
import { classTypeLabels, sessionStatusLabels, weekdayLabels } from "@/lib/constants";
import { formatJalali, todayUtcDate } from "@/lib/jalali";
import { getRooms } from "@/modules/room/services/room.service";
import { getTeachers } from "@/modules/teacher/services/teacher.service";
import { getSession } from "@/modules/class/services/class.service";
import { SessionCancelForm, SessionForm } from "@/modules/class/components/session-form";
import { MakeupSessionForm } from "@/modules/class/components/makeup-form";
import { JS_TO_WEEKDAY } from "@/modules/class/utils/weekly-sessions";
import { AttendanceCards } from "@/modules/attendance/components/attendance-cards";

export const dynamic = "force-dynamic";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const id = Number(sessionId);
  const session = await getSession(id).catch(() => null);
  if (!session) notFound();

  const [rooms, teachers] = await Promise.all([
    getRooms(),
    getTeachers(), // فعال — در فرم بر اساس ساز کلاس فیلتر می‌شوند
  ]);
  // فقط اساتید سازِ همین کلاس (F3-AC3)
  const classTeachers = teachers
    .filter((t) => t.instruments.some((ti) => ti.instrumentId === session.class.instrumentId))
    .map((t) => ({ id: t.id, fullName: t.fullName }));

  const weekday = weekdayLabels[JS_TO_WEEKDAY[session.date.getUTCDay()]];
  const isRecordable =
    session.status === "SCHEDULED" &&
    session.date.getTime() <= todayUtcDate().getTime(); // F5-AC2 + مصوب ایست ۲: امروز مجاز

  // کارت‌های حضور و غیاب فقط برای ثبت‌نام‌های فعال (F2-AC8)
  const activeStudents = session.class.enrollments.map((e) => ({
    id: e.studentId,
    fullName: e.student.fullName,
  }));
  const initialAttendance = Object.fromEntries(
    session.attendance
      .filter((a) => activeStudents.some((s) => s.id === a.studentId))
      .map((a) => [a.studentId, { status: a.status, note: a.note ?? undefined }]),
  );

  return (
    <>
      <PageHeader title={`${weekday} ${formatJalali(session.date)} — ${session.startTime} تا ${session.endTime}`}>
        {session.status === "CANCELLED" ? (
          <Badge variant="destructive">{sessionStatusLabels.CANCELLED}</Badge>
        ) : (
          <Badge>{sessionStatusLabels.SCHEDULED}</Badge>
        )}
        {session.isOverridden ? <Badge variant="outline">بازنویسی‌شده (F4-AC7)</Badge> : null}
        <Button asChild variant="ghost" size="sm">
          <Link href="/schedule">← تقویم هفتگی</Link>
        </Button>
      </PageHeader>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">جزئیات جلسه</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                کلاس:{" "}
                <Link href={`/classes/${session.class.id}`} className="font-bold hover:underline">
                  {session.class.title || session.class.instrument.name}
                </Link>{" "}
                ({classTypeLabels[session.class.type]})
              </p>
              <p>ساز: {session.class.instrument.name}</p>
              <p>استاد: {session.teacher.fullName}</p>
              <p>اتاق: {session.room.name}</p>
              <p>ترم: {session.class.term.name}</p>
              <p>
                هنرجویان:{" "}
                {activeStudents.length > 0
                  ? activeStudents.map((s) => s.fullName).join("، ")
                  : "—"}
              </p>
              {session.notes ? (
                <p className="text-muted-foreground">{session.notes}</p>
              ) : null}
            </CardContent>
          </Card>

          {session.status === "SCHEDULED" ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">لغو جلسه</CardTitle>
              </CardHeader>
              <CardContent>
                <SessionCancelForm sessionId={session.id} />
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  بند ۱۱: لغو توسط مدرس جزو ۱۰ جلسه محسوب نمی‌شود — پس از لغو، تاریخ جبرانی را انتخاب کنید.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardHeader>
                <CardTitle className="text-base">جلسه لغوشده — ایجاد جبرانی (بند ۱۱)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
                  این جلسه لغوشده جزو جلسات آموزشی محسوب نمی‌شود. تاریخ جبرانی را انتخاب کنید تا ۱۰ جلسه کامل بماند.
                </p>
                <MakeupSessionForm sessionId={session.id} />
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">ویرایش این جلسه (F4-AC7)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              تغییر این جلسه مستقل از بقیه سری است — بازتولیدهای بعدی به آن دست
              نمی‌زنند.
            </p>
            <SessionForm
              session={{
                id: session.id,
                date: formatJalali(session.date),
                startTime: session.startTime,
                endTime: session.endTime,
                roomId: session.roomId,
                teacherId: session.teacherId,
                notes: session.notes,
              }}
              rooms={rooms}
              teachers={classTeachers}
            />
          </CardContent>
        </Card>
      </div>

      {/* ── حضور و غیاب (F5) — تمام‌عرض زیر دو ستون ── */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">حضور و غیاب (F5)</CardTitle>
        </CardHeader>
        <CardContent>
          {isRecordable ? (
            activeStudents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                این کلاس هنرجوی ثبت‌نام‌شده‌ای ندارد.
              </p>
            ) : (
              <AttendanceCards
                sessionId={session.id}
                students={activeStudents}
                initial={initialAttendance}
              />
            )
          ) : session.status === "CANCELLED" ? (
            <p className="text-sm text-muted-foreground">
              جلسه لغوشده — قابل ثبت حضور و غیاب نیست.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              جلسات آینده قابل ثبت حضور و غیاب نیستند (F5-AC2) — از روز برگزاری
              قابل ثبت است.
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}

// تقویم هفتگی (F4-AC6) — ستون‌های روزهای هفته · فیلتر اتاق/استاد · ناوبری هفته
// جلسه لغوشده با خط‌خوردگی می‌ماند (U6) · کدگذاری نوع کلاس با رنگ (U4)
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/form";
import { classTypeLabels, sessionStatusLabels, weekdayLabels } from "@/lib/constants";
import { formatJalali } from "@/lib/jalali";
import { getRooms } from "@/modules/room/services/room.service";
import { getTeachers } from "@/modules/teacher/services/teacher.service";
import { getWeekSessions } from "@/modules/schedule/queries";
import {
  addDays,
  formatWeekRange,
  parseWeekParam,
  saturdayOf,
  toDateParam,
  weekDays,
} from "@/modules/schedule/utils/week";
import { WEEKDAY_ORDER } from "@/modules/class/utils/weekly-sessions";

export const dynamic = "force-dynamic";
export const metadata = { title: "تقویم هفتگی" };

const CLASS_TYPE_STYLES: Record<string, string> = {
  PRIVATE: "border-sky-500/50 bg-sky-500/10",
  GROUP: "border-emerald-500/50 bg-emerald-500/10",
  SEMI_GROUP: "border-violet-500/50 bg-violet-500/10",
  PRACTICE: "border-amber-500/50 bg-amber-500/10",
};

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; room?: string; teacher?: string }>;
}) {
  const { week, room, teacher } = await searchParams;

  const saturday = saturdayOf(parseWeekParam(week));
  const days = weekDays(saturday);
  const weekEnd = days[6];
  const roomId = room && Number.isInteger(Number(room)) ? Number(room) : undefined;
  const teacherId =
    teacher && Number.isInteger(Number(teacher)) ? Number(teacher) : undefined;

  const [sessions, rooms, teachers] = await Promise.all([
    getWeekSessions(saturday, weekEnd, { roomId, teacherId }),
    getRooms(),
    getTeachers(),
  ]);

  // گروه‌بندی جلسات بر اساس روز هفته
  const byDay = new Map<string, typeof sessions>();
  for (const s of sessions) {
    const key = s.date.toISOString().slice(0, 10);
    const list = byDay.get(key) ?? [];
    list.push(s);
    byDay.set(key, list);
  }

  // لینک‌های ناوبری — فیلترها حفظ می‌شوند
  const filtersQuery = (w: string) => {
    const p = new URLSearchParams({ week: w });
    if (roomId) p.set("room", String(roomId));
    if (teacherId) p.set("teacher", String(teacherId));
    return `/schedule?${p.toString()}`;
  };

  return (
    <>
      <PageHeader title="تقویم هفتگی">
        <Badge variant="outline">F4-AC6</Badge>
        <div className="flex items-center gap-1">
          <Button asChild variant="outline" size="sm">
            <Link href={filtersQuery(toDateParam(addDays(saturday, -7)))}>› هفته قبل</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href={`/schedule${roomId ? `?room=${roomId}` : ""}`}>این هفته</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={filtersQuery(toDateParam(addDays(saturday, 7)))}>هفته بعد ‹</Link>
          </Button>
        </div>
      </PageHeader>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-bold">{formatWeekRange(saturday)}</p>
            {/* فیلتر GET — با URL قابل اشتراک‌گذاری */}
            <form action="/schedule" className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="week" value={toDateParam(saturday)} />
              <select
                name="room"
                defaultValue={roomId ? String(roomId) : ""}
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                aria-label="فیلتر اتاق"
              >
                <option value="">همه اتاق‌ها</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <select
                name="teacher"
                defaultValue={teacherId ? String(teacherId) : ""}
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                aria-label="فیلتر استاد"
              >
                <option value="">همه اساتید</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName}
                  </option>
                ))}
              </select>
              <Button type="submit" variant="outline" size="sm">
                اعمال فیلتر
              </Button>
            </form>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {days.map((d, i) => {
              const key = d.toISOString().slice(0, 10);
              const daySessions = byDay.get(key) ?? [];
              const j = formatJalali(d); // برای شماره روز
              return (
                <div key={key} className="min-w-0 rounded-lg border p-2">
                  <div className="mb-2 flex items-baseline justify-between border-b pb-1.5">
                    <span className="text-sm font-bold">{weekdayLabels[WEEKDAY_ORDER[i]]}</span>
                    <span className="text-xs text-muted-foreground">
                      {j.split("/")[2]}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {daySessions.length === 0 ? (
                      <p className="py-2 text-center text-xs text-muted-foreground">—</p>
                    ) : (
                      daySessions.map((s) => (
                        <Link
                          key={s.id}
                          href={`/sessions/${s.id}`}
                          className={`block rounded-md border px-2 py-1.5 text-xs ${CLASS_TYPE_STYLES[s.class.type] ?? ""} ${
                            s.status === "CANCELLED" ? "opacity-60" : ""
                          }`}
                        >
                          <span dir="ltr" className="block text-center font-bold">
                            {s.startTime}
                          </span>
                          <span className={`block truncate text-center ${s.status === "CANCELLED" ? "line-through" : ""}`}>
                            {s.class.title || s.class.instrument.name}
                          </span>
                          <span className="block truncate text-center text-muted-foreground">
                            {s.teacher.fullName} · {s.room.name}
                          </span>
                          {s.status === "CANCELLED" ? (
                            <span className="block text-center text-destructive">
                              {sessionStatusLabels.CANCELLED}
                            </span>
                          ) : null}
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {(Object.keys(classTypeLabels) as (keyof typeof classTypeLabels)[]).map((t) => (
              <span key={t} className="flex items-center gap-1">
                <span
                  className={`inline-block size-2.5 rounded-sm border ${CLASS_TYPE_STYLES[t]}`}
                />
                {classTypeLabels[t]}
              </span>
            ))}
            <span>— کلیک روی جلسه: جزئیات + ویرایش/لغو (F4-AC7)</span>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

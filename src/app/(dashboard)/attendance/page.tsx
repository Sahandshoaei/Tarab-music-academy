// مرورگر حضور و غیاب (F5-AC3) — فهرست جلسات با وضعیت ثبت · فیلتر کلاس/بازه/ثبت‌نشده
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/form";
import { formatJalali, todayTehranDate } from "@/lib/jalali";
import { toPersianDigits } from "@/validations/validators";
import { parseJalaliDate } from "@/lib/jalali";
import { weekdayLabels } from "@/lib/constants";
import { JS_TO_WEEKDAY } from "@/modules/class/utils/weekly-sessions";
import {
  listAttendanceSessions,
  listClassesForFilter,
} from "@/modules/attendance/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "حضور و غیاب" };

const selectCls =
  "h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{
    class?: string;
    from?: string;
    to?: string;
    pending?: string;
  }>;
}) {
  const { class: classParam, from, to, pending } = await searchParams;
  const classId =
    classParam && Number.isInteger(Number(classParam)) ? Number(classParam) : undefined;
  const fromDate = from ? (parseJalaliDate(from) ?? undefined) : undefined;
  const toDate = to ? (parseJalaliDate(to) ?? undefined) : undefined;
  const pendingOnly = pending === "1";

  const [sessions, classes] = await Promise.all([
    listAttendanceSessions({ classId, from: fromDate, to: toDate, pendingOnly }),
    listClassesForFilter(),
  ]);
  const today = todayTehranDate();

  return (
    <>
      <PageHeader title="حضور و غیاب">
        <Badge variant="outline">F5</Badge>
      </PageHeader>

      <Card>
        <CardContent className="space-y-3">
          {/* فیلتر GET — با URL قابل اشتراک‌گذاری */}
          <form action="/attendance" className="flex flex-wrap items-center gap-2">
            <select name="class" defaultValue={classId ? String(classId) : ""} className={selectCls} aria-label="فیلتر کلاس">
              <option value="">همه کلاس‌ها</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title || c.instrument.name}
                  {c.isActive ? "" : " (لغوشده)"}
                </option>
              ))}
            </select>
            <Input name="from" defaultValue={from ?? ""} placeholder="از تاریخ — ۱۴۰۵/۰۶/۰۱" dir="ltr" className="w-40 text-right" />
            <Input name="to" defaultValue={to ?? ""} placeholder="تا تاریخ — ۱۴۰۵/۰۶/۳۱" dir="ltr" className="w-40 text-right" />
            <select name="pending" defaultValue={pendingOnly ? "1" : ""} className={selectCls} aria-label="وضعیت ثبت">
              <option value="">همه جلسات</option>
              <option value="1">فقط ثبت‌نشده‌ها</option>
            </select>
            <Button type="submit" variant="outline" size="sm">
              اعمال فیلتر
            </Button>
          </form>

          <p className="text-sm text-muted-foreground">{toPersianDigits(String(sessions.length))} جلسه (حداکثر ۲۰۰)</p>

          {sessions.length === 0 ? (
            <div className="rounded-lg border border-dashed py-10 text-center">
              <p className="text-sm text-muted-foreground">جلسه‌ای با این فیلترها یافت نشد — فیلتر را عوض کنید یا بازه دیگری بزنید.</p>
              <p className="mt-1 text-xs text-muted-foreground">نکته: «ثبت‌نشده» فقط جلسات گذشتهٔ بدون حضور است (۳.۴ — Empty State یکدست با بدهکاران)</p>
            </div>
          ) : (
            sessions.map((s) => {
              const isFuture = s.date.getTime() > today.getTime();
              const label = s.class.title || s.class.instrument.name;
              return (
                <Link
                  key={s.id}
                  href={`/sessions/${s.id}`}
                  className={`flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2.5 text-sm hover:bg-muted/50 ${
                    s.status === "CANCELLED" ? "opacity-60" : ""
                  }`}
                >
                  <span className="min-w-28">
                    {weekdayLabels[JS_TO_WEEKDAY[s.date.getUTCDay()]]}{" "}
                    {formatJalali(s.date)}
                  </span>
                  <span dir="ltr" className="text-xs text-muted-foreground">
                    {s.startTime}–{s.endTime}
                  </span>
                  <span className="font-bold">{label}</span>
                  <span className="text-xs text-muted-foreground">{s.class.teacher.fullName}</span>
                  <span className="text-xs text-muted-foreground">{s.room.name}</span>
                  <span className="ms-auto">
                    {s.status === "CANCELLED" ? (
                      <Badge variant="outline">لغوشده</Badge>
                    ) : isFuture ? (
                      <Badge variant="secondary">آینده</Badge>
                    ) : s._count.attendance === 0 ? (
                      <Badge variant="destructive">ثبت‌نشده</Badge>
                    ) : (
                      <Badge>
                        {toPersianDigits(`${s._count.attendance}/${s.class._count.enrollments}`)} ثبت‌شده
                      </Badge>
                    )}
                  </span>
                </Link>
              );
            })
          )}
          <p className="text-xs text-muted-foreground">
            فهرست به‌صورت پیش‌فرض بر اساس نزدیک‌ترین به امروز مرتب شده —
            «ثبت‌نشده» یعنی هنوز هیچ رکوردی برای آن جلسه ثبت نشده (F5-AC4) —
            کلیک کنید تا ثبت کنید.
          </p>
        </CardContent>
      </Card>
    </>
  );
}

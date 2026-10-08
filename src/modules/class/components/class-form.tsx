"use client";

// فرم کلاس (ثبت/ویرایش) — F4-AC1..AC5 · سوییچ الگو · فیلتر استاد بر اساس ساز
// (F3-AC3) · پیش‌نمایش جلسات قبل از ثبت (U3)
import { useActionState, useState } from "react";
import type { ClassType, ScheduleType, Weekday } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage, SubmitButton } from "@/components/shared/form";
import { classTypeLabels, scheduleTypeLabels, weekdayLabels } from "@/lib/constants";
import { formatJalali, todayUtcDate } from "@/lib/jalali";
import { parseJalaliDate } from "@/lib/jalali";
import { parseTime } from "@/lib/time";
import { createClassAction, updateClassAction } from "../actions/class.actions";
import {
  WEEKDAY_ORDER,
  WEEKDAY_TO_JS,
} from "../utils/weekly-sessions";

const selectCls =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs";

export interface ClassFormProps {
  instruments: { id: number; name: string }[];
  teachers: { id: number; fullName: string; instrumentIds: number[] }[];
  rooms: { id: number; name: string }[];
  term: { name: string; startDate: string; endDate: string }; // ISO
  students: { id: number; fullName: string }[];
  settings: { openTime: string; closeTime: string; closedDays: string[] };
  class?: {
    id: number;
    title: string | null;
    classType: ClassType;
    scheduleType: ScheduleType;
    instrumentId: number;
    teacherId: number;
    roomId: number;
    weekday: Weekday | null;
    startTime: string | null;
    endTime: string | null;
    notes: string | null;
    studentIds: number[];
  };
}

export function ClassForm(props: ClassFormProps) {
  const { class: cls } = props;
  const action = cls ? updateClassAction : createClassAction;
  const [state, formAction] = useActionState(action, {});

  const [scheduleType, setScheduleType] = useState<ScheduleType>(
    cls?.scheduleType ?? "WEEKLY",
  );
  const [classType, setClassType] = useState<ClassType>(cls?.classType ?? "PRIVATE");
  const [instrumentId, setInstrumentId] = useState(String(cls?.instrumentId ?? ""));
  const [weekday, setWeekday] = useState<Weekday | "">(cls?.weekday ?? "");
  const [singleDate, setSingleDate] = useState("");
  const [startTime, setStartTime] = useState(cls?.startTime ?? "");
  const [endTime, setEndTime] = useState(cls?.endTime ?? "");
  const [selectedStudents, setSelectedStudents] = useState<number[]>(
    cls?.studentIds ?? [],
  );

  // F3-AC3 — فقط اساتید همان ساز (تغییر ساز، گزینه‌های استاد را عوض می‌کند)
  const teachers = props.teachers.filter(
    (t) => instrumentId === "" || t.instrumentIds.includes(Number(instrumentId)),
  );

  // تعداد جلسات — مصوب ۱۴۰۴/۰۷/۰۸: خصوصی ۱۰، گروهی ۱۰، نیمه‌گروهی ۱۰، تمرینی ۸
  function requiredCount(type: ClassType): number {
    if (type === "PRACTICE") return 8;
    return 10;
  }
  function genPreview(): Date[] | null {
    if (scheduleType === "SINGLE") {
      if (!singleDate || !parseJalaliDate(singleDate) || !parseTime(startTime) || !parseTime(endTime) || parseTime(startTime)! >= parseTime(endTime)!) return null;
      const d = parseJalaliDate(singleDate);
      return d ? [d] : null;
    }
    if (scheduleType !== "WEEKLY" || !weekday || !parseTime(startTime) || !parseTime(endTime) || parseTime(startTime)! >= parseTime(endTime)!) return null;
    const termStart = new Date(props.term.startDate);
    const termEnd = new Date(props.term.endDate);
    const today = todayUtcDate();
    const required = requiredCount(classType);
    const weekdays: Weekday[] = [weekday as Weekday];
    const jsDays = new Set(weekdays.map((w) => WEEKDAY_TO_JS[w]));
    const start = termStart.getTime() > today.getTime() ? termStart : today;
    const dates: Date[] = [];
    for (let t = new Date(start.getTime()); t.getTime() <= termEnd.getTime() && dates.length < required; t = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate() + 1))) {
      if (jsDays.has(t.getUTCDay())) dates.push(new Date(t.getTime()));
    }
    return dates;
  }
  const preview = genPreview();
  const requiredPreview = (() => {
    try { return requiredCount(classType); } catch { return 10; }
  })();

  const closedDays = props.settings.closedDays as Weekday[];
  // ظرفیت MVP-1: خصوصی دقیقاً ۱ (مصوب ایست ۲)
  const capacityReached = classType === "PRIVATE" && selectedStudents.length >= 1;

  function toggleStudent(id: number, checked: boolean) {
    setSelectedStudents((prev) =>
      checked ? [...prev, id] : prev.filter((s) => s !== id),
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {cls ? <input type="hidden" name="classId" value={cls.id} /> : null}
      {/* الگو در ویرایش ثابت است — سرویس تغییرش را رد می‌کند */}
      <input type="hidden" name="scheduleType" value={scheduleType} />

      <div className="space-y-2">
        <Label>الگوی زمان‌بندی *</Label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(scheduleTypeLabels) as ScheduleType[]).map((st) => (
            <button
              key={st}
              type="button"
              disabled={!!cls}
              onClick={() => setScheduleType(st)}
              className={`rounded-md border px-3 py-1.5 text-sm ${
                scheduleType === st ? "border-primary bg-primary/10 font-bold" : ""
              } ${cls ? "cursor-not-allowed opacity-70" : ""}`}
            >
              {scheduleTypeLabels[st]}
            </button>
          ))}
        </div>
        {scheduleType === "AD_HOC" ? (
          <p className="text-xs text-muted-foreground">
            جلسات بعد از ایجاد کلاس، از صفحه کلاس یکی‌یکی اضافه می‌شوند (F4-AC2).
          </p>
        ) : scheduleType === "SINGLE" ? (
          <p className="text-xs text-muted-foreground">
            تک‌جلسه: دقیقاً یک جلسه در تاریخ دلخواه شما ساخته می‌شود (برای هنرجویی که فقط یک جلسه می‌خواهد).
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="c-title">برچسب کلاس (اختیاری)</Label>
        <Input
          id="c-title"
          name="title"
          defaultValue={cls?.title ?? ""}
          placeholder="مثلاً: گیتار مقدماتی"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="c-type">نوع کلاس *</Label>
          <select
            id="c-type"
            name="classType"
            value={classType}
            onChange={(e) => setClassType(e.target.value as ClassType)}
            className={selectCls}
          >
            {(Object.keys(classTypeLabels) as ClassType[]).map((t) => (
              <option key={t} value={t}>
                {classTypeLabels[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="c-instrument">ساز *</Label>
          <select
            id="c-instrument"
            name="instrumentId"
            value={instrumentId}
            onChange={(e) => setInstrumentId(e.target.value)}
            className={selectCls}
          >
            <option value="">— انتخاب کنید —</option>
            {props.instruments.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="c-teacher">استاد * (فقط اساتید همین ساز — F3-AC3)</Label>
          <select
            id="c-teacher"
            name="teacherId"
            defaultValue={cls ? String(cls.teacherId) : ""}
            key={instrumentId} /* با تغییر ساز، گزینه‌ها عوض می‌شوند */
            className={selectCls}
          >
            <option value="">— انتخاب کنید —</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.fullName}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="c-room">اتاق *</Label>
          <select
            id="c-room"
            name="roomId"
            defaultValue={cls ? String(cls.roomId) : ""}
            className={selectCls}
          >
            <option value="">— انتخاب کنید —</option>
            {props.rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {scheduleType === "WEEKLY" ? (
        <div className="space-y-3 rounded-md border p-3">
          <div className="space-y-2">
            <Label>روز هفته * (تعطیل آموزشگاه: {closedDays.map((d) => weekdayLabels[d]).join("، ") || "—"})</Label>
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAY_ORDER.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setWeekday(d)}
                  className={`rounded-md border px-2.5 py-1 text-sm ${
                    weekday === d ? "border-primary bg-primary/10 font-bold" : ""
                  }`}
                >
                  {weekdayLabels[d]}
                  {closedDays.includes(d) ? (
                    <span className="ms-1 text-xs text-destructive">(تعطیل)</span>
                  ) : null}
                </button>
              ))}
            </div>
            <input type="hidden" name="weekday" value={weekday} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="c-start">ساعت شروع *</Label>
              <Input
                id="c-start"
                name="startTime"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="۱۶:۰۰"
                dir="ltr"
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-end">ساعت پایان *</Label>
              <Input
                id="c-end"
                name="endTime"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="۱۷:۰۰"
                dir="ltr"
                className="text-right"
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            بازه کاری آموزشگاه: {props.settings.openTime} تا {props.settings.closeTime} ·
            ترم: {props.term.name} — جلسات تا پایان همین ترم تولید می‌شوند (F0-AC3).
          </p>

          {preview ? (
            preview.length > 0 ? (
              preview.length === requiredPreview ? (
                <p className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700">
                  ✓ {preview.length} جلسه ساخته می‌شود ({classType === "PRACTICE" ? "تمرینی ۸ جلسه" : `${classTypeLabels[classType]} ${requiredPreview} جلسه`}) · {weekday ? weekdayLabels[weekday as Weekday] : ""} {formatJalali(preview[0])} · آخرین: {formatJalali(preview[preview.length - 1])}
                </p>
              ) : (
                <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
                  ⚠️ {preview.length} جلسه در ترم می‌گنجد ولی {requiredPreview} جلسه لازم است — بازه ترم را طولانی‌تر کنید یا روز دیگری انتخاب کنید.
                </p>
              )
            ) : (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                در بازه باقی‌مانده ترم، جلسه‌ای روی این روز نمی‌افتد.
              </p>
            )
          ) : null}
        </div>
      ) : null}

      {scheduleType === "SINGLE" ? (
        <div className="space-y-3 rounded-md border p-3">
          <div className="space-y-2">
            <Label htmlFor="c-single-date">تاریخ جلسه * (شمسی — مثل ۱۴۰۴/۱۰/۱۲)</Label>
            <Input
              id="c-single-date"
              name="singleDate"
              value={singleDate}
              onChange={(e) => setSingleDate(e.target.value)}
              placeholder="۱۴۰۴/۱۰/۱۲"
              dir="ltr"
              className="text-right"
            />
            <p className="text-xs text-muted-foreground">
              ترم: {props.term.name} · تاریخ باید داخل همین ترم و روز باز آموزشگاه باشد.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="c-start-single">ساعت شروع *</Label>
              <Input
                id="c-start-single"
                name="startTime"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="۱۶:۰۰"
                dir="ltr"
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-end-single">ساعت پایان *</Label>
              <Input
                id="c-end-single"
                name="endTime"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="۱۷:۰۰"
                dir="ltr"
                className="text-right"
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            بازه کاری آموزشگاه: {props.settings.openTime} تا {props.settings.closeTime}
          </p>

          {preview && preview.length === 1 ? (
            <p className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700">
              ✓ ۱ جلسه در {formatJalali(preview[0])} — {startTime} تا {endTime} ساخته می‌شود.
            </p>
          ) : singleDate && parseJalaliDate(singleDate) ? (
            <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
              تاریخ و ساعت را کامل کنید.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-2">
        <Label>
          هنرجویان *{" "}
          {classType === "PRIVATE"
            ? "— کلاس خصوصی: دقیقاً یک هنرجو"
            : "— حداقل یک هنرجو"}
        </Label>
        <div className="max-h-44 space-y-1.5 overflow-y-auto rounded-md border p-3">
          {props.students.map((s) => {
            const checked = selectedStudents.includes(s.id);
            return (
              <label
                key={s.id}
                className={`flex items-center gap-2 text-sm ${
                  capacityReached && !checked ? "opacity-50" : ""
                }`}
              >
                <input
                  type="checkbox"
                  name="studentIds"
                  value={s.id}
                  checked={checked}
                  disabled={capacityReached && !checked}
                  onChange={(e) => toggleStudent(s.id, e.target.checked)}
                  className="size-4 accent-primary"
                />
                {s.fullName}
              </label>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="c-notes">یادداشت (اختیاری)</Label>
        <Input id="c-notes" name="notes" defaultValue={cls?.notes ?? ""} />
      </div>

      <FormMessage
        error={state.error}
        success={state.success}
        successText={cls ? "تغییرات ذخیره شد ✓" : "کلاس ثبت شد ✓"}
      />
      <SubmitButton className="w-full">
        {cls ? "ذخیره تغییرات" : "ثبت کلاس"}
      </SubmitButton>
    </form>
  );
}

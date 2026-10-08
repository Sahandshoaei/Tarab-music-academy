"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatJalali, todayUtcDate } from "@/lib/jalali";
import { classTypeLabels, weekdayLabels } from "@/lib/constants";
import { toPersianDigits } from "@/validations/validators";
import type { StudentClassAttendance } from "@/modules/attendance/queries";

function typeBadgeClass(type: string) {
  switch (type) {
    case "PRIVATE":
      return "bg-sky-500/15 text-sky-700 border-sky-500/30";
    case "GROUP":
      return "bg-violet-500/15 text-violet-700 border-violet-500/30";
    case "SEMI_GROUP":
      return "bg-amber-500/15 text-amber-700 border-amber-500/30";
    case "PRACTICE":
      return "bg-emerald-500/15 text-emerald-700 border-emerald-500/30";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function TypeBadge({ type }: { type: string }) {
  const label = classTypeLabels[type as keyof typeof classTypeLabels] ?? type;
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${typeBadgeClass(type)}`}>{label}</span>;
}

export function StudentTermClassesButton({ classes }: { classes: StudentClassAttendance[] }) {
  const [open, setOpen] = useState(false);
  const today = todayUtcDate();
  const fa = (n: number) => toPersianDigits(String(n));

  if (classes.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-4 text-center text-sm text-muted-foreground">هنوز در هیچ کلاسی ثبت‌نام نشده.</CardContent>
      </Card>
    );
  }

  // گروه‌بندی بر اساس ترم برای نمایش واضح‌تر
  const byTerm = classes.reduce<Record<string, StudentClassAttendance[]>>((acc, c) => {
    (acc[c.term] ??= []).push(c);
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)} className="w-full sm:w-auto">
        {open ? "بستن جدول" : `مشاهده جدول کامل کلاس‌های ترم (${fa(classes.length)} کلاس)`}
      </Button>

      {open ? (
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/30 py-3">
            <CardTitle className="text-sm font-bold">جدول کلاس‌های ترم — جزئیات کامل + حضور و غیاب</CardTitle>
            <p className="text-xs text-muted-foreground">۴ نوع کلاس (خصوصی/گروهی/نیمه‌گروهی/تمرینی) + وضعیت حضور هر کلاس</p>
          </CardHeader>
          <CardContent className="p-0">
            {/* دسکتاپ: جدول */}
            <div className="hidden overflow-auto lg:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/20 text-xs text-muted-foreground">
                    <th className="whitespace-nowrap p-3 text-right font-medium">کلاس</th>
                    <th className="whitespace-nowrap p-3 text-right font-medium">نوع</th>
                    <th className="whitespace-nowrap p-3 text-right font-medium">ساز</th>
                    <th className="whitespace-nowrap p-3 text-right font-medium">استاد</th>
                    <th className="whitespace-nowrap p-3 text-right font-medium">ترم</th>
                    <th className="whitespace-nowrap p-3 text-right font-medium">زمان</th>
                    <th className="whitespace-nowrap p-3 text-center font-medium">وضعیت</th>
                    <th className="whitespace-nowrap p-3 text-center font-medium">جلسات</th>
                    <th className="whitespace-nowrap p-3 text-center font-medium">حضور و غیاب</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {classes.map((c) => (
                    <tr key={c.classId} className={`hover:bg-muted/20 ${!c.isActive ? "opacity-60" : ""}`}>
                      <td className="p-3">
                        <Link href={`/classes/${c.classId}`} className="font-medium hover:text-primary hover:underline">
                          {c.title}
                        </Link>
                        {c.hasThreeConsecutiveAbsences ? (
                          <span className="mr-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-700">⚠️ ۳ غیبت</span>
                        ) : null}
                        <div className="mt-1 flex flex-wrap gap-1 lg:hidden">
                          <TypeBadge type={c.type} />
                        </div>
                      </td>
                      <td className="p-3">
                        <TypeBadge type={c.type} />
                      </td>
                      <td className="p-3 whitespace-nowrap">{c.instrument}</td>
                      <td className="p-3 whitespace-nowrap">{c.teacher}</td>
                      <td className="p-3 whitespace-nowrap text-xs">{c.term}</td>
                      <td className="p-3 whitespace-nowrap text-xs">
                        {c.scheduleType === "WEEKLY" && c.weekday ? (
                          <>
                            {weekdayLabels[c.weekday as keyof typeof weekdayLabels]} {c.startTime}–{c.endTime}
                            <span className="mr-1 text-muted-foreground">· {c.room}</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">جلسه‌به‌جلسه · {c.room}</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {c.isActive ? (
                          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-700">فعال</span>
                        ) : (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">غیرفعال</span>
                        )}
                      </td>
                      <td className="p-3 text-center text-xs tabular-nums">
                        <span className="font-medium">{fa(c.pastCount)}</span> <span className="text-muted-foreground">گذشته</span> · {fa(c.remainingCount)} باقی
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap justify-center gap-1 text-[11px]">
                          <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-emerald-700">حاضر {fa(c.counts.PRESENT)}</span>
                          <span className="rounded-full border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-destructive">غایب {fa(c.counts.ABSENT)}</span>
                          <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-amber-700">موجه {fa(c.counts.EXCUSED)}</span>
                          {c.unrecordedCount > 0 ? <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">ثبت‌نشده {fa(c.unrecordedCount)}</span> : null}
                        </div>
                        {c.recent.length > 0 ? (
                          <div className="mt-1.5 flex flex-wrap justify-center gap-1">
                            {c.recent.map((r) => {
                              const chip = recentChip(r, today);
                              return (
                                <Link key={r.id} href={`/sessions/${r.id}`} className={`rounded-full border px-2 py-0.5 text-[10px] ${chip.cls}`}>
                                  {formatJalali(r.date)} {chip.label}
                                </Link>
                              );
                            })}
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* موبایل: کارت‌های عمودی */}
            <div className="space-y-3 p-3 lg:hidden">
              {classes.map((c) => (
                <div key={c.classId} className={`rounded-xl border p-3 ${!c.isActive ? "bg-muted/20 opacity-70" : "bg-card"}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/classes/${c.classId}`} className="font-bold hover:text-primary hover:underline">
                      {c.title}
                    </Link>
                    <TypeBadge type={c.type} />
                    {c.hasThreeConsecutiveAbsences ? <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-700">⚠️ ۳ غیبت</span> : null}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {c.instrument} · {c.teacher} · {c.term}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {c.scheduleType === "WEEKLY" && c.weekday ? `${weekdayLabels[c.weekday as keyof typeof weekdayLabels]} ${c.startTime}–${c.endTime} · ${c.room}` : `جلسه‌به‌جلسه · ${c.room}`}
                    {" · "}
                    {c.isActive ? <span className="text-emerald-700">فعال</span> : <span>غیرفعال</span>}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                    <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-emerald-700">حاضر {fa(c.counts.PRESENT)}</span>
                    <span className="rounded-full border border-destructive/40 bg-destructive/10 px-2 py-1 text-destructive">غایب {fa(c.counts.ABSENT)}</span>
                    <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-amber-700">موجه {fa(c.counts.EXCUSED)}</span>
                    {c.unrecordedCount > 0 ? <span className="rounded-full bg-muted px-2 py-1 text-muted-foreground">ثبت‌نشده {fa(c.unrecordedCount)}</span> : null}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">گذشته {fa(c.pastCount)} · باقی {fa(c.remainingCount)}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {c.recent.map((r) => {
                      const chip = recentChip(r, today);
                      return (
                        <Link key={r.id} href={`/sessions/${r.id}`} className={`rounded-full border px-2 py-1 text-xs ${chip.cls}`}>
                          {formatJalali(r.date)} {chip.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* خلاصه ترمی */}
            <div className="border-t bg-muted/10 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">خلاصه ترمی:</p>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                {Object.entries(byTerm).map(([term, list]) => (
                  <span key={term}>
                    {term}: {fa(list.length)} کلاس · {fa(list.reduce((s, x) => s + x.pastCount, 0))} جلسه گذشته
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function recentChip(r: { date: Date; status: string; attendance: string | null }, today: Date) {
  if (r.status === "CANCELLED") return { label: "لغو", cls: "border-border text-muted-foreground line-through" };
  if (r.date.getTime() >= today.getTime()) return { label: "آینده", cls: "border-border text-muted-foreground" };
  switch (r.attendance) {
    case "PRESENT":
      return { label: "حاضر", cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700" };
    case "ABSENT":
      return { label: "غایب", cls: "border-destructive/40 bg-destructive/10 text-destructive" };
    case "EXCUSED":
      return { label: "موجه", cls: "border-amber-500/40 bg-amber-500/10 text-amber-700" };
    default:
      return { label: "ثبت‌نشده", cls: "border-dashed text-muted-foreground" };
  }
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { classTypeLabels, weekdayLabels } from "@/lib/constants";
import { toPersianDigits } from "@/validations/validators";
import type { TeacherClassProfile } from "../services/teacher.service";

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

export function TeacherTermClassesButton({ classes }: { classes: TeacherClassProfile[] }) {
  const [open, setOpen] = useState(false);
  const fa = (n: number) => toPersianDigits(String(n));

  if (classes.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-4 text-center text-sm text-muted-foreground">هنوز کلاسی برای این استاد ثبت نشده.</CardContent>
      </Card>
    );
  }

  const byTerm = classes.reduce<Record<string, TeacherClassProfile[]>>((acc, c) => {
    (acc[c.term] ??= []).push(c);
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)} className="w-full sm:w-auto">
        {open ? "بستن جدول" : `مشاهده جدول کامل کلاس‌های استاد (${fa(classes.length)} کلاس)`}
      </Button>

      {open ? (
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/30 py-3">
            <CardTitle className="text-sm font-bold">جدول برنامه کلاس‌های استاد — جزئیات کامل</CardTitle>
            <p className="text-xs text-muted-foreground">۴ نوع کلاس (خصوصی/گروهی/نیمه‌گروهی/تمرینی) + اتاق و زمان + هنرجویان + جلسات</p>
          </CardHeader>
          <CardContent className="p-0">
            {/* دسکتاپ */}
            <div className="hidden overflow-auto lg:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/20 text-xs text-muted-foreground">
                    <th className="whitespace-nowrap p-3 text-right font-medium">کلاس</th>
                    <th className="whitespace-nowrap p-3 text-right font-medium">نوع</th>
                    <th className="whitespace-nowrap p-3 text-right font-medium">ساز</th>
                    <th className="whitespace-nowrap p-3 text-right font-medium">ترم</th>
                    <th className="whitespace-nowrap p-3 text-right font-medium">زمان</th>
                    <th className="whitespace-nowrap p-3 text-center font-medium">وضعیت</th>
                    <th className="whitespace-nowrap p-3 text-center font-medium">هنرجویان</th>
                    <th className="whitespace-nowrap p-3 text-center font-medium">جلسات</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {classes.map((c) => (
                    <tr key={c.classId} className={`hover:bg-muted/20 ${!c.isActive ? "opacity-60" : ""}`}>
                      <td className="p-3">
                        <Link href={`/classes/${c.classId}`} className="font-medium hover:text-primary hover:underline">
                          {c.title}
                        </Link>
                      </td>
                      <td className="p-3">
                        <TypeBadge type={c.type} />
                      </td>
                      <td className="p-3 whitespace-nowrap">{c.instrument}</td>
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
                      <td className="p-3 text-center tabular-nums">{fa(c.studentCount)} نفر</td>
                      <td className="p-3 text-center text-xs tabular-nums">
                        <span className="font-medium">{fa(c.pastCount)}</span> <span className="text-muted-foreground">گذشته</span> · {fa(c.remainingCount)} باقی · {fa(c.totalSessions)} کل
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* موبایل */}
            <div className="space-y-3 p-3 lg:hidden">
              {classes.map((c) => (
                <div key={c.classId} className={`rounded-xl border p-3 ${!c.isActive ? "bg-muted/20 opacity-70" : "bg-card"}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/classes/${c.classId}`} className="font-bold hover:text-primary hover:underline">
                      {c.title}
                    </Link>
                    <TypeBadge type={c.type} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {c.instrument} · {c.term}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {c.scheduleType === "WEEKLY" && c.weekday ? `${weekdayLabels[c.weekday as keyof typeof weekdayLabels]} ${c.startTime}–${c.endTime} · ${c.room}` : `جلسه‌به‌جلسه · ${c.room}`}
                    {" · "}
                    {c.isActive ? <span className="text-emerald-700">فعال</span> : <span>غیرفعال</span>}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-muted px-2 py-1">هنرجویان {fa(c.studentCount)}</span>
                    <span className="rounded-full border px-2 py-1 text-muted-foreground">
                      گذشته {fa(c.pastCount)} · باقی {fa(c.remainingCount)} · کل {fa(c.totalSessions)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t bg-muted/10 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">خلاصه ترمی:</p>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                {Object.entries(byTerm).map(([term, list]) => (
                  <span key={term}>
                    {term}: {fa(list.length)} کلاس · {fa(list.reduce((s, x) => s + x.studentCount, 0))} هنرجو
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

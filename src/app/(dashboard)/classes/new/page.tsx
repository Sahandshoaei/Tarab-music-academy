// ثبت کلاس جدید (F4-AC1..AC5)
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/form";
import { prisma } from "@/lib/prisma";
import { ClassForm } from "@/modules/class/components/class-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "کلاس جدید" };

export default async function NewClassPage() {
  // کلاس فقط در ترم فعال ساخته می‌شود (§۶.4-4)
  const [term, instruments, rooms, teachers, students, settings] = await Promise.all([
    prisma.term.findFirst({ where: { isActive: true } }),
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
      where: { isActive: true }, // F2-AC8
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true },
    }),
    prisma.schoolSettings.findUnique({ where: { id: 1 } }),
  ]);

  if (!term) {
    return (
      <>
        <PageHeader title="ثبت کلاس جدید" />
        <Card className="max-w-lg">
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              کلاس فقط در ترم فعال ساخته می‌شود (§۶.4-4) — ترم فعالی وجود ندارد.
            </p>
            <Button asChild size="sm">
              <Link href="/terms">مدیریت ترم‌ها</Link>
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title="ثبت کلاس جدید" />
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">مشخصات کلاس</CardTitle>
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
              name: term.name,
              startDate: term.startDate.toISOString(),
              endDate: term.endDate.toISOString(),
            }}
            students={students}
            settings={{
              openTime: settings?.openTime ?? "09:00",
              closeTime: settings?.closeTime ?? "21:00",
              closedDays: settings?.closedDays ?? [],
            }}
          />
        </CardContent>
      </Card>
    </>
  );
}

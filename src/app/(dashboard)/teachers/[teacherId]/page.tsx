// پروفایل استاد — گرید مرتب (3.2 + 4.4)
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActiveBadge, PageHeader } from "@/components/shared/form";
import { prisma } from "@/lib/prisma";
import { formatJalali } from "@/lib/jalali";
import { toPersianDigits } from "@/validations/validators";
import { calcAge } from "@/lib/age";
import { getTeacher, getTeacherClassesProfile } from "@/modules/teacher/services/teacher.service";
import { TeacherTermClassesButton } from "@/modules/teacher/components/teacher-term-classes-table";
import { listReceiptsByTeacherId } from "@/modules/teacher/repositories/teacher-receipt.repository";
import { TeacherReceiptsCard } from "@/modules/teacher/components/teacher-receipts-card";
import { toggleTeacherActiveAction } from "@/modules/teacher/actions/teacher.actions";
import { TeacherForm } from "@/modules/teacher/components/teacher-form";

export const dynamic = "force-dynamic";

const insuranceLabels: Record<string, string> = {
  TAMIN_EJTEMAEI: "تامین اجتماعی",
  SALAMAT: "سلامت",
  OTHER: "سایر",
};

export default async function TeacherDetailPage({ params }: { params: Promise<{ teacherId: string }> }) {
  const { teacherId } = await params;
  const id = Number(teacherId);
  const teacher = await getTeacher(id).catch(() => null);
  if (!teacher) notFound();

  const [instruments, receipts, teacherClasses] = await Promise.all([
    prisma.instrument.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
    listReceiptsByTeacherId(id),
    getTeacherClassesProfile(id),
  ]);

  const age = calcAge(teacher.birthDate);

  return (
    <>
      <PageHeader title={teacher.fullName}>
        <ActiveBadge active={teacher.isActive} />
        <form action={toggleTeacherActiveAction}>
          <input type="hidden" name="id" value={teacher.id} />
          <input type="hidden" name="next" value={String(!teacher.isActive)} />
          <Button type="submit" variant="outline" size="sm">
            {teacher.isActive ? "غیرفعال‌سازی" : "فعال‌سازی"}
          </Button>
        </form>
        <Button asChild variant="ghost" size="sm">
          <Link href="/teachers">← بازگشت</Link>
        </Button>
      </PageHeader>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {/* راست — جزئیات */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/30 py-3">
            <CardTitle className="text-sm font-bold">اطلاعات استاد</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {/* 3.2 — گرید عمودی زیرهم با py-3 (قبلاً بدون padding روی هم می‌افتاد) */}
            <div className="grid divide-y divide-border text-sm">
              <div className="space-y-1 py-3 first:pt-0 last:pb-0">
                <p className="text-xs text-muted-foreground">موبایل</p>
                <p className="font-medium tabular-nums" dir="ltr">
                  {toPersianDigits(teacher.phone)}
                </p>
              </div>
              <div className="space-y-1 py-3 first:pt-0 last:pb-0">
                <p className="text-xs text-muted-foreground">تاریخ تولد / سن</p>
                <p className="font-medium">
                  {teacher.birthDate ? (
                    <>
                      {formatJalali(teacher.birthDate)} {age ? `— ${age} ساله` : ""}
                    </>
                  ) : (
                    "—"
                  )}
                </p>
              </div>
              <div className="space-y-1 py-3 first:pt-0 last:pb-0">
                <p className="text-xs text-muted-foreground">سازهای تدریسی</p>
                <p className="font-medium">{teacher.instruments.map((ti) => ti.instrument.name).join("، ") || "—"}</p>
              </div>
              <div className="space-y-1 py-3 first:pt-0 last:pb-0">
                <p className="text-xs text-muted-foreground">تعداد کلاس‌ها</p>
                <p className="font-medium tabular-nums">{toPersianDigits(String(teacher._count.classes))} کلاس</p>
              </div>
              <div className="space-y-1 py-3 first:pt-0 last:pb-0">
                <p className="text-xs text-muted-foreground">بیمه</p>
                <p className="font-medium">
                  {teacher.insuranceType ? insuranceLabels[teacher.insuranceType] : "—"}
                  {teacher.insuranceNumber ? ` — ${toPersianDigits(teacher.insuranceNumber)}` : ""}
                </p>
              </div>
              {teacher.resumeImageUrl ? (
                  <div className="space-y-1 py-3 first:pt-0 last:pb-0">
                  <p className="text-xs text-muted-foreground">رزومه</p>
                  <a href={teacher.resumeImageUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                    {teacher.resumeImageUrl.endsWith(".pdf") ? "مشاهده PDF" : "مشاهده عکس"}
                  </a>
                </div>
              ) : null}
              <div className="space-y-1 py-3 first:pt-0 last:pb-0">
                <p className="text-xs text-muted-foreground">سابقه تدریس</p>
                <p className="font-medium">
                  {teacher.teachingExperienceYears != null ? `${toPersianDigits(String(teacher.teachingExperienceYears))} سال` : "—"}
                  {teacher.teachingExperienceNote ? ` — ${teacher.teachingExperienceNote}` : ""}
                </p>
              </div>
              <div className="space-y-1 py-3 first:pt-0 last:pb-0">
                <p className="text-xs text-muted-foreground">صلاحیت تدریس</p>
                <p className={`font-medium ${teacher.isQualified ? "text-emerald-600" : "text-muted-foreground"}`}>
                  {teacher.isQualified ? "✓ تأیید شده" : "— تأیید نشده"}
                  {teacher.qualificationNote ? ` — ${teacher.qualificationNote}` : ""}
                </p>
              </div>
              <div className="space-y-1 py-3 first:pt-0 last:pb-0">
                <p className="text-xs text-muted-foreground">شماره کارت</p>
                <p className="font-medium tabular-nums" dir="ltr">
                  {teacher.cardNumber ? toPersianDigits(teacher.cardNumber) : "—"}
                </p>
              </div>
              <div className="space-y-1 py-3 first:pt-0 last:pb-0">
                <p className="text-xs text-muted-foreground">شماره شبا</p>
                <p className="font-medium tabular-nums" dir="ltr">
                  {teacher.sheba ? toPersianDigits(teacher.sheba) : "—"}
                </p>
              </div>
              {teacher.notes ? (
                <div className="space-y-1 rounded-lg bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">یادداشت</p>
                  <p className="leading-relaxed text-muted-foreground">{teacher.notes}</p>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {/* چپ — ویرایش */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/30 py-3">
            <CardTitle className="text-sm font-bold">ویرایش اطلاعات</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <TeacherForm
              instruments={instruments}
              teacher={{
                id: teacher.id,
                fullName: teacher.fullName,
                phone: teacher.phone,
                notes: teacher.notes,
                instrumentIds: teacher.instruments.map((ti) => ti.instrumentId),
                birthDate: teacher.birthDate ? formatJalali(teacher.birthDate) : null,
                resumeImageUrl: teacher.resumeImageUrl,
                insuranceType: teacher.insuranceType,
                insuranceNumber: teacher.insuranceNumber,
                teachingExperienceYears: teacher.teachingExperienceYears,
                teachingExperienceNote: teacher.teachingExperienceNote,
                isQualified: teacher.isQualified,
                qualificationNote: teacher.qualificationNote,
                cardNumber: teacher.cardNumber,
                sheba: teacher.sheba,
              }}
            />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <TeacherReceiptsCard teacherId={teacher.id} receipts={receipts} />
      </div>

      <div className="mt-6">
        <TeacherTermClassesButton classes={teacherClasses} />
      </div>
    </>
  );
}

// پروفایل هنرجو — جزئیات + ویرایش + حذف (گرید مرتب)
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActiveBadge, PageHeader } from "@/components/shared/form";
import { prisma } from "@/lib/prisma";
import { referralSourceLabels } from "@/lib/constants";
import { formatJalali, todayUtcDate } from "@/lib/jalali";
import { toPersianDigits } from "@/validations/validators";
import { getStudent } from "@/modules/student/services/student.service";
import { listMessagesByStudentId } from "@/modules/sms/repositories/batch.repository";
import { StudentSignatureCard } from "@/modules/student/components/student-signature-card";
import { getStudentAttendanceProfile } from "@/modules/attendance/queries";
import { getRefundPreview } from "@/modules/student/services/refund.service";
import { getStudentFinanceSummary } from "@/modules/finance/services/finance.service";
import { StudentFinanceCard } from "@/modules/finance/components/student-finance-card";
import { PaymentForm } from "@/modules/finance/components/payment-form";
import { WithdrawalCard } from "@/modules/student/components/withdrawal-card";
import { toggleStudentActiveAction } from "@/modules/student/actions/student.actions";
import { StudentForm } from "@/modules/student/components/student-form";
import { StudentDeleteForm } from "@/modules/student/components/student-delete-form";
import { StudentTermClassesButton } from "@/modules/student/components/student-term-classes-table";

export const dynamic = "force-dynamic";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const id = Number(studentId);
  const student = await getStudent(id).catch(() => null);
  if (!student) notFound();

  const instruments = await prisma.instrument.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });

  const [attendanceClasses, smsHistory, refundPreviews, financeSummary] = await Promise.all([
    getStudentAttendanceProfile(id),
    listMessagesByStudentId(id),
    getRefundPreview(id),
    getStudentFinanceSummary(id),
  ]);

  const activeClassesForPayment = financeSummary.classes.map((c: { classId: number; title: string | null; type: string; instrument: string }) => ({
    id: c.classId,
    title: c.title,
    type: c.type,
    instrument: c.instrument,
  }));

  const today = todayUtcDate();

  const dataCount =
    (student._count.enrollments ?? 0) +
    (student._count.attendances ?? 0) +
    (student._count.smsMessages ?? 0) +
    (financeSummary.classes.length > 0 ? 1 : 0) +
    (financeSummary.payments.length > 0 ? 1 : 0);

  return (
    <>
      <PageHeader title={student.fullName}>
        <ActiveBadge active={student.isActive} />
        <form action={toggleStudentActiveAction}>
          <input type="hidden" name="id" value={student.id} />
          <input type="hidden" name="next" value={String(!student.isActive)} />
          <Button type="submit" variant="outline" size="sm">
            {student.isActive ? "غیرفعال‌سازی" : "فعال‌سازی"}
          </Button>
        </form>
        <Button asChild variant="ghost" size="sm">
          <Link href="/students">← بازگشت به لیست</Link>
        </Button>
      </PageHeader>

      {/* ── گرید اصلی: راست جزئیات+حذف، چپ ویرایش — gap منظم 6 ── */}
      <div className="grid items-start gap-6 lg:grid-cols-2">
        {/* ستون راست — اطلاعات */}
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/30 py-3">
              <CardTitle className="text-sm font-bold">اطلاعات هنرجو</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid divide-y divide-border text-sm">
                <div className="space-y-1 py-3 first:pt-0 last:pb-0">
                  <p className="text-xs text-muted-foreground">کد ملی</p>
                  <p className="font-medium tabular-nums" dir="ltr">
                    {toPersianDigits(student.nationalId)}
                  </p>
                </div>
                <div className="space-y-1 py-3 first:pt-0 last:pb-0">
                  <p className="text-xs text-muted-foreground">موبایل هنرجو</p>
                  <p className="font-medium tabular-nums" dir="ltr">
                    {toPersianDigits(student.phone)}
                  </p>
                </div>
                <div className="space-y-1 py-3 first:pt-0 last:pb-0">
                  <p className="text-xs text-muted-foreground">موبایل ولی</p>
                  <p className="font-medium tabular-nums" dir="ltr">
                    {toPersianDigits(student.guardianPhone)}
                  </p>
                </div>
                <div className="space-y-1 py-3 first:pt-0 last:pb-0">
                  <p className="text-xs text-muted-foreground">تاریخ ثبت‌نام</p>
                  <p className="font-medium">{formatJalali(student.registrationDate)}</p>
                </div>
                <div className="space-y-1 py-3 first:pt-0 last:pb-0">
                  <p className="text-xs text-muted-foreground">سازها</p>
                  <p className="font-medium">{student.instruments.map((si) => si.instrument.name).join("، ") || "—"}</p>
                </div>
                <div className="space-y-1 py-3 first:pt-0 last:pb-0">
                  <p className="text-xs text-muted-foreground">منبع آشنایی</p>
                  <p className="font-medium">
                    {student.referralSource ? referralSourceLabels[student.referralSource] : "نامشخص"}
                    {student.referralSource === "OTHER" && student.referralNote ? ` — ${student.referralNote}` : ""}
                  </p>
                </div>
                {student.address ? (
                  <div className="space-y-1 py-3 sm:col-span-2 first:pt-0">
                    <p className="text-xs text-muted-foreground">آدرس</p>
                    <p className="font-medium leading-relaxed">{student.address}</p>
                  </div>
                ) : null}
                {student.notes ? (
                  <div className="space-y-1 sm:col-span-2 rounded-lg bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">یادداشت</p>
                    <p className="leading-relaxed text-muted-foreground">{student.notes}</p>
                  </div>
                ) : null}
              </div>
              <div className="mt-4 border-t pt-4">
                <StudentFinanceCard studentId={student.id} summary={financeSummary as unknown as React.ComponentProps<typeof StudentFinanceCard>['summary']} />
                <div className="mt-4">
                  <PaymentForm studentId={student.id} classes={activeClassesForPayment} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-dashed">
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-bold">حذف</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-5 pt-0 text-sm">
              {dataCount === 0 ? (
                <>
                  <p className="leading-relaxed text-muted-foreground">این هنرجو هیچ سابقه‌ای (کلاس، حضور، مالی، پیامک) ندارد؛ حذف کامل مجاز است.</p>
                  <StudentDeleteForm studentId={student.id} studentName={student.fullName} />
                </>
              ) : (
                <p className="leading-relaxed text-muted-foreground">این هنرجو سابقه دارد — طبق سیاست حفظ سابقه، فقط غیرفعال‌سازی از همین صفحه امکان‌پذیر است.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 3.3 — ستون چپ: ویرایش + انصراف (قبلاً انصراف ستون راست بود) */}
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/30 py-3">
              <CardTitle className="text-sm font-bold">ویرایش اطلاعات</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <StudentForm
                instruments={instruments}
                student={{
                  id: student.id,
                  fullName: student.fullName,
                  nationalId: student.nationalId,
                  phone: student.phone,
                  guardianPhone: student.guardianPhone,
                  address: student.address,
                  registrationDate: formatJalali(student.registrationDate),
                  referralSource: student.referralSource,
                  referralNote: student.referralNote,
                  notes: student.notes,
                  instrumentIds: student.instruments.map((si) => si.instrumentId),
                }}
              />
            </CardContent>
          </Card>
          <WithdrawalCard studentId={student.id} studentName={student.fullName} previews={refundPreviews} />
        </div>
      </div>

      {/* ── امضا — فقط امضا (فیش اقساطی حذف شد، گزارشات از شهریه منعطف می‌آید) ── */}
      <div className="mt-6">
        <StudentSignatureCard studentId={student.id} imageUrl={student.signatureImageUrl} />
      </div>

      {/* ── تاریخچه پیامک ── */}
      {smsHistory.length > 0 ? (
        <Card className="mt-6 overflow-hidden">
          <CardHeader className="border-b bg-muted/30 py-3">
            <CardTitle className="text-sm font-bold">تاریخچه پیامک</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-4 text-sm">
            {smsHistory.map((m) => (
              <div key={m.id} className="flex flex-wrap items-center gap-2 rounded-lg border bg-card px-3 py-2.5">
                <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">{formatJalali(m.createdAt)}</span>
                <span className="flex-1 truncate">{m.body.slice(0, 80)}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{m.status}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {/* ── دکمه جدول کامل کلاس‌های ترم — درخواست کاربر ── */}
      <div className="mt-6">
        <StudentTermClassesButton classes={attendanceClasses} />
      </div>

      {/* ── کلاس‌ها و حضور و غیاب — تمام‌عرض ── */}
      {attendanceClasses.some((c) => c.hasThreeConsecutiveAbsences) ? (
        <Card className="mt-6 border-amber-500/50 bg-amber-500/10">
          <CardContent className="p-4 text-sm text-amber-800 dark:text-amber-200">
            <p className="font-bold">⚠️ هشدار بند ۱۲ — ۳ غیبت متوالی</p>
            <p className="mt-1 leading-relaxed">
              یکی از کلاس‌های این هنرجو ۳ جلسه پشت سر هم غیبت (غیرموجه) دارد — طبق مقررات به منزله انصراف تلقی می‌شود. لطفاً با هنرجو تماس گرفته و تصمیم نهایی را ثبت کنید. (فقط هشدار — غیرفعال‌سازی دستی است)
            </p>
          </CardContent>
        </Card>
      ) : null}
      {attendanceClasses.length > 0 ? (
        <Card className="mt-6 overflow-hidden">
          <CardHeader className="border-b bg-muted/30 py-3">
            <CardTitle className="text-sm font-bold">کلاس‌ها و حضور و غیاب</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 text-sm">
            {attendanceClasses.map((c) => (
              <div key={c.classId} className={`space-y-3 rounded-xl border p-4 ${c.isActive ? "bg-card" : "bg-muted/20 opacity-60"}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/classes/${c.classId}`} className="font-bold hover:text-primary hover:underline">
                    {c.title}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {c.teacher} · ترم {c.term}
                  </span>
                  {c.hasThreeConsecutiveAbsences ? (
                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700">
                      ⚠️ ۳ غیبت متوالی
                    </span>
                  ) : null}
                  {!c.isActive ? (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">ثبت‌نام غیرفعال</span>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  جلسات گذشته: {fa(c.pastCount)} · باقی‌مانده: {fa(c.remainingCount)} — محاسبه‌شده خودکار (U7)
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-emerald-500/50 bg-emerald-500/10 px-2.5 py-1 text-emerald-700">حاضر: {fa(c.counts.PRESENT)}</span>
                  <span className="rounded-full border border-destructive/50 bg-destructive/10 px-2.5 py-1 text-destructive">غایب: {fa(c.counts.ABSENT)}</span>
                  <span className="rounded-full border border-amber-500/50 bg-amber-500/10 px-2.5 py-1 text-amber-700">موجه: {fa(c.counts.EXCUSED)}</span>
                  {c.unrecordedCount > 0 ? (
                    <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">ثبت‌نشده: {fa(c.unrecordedCount)}</span>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {c.recent.map((r) => {
                    const chip = recentChip(r, today);
                    return (
                      <Link key={r.id} href={`/sessions/${r.id}`} className={`rounded-full border px-2.5 py-1 ${chip.cls}`}>
                        {formatJalali(r.date)} — {chip.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}

const fa = (n: number) => toPersianDigits(String(n));

function recentChip(
  r: { date: Date; status: string; attendance: string | null },
  today: Date,
): { label: string; cls: string } {
  if (r.status === "CANCELLED") return { label: "لغوشده", cls: "border-border text-muted-foreground line-through" };
  if (r.date.getTime() >= today.getTime()) return { label: "آینده", cls: "border-border text-muted-foreground" };
  switch (r.attendance) {
    case "PRESENT":
      return { label: "حاضر", cls: "border-emerald-500/50 bg-emerald-500/10 text-emerald-700" };
    case "ABSENT":
      return { label: "غایب", cls: "border-destructive/50 bg-destructive/10 text-destructive" };
    case "EXCUSED":
      return { label: "موجه", cls: "border-amber-500/50 bg-amber-500/10 text-amber-700" };
    default:
      return { label: "ثبت‌نشده", cls: "border-dashed border-border text-muted-foreground" };
  }
}

// لیست هنرجویان (F2) — جستجوی نام/کدملی/تماس در یک فیلد (F2-AC5) + فیلتر وضعیت + pagination واقعی (2.3)
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ActiveBadge, PageHeader } from "@/components/shared/form";
import { formatJalali } from "@/lib/jalali";
import { toPersianDigits } from "@/validations/validators";
import { getStudents, type StudentStatusFilter } from "@/modules/student/services/student.service";
import { toggleStudentActiveAction } from "@/modules/student/actions/student.actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "هنرجویان" };

const STATUS_TABS: { key: StudentStatusFilter; label: string }[] = [
  { key: "active", label: "فعال" },
  { key: "inactive", label: "غیرفعال" },
  { key: "all", label: "همه" },
];

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const { q, status, page: pageParam } = await searchParams;
  const statusFilter: StudentStatusFilter =
    status === "inactive" || status === "all" ? status : "active";
  const page = Math.max(1, Number(pageParam) || 1);
  const { items: students, total, totalPages } = await getStudents({ q, status: statusFilter, page, pageSize: 20 });

  // q در URL می‌ماند — لینک جستجو قابل اشتراک‌گذاری است
  const tabHref = (s: StudentStatusFilter) =>
    `/students?status=${s}${q ? `&q=${encodeURIComponent(q)}` : ""}`;
  const pageHref = (p: number) =>
    `/students?status=${statusFilter}${q ? `&q=${encodeURIComponent(q)}` : ""}&page=${p}`;

  return (
    <>
      <PageHeader title="هنرجویان">
        <Badge variant="outline">F2</Badge>
        <Button asChild size="sm">
          <Link href="/students/new">＋ هنرجوی جدید</Link>
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="space-y-3">
          <form action="/students" className="flex gap-2">
            <Input
              name="q"
              defaultValue={q ?? ""}
              placeholder="نام، کد ملی یا شماره تماس…"
            />
            <input type="hidden" name="status" value={statusFilter} />
            <Button type="submit" variant="outline">
              جستجو
            </Button>
          </form>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">{toPersianDigits(String(total))} هنرجو — صفحه {toPersianDigits(String(page))} از {toPersianDigits(String(totalPages || 1))}</p>
            <div className="flex gap-1">
              {STATUS_TABS.map((t) => (
                <Button
                  key={t.key}
                  asChild
                  size="sm"
                  variant={t.key === statusFilter ? "default" : "ghost"}
                >
                  <Link href={tabHref(t.key)}>{t.label}</Link>
                </Button>
              ))}
            </div>
          </div>

          {students.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              هنرجویی یافت نشد — عبارت جستجو یا فیلتر را تغییر دهید.
            </p>
          ) : (
            students.map((s) => (
              <div
                key={s.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2.5 text-sm"
              >
                <Link href={`/students/${s.id}`} className="font-bold hover:underline">
                  {s.fullName}
                </Link>
                <span className="text-xs text-muted-foreground" dir="ltr">
                  {toPersianDigits(s.nationalId)}
                </span>
                <span className="text-xs text-muted-foreground" dir="ltr">
                  {toPersianDigits(s.phone)}
                </span>
                <span className="flex flex-wrap gap-1">
                  {s.instruments.map((si) => (
                    <span
                      key={si.instrumentId}
                      className="rounded-full bg-muted px-2 py-0.5 text-xs"
                    >
                      {si.instrument.name}
                    </span>
                  ))}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatJalali(s.registrationDate)}
                </span>
                <ActiveBadge active={s.isActive} />
                <form action={toggleStudentActiveAction} className="ms-auto">
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="next" value={String(!s.isActive)} />
                  <Button type="submit" size="sm" variant="outline">
                    {s.isActive ? "غیرفعال‌سازی" : "فعال‌سازی"}
                  </Button>
                </form>
              </div>
            ))
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button asChild variant="outline" size="sm" disabled={page <= 1}>
                <Link href={pageHref(page - 1)}>‹ قبلی</Link>
              </Button>
              <span className="text-xs text-muted-foreground">صفحه {toPersianDigits(String(page))} از {toPersianDigits(String(totalPages))}</span>
              <Button asChild variant="outline" size="sm" disabled={page >= totalPages}>
                <Link href={pageHref(page + 1)}>بعدی ›</Link>
              </Button>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            غیرفعال‌سازی = Soft Delete (F2-AC7) — سابقه هنرجو همیشه حفظ می‌شود ·
            حذف کامل فقط برای هنرجوی بدون هیچ سابقه‌ای، از صفحه پروفایل.
          </p>
        </CardContent>
      </Card>
    </>
  );
}

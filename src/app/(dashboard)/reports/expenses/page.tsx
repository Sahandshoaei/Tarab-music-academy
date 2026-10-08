import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PeriodFilter } from "@/modules/report/components/period-filter";
import { resolvePeriodFromSearchParams } from "@/modules/report/utils/period";
import { getExpenseRows, getGeneralExpenseRows, getTerms, getTermById, getActiveTerm, getOverview } from "@/modules/report/services/report.service";
import { formatJalali } from "@/lib/jalali";
import { toPersianDigits } from "@/validations/validators";
import { prisma } from "@/lib/prisma";
import { generalExpenseCategoryLabels, generalExpenseCategoryOptions } from "@/lib/constants";
import { GeneralExpenseForm } from "@/modules/expense/components/general-expense-form";
import { GeneralExpenseList } from "@/modules/expense/components/general-expense-list";

export const dynamic = "force-dynamic";
export const metadata = { title: "گزارش هزینه — حقوق و جانبی" };

function buildPeriodQuery(sp: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  if (sp.mode) params.set("mode", sp.mode);
  if (sp.month) params.set("month", sp.month);
  if (sp.termId) params.set("termId", sp.termId);
  if (sp.from) params.set("from", sp.from);
  if (sp.to) params.set("to", sp.to);
  return params.toString();
}

export default async function ExpensesReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const terms = await getTerms();

  let termForPeriod: { name: string; startDate: Date; endDate: Date } | null = null;
  if (sp.mode === "term" && sp.termId) {
    const t = await getTermById(Number(sp.termId));
    if (t) termForPeriod = { name: t.name, startDate: t.startDate, endDate: t.endDate };
  } else if (sp.mode === "term" && !sp.termId) {
    const active = await getActiveTerm();
    if (active) termForPeriod = { name: active.name, startDate: active.startDate, endDate: active.endDate };
  }

  const period = resolvePeriodFromSearchParams(sp as Record<string, string | undefined>, termForPeriod);
  const range = { from: period.from, to: period.to };

  const tab = sp.tab === "general" ? "general" : "teacher";

  const q = sp.q || "";
  const teacherId = sp.teacherId ? Number(sp.teacherId) : undefined;
  const teacherRows = await getExpenseRows(range, { q, teacherId });
  const teachers = await prisma.teacher.findMany({ where: { isActive: true }, orderBy: { fullName: "asc" } });
  const teacherTotal = teacherRows.reduce((s, r) => s + r.amount, 0);

  const qg = sp.qg || "";
  const category = sp.category || "";
  const generalRows = await getGeneralExpenseRows(range, { q: qg, category: category || undefined });
  const generalTotal = generalRows.reduce((s, r) => s + r.amount, 0);

  const overview = await getOverview(range);
  const periodQuery = buildPeriodQuery(sp as Record<string, string | undefined>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">هزینه‌ها</h1>
        <p className="text-sm text-muted-foreground">
          بازه: <b className="text-foreground">{period.label}</b> · حقوق {toPersianDigits(overview.expenseTeacherTotal.toLocaleString("en-US"))} + جانبی {toPersianDigits(overview.expenseGeneralTotal.toLocaleString("en-US"))} = کل {toPersianDigits(overview.expenseTotal.toLocaleString("en-US"))} تومان
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {toPersianDigits(String(overview.expenseTeacherCount))} فیش حقوق · {toPersianDigits(String(overview.expenseGeneralCount))} هزینه جانبی · سود خالص {toPersianDigits(overview.profit.toLocaleString("en-US"))} تومان
        </p>
      </div>

      <PeriodFilter terms={terms.map(t => ({ id: t.id, name: t.name }))} />

      <div className="flex gap-2 border-b">
        <Link
          href={`/reports/expenses?${periodQuery}${periodQuery ? "&" : ""}tab=teacher${q ? `&q=${encodeURIComponent(q)}` : ""}${teacherId ? `&teacherId=${teacherId}` : ""}`}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === "teacher" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          حقوق اساتید <Badge variant={tab === "teacher" ? "default" : "secondary"} className="mr-2">{toPersianDigits(String(teacherRows.length))}</Badge>
        </Link>
        <Link
          href={`/reports/expenses?${periodQuery}${periodQuery ? "&" : ""}tab=general${qg ? `&qg=${encodeURIComponent(qg)}` : ""}${category ? `&category=${category}` : ""}`}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === "general" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          هزینه جانبی <Badge variant={tab === "general" ? "default" : "secondary"} className="mr-2">{toPersianDigits(String(generalRows.length))}</Badge>
        </Link>
      </div>

      {tab === "teacher" ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">فیلتر حقوق اساتید</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3 sm:grid-cols-3">
                {sp.mode && <input type="hidden" name="mode" value={sp.mode} />}
                {sp.month && <input type="hidden" name="month" value={sp.month} />}
                {sp.termId && <input type="hidden" name="termId" value={sp.termId} />}
                {sp.from && <input type="hidden" name="from" value={sp.from} />}
                {sp.to && <input type="hidden" name="to" value={sp.to} />}
                <input type="hidden" name="tab" value="teacher" />
                <div>
                  <label className="text-xs text-muted-foreground">جستجو (نام استاد/توضیح)</label>
                  <Input name="q" defaultValue={q} placeholder="نام استاد…" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">استاد</label>
                  <select name="teacherId" defaultValue={teacherId ? String(teacherId) : ""} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                    <option value="">همه اساتید</option>
                    {teachers.map(t => <option key={t.id} value={String(t.id)}>{t.fullName}</option>)}
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <Button type="submit" size="sm">اعمال</Button>
                  <Link
                    href={`/reports/expenses?${periodQuery}${periodQuery ? "&" : ""}tab=teacher`}
                    className="inline-flex h-8 items-center justify-center rounded-md border px-3 text-sm"
                  >
                    پاک کردن
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">جدول حقوق‌ها <Badge variant="secondary" className="mr-2">{toPersianDigits(String(teacherRows.length))} ردیف</Badge></CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {teacherRows.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">فیشی در این بازه/فیلتر یافت نشد.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-y bg-muted/50 text-xs text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 text-right">تاریخ</th>
                        <th className="px-3 py-2 text-right">استاد</th>
                        <th className="px-3 py-2 text-right">مبلغ</th>
                        <th className="px-3 py-2 text-right">توضیح</th>
                        <th className="px-3 py-2 text-right">فیش</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teacherRows.map(r => (
                        <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="px-3 py-2 whitespace-nowrap" dir="ltr">{formatJalali(r.paidAt)}</td>
                          <td className="px-3 py-2">
                            <Link href={`/teachers/${r.teacher.id}`} className="font-medium text-primary hover:underline">{r.teacher.fullName}</Link>
                          </td>
                          <td className="px-3 py-2 font-medium">{toPersianDigits(r.amount.toLocaleString("en-US"))}</td>
                          <td className="px-3 py-2 max-w-[200px] truncate text-xs text-muted-foreground">{r.note || "—"}</td>
                          <td className="px-3 py-2">
                            {r.imageUrl.toLowerCase().endsWith(".pdf") ? (
                              <a href={`/${r.imageUrl}`} target="_blank" className="text-xs text-primary hover:underline">PDF</a>
                            ) : (
                              <a href={`/${r.imageUrl}`} target="_blank" className="text-xs text-primary hover:underline">عکس</a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted/50 font-bold">
                      <tr>
                        <td colSpan={2} className="px-3 py-2 text-left">جمع فیلترشده</td>
                        <td className="px-3 py-2">{toPersianDigits(teacherTotal.toLocaleString("en-US"))} تومان</td>
                        <td colSpan={2} className="px-3 py-2 text-xs font-normal text-muted-foreground">{toPersianDigits(String(teacherRows.length))} فیش</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          <GeneralExpenseForm />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">فیلتر هزینه جانبی</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3 sm:grid-cols-3">
                {sp.mode && <input type="hidden" name="mode" value={sp.mode} />}
                {sp.month && <input type="hidden" name="month" value={sp.month} />}
                {sp.termId && <input type="hidden" name="termId" value={sp.termId} />}
                {sp.from && <input type="hidden" name="from" value={sp.from} />}
                {sp.to && <input type="hidden" name="to" value={sp.to} />}
                <input type="hidden" name="tab" value="general" />
                <div>
                  <label className="text-xs text-muted-foreground">جستجو (عنوان/توضیح)</label>
                  <Input name="qg" defaultValue={qg} placeholder="عنوان هزینه…" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">دسته</label>
                  <select name="category" defaultValue={category} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                    <option value="">همه دسته‌ها</option>
                    {generalExpenseCategoryOptions.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <Button type="submit" size="sm">اعمال</Button>
                  <Link
                    href={`/reports/expenses?${periodQuery}${periodQuery ? "&" : ""}tab=general`}
                    className="inline-flex h-8 items-center justify-center rounded-md border px-3 text-sm"
                  >
                    پاک کردن
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                جدول هزینه‌های جانبی <Badge variant="secondary" className="mr-2">{toPersianDigits(String(generalRows.length))} ردیف</Badge>
                <span className="text-xs font-normal text-muted-foreground mr-2">جمع {toPersianDigits(generalTotal.toLocaleString("en-US"))} تومان</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <GeneralExpenseList expenses={generalRows as any} />
            </CardContent>
          </Card>

          {overview.expenseByCategory.length > 0 && (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-sm">تفکیک هزینه جانبی بر حسب دسته (در بازه)</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm sm:grid-cols-3">
                {overview.expenseByCategory.map(c => (
                  <div key={c.name} className="flex justify-between rounded border px-3 py-2">
                    <span>{c.name}</span>
                    <span className="font-bold">{toPersianDigits(c.value.toLocaleString("en-US"))} تومان</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

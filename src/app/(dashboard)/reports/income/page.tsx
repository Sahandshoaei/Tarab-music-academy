import Link from "next/link";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {PeriodFilter} from "@/modules/report/components/period-filter";
import {resolvePeriodFromSearchParams} from "@/modules/report/utils/period";
import {getIncomeRows, getTerms, getTermById, getActiveTerm} from "@/modules/report/services/report.service";
import {formatJalali, formatMoney} from "@/lib/jalali";
import {toPersianDigits} from "@/validations/validators";
import {prisma} from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = {title: "گزارش درآمد — شهریه‌ها"};

export default async function IncomeReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const terms = await getTerms();

  let termForPeriod: {name: string; startDate: Date; endDate: Date} | null = null;
  if (sp.mode === "term" && sp.termId) {
    const t = await getTermById(Number(sp.termId));
    if (t) termForPeriod = {name: t.name, startDate: t.startDate, endDate: t.endDate};
 } else if (sp.mode === "term" && !sp.termId) {
    const active = await getActiveTerm();
    if (active) termForPeriod = {name: active.name, startDate: active.startDate, endDate: active.endDate};
 }

  const period = resolvePeriodFromSearchParams(sp as Record<string, string | undefined>, termForPeriod);
  const range = {from: period.from, to: period.to};

  // فیلترهای جدول
  const q = sp.q || "";
  const instrumentId = sp.instrumentId ? Number(sp.instrumentId) : undefined;

  const rows = await getIncomeRows(range, {q, instrumentId});

  // لیست سازها برای فیلتر
  const instruments = await prisma.instrument.findMany({where: {isActive: true}, orderBy: {name: "asc"}});

  const total = rows.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">درآمد — شهریه هنرجوها (منعطف)</h1>
        <p className="text-sm text-muted-foreground">
          بازه: <b className="text-foreground">{period.label}</b> · {toPersianDigits(String(rows.length))} پرداخت · جمع {formatMoney(total)} تومان
        </p>
      </div>

      <PeriodFilter terms={terms.map(t => ({id: t.id, name: t.name}))} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">فیلتر جدول</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 sm:grid-cols-3">
            {/* حفظ پارامترهای period */}
            {sp.mode && <input type="hidden" name="mode" value={sp.mode} />}
            {sp.month && <input type="hidden" name="month" value={sp.month} />}
            {sp.termId && <input type="hidden" name="termId" value={sp.termId} />}
            {sp.from && <input type="hidden" name="from" value={sp.from} />}
            {sp.to && <input type="hidden" name="to" value={sp.to} />}
            <div>
              <label className="text-xs text-muted-foreground">جستجو (نام/توضیح)</label>
              <Input name="q" defaultValue={q} placeholder="نام هنرجو…" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">ساز</label>
              <select name="instrumentId" defaultValue={instrumentId ? String(instrumentId) : ""} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                <option value="">همه سازها</option>
                {instruments.map(i => <option key={i.id} value={String(i.id)}>{i.name}</option>)}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit" size="sm">اعمال</Button>
              <Link
                href={`/reports/income?${new URLSearchParams({...(sp.mode?{mode:sp.mode}:{}), ...(sp.month?{month:sp.month}:{}), ...(sp.termId?{termId:sp.termId}:{}), ...(sp.from?{from:sp.from}:{}), ...(sp.to?{to:sp.to}:{})}).toString()}`}
                className="inline-flex h-8 items-center justify-center rounded-md border px-3 text-sm"
              >
                پاک کردن فیلتر جدول
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">جدول شهریه‌ها <Badge variant="secondary" className="mr-2">{toPersianDigits(String(rows.length))} ردیف</Badge></CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">پرداختی در این بازه/فیلتر یافت نشد.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-y bg-muted/50 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-right">تاریخ</th>
                    <th className="px-3 py-2 text-right">هنرجو</th>
                    <th className="px-3 py-2 text-right">ساز</th>
                    <th className="px-3 py-2 text-right">مبلغ</th>
                    <th className="px-3 py-2 text-right">توضیح</th>
                    <th className="px-3 py-2 text-right">رسید</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-2 whitespace-nowrap" dir="ltr">{formatJalali(r.paidAt)}</td>
                      <td className="px-3 py-2">
                        <Link href={`/students/${r.student.id}`} className="font-medium text-primary hover:underline">{r.student.fullName}</Link>
                      </td>
                      <td className="px-3 py-2 text-xs">{r.allocations?.length ? r.allocations.map((a)=>a.class.instrument.name).join("، ") : r.student.instruments.map((i)=>i.instrument.name).join("، ") || "—"}</td>
                      <td className="px-3 py-2 font-medium">{formatMoney(r.amount)}</td>
                      <td className="px-3 py-2 max-w-[200px] truncate text-xs text-muted-foreground">{r.note || "—"}</td>
                      <td className="px-3 py-2">
                        {r.receiptImageUrl?.toLowerCase().endsWith(".pdf") ? (
                          <a href={r.receiptImageUrl} target="_blank" className="text-xs text-primary hover:underline">PDF</a>
                        ) : (
                          <a href={r.receiptImageUrl} target="_blank" className="text-xs text-primary hover:underline">عکس</a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/50 font-bold">
                  <tr>
                    <td colSpan={3} className="px-3 py-2 text-left">جمع فیلترشده</td>
                    <td className="px-3 py-2">{formatMoney(total)} تومان</td>
                    <td colSpan={2} className="px-3 py-2 text-xs font-normal text-muted-foreground">{toPersianDigits(String(rows.length))} پرداخت</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

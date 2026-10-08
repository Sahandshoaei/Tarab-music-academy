import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { resolvePeriodFromSearchParams } from "@/modules/report/utils/period";
import { getIncomeRows, getExpenseRows, getProfitLossRows, getTermById, getActiveTerm } from "@/modules/report/services/report.service";
import { formatJalali } from "@/lib/jalali";

export const dynamic = "force-dynamic";

function toCsvRow(cells: (string | number)[]): string {
  return cells.map(c => {
    const s = String(c ?? "");
    // escape double quotes and wrap if contains comma/quote/newline
    if (s.includes('"') || s.includes(",") || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }).join(",");
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = Object.fromEntries(req.nextUrl.searchParams.entries()) as Record<string, string | undefined>;
  const type = (sp.type as string) || "income";

  // term resolution
  let termForPeriod: { name: string; startDate: Date; endDate: Date } | null = null;
  if (sp.mode === "term" && sp.termId) {
    const t = await getTermById(Number(sp.termId));
    if (t) termForPeriod = { name: t.name, startDate: t.startDate, endDate: t.endDate };
  } else if (sp.mode === "term" && !sp.termId) {
    const active = await getActiveTerm();
    if (active) termForPeriod = { name: active.name, startDate: active.startDate, endDate: active.endDate };
  }

  const period = resolvePeriodFromSearchParams(sp, termForPeriod);
  const range = { from: period.from, to: period.to };

  let csv = "\uFEFF"; // BOM for Excel Persian
  let filename = "report.csv";

  if (type === "income") {
    const rows = await getIncomeRows(range, { q: sp.q, instrumentId: sp.instrumentId ? Number(sp.instrumentId) : undefined });
    csv += toCsvRow(["تاریخ شمسی", "هنرجو", "ساز", "مبلغ (تومان)", "توضیح"]) + "\n";
    for (const r of rows) {
      csv += toCsvRow([
        formatJalali(r.paidAt),
        r.student.fullName,
        r.student.instruments.map(i => i.instrument.name).join("، "),
        r.amount,
        r.note || "",
      ]) + "\n";
    }
    csv += toCsvRow(["جمع", "", "", rows.reduce((s, r) => s + r.amount, 0), `${rows.length} فیش`]) + "\n";
    filename = `income-${period.label.replace(/\//g, "-")}.csv`;
  } else if (type === "expenses") {
    const rows = await getExpenseRows(range, { q: sp.q, teacherId: sp.teacherId ? Number(sp.teacherId) : undefined });
    csv += toCsvRow(["تاریخ شمسی", "استاد", "مبلغ (تومان)", "توضیح"]) + "\n";
    for (const r of rows) {
      csv += toCsvRow([formatJalali(r.paidAt), r.teacher.fullName, r.amount, r.note || ""]) + "\n";
    }
    csv += toCsvRow(["جمع", "", rows.reduce((s, r) => s + r.amount, 0), `${rows.length} فیش`]) + "\n";
    filename = `expenses-${period.label.replace(/\//g, "-")}.csv`;
  } else if (type === "profit") {
    const rows = await getProfitLossRows(range);
    csv += toCsvRow(["ماه شمسی", "درآمد", "هزینه حقوق", "سود خالص", "حاشیه سود٪"]) + "\n";
    for (const r of rows) {
      csv += toCsvRow([r.label, r.income, r.expense, r.profit, r.income ? ((r.profit / r.income) * 100).toFixed(1) : "0"]) + "\n";
    }
    const totalIncome = rows.reduce((s, r) => s + r.income, 0);
    const totalExpense = rows.reduce((s, r) => s + r.expense, 0);
    csv += toCsvRow(["جمع کل", totalIncome, totalExpense, totalIncome - totalExpense, totalIncome ? (((totalIncome - totalExpense)/totalIncome)*100).toFixed(1) : "0"]) + "\n";
    filename = `profit-loss-${period.label.replace(/\//g, "-")}.csv`;
  } else {
    return NextResponse.json({ error: "invalid type" }, { status: 400 });
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  });
}

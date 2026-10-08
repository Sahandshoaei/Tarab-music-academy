// ── سرویس گزارشات — منطق تجمیع و گروه‌بندی (بدون ذخیره)
// درآمد از TuitionPayment (شهریه منعطف) — نه StudentReceipt قدیمی
import { toJalaali } from "jalaali-js";
import { toPersianDigits } from "@/validations/validators";
import * as repo from "../repositories/report.repository";
import type { DateRange } from "../repositories/report.repository";

export type MonthlyPoint = {
  key: string; // 1404/06
  label: string; // ۱۴۰۴/۰۶
  income: number;
  expense: number; // کل هزینه (حقوق + جانبی)
  expenseTeacher: number;
  expenseGeneral: number;
  profit: number;
};

export type OverviewData = {
  incomeTotal: number;
  expenseTotal: number; // کل = حقوق + جانبی
  expenseTeacherTotal: number;
  expenseGeneralTotal: number;
  profit: number;
  incomeCount: number;
  expenseCount: number; // حقوق + جانبی
  expenseTeacherCount: number;
  expenseGeneralCount: number;
  avgIncome: number;
  avgExpense: number;
  monthly: MonthlyPoint[];
  cumulative: { label: string; income: number; profit: number }[];
  incomeByInstrument: { name: string; value: number }[];
  expenseByTeacher: { name: string; value: number }[];
  expenseByCategory: { name: string; value: number }[];
};

function toJalaliMonthKey(d: Date): string {
  const j = toJalaali(d);
  return `${j.jy}/${String(j.jm).padStart(2, "0")}`;
}

function toPersianMonthLabel(key: string): string {
  return toPersianDigits(key);
}

/** گروه‌بندی پرداخت‌ها بر اساس ماه شمسی paidAt — شامل هزینه جانبی */
function groupByJalaliMonth(
  tuitionPayments: { paidAt: Date; amount: number }[],
  teacherReceipts: { paidAt: Date; amount: number }[],
  generalExpenses: { paidAt: Date; amount: number }[] = [],
): MonthlyPoint[] {
  const map = new Map<string, MonthlyPoint>();
  for (const r of tuitionPayments) {
    const k = toJalaliMonthKey(r.paidAt);
    const cur = map.get(k) ?? { key: k, label: toPersianMonthLabel(k), income: 0, expense: 0, expenseTeacher: 0, expenseGeneral: 0, profit: 0 };
    cur.income += r.amount;
    map.set(k, cur);
  }
  for (const r of teacherReceipts) {
    const k = toJalaliMonthKey(r.paidAt);
    const cur = map.get(k) ?? { key: k, label: toPersianMonthLabel(k), income: 0, expense: 0, expenseTeacher: 0, expenseGeneral: 0, profit: 0 };
    cur.expense += r.amount;
    cur.expenseTeacher += r.amount;
    map.set(k, cur);
  }
  for (const r of generalExpenses) {
    const k = toJalaliMonthKey(r.paidAt);
    const cur = map.get(k) ?? { key: k, label: toPersianMonthLabel(k), income: 0, expense: 0, expenseTeacher: 0, expenseGeneral: 0, profit: 0 };
    cur.expense += r.amount;
    cur.expenseGeneral += r.amount;
    map.set(k, cur);
  }
  const arr = Array.from(map.values()).map(p => ({ ...p, profit: p.income - p.expense }));
  arr.sort((a, b) => a.key.localeCompare(b.key));
  return arr;
}

export async function getOverview(range: DateRange): Promise<OverviewData> {
  const [tuitionPayments, teacherReceipts, generalExpenses] = await Promise.all([
    repo.listTuitionPayments(range),
    repo.listTeacherReceipts(range),
    repo.listGeneralExpenses(range),
  ]);

  const incomeTotal = tuitionPayments.reduce((s, r) => s + r.amount, 0);
  const expenseTeacherTotal = teacherReceipts.reduce((s, r) => s + r.amount, 0);
  const expenseGeneralTotal = (generalExpenses as { amount: number }[]).reduce((s, r) => s + r.amount, 0);
  const expenseTotal = expenseTeacherTotal + expenseGeneralTotal;
  const profit = incomeTotal - expenseTotal;
  const incomeCount = tuitionPayments.length;
  const expenseTeacherCount = teacherReceipts.length;
  const expenseGeneralCount = (generalExpenses as unknown[]).length;
  const expenseCount = expenseTeacherCount + expenseGeneralCount;

  const monthly = groupByJalaliMonth(tuitionPayments, teacherReceipts, generalExpenses as { paidAt: Date; amount: number }[]);

  let cumIncome = 0, cumProfit = 0;
  const cumulative = monthly.map(m => {
    cumIncome += m.income;
    cumProfit += m.profit;
    return { label: m.label, income: cumIncome, profit: cumProfit };
  });

  // درآمد به تفکیک ساز — از تخصیص کلاس (allocations) اگر باشد، وگرنه از سازهای هنرجو
  const instrumentMap = new Map<string, number>();
  for (const r of tuitionPayments as typeof tuitionPayments) {
    // اگر تخصیص دارد، بر اساس ساز کلاس تقسیم کن (دقیق‌تر)
    if (r.allocations && r.allocations.length > 0) {
      for (const a of r.allocations) {
        const name = a.class?.instrument?.name ?? "نامشخص";
        instrumentMap.set(name, (instrumentMap.get(name) ?? 0) + a.amount);
      }
    } else {
      // fallback: سازهای هنرجو
      const instruments = r.student?.instruments as { instrument: { name: string } }[] | undefined;
      if (!instruments || instruments.length === 0) {
        const k = "بدون ساز";
        instrumentMap.set(k, (instrumentMap.get(k) ?? 0) + r.amount);
      } else if (instruments.length === 1) {
        const k = instruments[0].instrument.name;
        instrumentMap.set(k, (instrumentMap.get(k) ?? 0) + r.amount);
      } else {
        const share = Math.floor(r.amount / instruments.length);
        let remainder = r.amount - share * instruments.length;
        for (const inst of instruments) {
          const k = inst.instrument.name;
          let add = share;
          if (remainder > 0) { add += 1; remainder--; }
          instrumentMap.set(k, (instrumentMap.get(k) ?? 0) + add);
        }
      }
    }
  }
  const incomeByInstrument = Array.from(instrumentMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const teacherMap = new Map<string, number>();
  for (const r of teacherReceipts) {
    const name = (r as { teacher: { fullName: string } }).teacher.fullName;
    teacherMap.set(name, (teacherMap.get(name) ?? 0) + r.amount);
  }
  const expenseByTeacher = Array.from(teacherMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // هزینه جانبی به تفکیک دسته
  const { generalExpenseCategoryLabels } = await import("@/lib/constants");
  const catMap = new Map<string, number>();
  for (const r of generalExpenses as unknown as Array<{ category: string; amount: number }>) {
    const label = (generalExpenseCategoryLabels as Record<string, string>)[r.category] ?? r.category;
    catMap.set(label, (catMap.get(label) ?? 0) + r.amount);
  }
  const expenseByCategory = Array.from(catMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return {
    incomeTotal,
    expenseTotal,
    expenseTeacherTotal,
    expenseGeneralTotal,
    profit,
    incomeCount,
    expenseCount,
    expenseTeacherCount,
    expenseGeneralCount,
    avgIncome: incomeCount ? Math.round(incomeTotal / incomeCount) : 0,
    avgExpense: expenseCount ? Math.round(expenseTotal / expenseCount) : 0,
    monthly,
    cumulative,
    incomeByInstrument,
    expenseByTeacher,
    expenseByCategory,
  };
}

/** سطرهای درآمد برای جدول — از TuitionPayment */
export async function getIncomeRows(range: DateRange, opts: { q?: string; instrumentId?: number }) {
  const rows = await repo.listTuitionPayments(range);
  let filtered = rows as unknown as Array<{
    id: number; amount: number; paidAt: Date; note: string | null; receiptImageUrl: string;
    student: { id: number; fullName: string; instruments: { instrument: { id: number; name: string } }[] }
    allocations: { amount: number; class: { instrument: { id: number; name: string } } }[]
  }>;

  if (opts.q) {
    const needle = opts.q.trim().toLowerCase();
    filtered = filtered.filter(r =>
      r.student.fullName.toLowerCase().includes(needle) ||
      (r.note && r.note.toLowerCase().includes(needle)) ||
      String(r.amount).includes(needle)
    );
  }
  if (opts.instrumentId) {
    filtered = filtered.filter(r => {
      // اول allocations را چک کن، بعد سازهای هنرجو
      if (r.allocations?.some(a => a.class.instrument.id === opts.instrumentId)) return true;
      return r.student.instruments.some(i => i.instrument.id === opts.instrumentId);
    });
  }
  return filtered;
}

export async function getExpenseRows(range: DateRange, opts: { q?: string; teacherId?: number }) {
  const rows = await repo.listTeacherReceipts(range);
  let filtered = rows as unknown as Array<{
    id: number; amount: number; paidAt: Date; note: string | null; imageUrl: string;
    teacher: { id: number; fullName: string }
  }>;
  if (opts.q) {
    const needle = opts.q.trim().toLowerCase();
    filtered = filtered.filter(r =>
      r.teacher.fullName.toLowerCase().includes(needle) ||
      (r.note && r.note.toLowerCase().includes(needle))
    );
  }
  if (opts.teacherId) {
    filtered = filtered.filter(r => r.teacher.id === opts.teacherId);
  }
  return filtered;
}

export async function getGeneralExpenseRows(
  range: DateRange,
  opts: { q?: string; category?: string },
) {
  const rows = await repo.listGeneralExpenses(range);
  let filtered = rows as unknown as Array<{
    id: number; title: string; category: string; amount: number; paidAt: Date; note: string | null;
  }>;
  if (opts.q) {
    const needle = opts.q.trim().toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.title.toLowerCase().includes(needle) ||
        (r.note && r.note.toLowerCase().includes(needle)) ||
        String(r.amount).includes(needle),
    );
  }
  if (opts.category) {
    filtered = filtered.filter((r) => r.category === opts.category);
  }
  return filtered;
}

/** سطرهای سود ماهانه برای /profit-loss */
export async function getProfitLossRows(range: DateRange) {
  const overview = await getOverview(range);
  return overview.monthly;
}

// ── ترم
export function getTerms() {
  return repo.listTerms();
}
export function getTermById(id: number) {
  return repo.findTermById(id);
}
export function getActiveTerm() {
  return repo.findActiveTerm();
}

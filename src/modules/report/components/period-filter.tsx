"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { lastJalaliMonths, currentJalaliMonth } from "../utils/period";

interface TermOption { id: number; name: string }

export function PeriodFilter({ terms }: { terms: TermOption[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentMode = sp.get("mode") || "month";
  const currentMonth = sp.get("month") || currentJalaliMonth();
  const currentTermId = sp.get("termId") || "";
  const currentFrom = sp.get("from") || "";
  const currentTo = sp.get("to") || "";

  const [mode, setMode] = useState(currentMode);
  const [month, setMonth] = useState(currentMonth);
  const [termId, setTermId] = useState(currentTermId);
  const [from, setFrom] = useState(currentFrom);
  const [to, setTo] = useState(currentTo);

  function apply() {
    const params = new URLSearchParams();
    params.set("mode", mode);
    if (mode === "month" && month) params.set("month", month);
    if (mode === "term" && termId) params.set("termId", termId);
    if (mode === "custom") {
      if (from) params.set("from", from);
      if (to) params.set("to", to);
    }
    // preserve other filters (q etc) — but for period filter we keep them
    for (const [k, v] of sp.entries()) {
      if (["mode","month","termId","from","to"].includes(k)) continue;
      // keep q, instrumentId etc
      if (!params.has(k)) params.set(k, v);
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function clear() {
    setMode("month");
    setMonth(currentJalaliMonth());
    setTermId("");
    setFrom("");
    setTo("");
    startTransition(() => router.push(pathname));
  }

  function exportCsv(type: "income" | "expenses" | "profit") {
    const params = new URLSearchParams(sp.toString());
    params.set("type", type);
    // برای نمای کلی نوع profit
    window.location.href = `/api/reports/export?${params.toString()}`;
  }

  const months = lastJalaliMonths(12);

  return (
    <Card>
      <CardContent className="pt-4 space-y-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="space-y-1">
            <Label>بازه</Label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              <option value="month">ماه شمسی</option>
              <option value="term">ترم تحصیلی</option>
              <option value="custom">بازه دلخواه</option>
              <option value="all">همه زمان‌ها</option>
            </select>
          </div>

          {mode === "month" && (
            <div className="space-y-1 sm:col-span-2">
              <Label>ماه</Label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                {months.map((m) => (
                  <option key={m} value={m}>{m.replace("/", " / ")}</option>
                ))}
              </select>
            </div>
          )}

          {mode === "term" && (
            <div className="space-y-1 sm:col-span-2">
              <Label>ترم</Label>
              <select
                value={termId}
                onChange={(e) => setTermId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                <option value="">— انتخاب ترم —</option>
                {terms.map((t) => (
                  <option key={t.id} value={String(t.id)}>{t.name}</option>
                ))}
              </select>
              {terms.length === 0 && <p className="text-xs text-muted-foreground">ترمی ثبت نشده</p>}
            </div>
          )}

          {mode === "custom" && (
            <>
              <div className="space-y-1">
                <Label>از تاریخ (۱۴۰۴/۰۶/۰۱)</Label>
                <Input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="۱۴۰۴/۰۶/۰۱" dir="ltr" />
              </div>
              <div className="space-y-1">
                <Label>تا تاریخ</Label>
                <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="۱۴۰۴/۰۶/۳۱" dir="ltr" />
              </div>
            </>
          )}

          {mode === "all" && (
            <div className="sm:col-span-2 flex items-end text-sm text-muted-foreground">
              همه تراکنش‌ها بدون فیلتر زمانی
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={apply} disabled={isPending} size="sm">
            {isPending ? "در حال اعمال…" : "اعمال فیلتر"}
          </Button>
          <Button variant="outline" onClick={clear} size="sm">پاک کردن</Button>
          <span className="mx-2 hidden sm:inline text-muted-foreground">|</span>
          <Button variant="outline" size="sm" onClick={() => exportCsv("income")} title="خروجی شهریه‌ها">
            Excel شهریه
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportCsv("expenses")}>
            Excel حقوق
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            چاپ
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

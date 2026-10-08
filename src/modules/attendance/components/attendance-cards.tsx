"use client";

// کارت‌های ثبت حضور و غیاب (F5) — ۳ دکمه + «همه حاضر» (U5) · دلیل موجه اجباری
// کلیک دوباره روی وضعیت فعال = برداشتن انتخاب → رکورد حذف و «ثبت‌نشده» می‌شود (AC4)
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormMessage, SubmitButton } from "@/components/shared/form";
import { setAttendanceAction } from "../actions/attendance.actions";

const STATUS_OPTIONS = [
  {
    value: "PRESENT",
    label: "حاضر",
    active: "border-emerald-500 bg-emerald-500/15 font-bold text-emerald-700",
  },
  {
    value: "ABSENT",
    label: "غایب",
    active: "border-destructive bg-destructive/15 font-bold text-destructive",
  },
  {
    value: "EXCUSED",
    label: "موجه",
    active: "border-amber-500 bg-amber-500/15 font-bold text-amber-700",
  },
] as const;

type Status = (typeof STATUS_OPTIONS)[number]["value"];

export function AttendanceCards({
  sessionId,
  students,
  initial,
}: {
  sessionId: number;
  students: { id: number; fullName: string }[];
  initial: Record<number, { status: Status; note?: string }>;
}) {
  const [state, formAction] = useActionState(setAttendanceAction, {});
  const [records, setRecords] = useState<
    Record<number, { status: Status | null; note: string }>
  >(() =>
    Object.fromEntries(
      students.map((s) => [
        s.id,
        initial[s.id]
          ? { status: initial[s.id].status, note: initial[s.id].note ?? "" }
          : { status: null, note: "" },
      ]),
    ),
  );

  function setStatus(id: number, status: Status) {
    setRecords((prev) => ({
      ...prev,
      [id]: { ...prev[id], status: prev[id].status === status ? null : status },
    }));
  }

  function setNote(id: number, note: string) {
    setRecords((prev) => ({ ...prev, [id]: { ...prev[id], note } }));
  }

  function markAllPresent() {
    setRecords((prev) =>
      Object.fromEntries(
        Object.entries(prev).map(([id, r]) => [
          id,
          { ...r, status: "PRESENT" as const },
        ]),
      ),
    );
  }

  const entries = Object.entries(records)
    .filter(([, r]) => r.status !== null)
    .map(([id, r]) => ({
      studentId: Number(id),
      status: r.status,
      note: r.status === "EXCUSED" ? r.note.trim() || undefined : undefined,
    }));

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="sessionId" value={sessionId} />
      <input type="hidden" name="entries" value={JSON.stringify(entries)} />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{students.length} هنرجو</p>
        <Button type="button" variant="outline" size="sm" onClick={markAllPresent}>
          ✓ همه حاضر
        </Button>
      </div>

      {students.map((s) => {
        const r = records[s.id];
        return (
          <div key={s.id} className="space-y-2 rounded-lg border p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold">{s.fullName}</span>
              {r.status === null ? (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  ثبت‌نشده
                </span>
              ) : null}
              <div className="ms-auto flex gap-1">
                {STATUS_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setStatus(s.id, o.value)}
                    className={`rounded-md border px-3 py-1 text-sm ${
                      r.status === o.value ? o.active : ""
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            {r.status === "EXCUSED" ? (
              <input
                value={r.note}
                onChange={(e) => setNote(s.id, e.target.value)}
                placeholder="دلیل موجه * — مثلاً: امتحان مدرسه"
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
              />
            ) : null}
          </div>
        );
      })}

      <FormMessage
        error={state.error}
        success={state.success}
        successText="حضور و غیاب ثبت شد ✓"
      />
      <SubmitButton className="w-full">ذخیره حضور و غیاب</SubmitButton>
    </form>
  );
}

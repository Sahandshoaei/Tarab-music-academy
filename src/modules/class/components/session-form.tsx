"use client";

// فرم ویرایش تک‌جلسه (F4-AC7) + دکمه لغو جلسه — استفاده در صفحه جلسه
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage, SubmitButton } from "@/components/shared/form";
import { cancelSessionAction, updateSessionAction } from "../actions/class.actions";

const selectCls =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs";

export function SessionForm({
  session,
  rooms,
  teachers,
}: {
  session: {
    id: number;
    date: string; // شمسی «۱۴۰۵/۰۶/۲۰»
    startTime: string;
    endTime: string;
    roomId: number;
    teacherId: number;
    notes: string | null;
  };
  rooms: { id: number; name: string }[];
  teachers: { id: number; fullName: string }[];
}) {
  const [state, formAction] = useActionState(updateSessionAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="sessionId" value={session.id} />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="ss-date">تاریخ (شمسی) *</Label>
          <Input
            id="ss-date"
            name="date"
            defaultValue={session.date}
            placeholder="۱۴۰۵/۰۶/۲۰"
            dir="ltr"
            className="text-right"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ss-start">ساعت شروع *</Label>
          <Input
            id="ss-start"
            name="startTime"
            defaultValue={session.startTime}
            dir="ltr"
            className="text-right"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ss-end">ساعت پایان *</Label>
          <Input
            id="ss-end"
            name="endTime"
            defaultValue={session.endTime}
            dir="ltr"
            className="text-right"
            required
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ss-room">اتاق *</Label>
          <select
            id="ss-room"
            name="roomId"
            defaultValue={String(session.roomId)}
            className={selectCls}
          >
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="ss-teacher">استاد این جلسه *</Label>
          <select
            id="ss-teacher"
            name="teacherId"
            defaultValue={String(session.teacherId)}
            className={selectCls}
          >
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.fullName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ss-notes">یادداشت (اختیاری)</Label>
        <Input id="ss-notes" name="notes" defaultValue={session.notes ?? ""} />
      </div>

      <FormMessage error={state.error} success={state.success} successText="جلسه به‌روزرسانی شد ✓" />
      <SubmitButton className="w-full">ذخیره تغییرات این جلسه</SubmitButton>
    </form>
  );
}

export function SessionCancelForm({ sessionId }: { sessionId: number }) {
  return (
    <form
      action={cancelSessionAction}
      onSubmit={(e) => {
        if (!window.confirm("این جلسه لغو شود؟ (جلسات گذشته/آینده دیگر سری تحت تأثیر نیستند)"))
          e.preventDefault();
      }}
    >
      <input type="hidden" name="sessionId" value={sessionId} />
      <Button type="submit" variant="destructive" size="sm">
        لغو این جلسه
      </Button>
    </form>
  );
}

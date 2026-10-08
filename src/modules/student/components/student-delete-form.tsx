"use client";

// حذف کامل هنرجوی بدون‌داده (استثنای مصوب فاز ۶ — سند طراحی §۱.۵)
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/shared/form";
import { deleteStudentAction } from "../actions/student.actions";

export function StudentDeleteForm({
  studentId,
  studentName,
}: {
  studentId: number;
  studentName: string;
}) {
  const [state, formAction] = useActionState(deleteStudentAction, {});

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (
          !window.confirm(`حذف کامل «${studentName}»؟ این عمل قابل بازگشت نیست.`)
        )
          e.preventDefault();
      }}
      className="space-y-2"
    >
      <input type="hidden" name="studentId" value={studentId} />
      <Button type="submit" variant="destructive" size="sm">
        حذف کامل هنرجو
      </Button>
      <FormMessage error={state.error} />
    </form>
  );
}

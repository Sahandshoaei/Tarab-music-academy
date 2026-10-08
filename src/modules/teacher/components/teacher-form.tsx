"use client";

// فرم استاد (F3 + پروفایل تکمیلی فاز ۶)
import { useActionState, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage, SubmitButton } from "@/components/shared/form";
import { createTeacherAction, updateTeacherAction } from "../actions/teacher.actions";

export interface TeacherFormProps {
  instruments: { id: number; name: string }[];
  teacher?: {
    id: number;
    fullName: string;
    phone: string;
    notes?: string | null;
    instrumentIds: number[];
    birthDate?: string | null; // شمسی
    resumeImageUrl?: string | null;
    insuranceType?: string | null;
    insuranceNumber?: string | null;
    teachingExperienceYears?: number | null;
    teachingExperienceNote?: string | null;
    isQualified?: boolean;
    qualificationNote?: string | null;
    cardNumber?: string | null;
    sheba?: string | null;
  };
}

export function TeacherForm({ instruments, teacher }: TeacherFormProps) {
  const action = teacher ? updateTeacherAction : createTeacherAction;
  const [state, formAction] = useActionState(action, {});
  const [qualified, setQualified] = useState(!!teacher?.isQualified);

  return (
    <form action={formAction} className="space-y-4">
      {teacher ? <input type="hidden" name="teacherId" value={teacher.id} /> : null}

      <div className="space-y-2">
        <Label htmlFor="t-name">نام و نام‌خانوادگی *</Label>
        <Input id="t-name" name="fullName" defaultValue={teacher?.fullName} placeholder="مثلاً: استاد کریمی" required />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="t-phone">شماره موبایل *</Label>
          <Input id="t-phone" name="phone" defaultValue={teacher?.phone} placeholder="۰۹۱۲ · · · · · · ·" dir="ltr" className="text-right" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="t-birth">تاریخ تولد (شمسی)</Label>
          <Input id="t-birth" name="birthDate" defaultValue={teacher?.birthDate ?? ""} placeholder="۱۳۷۰/۰۱/۱۵" dir="ltr" className="text-right" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>ساز(های) تدریسی * — چند انتخاب مجاز (F3-AC1)</Label>
        <div className="flex flex-wrap gap-x-4 gap-y-2 rounded-md border p-3">
          {instruments.map((i) => (
            <label key={i.id} className="flex items-center gap-1.5 text-sm">
              <input type="checkbox" name="instrumentIds" value={i.id} defaultChecked={teacher?.instrumentIds.includes(i.id)} className="size-4 accent-primary" />
              {i.name}
            </label>
          ))}
        </div>
      </div>

      {/* رزومه */}
      <div className="space-y-2">
        <Label>عکس رزومه</Label>
        {teacher?.resumeImageUrl ? (
          <a href={teacher.resumeImageUrl} target="_blank" rel="noopener noreferrer" className="block">
            {teacher.resumeImageUrl.endsWith(".pdf") ? (
              <span className="inline-flex rounded border bg-muted px-3 py-2 text-xs">مشاهده PDF رزومه</span>
            ) : (
              <img src={teacher.resumeImageUrl} alt="رزومه" className="max-h-40 rounded border object-contain" />
            )}
          </a>
        ) : null}
        <input type="file" name="resume" accept="image/jpeg,image/png,image/webp,application/pdf" className="block w-full text-sm file:me-2 file:rounded-md file:border file:bg-muted file:px-3 file:py-1" />
        <p className="text-xs text-muted-foreground">jpg / png / webp / pdf — حداکثر ۵ MB — خالی بگذارید تا بدون تغییر بماند</p>
      </div>

      {/* بیمه */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>نوع بیمه</Label>
          <select name="insuranceType" defaultValue={teacher?.insuranceType ?? ""} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
            <option value="">— انتخاب —</option>
            <option value="TAMIN_EJTEMAEI">تامین اجتماعی</option>
            <option value="SALAMAT">سلامت</option>
            <option value="OTHER">سایر</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>شماره بیمه</Label>
          <Input name="insuranceNumber" defaultValue={teacher?.insuranceNumber ?? ""} placeholder="مثلاً ۱۲۳۴۵۶۷۸۹۰" dir="ltr" className="text-right" />
        </div>
      </div>

      {/* سابقه */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>سابقه تدریس (سال)</Label>
          <Input name="teachingExperienceYears" defaultValue={teacher?.teachingExperienceYears != null ? String(teacher.teachingExperienceYears) : ""} placeholder="مثلاً ۸" dir="ltr" className="text-right" />
        </div>
        <div className="space-y-2">
          <Label>توضیح سابقه</Label>
          <Input name="teachingExperienceNote" defaultValue={teacher?.teachingExperienceNote ?? ""} placeholder="مثلاً: ۸ سال تدریس پیانو" />
        </div>
      </div>

      {/* صلاحیت */}
      <div className="space-y-2 rounded-md border p-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isQualified" defaultChecked={teacher?.isQualified} onChange={(e) => setQualified(e.target.checked)} className="size-4 accent-primary" />
          صلاحیت تدریس تأیید شده
        </label>
        {qualified ? (
          <div className="space-y-2 pt-2">
            <Label>توضیح صلاحیت</Label>
            <Input name="qualificationNote" defaultValue={teacher?.qualificationNote ?? ""} placeholder="مثلاً: دارای مدرک مربیگری درجه ۲" />
          </div>
        ) : (
          <input type="hidden" name="qualificationNote" value={teacher?.qualificationNote ?? ""} />
        )}
      </div>

      {/* کارت و شبا */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>شماره کارت (۱۶ رقم)</Label>
          <Input name="cardNumber" defaultValue={teacher?.cardNumber ?? ""} placeholder="۶۲۱۹۸۶۱۰••••••••" dir="ltr" className="text-right" />
        </div>
        <div className="space-y-2">
          <Label>شماره شبا (IR...)</Label>
          <Input name="sheba" defaultValue={teacher?.sheba ?? ""} placeholder="IR120120000000..." dir="ltr" className="text-right" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="t-notes">یادداشت (اختیاری)</Label>
        <Input id="t-notes" name="notes" defaultValue={teacher?.notes ?? ""} />
      </div>

      <FormMessage error={state.error} success={state.success} />
      <SubmitButton className="w-full">{teacher ? "ذخیره تغییرات" : "ثبت استاد"}</SubmitButton>
    </form>
  );
}

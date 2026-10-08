"use client";

// فرم هنرجو (ثبت/ویرایش) — F2-AC1..AC4 · تاریخ شمسی (D20) · چند ساز
import { useActionState, useState } from "react";
import type { ReferralSource } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage, SubmitButton } from "@/components/shared/form";
import { referralSourceLabels } from "@/lib/constants";
import { todayJalali } from "@/lib/jalali";
import { createStudentAction, updateStudentAction } from "../actions/student.actions";

export interface StudentFormProps {
  instruments: { id: number; name: string }[];
  student?: {
    id: number;
    fullName: string;
    nationalId: string;
    phone: string;
    guardianPhone: string;
    address?: string | null;
    registrationDate: string; // شمسی «۱۴۰۵/۰۶/۱۵»
    referralSource?: ReferralSource | null;
    referralNote?: string | null;
    notes?: string | null;
    instrumentIds: number[];
  };
}

export function StudentForm({ instruments, student }: StudentFormProps) {
  const action = student ? updateStudentAction : createStudentAction;
  const [state, formAction] = useActionState(action, {});
  const [referral, setReferral] = useState(student?.referralSource ?? "");

  return (
    <form action={formAction} className="space-y-4">
      {student ? <input type="hidden" name="studentId" value={student.id} /> : null}

      <div className="space-y-2">
        <Label htmlFor="s-name">نام و نام‌خانوادگی *</Label>
        <Input
          id="s-name"
          name="fullName"
          defaultValue={student?.fullName}
          placeholder="مثلاً: آرش کاظمی"
          required
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="s-nid">کد ملی *</Label>
          <Input
            id="s-nid"
            name="nationalId"
            defaultValue={student?.nationalId}
            placeholder="۱۰ رقم"
            dir="ltr"
            className="text-right"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="s-reg">تاریخ ثبت‌نام (شمسی) *</Label>
          <Input
            id="s-reg"
            name="registrationDate"
            defaultValue={student?.registrationDate ?? todayJalali()}
            placeholder="۱۴۰۵/۰۶/۱۵"
            dir="ltr"
            className="text-right"
            required
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="s-phone">موبایل هنرجو *</Label>
          <Input
            id="s-phone"
            name="phone"
            defaultValue={student?.phone}
            placeholder="۰۹۱۲ · · · · · · ·"
            dir="ltr"
            className="text-right"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="s-guardian">موبایل قوم نزدیک *</Label>
          <Input
            id="s-guardian"
            name="guardianPhone"
            defaultValue={student?.guardianPhone}
            placeholder="۰۹۱۲ · · · · · · ·"
            dir="ltr"
            className="text-right"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>ساز(های) مورد علاقه * — چند انتخاب مجاز (F2-AC4)</Label>
        <div className="flex flex-wrap gap-x-4 gap-y-2 rounded-md border p-3">
          {instruments.map((i) => (
            <label key={i.id} className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                name="instrumentIds"
                value={i.id}
                defaultChecked={student?.instrumentIds.includes(i.id)}
                className="size-4 accent-primary"
              />
              {i.name}
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="s-referral">منبع آشنایی (اختیاری)</Label>
          <select
            id="s-referral"
            name="referralSource"
            value={referral}
            onChange={(e) => setReferral(e.target.value as ReferralSource | "")}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
          >
            <option value="">— نامشخص —</option>
            {Object.entries(referralSourceLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        {referral === "OTHER" ? (
          <div className="space-y-2">
            <Label htmlFor="s-referral-note">توضیح منبع (برای «سایر») *</Label>
            <Input
              id="s-referral-note"
              name="referralNote"
              defaultValue={student?.referralNote ?? ""}
              placeholder="مثلاً: سایت آموزشگاه"
            />
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="s-address">آدرس (اختیاری)</Label>
        <Input id="s-address" name="address" defaultValue={student?.address ?? ""} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="s-notes">یادداشت (اختیاری)</Label>
        <Input id="s-notes" name="notes" defaultValue={student?.notes ?? ""} />
      </div>

      <FormMessage
        error={state.error}
        success={state.success}
        successText={student ? "تغییرات ذخیره شد ✓" : "هنرجو ثبت شد ✓"}
      />
      <SubmitButton className="w-full">
        {student ? "ذخیره تغییرات" : "ثبت هنرجو"}
      </SubmitButton>
    </form>
  );
}

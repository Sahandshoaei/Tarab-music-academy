"use client";

import { useActionState, useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormMessage, SubmitButton } from "@/components/shared/form";
import { sendSmsAction } from "../actions/sms.actions";

type Template = { id: number; title: string; body: string };
type Cls = { id: number; title: string | null; instrument: { name: string } };
type Inst = { id: number; name: string };
type Student = { id: number; fullName: string };

const VARIABLES = ["{نام هنرجو}", "{نام آموزشگاه}", "{نام کلاس}", "{نام استاد}", "{روز کلاس}", "{ساعت کلاس}"];

function countParts(t: string) {
  return Math.max(1, Math.ceil([...t].length / 70));
}

export function ComposeForm({
  templates,
  classes,
  instruments,
  students,
}: {
  templates: Template[];
  classes: Cls[];
  instruments: Inst[];
  students: Student[];
}) {
  const [state, formAction] = useActionState(sendSmsAction, {});
  const [audienceType, setAudienceType] = useState("INDIVIDUAL");
  const [body, setBody] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  function applyTemplate(id: string) {
    setSelectedTemplateId(id);
    const t = templates.find((x) => String(x.id) === id);
    if (t) setBody(t.body);
  }

  const preview = useMemo(() => {
    return body.replaceAll("{نام هنرجو}", "سارا نمونه").replaceAll("{نام آموزشگاه}", "آموزشگاه موسیقی").replaceAll("{نام کلاس}", "پیانو گروهی").replaceAll("{نام استاد}", "استاد کریمی").replaceAll("{روز کلاس}", "دوشنبه").replaceAll("{ساعت کلاس}", "۱۶:۰۰");
  }, [body]);

  return (
    <form action={formAction} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">۱ — گیرندگان</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>شیوه انتخاب *</Label>
              <select name="audienceType" value={audienceType} onChange={(e) => setAudienceType(e.target.value)} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
                <option value="INDIVIDUAL">تک‌تک (انتخاب دستی)</option>
                <option value="CLASS">کلاس</option>
                <option value="INSTRUMENT">ساز</option>
                <option value="ALL_ACTIVE">همه فعال</option>
                <option value="DYNAMIC">فیلتر هوشمند</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>شماره مقصد *</Label>
              <select name="phoneTarget" defaultValue="STUDENT" className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
                <option value="STUDENT">شماره خود هنرجو</option>
                <option value="GUARDIAN">شماره قوم نزدیک</option>
              </select>
            </div>
          </div>

          {audienceType === "INDIVIDUAL" ? (
            <div className="space-y-2">
              <Label>هنرجویان (چند انتخاب)</Label>
              <div className="max-h-40 overflow-auto rounded-md border p-2">
                {students.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 py-1 text-sm">
                    <input type="checkbox" name="studentIds" value={s.id} className="size-4 accent-primary" />
                    {s.fullName}
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          {audienceType === "CLASS" ? (
            <div className="space-y-2">
              <Label>کلاس</Label>
              <select name="audienceValue" className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
                <option value="">— انتخاب —</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title || c.instrument.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {audienceType === "INSTRUMENT" ? (
            <div className="space-y-2">
              <Label>ساز</Label>
              <select name="audienceValue" className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
                <option value="">— انتخاب —</option>
                {instruments.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {audienceType === "DYNAMIC" ? (
            <div className="space-y-2">
              <Label>فیلتر هوشمند</Label>
              <select name="audienceValue" className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
                <option value="absent_today">غایبان امروز (F5)</option>
                <option value="no_active_class">بدون کلاس فعال</option>
                <option value="debtors">
                  بدهکاران (قسط سررسید گذشته)
                </option>
              </select>
            </div>
          ) : null}

          {audienceType !== "INDIVIDUAL" && audienceType !== "DYNAMIC" ? <input type="hidden" name="audienceValue" value="" /> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">۲ — قالب و متن</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>عنوان ارسال *</Label>
            <Input name="label" placeholder="مثلاً: اطلاع غیبت — پیانو گروهی" required />
          </div>
          <div className="space-y-2">
            <Label>قالب (اختیاری)</Label>
            <select value={selectedTemplateId} onChange={(e) => applyTemplate(e.target.value)} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
              <option value="">— بدون قالب، متن آزاد —</option>
              {templates
                .filter((t) => t)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
            </select>
            <input type="hidden" name="templateId" value={selectedTemplateId} />
          </div>
          <div className="space-y-2">
            <Label>متن پیام *</Label>
            <textarea name="body" value={body} onChange={(e) => setBody(e.target.value)} rows={5} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" placeholder="سلام {نام هنرجو}..." required />
            <div className="flex flex-wrap gap-1">
              {VARIABLES.map((v) => (
                <Button key={v} type="button" variant="outline" size="sm" onClick={() => setBody((p) => (p ? p + " " + v : v))} className="h-7 text-xs">
                  {v}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              پیش‌نمایش: {preview} — {countParts(preview)} بخش · هر بخش ۷۰ کاراکتر فارسی
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-amber-500/50 bg-amber-500/5">
        <CardContent className="pt-4 text-sm">
          <p>ارسال گروهی قابل بازگشت نیست — تعداد گیرنده و بخش‌ها قبل از ارسال تأیید می‌شود.</p>
        </CardContent>
      </Card>

      <FormMessage error={state.error} success={state.success} />
      <SubmitButton className="w-full">ارسال پیامک</SubmitButton>
    </form>
  );
}

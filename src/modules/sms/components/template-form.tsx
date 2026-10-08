"use client";

import { useActionState, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FormMessage, SubmitButton } from "@/components/shared/form";
import { createTemplateAction, updateTemplateAction } from "../actions/template.actions";

const VARIABLES = ["{نام هنرجو}", "{نام آموزشگاه}", "{نام کلاس}", "{نام استاد}", "{روز کلاس}", "{ساعت کلاس}"] as const;

export function TemplateForm({
  template,
}: {
  template?: { id: number; title: string; body: string; isActive: boolean };
}) {
  const action = template ? updateTemplateAction : createTemplateAction;
  const [state, formAction] = useActionState(action, {});
  const [body, setBody] = useState(template?.body ?? "");

  function insertVar(v: string) {
    setBody((prev) => (prev ? prev + " " + v : v));
  }

  return (
    <form action={formAction} className="space-y-4">
      {template ? <input type="hidden" name="id" value={template.id} /> : null}
      <div className="space-y-2">
        <Label>عنوان قالب *</Label>
        <Input name="title" defaultValue={template?.title} placeholder="مثلاً: اطلاع غیبت" required />
      </div>
      <div className="space-y-2">
        <Label>متن قالب *</Label>
        <textarea name="body" value={body} onChange={(e) => setBody(e.target.value)} rows={4} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" placeholder="سلام {نام هنرجو} عزیز..." required />
        <div className="flex flex-wrap gap-1">
          {VARIABLES.map((v) => (
            <Button key={v} type="button" variant="outline" size="sm" onClick={() => insertVar(v)} className="h-7 text-xs">
              {v}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">با کلیک، متغیر به انتهای متن اضافه می‌شود.</p>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isActive" defaultChecked={template?.isActive ?? true} className="size-4 accent-primary" />
        فعال
      </label>
      <FormMessage error={state.error} success={state.success} successText="ذخیره شد ✓" />
      <SubmitButton className="w-full">{template ? "ذخیره تغییرات" : "ایجاد قالب"}</SubmitButton>
    </form>
  );
}

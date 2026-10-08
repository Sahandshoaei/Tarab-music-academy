"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { FormMessage, SubmitButton } from "@/components/shared/form";
import { createInstrumentAction } from "../actions/instrument.actions";

export function InstrumentForm() {
  const [state, formAction] = useActionState(createInstrumentAction, {});
  return (
    <form action={formAction} className="flex items-start gap-2">
      <div className="flex-1 space-y-1">
        <Input name="name" placeholder="نام ساز جدید… (مثل: تار)" required />
        <FormMessage error={state.error} success={state.success} successText="افزوده شد ✓" />
      </div>
      <SubmitButton className="mt-0.5">＋ افزودن</SubmitButton>
    </form>
  );
}

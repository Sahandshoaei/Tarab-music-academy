"use client";

// کامپوننت‌های مشترک فرم‌ها: پیام خطا/موفقیت + دکمه ثبت + هدر صفحه
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { cn } from "cn";

export function SubmitButton({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className={className}>
      {pending ? "در حال ذخیره…" : children}
    </Button>
  );
}

export function FormMessage({
  error,
  success,
  successText = "با موفقیت ثبت شد ✓",
}: {
  error?: string;
  success?: boolean;
  successText?: string;
}) {
  if (error) {
    return (
      <p
        role="alert"
        className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
      >
        {error}
      </p>
    );
  }
  if (success) {
    return (
      <p className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600">
        {successText}
      </p>
    );
  }
  return null;
}

export function PageHeader({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-xl font-bold tracking-tight">{title}</h1>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

/** برچسب وضعیت فعال/غیرفعال */
export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs",
        active
          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600"
          : "border-muted bg-muted text-muted-foreground",
      )}
    >
      {active ? "فعال" : "غیرفعال"}
    </span>
  );
}

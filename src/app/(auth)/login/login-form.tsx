"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/modules/auth/actions";

export function LoginForm({ initialError }: { initialError?: string }) {
  const [error, formAction, pending] = useActionState(
    loginAction,
    initialError,
  );

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 text-4xl">🎸</div>
        <CardTitle className="text-xl">پنل مدیریت آموزشگاه</CardTitle>
        <CardDescription>برای ورود، ایمیل و رمز عبور را وارد کنید</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">ایمیل</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="admin@school.local"
              dir="ltr"
              autoComplete="username"
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">رمز عبور</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          {error ? (
            <p
              role="alert"
              className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "در حال ورود…" : "ورود"}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            نشست فقط با «خروج» منقضی می‌شود
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

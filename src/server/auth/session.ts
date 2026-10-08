// ═══════════════════════════════════════════════════════════════════════════
//  Session Helpers — گاردهای سمت سرور برای Server Actions و صفحات
//  الگوی استاندارد همه اکشن‌های فاز ۶:
//    const session = await requireAdmin();  // خط اول هر اکشن
// ═══════════════════════════════════════════════════════════════════════════
import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";

export type { Session };

/**
 * نشست ادمین را برمی‌گرداند؛ بدون نشست → ریدایرکت به صفحه ورود (F1-AC3).
 * خط اولِ هر Server Action ماژول‌ها.
 *
 * نکته: Session از خود next-auth import می‌شود — استخراج از ReturnType<typeof auth>
 * اشتباه است چون auth دو overload دارد (فراخوانی مستقیم + wrapper میدل‌ور) و
 * ReturnType نسخه میدل‌ور را برمی‌گرداند.
 */
export async function requireAdmin(): Promise<Session> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

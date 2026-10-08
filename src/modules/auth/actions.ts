// ═══════════════════════════════════════════════════════════════════════════
//  Server Actions احراز هویت (F1)
// ═══════════════════════════════════════════════════════════════════════════
"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";

/**
 * ورود با ایمیل/رمز — خروجی: پیام خطا (string) یا ریدایرکت در صورت موفقیت
 * F1-AC2: پیام عمومی — مشخص نمی‌کند ایمیل اشتباه است یا رمز
 */
export async function loginAction(
  _prev: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/");

  if (!email || !password) {
    return "ایمیل و رمز عبور را وارد کنید.";
  }

  try {
    await signIn("credentials", { email, password, redirectTo });
  } catch (error) {
    if (error instanceof AuthError) {
      // لاگ سمت سرور برای عیب‌یابی (پیام کاربر عمومی می‌ماند — F1-AC2)
      console.error(
        "[login] AuthError:",
        error.type ?? "unknown",
        "| message:",
        error.message?.slice(0, 120) ?? "-",
      );
      // F1-AC2 — پیام یکسان برای همه حالت‌های شکست
      return "ایمیل یا رمز عبور نادرست است.";
    }
    throw error; // NEXT_REDIRECT (موفقیت) باید عبور کند
  }
}

/** خروج دستی — تنها راه انقضای نشست (F1-AC4) */
export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

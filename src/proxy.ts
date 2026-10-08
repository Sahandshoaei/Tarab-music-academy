// ═══════════════════════════════════════════════════════════════════════════
//  Proxy (جانشین Middleware در Next 16) — F1-AC3: بدون ورود، دسترسی به هیچ صفحه‌ای از پنل ممکن نیست
// ═══════════════════════════════════════════════════════════════════════════
import { auth } from "@/lib/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // 1.2 — هدرهای امنیتی برای همه پاسخ‌ها (جلوگیری از MIME sniff و کلیک‌جک)
  const applySecurityHeaders = (res: Response) => {
    res.headers.set("X-Content-Type-Options", "nosniff");
    res.headers.set("X-Frame-Options", "DENY");
    res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    return res;
  };

  // صفحه ورود عمومی است — ولی اگر قبلاً وارد شده، به پنل هدایت شود
  if (pathname.startsWith("/login")) {
    if (req.auth) {
      return applySecurityHeaders(Response.redirect(new URL("/", req.nextUrl)));
    }
    return;
  }

  // بقیه مسیرها: بدون نشست → ریدایرکت به ورود (F1-AC3)
  if (!req.auth) {
    return applySecurityHeaders(Response.redirect(new URL("/login", req.nextUrl)));
  }

  // برای درخواست‌های عادی، هدرها در NextResponse بعدی اعمال می‌شود (در layout هم می‌توان اضافه کرد)
});

export const config = {
  // همه‌چیز به‌جز فایل‌های استاتیک Next، مسیرهای خود Auth.js و health عمومی
  matcher: ["/((?!api/auth|api/health|_next/static|_next/image|favicon.ico).*)"],
};

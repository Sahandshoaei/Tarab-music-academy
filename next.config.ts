import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // دامنه پیش‌نمایش sandbox (e2b) — بدون این، Next در حالت dev درخواست‌های
  // cross-origin (شامل Server Action ورود) از دامنه پیش‌نمایش را می‌بندد.
  // فقط برای توسعه است؛ روی Vercel اثری ندارد.
  allowedDevOrigins: ["*.e2b.app"],

  // 1.2 — هدرهای امنیتی سراسری (جلوگیری از MIME sniff و کلیک‌جک روی uploads)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        // uploads: مطمئن شو مرورگر PDF/JPG را اجرا نکند
        source: "/uploads/(.*)",
        headers: [{ key: "X-Content-Type-Options", value: "nosniff" }],
      },
    ];
  },
};

export default nextConfig;

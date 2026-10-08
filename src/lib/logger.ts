// 4.5 — لاگر سبک (pino-like) — بدون نیاز به Sentry در MVP
// در production می‌توان pino یا Sentry را جایگزین کرد؛ فعلاً console با سطح‌بندی

type LogLevel = "debug" | "info" | "warn" | "error";

function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const ts = new Date().toISOString();
  const base = { time: ts, level, msg: message, ...meta };
  // در dev همه لاگ‌ها، در prod فقط warn/error
  const isDev = process.env.NODE_ENV !== "production";
  if (!isDev && (level === "debug" || level === "info")) return;
  // به جای console.log مستقیم، JSON ساختاریافته — قابل ارسال به Sentry/ELK
  const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  fn(JSON.stringify(base));
}

export const logger = {
  debug: (meta: Record<string, unknown>, msg: string) => log("debug", msg, meta),
  info: (meta: Record<string, unknown>, msg: string) => log("info", msg, meta),
  warn: (meta: Record<string, unknown>, msg: string) => log("warn", msg, meta),
  error: (meta: Record<string, unknown>, msg: string) => log("error", msg, meta),
  // سازگار با pino: logger.info("msg", meta)
  // overload ساده برای فراخوانی logger.info("hello")
  // استفاده: logger.info({ userId }, "کاربر وارد شد")
};

// helper برای لاگ خطای Prisma — قابل اتصال به Sentry در آینده
export function logPrismaError(err: unknown, context: string) {
  logger.error({ err: err instanceof Error ? err.message : String(err), context }, `prisma:${context}`);
}

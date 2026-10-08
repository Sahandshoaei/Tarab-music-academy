// ═══════════════════════════════════════════════════════════════════════════
//  Auth.js (NextAuth v5) — F1: احراز هویت ادمین
//  استراتژی: JWT رمزنگاری‌شده در کوکی (تصمیم D21 — تأیید صاحب پروژه)
//  • F1-AC2: خطای عمومی — authorize فقط null برمی‌گرداند، دلیل افشا نمی‌شود
//  • F1-AC4: نشست فقط با خروج دستی منقضی می‌شود (maxAge = یک سال)
//  • ۱.۳ — Rate Limit: ۵ تلاش / ۱۵ دقیقه برای هر ایمیل (جلوگیری از brute force)
// ═══════════════════════════════════════════════════════════════════════════
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// — Rate Limit حافظه‌ای (per-instance) — برای MVP کافی است، در مقیاس بالا Redis
const loginAttempts = new Map<string, { count: number; first: number; blockedUntil?: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function isRateLimited(key: string): boolean {
  const rec = loginAttempts.get(key);
  if (!rec) return false;
  const now = Date.now();
  if (rec.blockedUntil && now < rec.blockedUntil) return true;
  if (now - rec.first > WINDOW_MS) {
    loginAttempts.delete(key);
    return false;
  }
  if (rec.count >= MAX_ATTEMPTS) {
    rec.blockedUntil = now + WINDOW_MS;
    return true;
  }
  return false;
}
function recordAttempt(key: string, success: boolean) {
  if (success) {
    loginAttempts.delete(key);
    return;
  }
  const now = Date.now();
  const rec = loginAttempts.get(key);
  if (!rec || now - rec.first > WINDOW_MS) {
    loginAttempts.set(key, { count: 1, first: now });
  } else {
    rec.count++;
    if (rec.count >= MAX_ATTEMPTS) rec.blockedUntil = now + WINDOW_MS;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,

  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 365, // F1-AC4 — یک سال؛ خروج فقط دستی
  },

  pages: {
    signIn: "/login",
  },

  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.sub) (session.user as unknown as { id: string }).id = token.sub;
      return session;
    },
  },

  providers: [
    Credentials({
      name: "ایمیل و رمز عبور",
      credentials: {
        email: { label: "ایمیل", type: "email" },
        password: { label: "رمز عبور", type: "password" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";

        if (!email || !password) return null;

        // ۱.۳ — Rate Limit
        if (isRateLimited(email)) {
          console.warn(`[auth] rate limited: ${email}`);
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email } });

        // F1-AC2: در همه حالت‌های شکست null برمی‌گردیم — پیام یکسان در UI
        if (!user || !user.isActive) { recordAttempt(email, false); return null; }
        if (user.role !== "ADMIN") { recordAttempt(email, false); return null; }
        if (!user.passwordHash) { recordAttempt(email, false); return null; }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) { recordAttempt(email, false); return null; }

        recordAttempt(email, true);
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
});

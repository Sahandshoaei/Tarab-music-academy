# music-school-admin 🎸

پنل مدیریت آموزشگاه موسیقی — توسعه داخلی (نه SaaS)

| | |
|---|---|
| **استک** | Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · shadcn/ui (RTL) · Prisma 6 · PostgreSQL |
| **پکیج منیجر** | pnpm |
| **مستندات پروژه** | پوشه [`docs/`](./docs) — نقشه راه، SRS، طراحی دیتابیس، وایرفریم |
| **مستندات معماری** | بخش «ساختار پروژه» پایین همین فایل |

---

## راه‌اندازی محلی

### پیش‌نیازها
- Node.js 20+
- pnpm — `npm i -g pnpm` (یا `corepack enable`)
- PostgreSQL 14+ در حال اجرا
  - 📖 **راهنمای گام‌به‌گام نصب PostgreSQL محلی (ویندوز/مک/لینوکس + عیب‌یابی): [`docs/setup-database.md`](./docs/setup-database.md)**

### مراحل

```bash
# ۱) نصب وابستگی‌ها
pnpm install

# ۲) فایل محیط را بسازید و DATABASE_URL را تنظیم کنید
cp .env.example .env

# ۳) ساخت دیتابیس (اگر محلی است)
createdb music_school

# ۴) اعمال مایگریشن‌ها (شامل قیود دستی: ایندکس یکتای جزئی ترم فعال + pg_trgm)
pnpm db:deploy

# ۵) داده اولیه (تنظیمات + سازها + اتاق‌ها + ترم فعال + ادمین اولیه از env)
pnpm db:seed

# ۶) اجرای سرور توسعه
pnpm dev
```

سپس <http://localhost:3000> را باز کنید — صفحه وضعیت باید اتصال دیتابیس را با آمار seed نشان دهد.

### اسکریپت‌های پرکاربرد

| دستور | شرح |
|---|---|
| `pnpm dev` | سرور توسعه |
| `pnpm build` / `pnpm start` | ساخت و اجرای پروداکشن |
| `pnpm lint` / `pnpm typecheck` | کیفیت کد (در CI هم اجرا می‌شوند) |
| `pnpm db:migrate` | ساخت مایگریشن جدید (توسعه) |
| `pnpm db:deploy` | اعمال مایگریشن‌ها (CI/پروداکشن) |
| `pnpm db:seed` | داده اولیه (idempotent) |
| `pnpm db:seed:demo` | داده دمو: ۴ استاد + ۱۲ هنرجو — بعد از db:seed، فقط محیط توسعه |
| `pnpm db:studio` | Prisma Studio — مرور دیتابیس |

---

## ساختار پروژه (معماری ماژولار — Feature-based)

```
music-school-admin/
├── docs/                       # مستندات پروژه (نقشه راه، طراحی‌ها، SRS)
│   └── design/                 # وایرفریم‌ها و ERD (آرتیفکت‌های فاز ۳ و ۴)
├── prisma/
│   ├── schema.prisma           # تک منبع حقیقت مدل داده (۲۳ مدل)
│   ├── migrations/             # مایگریشن‌ها + قیود دستی SQL
│   └── seed.ts                 # داده اولیه idempotent
├── public/                     # images/ · icons/
├── src/
│   ├── app/                    # صفحات — فقط لایه نمایش (App Router)
│   │   ├── (auth)/login/       # گروه صفحات احراز هویت (بدون پوسته پنل)
│   │   ├── (dashboard)/        # گروه صفحات پنل (با پوسته: سایدبار + نوار بالا)
│   │   │   └── …/new · /[id] · /[id]/edit   # الگوی روت هر موجودیت
│   │   └── api/                # auth/ · health/ (مانیتورینگ)
│   ├── modules/                # ⭐ ماژول‌های فیچر —actions/→ services/→ repositories/
│   │   └── …                   # (آناتومی: README داخل پوشه)
│   ├── components/             # ui/ (shadcn) · shared/ (مشترک‌ها) · layout/ (پوسته)
│   ├── lib/                    # prisma.ts · auth.ts · utils.ts · constants.ts (برچسب‌ها)
│   ├── server/                 # server-only: auth/session.ts (guards) · permissions/ · db/
│   ├── config/                 # navigation.ts (منوی پنل) · site.ts
│   ├── validations/            # اعتبارسنج‌های مشترک بین ماژول‌ها
│   └── hooks/ · types/         # ابزارهای مشترک
├── src/proxy.ts                # محافظت مسیرها (F1-AC3) — جانشین middleware در Next 16
└── .github/workflows/ci.yml    # CI: مایگریشن + تست + lint + typecheck + build
```

**جریان وابستگی (قانون معماری — داخل هر ماژول):**

```
صفحه/فرم → modules/<feature>/actions/ → services/ → repositories/ → lib/prisma.ts
```

- صفحات هرگز مستقیماً Prisma را صدا نمی‌زنند
- منطق کسب‌وکار فقط در `services/` هر ماژول
- `repositories/` تنها نقطه تماس با Prisma است
- جزئیات کامل: `src/modules/README.md`

---

## CI

GitHub Actions روی هر push/PR: نصب با pnpm → اعمال مایگریشن روی PostgreSQL تمیز (سرویس کانتینری) → lint → typecheck → build.

## دیپلوی (فاز ۷)

Vercel (اپ) + Neon/Supabase (دیتابیس) — `DATABASE_URL` در متغیرهای محیطی Vercel.

## ⚠️ قبل از اولین push

```bash
git config user.name  "نام شما"
git config user.email "ایمیل شما"
```

کامیت‌های اولیه با هویت جایگزین ساخته شده‌اند — `git commit --amend --reset-author` اگر می‌خواهید اصلاح شود.

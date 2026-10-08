# ماژول‌ها (Feature Modules)

هر فیچر/دامنه، یک ماژول مستقل — **قانون معماری حفظ شده، فقط خانه‌اش عوض شده**:

```
app/(dashboard)/…  →  modules/<feature>/actions/  →  services/  →  repositories/  →  lib/prisma.ts
      (صفحه/فرم)              (Server Actions نازک)   (منطق کسب‌وکار)  (دسترسی داده)     (Prisma)
```

## آناتومی استاندارد هر ماژول (پوشه‌های جمع)

```
modules/<feature>/
├── components/      # کامپوننت‌های اختصاصی همین ماژول (فرم، لیست، کارت…)
├── actions/         # Server Actions — نازک؛ فقط فرم→سرویس و ترجمه خطا
├── services/        # منطق کسب‌وکار + اعتبارسنجی سمت سرور (قواعد SRS اینجا زندگی می‌کنند)
├── repositories/    # فقط CRUD و کوئری — تنها نقطه تماس با Prisma
├── schemas/         # Zod schemaهای فرم‌های همین ماژول
├── types/           # تایپ‌های اختصاصی ماژول (برخی ماژول‌ها)
└── utils/           # ابزارهای اختصاصی ماژول (برخی ماژول‌ها)
```

> هر ماژول فقط پوشه‌هایی را دارد که به آن‌ها نیاز دارد (مثلاً `instrument` نیاز به `types/` ندارد).

## قواعد

- صفحات هرگز مستقیماً Prisma یا repository را صدا نمی‌زنند — از actions ماژول
- **خط اول هر Server Action:** `const session = await requireAdmin()` (از `server/auth/session`)
- منطق کسب‌وکار فقط در `services/` (تشخیص تداخل F4، اعتبارسنجی F2 و…)
- خطاهای دامنه در service تعریف می‌شوند (مثل `SchedulingConflictError`)
- اعتبارسنج‌های مشترک بین ماژول‌ها → `src/validations/` (نه داخل یک ماژول)
- برچسب‌های فارسی enum ها → `src/lib/constants.ts` (تک منبع حقیقت متن‌ها)
- کامپوننت‌های مشترک بین ماژول‌ها → `src/components/shared/`
- `server/` فقط زیرساخت است (session guards، permissions، ابزار db) — نه منطق فیچر

## وضعیت فعلی (فاز ۶)

| ماژول | وضعیت |
|---|---|
| `auth/` | ✅ فعال — actions.ts (login/logout) — خارج از آناتومی بالا چون فقط یک اکشن دارد |
| `dashboard/` | ✅ فعال — queries.ts (خواندن تجمیعی بدون قاعده کسب‌وکار) |
| `student/` `teacher/` `instrument/` `term/` `room/` | ✅ ایست ۱ |
| `class/` `schedule/` `settings/` | ✅ ایست ۲ (بخش اول — F4) |
| `attendance/` | ✅ ایست ۲ (F5) |
| `finance/` | ⏸ MVP-2 |
| `sms/` | ✅ MVP-3 — Adapter کاوه‌نگار REST + Mock توسعه، قالب‌ها، ارسال و تاریخچه |

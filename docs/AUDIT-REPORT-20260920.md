# گزارش عیب‌یابی و نواقص پروژه — آموزشگاه موسیقی طرب
**تاریخ:** ۳۰ شهریور ۱۴۰۵ — 2026-09-20  
**نسخه پروژه:** `3a7e09a` (هدر سراسری + گرید استاد/هنرجو + لوگوی طلایی)  
**تهیه‌کننده:** منتور مهندسی — بررسی کل کد (۱۴۶ فایل src + Prisma + Auth + SMS)  
**سبک:** سبک و کاربردی — فقط نکته‌های قابل‌اقدام

> نمره کلی: **۷.۵ / ۱۰** — اسکلت تمیز و ماژولار، MVP-1 حدود ۹۰٪ کامل. ایرادها «بدهی فنی» است نه ساختاری.

---

## ✅ نقطه‌قوت — حفظ کن
- معماری `modules/<feature>/{actions,service,repository,schemas}` + `proxy.ts` برای Next 16 تمیز و مقیاس‌پذیر.
- Prisma: Soft Delete با `isActive`، ایندکس‌های درست (`class_sessions_date`, `room/date`, `enrollments/student`)، ذخیره `HH:mm` و `Date @db.Date`.
- Auth.js v5 + bcrypt + JWT یک‌ساله + `proxy` محافظ همه مسیرها جز `api/health`.
- پالت کرم-گردویی `oklch` + Vazirmatn لوکال + دارک‌مود یکدست + لوگوی شفاف/طلایی.

---

## 🔴 بحرانی — قبل از تحویل واقعی باید فیکس شود

### ۱) ولیدیشن کد ملی خیلی سخت‌گیرانه
`src/validations/validators.ts:isValidNationalId` الگوریتم وزن‌دار `sum%11` را چک می‌کند.
- همین الان `4281422532` رد می‌شود: `sum=192 remainder=5 → باید 6 باشد نه 2`.
- برای محیط دمو/تست باید شل شود.

**پیشنهاد:** موقتاً فقط ` /^\d{10}$/ ` چک کن یا وایت‌لیست:
```ts
if(process.env.NODE_ENV!=="production") return /^\d{10}$/.test(nid)
```

### ۲) باگ حضور «نیمه‌ثبت» در مرورگر حضور
`src/modules/attendance/queries.ts:listAttendanceSessions({pendingOnly:true})`
```ts
attendance: { none: {} } // فقط صفر ثبت را می‌گیرد
```
ولی کلاس ۳ نفره با ۱ ثبت را «کامل» حساب می‌کند — همان باگی که در داشبورد فیکس شد (`att.length < enroll.length`).

### ۳) تایم‌زون تهران
`todayUtcDate()` با `Date.UTC(...getDate())` می‌سازد (UTC). کاربر `Asia/Tehran (+3:30)` است → جلسه ۰۰:۱۵ ممکن است یک روز جابه‌جا بیفتد.
**راه حل:** `Intl.DateTimeFormat` با `timeZone:"Asia/Tehran"` یا `date-fns-tz`.

### ۴) کندی داشبورد با دیتای زیاد
`getDashboardKpis` همه `pastSessions` را `findMany` کرده و در حافظه `filter` می‌کند. برای ۱۰K جلسه RAM می‌ترکد.
**راه حل:** `groupBy` + `having count(attendance) < count(enrollments)` سمت DB.

### ۵) SMS فقط Mock
`src/modules/sms/adapters/sms-provider.ts:getSmsProvider()` همیشه `MockSmsProvider` برمی‌گرداند. پروداکشن بدون Kavenegar/Ghasedak ارسال ندارد. `TODO` باقی مانده.

---

## 🟡 مهم — در اسپرینت بعد

| # | محل | ایراد | اقدام |
|---|-----|-------|-------|
| ۶ | `getStudents`, `listAttendanceSessions.slice(0,100)` | بدون pagination — ۲۰۰۰ هنرجو یکجا لود | `take/skip + count` |
| ۷ | `getStudentAttendanceProfile` | N+1 — برای هر کلاس جدا `enrollment+attendance` | یک `include` دسته‌جمعی |
| ۸ | `/login` | بدون Rate Limit — brute-force باز | `upstash/ratelimit` یا حافظه ساده |
| ۹ | `.env.example` | `AUTH_SECRET=""` خالی → هر ری‌استارت کوکی قبلی باطل | `zod` ولیدیشن + `openssl rand -base64 32` اجباری |
| ۱۰ | کل اپ | `loading.tsx / error.tsx / not-found.tsx` نیست → خطای DB صفحه سفید `digest 2799400919` | سه فایل fallback بساز |
| ۱۱ | تست | فقط `validators.test.ts` (۱۳ تست) | حداقل ۳۰ تست برای `student.service`, `weekly-sessions` + اجرای `vitest` در CI |

---

## 🟢 پیشنهادی — بدهی فنی سبک

- `console.error` → `pino` logger
- `allowedDevOrigins: ["*.e2b.app"]` فقط dev — برای پروداکشن جدا کن
- `toPersianDigits` پراکنده → `formatTimeFa`, `formatSheba` بساز
- `PageHeader` فقط `title` دارد → breadcrumb `هنرجویان › آرش کاظمی` اضافه کن
- آپلود فیش فعلاً `imageUrl` روی دیسک — برای پروداکشن `R2/S3` بگذار
- `ThemeToggle` با `localStorage` فلش SSR دارد → `next-themes` بهتر است
- `StudentReceipt/TeacherReceipt` مبلغ `Int` تومان — برای رقم‌های بزرگ `BigInt` فکر کن

---

## اولویت منتور (نقشه راه ۳ روزه)

**روز ۱:** فیکس ۲+۳+۴ (حضور + تایم‌زون + کندی)  
**روز ۲:** pagination + Rate Limit + `loading/error`  
**روز ۳:** سوئیچ SMS به Kavenegar + تست‌ها → زیپ پروداکشن

با همین ۳ روز پروژه از «دموی تمیز» به «قابل تحویل واقعی» تبدیل می‌شود.

---

### پیوست — فایل‌های کلیدی بررسی‌شده
`prisma/schema.prisma` (۱۷ ایندکس) · `src/lib/auth.ts` · `src/proxy.ts` · `src/lib/jalali.ts` · `src/validations/validators.ts` · `src/modules/student/*` · `src/modules/attendance/queries.ts` · `src/app/(dashboard)/layout.tsx` · `docs/ROADMAP.md`

> آماده‌ای تیک‌تاک مورد ۱ (کد ملی) را الان با هم شل کنیم؟

# سند طراحی دیتابیس (فاز ۳) — سامانه مدیریت آموزشگاه موسیقی

**نسخه سند:** ۱.۰ | **تاریخ:** شهریور ۱۴۰۵ (سپتامبر ۲۰۲۶)
**مراجع:** `01-project-proposal.md` · `02-srs.md`
**وضعیت:** آماده پیاده‌سازی — اسکیما با `prisma validate` ✅ تأیید شده است

---

## خروجی‌های این فاز

| فایل | شرح |
|---|---|
| `prisma/schema.prisma` | اسکیمای کامل Prisma — ۲۳ مدل، ۱۱ enum (MVP-1 کامل + پیش‌نمایش MVP-2 و MVP-3) |
| `docs/design/erd/school-erd.svg` | دیاگرام ER کامل (وکتور — برای زوم و چاپ) |
| `docs/design/erd/school-erd.png` | همان دیاگرام در قالب تصویر |
| `docs/design/erd/generate_erd.py` | اسکریپت تولید دیاگرام (برای بازتولید پس از تغییر اسکیما) |
| همین سند | تصمیمات طراحی، نگاشت نیازمندی‌ها، قواعد سرویس، ایندکس‌ها |

**اسکیما با موفقیت اعتبارسنجی و SQL آن بازبینی شد:** ۲۰ جدول، ۸ نوع enum، ۲۸ ایندکس/کلید یکتا — بدون خطا.

---

## ۱. تصمیم‌های معماری کلیدی

این تصمیمات ستون فقرات طراحی‌اند و دلیل هرکدام مهم‌تر از خودِ تصمیم است:

### ۱.۱ — جداسازی «حساب کاربری» از «پروفایل کسب‌وکار»
مدل `User` (احراز هویت Auth.js) از مدل‌های `Teacher` و `Student` (داده کسب‌وکار) **جدا** است و با فیلد اختیاریِ یکتای `userId` به آن‌ها وصل می‌شود. `User.role` از نوع enum (`ADMIN/TEACHER/STUDENT`) است.
**چرا؟** طبق پروپوزال §۲.۴، پنل استاد و هنرجو فازهای بعدی‌اند اما «مدل داده از ابتدا طوری طراحی شود که افزودن این نقش‌ها نیاز به بازطراحی اساسی نداشته باشد». با این جداسازی، فعال‌سازی پنل استاد یعنی فقط پرکردن `Teacher.userId` — بدون مایگریشن ساختاری.

### ۱.۲ — تفکیک `Class` (سری کلاس) از `ClassSession` (جلسه) — قلب طراحی F4
«کلاس» = تعریف ثابت سری (نوع، استاد، ساز، هنرجویان، اتاق پیش‌فرض، الگوی تکرار). «جلسه» = هر رخداد واقعی تقویمی با تاریخ/ساعت مشخص خودش.
**چرا؟** سه نیازمندی هم‌زمان فقط با این مدل جواب می‌دهند:
- تولید خودکار جلسات سری هفتگی تا پایان ترم (F4-AC1)
- ثبت جلسه‌به‌جلسه (AD_HOC) با همان ساختار (F4-AC2)
- **بازنویسی/لغو تک‌جلسه بدون دست‌زدن به بقیه سری (F4-AC7)** — جلسه رکورد مستقلی است؛ تغییرش روی سری اثر ندارد. فیلد `isOverridden` هم مشخص می‌کند جلسه دستی تغییر کرده تا در بازتولیدهای بعدی سری، بازنویسی نشود.

### ۱.۳ — غیرنرمال‌سازی عمدی `roomId` و `teacherId` روی `ClassSession`
این دو فیلد علاوه بر `Class`، روی هر جلسه هم تکرار می‌شوند (پیش‌فرض: از کلاس کپی می‌شوند).
**چرا؟** ۱) جابه‌جایی تک‌جلسه می‌تواند اتاق/استاد متفاوت داشته باشد؛ ۲) **تشخیص تداخل (F4-AC3/AC4) با یک کوئری تکی روی همین جدول** انجام می‌شود بدون join؛ ۳) جایگزینی استاد برای یک جلسه خاص در آینده ممکن می‌شود.

### ۱.۴ — `Enrollment` به‌عنوان جدول واسط صریح
رابطه چند‌به‌چند کلاس↔هنرجو با جدول واسط صریح (نه implicit Prisma) با کلید یکتای `(classId, studentId)` و فیلد `isActive`. خروج هنرجو از کلاس = `isActive=false`؛ ثبت‌نام مجدد = فعال‌سازی همان رکورد. سابقه حفظ می‌شود.

### ۱.۵ — Soft Delete سراسری با `isActive`
حذف فیزیکی در هیچ‌کدام از جداول دامنه مجاز نیست (F2-AC7، F3-AC4): هنرجو، استاد، ساز، اتاق، کلاس همگی فیلد `isActive` دارند. سابقه کلاس‌ها، حضور و غیاب و داده مالی همیشه سالم می‌ماند.
**استثنای مصوب فاز ۶ (F2):** حذف کامل هنرجو فقط وقتی مجاز است که هیچ سابقه‌ای (ثبت‌نام، حضور، مالی، پیامک) نداشته باشد — برای اصلاح ثبت اشتباه/تستی؛ سرویس گارد می‌گذارد و با اولین رکورد وابسته این مسیر برای همیشه بسته می‌شود.

### ۱.۶ — مقادیر مشتق‌شده ذخیره نمی‌شوند
طبق تأکید هر دو سند قبلی، این موارد **ستون ندارند** و در لایه سرویس محاسبه می‌شوند (بخش ۶.۵):
- «نوع کلاس‌های هنرجو» و «جلسات گذشته/باقی‌مانده ترم» → از `Enrollment` + `ClassSession` + ترم فعال
- «وضعیت قسط» (پرداخت‌شده/نشده/دیرکرد) → از `PaymentInstallment` + `dueDate` (MVP-2)
- «جلسه برگزار‌شده» → `date < امروز` و `status = SCHEDULED`

### ۱.۷ — زمان‌ها به فرمت رشته `"HH:mm"` (صفرپرشده)
مثلاً `"09:00"`. چون فرمت ثابت و صفرپرشده است، **مقایسه رشته‌ای دقیقاً معادل مقایسه زمانی است** (`"09:15" < "09:30"`) — منطق تشخیص تداخل و اعتبارسنجی بازه کاری ساده می‌شود و از دردسر نوع `Time` در JS/Prisma راحتیم. `date` جدا و از نوع `Date` نگهداری می‌شود.

### ۱.۸ — تنظیمات آموزشگاه در دیتابیس، نه Hardcode
ساعت شروع/پایان و روزهای تعطیل در جدول تک‌ردیفی `SchoolSettings` نگهداری می‌شوند نه در کد — چون بین دو سند ناسازگاری هست (بخش ۹) و باید بدون تغییر کد قابل اصلاح باشد.

### ۱.۹ — MVP-2 (مالی) از الان در اسکیما هست
مدل‌های `Invoice`، `Installment`، `Payment`، `PaymentInstallment` با کامنت و مرز مشخص «MVP-2» در اسکیما آمده‌اند تا فاز مالی بدون بازطراحی شروع شود. طبق SRS-F6 طراحی جزئی‌شان (تخفیف، روش پرداخت، فرمت فاکتور) به جلسه ابتدای MVP-2 موکول است. مایگریشن و پیاده‌سازی این بخش در همان فاز انجام می‌شود.

---

## ۲. دیاگرام ERD

فایل اصلی: **`erd/school-erd.svg`** (وکتور — برای دیدن جزئیات زوم کنید). نقشه رنگ‌ها: بنفش‌سرمه‌ای = احراز هویت، سبزآبی = اشخاص و سازها، کهربایی = ترم/اتاق/تنظیمات، آبی = زمان‌بندی (فیچر هسته‌ای)، بنفش = حضور و غیاب، خاکستری خط‌چین = MVP-2.

نمای فشرده روابط (Mermaid — در GitHub رندر می‌شود):

```mermaid
erDiagram
    USER ||--o{ ACCOUNT : ""
    USER ||--o{ SESSION : ""
    USER |o--o| TEACHER : "پروفایل - فاز آینده"
    USER |o--o| STUDENT : "پروفایل - فاز آینده"

    TEACHER ||--o{ TEACHER_INSTRUMENT : ""
    INSTRUMENT ||--o{ TEACHER_INSTRUMENT : ""
    STUDENT ||--o{ STUDENT_INSTRUMENT : ""
    INSTRUMENT ||--o{ STUDENT_INSTRUMENT : ""

    TEACHER ||--o{ CLASS : "دقیقا یک استاد"
    ROOM ||--o{ CLASS : "اتاق پیشفرض"
    INSTRUMENT ||--o{ CLASS : "ساز کلاس"
    TERM ||--o{ CLASS : ""

    CLASS ||--o{ CLASS_SESSION : "تولید جلسات"
    ROOM ||--o{ CLASS_SESSION : "اتاق جلسه"
    TEACHER ||--o{ CLASS_SESSION : "استاد جلسه"

    CLASS ||--o{ ENROLLMENT : ""
    STUDENT ||--o{ ENROLLMENT : "ثبتنام"

    CLASS_SESSION ||--o{ ATTENDANCE : ""
    STUDENT ||--o{ ATTENDANCE : ""
    USER |o--o{ ATTENDANCE : "ثبتکننده"

    STUDENT ||--o{ INVOICE : ""
    TERM ||--o{ INVOICE : ""
    INVOICE ||--o{ INSTALLMENT : ""
    STUDENT ||--o{ PAYMENT : ""
    PAYMENT ||--o{ PAYMENT_INSTALLMENT : ""
    INSTALLMENT ||--o{ PAYMENT_INSTALLMENT : ""
```

> در دیاگرام کامل، فیلدهای هر جدول با نشان‌های PK (کلید اصلی)، FK (کلید خارجی)، UQ (یکتا) مشخص شده‌اند. چند فیلد توضیحی کم‌اهمیت (مثل `notes`) برای خوانایی از دیاگرام حذف شده‌اند — مرجع نهایی، خود `schema.prisma` است.

---

## ۳. کاتالوگ موجودیت‌ها

### ۳.۱ دامنه احراز هویت (F1)

| مدل | شرح | نکات کلیدی |
|---|---|---|
| `User` | حساب کاربری سیستم | `email` یکتا · `passwordHash` (Argon2/Bcrypt) · `role` از enum — پیش‌فرض `ADMIN` |
| `Account` / `Session` / `VerificationToken` | اسکیمای استاندارد Adapter دی Auth.js | با Credentials Provider شاید بلافاصله استفاده نشوند، ولی برای Session دیتابیسی/OAuth آینده نگه داشته شده‌اند |

### ۳.۲ دامنه اشخاص و سازها (F2، F3)

| مدل | فیلدهای کلیدی | نکات کلیدی |
|---|---|---|
| `Instrument` | `name` یکتا، `sortOrder` | لیست سازها توسط ادمین تعریف می‌شود (F3-AC2) |
| `Teacher` | `fullName`, `phone`, `userId?` یکتا, `isActive` | Soft Delete (F3-AC4) · آماده اتصال به `User` برای پنل آینده |
| `Student` | `fullName`, `nationalId` **یکتا**, `phone`, `guardianPhone`, `address?`, `registrationDate`, `referralSource?`, `isActive` | کد ملی یکتا در سطح دیتابیس (F2-AC3) · اعتبارسنجی فرمت شماره‌ها در سرویس (F2-AC2) |
| `TeacherInstrument` | PK ترکیبی `(teacherId, instrumentId)` | چند‌به‌چند استاد↔ساز |
| `StudentInstrument` | PK ترکیبی `(studentId, instrumentId)` | چند‌به‌چند هنرجو↔ساز (F2-AC4) |

### ۳.۳ دامنه ترم، اتاق و تنظیمات (F0)

| مدل | فیلدهای کلیدی | نکات کلیدی |
|---|---|---|
| `Term` | `name`, `startDate`, `endDate`, `isActive` | «حداکثر یک ترم فعال» با ایندکس یکتای جزئی در سطح دیتابیس تضمین می‌شود (F0-AC2 — بخش ۷) |
| `Room` | `name` یکتا, `isActive` | — |
| `SchoolSettings` | `openTime`, `closeTime`, `closedDays: Weekday[]` | تک‌ردیفی (`id=1`) · مرجع اعتبارسنجی بازه کاری (F4-AC5) |

### ۳.۴ دامنه زمان‌بندی (F4) — فیچر هسته‌ای

| مدل | فیلدهای کلیدی | نکات کلیدی |
|---|---|---|
| `Class` | `type`, `scheduleType`, `teacherId`, `roomId`, `instrumentId`, `termId`, `weekday?`, `startTime?`, `endTime?`, `isActive` | `weekday/startTime/endTime` فقط برای `WEEKLY` پر می‌شوند (اعتبارسنجی شرطی در سرویس) · `isActive=false` = لغو کل سری |
| `ClassSession` | `classId`, `date`, `startTime`, `endTime`, `roomId`, `teacherId`, `status`, `isOverridden` | یک رکورد به‌ازای هر جلسه واقعی تقویمی — تولیدشده یا دستی |
| `Enrollment` | `(classId, studentId)` یکتا, `isActive`, `enrolledAt` | واسط کلاس↔هنرجو با حفظ سابقه خروج/بازگشت |

### ۳.۵ دامنه حضور و غیاب (F5)

| مدل | فیلدهای کلیدی | نکات کلیدی |
|---|---|---|
| `Attendance` | `(sessionId, studentId)` یکتا, `status`, `recordedById?`, `recordedAt` | نبودِ رکورد = «ثبت‌نشده» (F5-AC4) · ثبت فقط برای جلسات گذشته (اعتبارسنجی در سرویس — F5-AC2) |

### ۳.۶ دامنه مالی (MVP-2 — پیش‌تعریف)

| مدل | فیلدهای کلیدی | نکات کلیدی |
|---|---|---|
| `Invoice` | `studentId`, `termId`, `totalAmount` | وضعیت فاکتور (پرداخت‌شده/جزئی/نشده) مشتق می‌شود |
| `Installment` | `invoiceId`, `amount`, `dueDate`, `position` | `@@index([dueDate])` برای گزارش «بدهکاران» (F6-AC4) |
| `Payment` | `studentId`, `amount`, `method?`, `paidAt` | یک پرداخت می‌تواند چند قسط را پوشش دهد |
| `PaymentInstallment` | PK `(paymentId, installmentId)`, `appliedAmount` | تخصیص مبلغ پرداخت به اقساط — طرح دقیق در جلسه MVP-2 نهایی می‌شود |

### ۳.۷ دامنه پیامک (MVP-3 — پیش‌تعریف، مرجع کامل: `05-sms-feature.md`)

| مدل | فیلدهای کلیدی | نکته طراحی |
|---|---|---|
| `SmsTemplate` | `title` یکتا، `body`، `isActive` | «عنوان‌های مختلف» = قالب‌ها؛ متن با متغیرهای `{نام هنرجو}` و… |
| `SmsBatch` | `label`، `audienceType`، `totalCount`، `sentById` | هر عمل ارسال (حتی تک‌نفره) = یک دسته — audit یکنواخت |
| `SmsMessage` | `batchId`، `studentId`، `phone`، `phoneTarget`، `templateId?`، `body`، `status`، `providerRef?` | `body` = Snapshot متن نهایی (متغیرها جایگزین‌شده) — مستقل از تغییر قالب‌ها در آینده |

**Enums:** `SmsStatus` · `SmsAudienceType` · `SmsRecipientPhone` — **فیلدهای جدید SchoolSettings:** `smsProvider` · `smsApiKey` · `smsSenderLine` · `smsDefaultPhoneTarget`

---

## ۴. جدول کامل روابط

| # | رابطه | نوع | شرح / نیازمندی |
|---|---|---|---|
| 1 | User → Account, Session | 1:N | اسکیمای Auth.js |
| 2 | User ↔ Teacher, Student | 1:0..1 | اتصال پروفایل — فاز آینده (پروپوزال §۲.۴) |
| 3 | Teacher ↔ Instrument | N:M (واسط) | سازهای تدریسی (F3-AC1) |
| 4 | Student ↔ Instrument | N:M (واسط) | سازهای آموزشی (F2-AC4) |
| 5 | Teacher → Class | 1:N | دقیقاً یک استاد برای هر کلاس (پروپوزال §۴.۵) |
| 6 | Room → Class | 1:N | اتاق پیش‌فرض سری |
| 7 | Instrument → Class | 1:N | سازِ کلاس — پیش‌نیاز فیلتر اساتید در F3-AC3 |
| 8 | Term → Class | 1:N | بازه تولید جلسات (F0-AC3) |
| 9 | Class → ClassSession | 1:N | تولید/ثبت جلسات (F4-AC1, AC2) |
| 10 | Room → ClassSession | 1:N | اتاق واقعی جلسه (غیرنرمال، قابل بازنویسی) |
| 11 | Teacher → ClassSession | 1:N | استاد واقعی جلسه (غیرنرمال، قابل بازنویسی) |
| 12 | Class ↔ Student | N:M (واسط Enrollment) | ثبت‌نام با حفظ سابقه |
| 13 | ClassSession → Attendance | 1:N | یک رکورد به‌ازای هر هنرجوی هر جلسه |
| 14 | Student → Attendance | 1:N | تاریخچه به تفکیک هنرجو (F5-AC3) |
| 15 | User → Attendance | 0..1:N | ادمین ثبت‌کننده (audit) |
| 16–21 | روابط مالی MVP-2 | — | Invoice↔Student/Term، Installment↔Invoice، Payment↔Student، Payment↔Installment (واسط) |

---

## ۵. نگاشت نیازمندی‌ها به مدل داده (Traceability)

هدف: هر Acceptance Criterion بداند کجا پیاده می‌شود — **DB** (قید دیتابیس)، **SVC** (لایه سرویس)، **UI**.

| نیازمندی | مکانیزم | کجا |
|---|---|---|
| F1-AC1 ورود ایمیل/رمز | `User.email` + `passwordHash` | SVC (Auth.js) |
| F1-AC3 محافظت از همه صفحات | میان‌افزار احراز هویت | SVC |
| F1-AC4 نشست بدون انقضا | توکن Auth.js با انقضای بسیار طولانی / خروج دستی | SVC |
| F2-AC2 اعتبارسنجی فرمت تلفن‌ها | — | SVC |
| F2-AC3 کد ملی یکتا | `@@unique` روی `students.national_id` | **DB** |
| F2-AC4 چند ساز برای هنرجو | `StudentInstrument` | DB |
| F2-AC5 جستجوی هنرجو | ایندکس `full_name`/`phone` + `pg_trgm` (بخش ۷) | DB + SVC |
| F2-AC7 حذف نرم هنرجو | `students.is_active` | DB + SVC |
| F2-AC8 هنرجوی غیرفعال در انتخاب کلاس نباشد | فیلتر `isActive` در کوئری‌ها | SVC |
| F2-AC9 داده مشتق پروفایل | محاسبه از `Enrollment` + `ClassSession` | SVC (§۶.۵) |
| F3-AC2 لیست سازها قابل تعریف | جدول `Instrument` | DB |
| F3-AC3 فقط اساتید همان ساز | `Class.instrumentId` + فیلتر روی `TeacherInstrument` | SVC |
| F3-AC4 حذف نرم استاد | `teachers.is_active` | DB + SVC |
| F0-AC2 حداکثر یک ترم فعال | ایندکس یکتای جزئی `WHERE is_active` | **DB** (§۷) |
| F0-AC3 تولید تا پایان ترم فعال | `Term.endDate` + الگوریتم §۶.۲ | SVC |
| F4-AC1 سری هفتگی | `Class.scheduleType=WEEKLY` + `weekday/startTime/endTime` | DB + SVC |
| F4-AC2 جلسه‌به‌جلسه | `scheduleType=AD_HOC` + ثبت دستی `ClassSession` | DB + SVC |
| F4-AC3 تداخل استاد | کوئری §۶.۱ روی `(teacher_id, date)` | SVC + **DB ایندکس** |
| F4-AC4 تداخل اتاق | کوئری §۶.۱ روی `(room_id, date)` | SVC + **DB ایندکس** |
| F4-AC5 بازه کاری/روز تعطیل | `SchoolSettings` — اعتبارسنجی سمت سرور | SVC |
| F4-AC6 تقویم قابل فیلتر | ایندکس `class_sessions(date)` و `(room_id, date)` و `(teacher_id, date)` | DB |
| F4-AC7 بازنویسی/لغو تک‌جلسه | رکورد مستقل `ClassSession` + `isOverridden` | DB + SVC |
| F5-AC1 وضعیت حاضر/غایب/موجه | enum `AttendanceStatus` | DB |
| F5-AC2 فقط جلسات گذشته | چک `session.date <= today` (تصمیم ایست ۲: امروز مجاز — ثبت سر کلاس، U5) | SVC |
| F5-AC3 تاریخچه به تفکیک کلاس | ایندکس `attendances(student_id)` | DB + SVC |
| F5-AC4 «ثبت‌نشده» | نبودِ رکورد = ثبت‌نشده (پیش‌فرض null-safe) | طراحی |
| F6-AC1..AC5 | مدل‌های MVP-2 (§۳.۶) — طراحی نهایی در همان فاز | DB + SVC |

---

## ۶. قواعد و الگوریتم‌های سرویس

قواعدی که در دیتابیس قابل بیان نیستند و باید در لایه سرویس (server-side) اجرا شوند:

### ۶.۱ تشخیص تداخل (F4-AC3/AC4)
شرط تداخل دو جلسه در یک روز: `A.start < B.end AND B.start < A.end`. چون فرمت `"HH:mm"` صفرپرشده است، مقایسه رشته‌ای معتبر است:

```sql
-- قبل از ثبت/ویرایش هر جلسه:
SELECT id, room_id, teacher_id, start_time, end_time
FROM class_sessions
WHERE date = :new_date
  AND status = 'SCHEDULED'
  AND id != :exclude_id              -- هنگام ویرایش
  AND (room_id = :new_room_id OR teacher_id = :new_teacher_id)
  AND start_time < :new_end_time     -- رشته‌ای، ولی معادل زمانی
  AND :new_start_time < end_time;
-- اگر نتیجه‌ای برگشت → خطای تداخل (نمایش این کلاس تداخلی به ادمین)
```

> نکته: جلسات لغوشده (`CANCELLED`) در تداخل حساب نمی‌شوند. تداخل جلسه با جلسات «خودِ سری» هم طبیعتاً پوشش داده می‌شود (جابه‌جایی یک جلسه روی جلسه هم‌سری اشتباه است).

### ۶.۲ تولید جلسات سری هفتگی (F4-AC1)
```
برای کلاس WEEKLY از تاریخ max(شروع ترم فعال, امروز) تا پایان ترم فعال:
    اگر weekday(t) == class.weekday و weekday(t) ∉ settings.closedDays:
        INSERT ClassSession(classId, date=t, startTime, endTime,
                            roomId, teacherId, status=SCHEDULED, isOverridden=false)
```
هزینه این کار برای مقیاس پروژه (~۱۰ استاد، ۵۰ هنرجو) ناچیز است. قبل از INSERT همان چک تداخل §۶.۱ اجرا می‌شود.

### ۶.۳ لغو / بازنویسی تک‌جلسه و کل سری (F4-AC7)
- **تک‌جلسه:** ویرایش همان رکورد `ClassSession` (تاریخ/ساعت/اتاق) + `isOverridden=true`، یا `status=CANCELLED`. بقیه سری دست‌نخورده.
- **کل سری:** `Class.is_active = false` و (در سرویس) علامت‌گذاری جلسات آینده سری به‌عنوان `CANCELLED`.
- بازتولید جلسات سری در آینده: جلسات `isOverridden=true` یا `CANCELLED` دست نمی‌خورند.

### ۶.۴ اعتبارسنجی‌های ثبت کلاس/جلسه
1. زمان در بازه `settings.openTime..closeTime` (F4-AC5)
2. `weekday ∉ settings.closedDays` (برای سری) / `date` در روز تعطیل نباشد (برای جلسه)
3. `startTime < endTime`
4. کلاس `WEEKLY` فقط با ترم فعال ساخته می‌شود (F0-AC3) و `weekday/startTime/endTime` اجباری‌اند؛ کلاس `AD_HOC` این سه فیلد را `null` می‌گذارد
5. استاد انتخابی باید سازِ کلاس را تدریس کند (وجود رکورد در `TeacherInstrument` — F3-AC3)
6. کلاس `PRIVATE` دقیقاً یک `Enrollment` فعال دارد (کنترل در سرویس — ظرفیت کلاس گروهی طبق SRS خارج از MVP است)
7. فرمت شماره تلفن‌ها و کد ملی ۱۰ رقمی (F2-AC2/AC3)

### ۶.۵ مقادیر مشتق‌شده پروفایل هنرجو (F2-AC9)
```
نوع کلاس‌های هنرجو     = DISTINCT type از کلاس‌های دارای Enrollment فعالِ هنرجو در ترم فعال
جلسات گذشته‌ی ترم      = COUNT(s) که s.date < امروز AND s.status = SCHEDULED
جلسات باقی‌مانده‌ی ترم = COUNT(s) که s.date ≥ امروز AND s.status = SCHEDULED
```
(جلسه لغوشده نه «گذشته» است نه «باقی‌مانده».)

---

## ۷. ایندکس‌ها و قیود دیتابیس

### ایندکس‌های تعریف‌شده در اسکیما
| جدول | ایندکس | کاربرد |
|---|---|---|
| `students` | `UNIQUE(national_id)` · `(full_name)` · `(phone)` | یکتایی کد ملی + جستجو (F2-AC5) |
| `teachers` | `(phone)` | جستجو |
| `class_sessions` | `(date)` · `(room_id, date)` · `(teacher_id, date)` · `(class_id, date)` | تشخیص تداخل + تقویم (F4) |
| `enrollments` | `UNIQUE(class_id, student_id)` · `(student_id)` | جلوگیری از ثبت‌نام تکراری |
| `attendances` | `UNIQUE(session_id, student_id)` · `(student_id)` | یک رکورد به‌ازای جلسه/هنرجو |
| `installments` | `(invoice_id)` · `(due_date)` | گزارش بدهکاران (MVP-2) |
| `invoices` / `payments` | `(student_id)` · `(term_id)` | گزارش‌های مالی |

### قیود دستی (در مایگریشن — خارج از قدرت بیان Prisma)
بعد از `prisma migrate dev --create-only`، این دو را به فایل مایگریشن اضافه کنید و سپس `migrate dev` را اجرا کنید:

```sql
-- ۱) حداکثر یک ترم فعال (F0-AC2) — ایندکس یکتای جزئی:
CREATE UNIQUE INDEX "terms_one_active" ON "terms" ("is_active") WHERE "is_active" = true;

-- ۲) جستجوی متنی سریع روی نام/تلفن (F2-AC5):
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX "students_full_name_trgm" ON "students" USING gin ("full_name" gin_trgm_ops);
CREATE INDEX "students_phone_trgm"     ON "students" USING gin ("phone" gin_trgm_ops);
```

> **نکته نسخه Prisma:** اسکیما با سینتکس Prisma 5/6 نوشته و با `prisma@6 validate` تأیید شده است. اگر Prisma 7 استفاده می‌کنید، فقط `url` از بلوک `datasource` به `prisma.config.ts` منتقل می‌شود (تغییر مکانیکی کوچک؛ ساختار مدل‌ها بدون تغییر می‌ماند).

---

## ۸. داده اولیه (Seed)

برای اولین راه‌اندازی، این رکوردها لازم‌اند (در `prisma/seed.ts`):

| داده | نمونه |
|---|---|
| ادمین اولیه | یک `User` با `role=ADMIN` و رمز هش‌شده (از env خوانده شود) |
| سازهای پایه | گیتار، پیانو، ویولن، آواز، تنبک (قابل ویرایش) |
| اتاق‌ها | اتاق ۱، اتاق ۲، … (بسته به آموزشگاه) |
| تنظیمات | ردیف `SchoolSettings` با id=1 |
| ترم فعال | اگر آموزشگاه در وسط ترم شروع کند |

---

## ۹. تصمیم‌های باز و مغایرت‌های سند (⚠️ نیازمند تأیید کارفرما)

1. **ناسازگاری ساعت کاری بین دو سند** — مهم‌ترین مورد:
   - پروپوزال §۴.۴: «۰۹:۰۰ تا ۲۱:۰۰»
   - پروپوزال §۸ (فرضیات نهایی): «۱۶:۰۰ تا ۲۱:۰۰ ✅ تأیید شد»
   - SRS-F4-AC5: «۰۹:۰۰-۲۱:۰۰، شنبه تا چهارشنبه»

   **اقدام ما:** پیش‌فرض `SchoolSettings` طبق SRS (۰۹:۰۰–۲۱:۰۰، تعطیل پنجشنبه/جمعه) تنظیم شد و چون در دیتابیس است، ادمین بدون تغییر کد اصلاحش می‌کند. اما **این مورد باید با کارفرما نهایی شود** چون روی ظرفیت زمان‌بندی اثر مستقیم دارد.

2. **ظرفیت کلاس گروهی/نیمه‌گروهی** — طبق پروپوزال §۴.۶ خارج از MVP است؛ ساختار `Enrollment` افزودن فیلد `capacity` به `Class` را در فاز بعد ساده می‌کند.
3. **فاصله استراحت بین کلاس‌ها** — سندی ذکر نکرده؛ فعلاً تداخل یعنی هم‌پوشانی دقیق. اگر «۱۰ دقیقه فاصله» خواسته شود، فقط فرمول §۶.۱ با بافر می‌شود.
4. **MVP-2:** روش پرداخت (`PaymentMethod`)، تخفیف، فرمت فاکتور چاپی — طبق SRS-F6 به جلسه ابتدای فاز مالی موکول شد؛ مدل‌ها placeholder آماده دارند.
5. **یک فاکتور به‌ازای هر هنرجو در هر ترم؟** فعلاً قید یکتایی نگذاشتیم تا مانع صدور فاکتور جداگانه برای دو ساز نشود — در جلسه MVP-2 قطعی می‌شود.

---

## ۱۰. خلاصه آمار اسکیما

| شاخص | مقدار |
|---|---|
| مدل‌های MVP-1 | ۱۶ |
| مدل‌های MVP-2 (پیش‌تعریف) | ۴ |
| مدل‌های MVP-3 — پیامک (پیش‌تعریف) | ۳ |
| انواع enum | ۱۱ |
| جداول واسط صریح | ۵ (`TeacherInstrument`, `StudentInstrument`, `Enrollment`, `PaymentInstallment`, + Account) |
| کلیدهای یکتای کسب‌وکار | کد ملی هنرجو · ایمیل کاربر · نام ساز · نام اتاق · عنوان قالب پیامک · `(classId,studentId)` · `(sessionId,studentId)` |

---

**گام بعدی (فاز ۴):** وایرفریم صفحات حیاتی — فرم ثبت هنرجو، تقویم زمان‌بندی (جدول هفتگی اتاق/استاد)، و فرم حضور و غیاب جلسه.

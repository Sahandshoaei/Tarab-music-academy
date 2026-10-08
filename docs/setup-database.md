# راهنمای نصب و راه‌اندازی PostgreSQL محلی (راه B)

> این راهنما برای وقتی است که PostgreSQL را مستقیماً روی سیستم خودت نصب می‌کنی (بدون Docker).
> در پایان این راهنما، دیتابیس پروژه آماده است و فایل `.env` موجود **بدون هیچ تغییری** کار می‌کند.

**هدف نهایی:** کاربری با نام `school` (رمز `school`) + دیتابیس `music_school` — دقیقاً هماهنگ با `.env` پروژه:

```
DATABASE_URL="postgresql://school:school@localhost:5432/music_school?schema=public"
```

---

## ۱) نصب PostgreSQL — به تفکیک سیستم‌عامل

### 🪟 ویندوز

1. از [postgresql.org/download/windows](https://www.postgresql.org/download/windows/) نصب‌کننده **EDB** را دانلود کن (نسخه 16 یا 17)
2. در حین نصب:
   - **رمز کاربر `postgres` را که می‌پرسد، حتماً یادداشت کن** — بعداً لازمش داری
   - پورت را پیش‌فرض `5432` بگذار
   - کامپوننت‌های پیش‌فرض (شامل **pgAdmin**) را نگه دار
3. بعد از نصب، PostgreSQL به‌صورت سرویس ویندوز خودکار اجرا می‌شود
   (برای اطمینان: `Win+R` → `services.msc` → سرویسی مثل `postgresql-x64-16` باید Running باشد)
4. برای کار با ترمینال SQL: منوی استارت → **SQL Shell (psql)**

### 🍎 macOS

```bash
brew install postgresql@16
brew services start postgresql@16   # اجرای خودکار در بوت
```

> نکته مک: با Homebrew، سوپریوزر دیتابیس همان نام کاربری مک توست و برای اتصال محلی **نیازی به رمز ندارد** — با `psql postgres` مستقیم وارد می‌شوی.

### 🐧 لینوکس (Debian/Ubuntu)

```bash
sudo apt install postgresql
sudo systemctl enable --now postgresql
```

> نکته لینوکس: کاربر `postgres` فقط از طریق `sudo -u postgres psql` قابل ورود است (peer authentication).

---

## ۲) ساخت کاربر و دیتابیس پروژه

دو دستور SQL زیر را اجرا کن — **قانونی است و همه‌جا یکسان**:

```sql
CREATE USER school WITH PASSWORD 'school' CREATEDB;
CREATE DATABASE music_school OWNER school;
```

نحوه اجرا در هر سیستم‌عامل:

| سیستم‌عامل | روش |
|---|---|
| **ویندوز** | SQL Shell (psql) را باز کن → به همه سوالات اولیه Enter بزن **به‌جز Username** که `postgres` را وارد کن → رمز نصب را بزن → دو دستور بالا را اجرا کن |
| **مک** | `psql postgres -c "CREATE USER school WITH PASSWORD 'school' CREATEDB;"` سپس `psql postgres -c "CREATE DATABASE music_school OWNER school;"` |
| **لینوکس** | همان دستورات مک ولی با `sudo -u postgres psql -c "..."` |

**چرا کاربر جدا به‌جای خود `postgres`؟** اصل حداقل دسترسی — اپلیکیشن نباید با سوپریوزر دیتابیس اجرا شود.

**چرا `CREATEDB`؟** دستور `prisma migrate dev` (اسکریپت `pnpm db:migrate`) برای ساختن «shadow database» موقت به این دسترسی نیاز دارد — برای ساخت مایگریشن‌های جدید در آینده لازم است.

---

## ۳) آناتومی `DATABASE_URL` (وقتی چیزی فرق داشت)

```
postgresql://school:school@localhost:5432/music_school?schema=public
             └─┬──┘ └─┬──┘ └───┬───┘ └┬─┘ └────┬─────┘
             کاربر  رمز    هاست   پورت   نام دیتابیس
```

اگر چیز دیگری ساختی (مثلاً رمز قوی‌تر — که کار درستی است)، فقط همان بخش را در `.env` عوض کن. مثال با رمز متفاوت و کاربر پیش‌فرض:

```
DATABASE_URL="postgresql://postgres:MyStrongPass@localhost:5432/music_school?schema=public"
```

> 🔒 رمزهای قوی برای `school` محلی اشکالی ندارد ولی `.env` را هرگز commit نکن (در `.gitignore` همین پروژه حذف شده است).

---

## ۴) تست اتصال قبل از اجرای پروژه

```bash
psql -h localhost -U school -d music_school
# رمز: school
# اگر وارد شدی ✓ — با \q خارج شو
```

ویندوزی‌ها می‌توانند از SQL Shell استفاده کنند: به‌ترتیب `localhost` ← `music_school` ← `5432` ← `school` ← رمز `school`.

---

## ۵) اجرای مایگریشن و داده اولیه

در ریشه پروژه (ترمینال VS Code):

```bash
pnpm db:deploy   # ساخت ۲۳ جدول + قیود دستی (تغییرناپذیر و امن — فقط اعمال)
pnpm db:seed     # تنظیمات + ۶ ساز + ۳ اتاق + ترم فعال + ادمین اولیه
pnpm dev         # ↑ http://localhost:3000
```

**تأیید بصری — دو راه:**

```bash
pnpm db:studio   # Prisma Studio در مرورگر: localhost:5555 — مرور گرافیکی جداول
```

```bash
psql -h localhost -U school -d music_school -c "\dt"        # باید ۲۴ جدول ببینی
psql -h localhost -U school -d music_school -c "SELECT name FROM instruments;"  # ۶ ساز
```

---

## ۶) عیب‌یابی خطاهای رایج

| خطا | معنی | راه‌حل |
|---|---|---|
| `P1001: Can't reach database server` | سرویس PostgreSQL اجرا نیست | ویندوز: `services.msc` → سرویس postgresql → Start · مک: `brew services start postgresql@16` · لینوکس: `sudo service postgresql start` |
| `P1000: Authentication failed` | کاربر/رمز با `.env` نمی‌خواند | رمز را ریست کن: `ALTER USER school WITH PASSWORD 'school';` (با psql ادمین) یا `.env` را اصلاح کن |
| `P1003: Database does not exist` | دیتابیس ساخته نشده | دستور `CREATE DATABASE music_school OWNER school;` را اجرا کن |
| `psql: command not found` (ویندوز) | psql در PATH نیست | از SQL Shell استارت‌منو استفاده کن، یا `C:\Program Files\PostgreSQL\16\bin` را به PATH اضافه کن |
| پورت ۵۴۳۲ اشغال است | یک PostgreSQL دیگر (نسخه قدیمی‌تر) روی همان پورت | لینوکس: `pg_lsclusters` وضعیت را نشان می‌دهد · یا پورت را در `.env` مطابق نسخه فعال تغییر بده |
| رمز `postgres` ویندوز را فراموش کردم | — | در SQL Shell نمی‌توانی وارد شوی → با pgAdmin هم اگر ذخیره نشده باشد نمی‌شود؛ ساده‌ترین راه: نصب مجدد یا تغییر `pg_hba.conf` به حالت trust موقت — از من بپرس تا قدم‌به‌قدم انجامش بدهیم |

---

## ۷) روش گرافیکی جایگزین — pgAdmin

اگر با ترمینال راحت نیستی، **pgAdmin** (نصب‌شده همراه PostgreSQL ویندوز):

1. باز کن → رمز `postgres` نصب را (یک‌بار، برای ذخیره) وارد کن
2. درخت سمت چپ → Servers → PostgreSQL 16 → راست‌کلیک روی Databases → **Create → Database…** → نام: `music_school` → Owner: `school` *(کاربر school را باید قبلاً با Query Tool ساخته باشی: Tools → Query Tool → دو دستور SQL بخش ۲)*

---

## جمع‌بندی چک‌لیست

- [ ] PostgreSQL نصب است و سرویسش Running است
- [ ] کاربر `school` با رمز `school` ساخته شده
- [ ] دیتابیس `music_school` با owner برابر `school` ساخته شده
- [ ] `psql -h localhost -U school -d music_school` ورد می‌شود
- [ ] `pnpm db:deploy` و `pnpm db:seed` بدون خطا اجرا شدند
- [ ] صفحه `localhost:3000` آمار seed را نشان می‌دهد

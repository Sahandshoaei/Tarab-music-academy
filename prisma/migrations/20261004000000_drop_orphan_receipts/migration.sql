-- 1.1 — حذف جدول یتیم student_receipts (جایگزین شده با tuition_payments منعطف)
-- دیتای قدیمی اگر نیاز به مایگریشن داشت، قبل از DROP دستی INSERT کنید
DROP TABLE IF EXISTS "student_receipts" CASCADE;

-- 1.4 — تضمین حداکثر یک ترم فعال + ایندکس‌های جستجو

-- فقط یک ترم فعال (Partial Unique Index — قبلاً در کامنت بود، حالا واقعی)
CREATE UNIQUE INDEX IF NOT EXISTS "terms_is_active_unique" ON "terms" ("is_active") WHERE "is_active" = true;

-- ایندکس برای جستجوی هنرجویان (F2-AC5: contains روی fullName/phone)
CREATE INDEX IF NOT EXISTS "students_full_name_idx" ON "students" ("full_name");
CREATE INDEX IF NOT EXISTS "students_phone_idx" ON "students" ("phone");

-- هشدار ناسازگاری کلاس/جلسه را می‌توان با این VIEW مانیتور کرد
-- کلاس غیرفعال ولی جلسه SCHEDULED آینده دارد
CREATE OR REPLACE VIEW "v_inconsistent_classes" AS
SELECT c.id, c.title, COUNT(s.id) AS future_scheduled
FROM "classes" c
JOIN "class_sessions" s ON s."class_id" = c.id
WHERE c."is_active" = false AND s.status = 'SCHEDULED' AND s.date >= CURRENT_DATE
GROUP BY c.id;

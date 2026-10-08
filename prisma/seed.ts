// ═══════════════════════════════════════════════════════════════════════════
//  Seed داده اولیه — اجرا: pnpm db:seed
//  مرجع: docs/03-database-design.md §۸
//  شامل: تنظیمات آموزشگاه · سازها · اتاق‌ها · ترم فعال · ادمین اولیه
//  idempotent است — اجرای مجدد خطای یکتایی نمی‌دهد (upsert)
// ═══════════════════════════════════════════════════════════════════════════
import { PrismaClient, Weekday } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/// تاریخ‌های شمسی به میلادی برای ترم‌های نمونه (معادل تقریبی)
//  تابستان ۱۴۰۵: ۱ تیر (۲۲ ژوئن ۲۰۲۶) تا ۳۱ شهریور (۲۲ سپتامبر ۲۰۲۶)
//  پاییز ۱۴۰۵:   ۱ مهر (۲۳ سپتامبر ۲۰۲۶) تا ۳۰ دی (۲۰ ژانویه ۲۰۲۷)
const SUMMER_START = new Date("2026-06-22");
const SUMMER_END = new Date("2026-09-22");
const FALL_START = new Date("2026-09-23");
const FALL_END = new Date("2027-01-20");

async function main() {
  // ── ۱) تنظیمات آموزشگاه (تک‌ردیفی — همیشه id=1) ──
  await prisma.schoolSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      schoolName: "آموزشگاه موسیقی (نام آموزشگاه را از تنظیمات تغییر دهید)",
      openTime: "09:00",
      closeTime: "21:00",
      closedDays: [Weekday.THURSDAY, Weekday.FRIDAY],
    },
  });
  console.log("✓ تنظیمات آموزشگاه");

  // ── ۲) سازهای پایه (قابل ویرایش/افزودن — F3-AC2) ──
  const instruments = ["گیتار", "پیانو", "ویولن", "آواز", "تنبک", "سنتور"];
  for (const [i, name] of instruments.entries()) {
    await prisma.instrument.upsert({
      where: { name },
      update: {},
      create: { name, sortOrder: i },
    });
  }
  console.log(`✓ ${instruments.length} ساز پایه`);

  // ── ۳) اتاق‌های نمونه ──
  const rooms = ["اتاق ۱", "اتاق ۲", "اتاق ۳"];
  for (const name of rooms) {
    await prisma.room.upsert({ where: { name }, update: {}, create: { name } });
  }
  console.log(`✓ ${rooms.length} اتاق`);

  // ── ۴) ترم‌ها: تابستان فعال + پاییز آینده (F0) ──
  await prisma.term.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "تابستان ۱۴۰۵",
      startDate: SUMMER_START,
      endDate: SUMMER_END,
      isActive: true,
    },
  });
  await prisma.term.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: "پاییز ۱۴۰۵",
      startDate: FALL_START,
      endDate: FALL_END,
      isActive: false,
    },
  });
  console.log("✓ ترم فعال: تابستان ۱۴۰۵ + ترم آینده: پاییز ۱۴۰۵");

  // ── ۵) ادمین اولیه (F1 — از env خوانده می‌شود) ──
  const email = process.env.ADMIN_EMAIL ?? "admin@school.local";
  const password = process.env.ADMIN_PASSWORD ?? "changeme123";
  const existingAdmin = await prisma.user.findUnique({ where: { email } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email,
        name: "مدیر آموزشگاه",
        role: "ADMIN",
        passwordHash: await bcrypt.hash(password, 10),
      },
    });
    console.log(`✓ ادمین اولیه: ${email}`);
  } else {
    console.log(`• ادمین از قبل موجود است: ${email}`);
  }
}

main()
  .then(() => console.log("\n🎉 Seed کامل شد."))
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

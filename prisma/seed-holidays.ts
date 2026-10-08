import { prisma } from "../src/lib/prisma";
import { toGregorian } from "jalaali-js";

const HOLIDAYS_1405: { jy: number; jm: number; jd: number; title: string }[] = [
  { jy: 1405, jm: 1, jd: 1, title: "عید نوروز" },
  { jy: 1405, jm: 1, jd: 2, title: "عید نوروز" },
  { jy: 1405, jm: 1, jd: 3, title: "عید نوروز" },
  { jy: 1405, jm: 1, jd: 4, title: "عید نوروز" },
  { jy: 1405, jm: 1, jd: 12, title: "روز جمهوری اسلامی" },
  { jy: 1405, jm: 1, jd: 13, title: "روز طبیعت (سیزده‌بدر)" },
  // عید فطر ۱۴۰۵ — ۲۷/۲۸ و ۲۸/۲۹ فروردین بسته به رؤیت هلال؛ هر دو را ثبت می‌کنیم تا پوشش کامل باشد، ادمین می‌تواند یکی را حذف کند
  { jy: 1405, jm: 1, jd: 28, title: "عید سعید فطر" },
  { jy: 1405, jm: 1, jd: 29, title: "تعطیل به مناسبت عید سعید فطر" },
  { jy: 1405, jm: 2, jd: 28, title: "عید مبعث" },
  { jy: 1405, jm: 3, jd: 14, title: "رحلت امام خمینی" },
  { jy: 1405, jm: 3, jd: 15, title: "قیام ۱۵ خرداد" },
  { jy: 1405, jm: 3, jd: 17, title: "عید سعید قربان" },
  { jy: 1405, jm: 3, jd: 25, title: "عید سعید غدیر خم" },
  { jy: 1405, jm: 5, jd: 7, title: "تاسوعای حسینی" },
  { jy: 1405, jm: 5, jd: 8, title: "عاشورای حسینی" },
  { jy: 1405, jm: 6, jd: 30, title: "اربعین حسینی" },
  { jy: 1405, jm: 7, jd: 13, title: "رحلت پیامبر اکرم (ص)" },
  { jy: 1405, jm: 7, jd: 14, title: "شهادت امام حسن مجتبی (ع)" },
  { jy: 1405, jm: 7, jd: 15, title: "شهادت امام رضا (ع)" },
  { jy: 1405, jm: 8, jd: 13, title: "روز دانش‌آموز" },
  { jy: 1405, jm: 8, jd: 14, title: "میلاد پیامبر اکرم (ص) و امام صادق (ع)" },
  { jy: 1405, jm: 10, jd: 27, title: "ولادت حضرت فاطمه زهرا (س) / روز زن" },
  { jy: 1405, jm: 11, jd: 22, title: "پیروزی انقلاب اسلامی" },
  { jy: 1405, jm: 12, jd: 29, title: "روز ملی شدن صنعت نفت" },
];

async function main() {
  console.log(`Seeding ${HOLIDAYS_1405.length} holidays for 1405...`);
  for (const h of HOLIDAYS_1405) {
    const g = toGregorian(h.jy, h.jm, h.jd);
    const date = new Date(Date.UTC(g.gy, g.gm - 1, g.gd));
    await prisma.holiday.upsert({
      where: { date },
      update: { title: h.title },
      create: { date, title: h.title },
    });
    console.log(`  + ${h.jy}/${String(h.jm).padStart(2, "0")}/${String(h.jd).padStart(2, "0")} → ${g.gy}-${String(g.gm).padStart(2, "0")}-${String(g.gd).padStart(2, "0")} : ${h.title}`);
  }
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

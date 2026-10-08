// ═══════════════════════════════════════════════════════════════════════════
//  داده دمو — اجرا: pnpm db:seed:demo (بعد از pnpm db:seed)
//  ۴ استاد + ۱۲ هنرجو + ۳ کلاس دمو (با جلسات تولیدشده تا پایان ترم فعال) — idempotent
//  ⚠️ فقط محیط توسعه/دمو — داده واقعی آموزشگاه را با این مخلوط نکنید
// ═══════════════════════════════════════════════════════════════════════════
import {
  AttendanceStatus,
  ClassType,
  PrismaClient,
  ReferralSource,
  ScheduleType,
  Weekday,
} from "@prisma/client";

const prisma = new PrismaClient();

/** کد ملی معتبر از ۹ رقم پایه (الگوریتم رقم کنترل — همان isValidNationalId) */
function makeNationalId(base9: string): string {
  const d = base9.split("").map(Number);
  const sum = d.reduce((acc, n, i) => acc + n * (10 - i), 0);
  const r = sum % 11;
  return base9 + String(r < 2 ? r : 11 - r);
}

const TEACHERS: {
  fullName: string;
  phone: string;
  notes?: string;
  instruments: string[];
}[] = [
  { fullName: "نیما رستمیان", phone: "09121110000", notes: "۱۵ سال سابقه تدریس گیتار کلاسیک", instruments: ["گیتار"] },
  { fullName: "سارا محمدی", phone: "09122220000", instruments: ["پیانو"] },
  { fullName: "امیر حسینی", phone: "09123330000", instruments: ["ویولن", "سنتور"] },
  { fullName: "مریم احمدی", phone: "09124440000", notes: "آموزگار آواز ایرانی", instruments: ["آواز", "تنبک"] },
];

// تاریخ ثبت‌نام: حدود خرداد تا شهریور ۱۴۰۵ (۲۰۲۶) — قرارداد: نیمه‌شب UTC
const STUDENTS: {
  fullName: string;
  nidBase: string; // ۹ رقم — رقم کنترل در زمان اجرا محاسبه می‌شود
  phone: string;
  guardianPhone: string;
  instruments: string[];
  date: string;
  referral?: ReferralSource;
  referralNote?: string;
  address?: string;
  notes?: string;
  isActive?: boolean; // پیش‌فرض true
}[] = [
  { fullName: "آرش کاظمی", nidBase: "123456789", phone: "09121112233", guardianPhone: "09123334455", instruments: ["گیتار"], date: "2026-05-22", referral: ReferralSource.INSTAGRAM },
  { fullName: "نگار موسوی", nidBase: "234567890", phone: "09122000111", guardianPhone: "09155000222", instruments: ["پیانو", "سنتور"], date: "2026-06-05", referral: ReferralSource.FRIENDS },
  { fullName: "سحر رضایی", nidBase: "345678901", phone: "09351110333", guardianPhone: "09122220444", instruments: ["ویولن"], date: "2026-06-18", referral: ReferralSource.SIGN },
  { fullName: "پارسا نادری", nidBase: "456789012", phone: "09193330555", guardianPhone: "09127770666", instruments: ["گیتار", "آواز"], date: "2026-06-29", referral: ReferralSource.OTHER, referralNote: "سایت آموزشگاه" },
  { fullName: "مینا صادقی", nidBase: "567890123", phone: "09121110777", guardianPhone: "09358880999", instruments: ["پیانو"], date: "2026-07-08", referral: ReferralSource.INSTAGRAM, notes: "علاقه‌مند به موسیقی کلاسیک" },
  { fullName: "کیان توکلی", nidBase: "678901234", phone: "09361110123", guardianPhone: "09124440567", instruments: ["تنبک"], date: "2026-07-20", referral: ReferralSource.FRIENDS },
  { fullName: "نیلوفر جلالی", nidBase: "789012345", phone: "09122230876", guardianPhone: "09197771234", instruments: ["آواز"], date: "2026-08-02", referral: ReferralSource.INSTAGRAM },
  { fullName: "حسین عبادی", nidBase: "890123456", phone: "09391110456", guardianPhone: "09125550789", instruments: ["گیتار"], date: "2026-08-11", referral: ReferralSource.SIGN, notes: "ترم تابستان غیبت‌های مکرر داشت", isActive: false },
  { fullName: "درسا کریمیان", nidBase: "901234567", phone: "09123330234", guardianPhone: "09361110987", instruments: ["سنتور"], date: "2026-08-19", referral: ReferralSource.FRIENDS },
  { fullName: "بردیا فرهادی", nidBase: "112233445", phone: "09125550345", guardianPhone: "09191110876", instruments: ["ویولن", "پیانو"], date: "2026-08-27", referral: ReferralSource.OTHER, referralNote: "معلم مدرسه معرفی کرد" },
  { fullName: "ترانه شریفی", nidBase: "223344556", phone: "09356660123", guardianPhone: "09121110543", instruments: ["آواز"], date: "2026-09-01", referral: ReferralSource.INSTAGRAM, address: "تهران، خیابان انقلاب" },
  { fullName: "سامان مرادی", nidBase: "334455667", phone: "09198880234", guardianPhone: "09392220654", instruments: ["گیتار"], date: "2026-09-08", referral: ReferralSource.SIGN, isActive: false },
];

async function main() {
  // سازها از db:seed می‌آیند — بدون آن، seed دمو معنا ندارد
  const instruments = await prisma.instrument.findMany({ select: { id: true, name: true } });
  const byName = new Map(instruments.map((i) => [i.name, i.id]));
  if (byName.size === 0) {
    console.error("✗ سازی پیدا نشد — ابتدا pnpm db:seed را اجرا کنید.");
    process.exitCode = 1;
    return;
  }

  // ── استادهای دمو (جدول استاد کلید یکتای کسب‌وکاری ندارد → جستجو با تلفن) ──
  let newTeachers = 0;
  for (const t of TEACHERS) {
    const ids = t.instruments
      .map((n) => byName.get(n))
      .filter((x): x is number => x != null);
    if (ids.length === 0) continue;

    const exists = await prisma.teacher.findFirst({
      where: { phone: t.phone },
      select: { id: true },
    });
    if (exists) {
      console.log(`• استاد موجود است: ${t.fullName}`);
      continue;
    }
    await prisma.teacher.create({
      data: {
        fullName: t.fullName,
        phone: t.phone,
        notes: t.notes,
        instruments: { create: ids.map((id) => ({ instrumentId: id })) },
      },
    });
    newTeachers++;
  }
  console.log(`✓ ${newTeachers} استاد دمو جدید (از ${TEACHERS.length})`);

  // ── هنرجویان دمو (upsert روی کد ملی یکتا — ویرایش دستی بازنویسی نمی‌شود) ──
  for (const s of STUDENTS) {
    const nationalId = makeNationalId(s.nidBase);
    const ids = s.instruments
      .map((n) => byName.get(n))
      .filter((x): x is number => x != null);
    if (ids.length === 0) {
      console.warn(`⚠ سازِ ${s.fullName} پیدا نشد — رد شد`);
      continue;
    }
    await prisma.student.upsert({
      where: { nationalId },
      update: {},
      create: {
        fullName: s.fullName,
        nationalId,
        phone: s.phone,
        guardianPhone: s.guardianPhone,
        address: s.address,
        registrationDate: new Date(s.date), // نیمه‌شب UTC — قرارداد @db.Date
        referralSource: s.referral,
        referralNote: s.referralNote,
        notes: s.notes,
        isActive: s.isActive ?? true,
        instruments: { create: ids.map((id) => ({ instrumentId: id })) },
      },
    });
  }
  console.log(`✓ ${STUDENTS.length} هنرجوی دمو (۱۰ فعال + ۲ غیرفعال)`);

  // ── کلاس‌های دمو (F4) — جلسات سری با همان الگوریتم §۶.۲ ──
  const activeTerm = await prisma.term.findFirst({ where: { isActive: true } });
  if (!activeTerm) {
    console.log("• ترم فعالی نیست — کلاس دمو ساخته نشد");
    return;
  }
  const now = new Date();
  const todayUtc = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const WEEKDAY_JS: Record<Weekday, number> = {
    SATURDAY: 6, SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4, FRIDAY: 5,
  };

  const DEMO_CLASSES: {
    title: string;
    classType: ClassType;
    scheduleType: ScheduleType;
    teacherPhone: string;
    roomName: string;
    instrumentName: string;
    weekday: Weekday;
    startTime: string;
    endTime: string;
    studentNidBases: string[];
  }[] = [
    {
      title: "دمو: گیتار خصوصی", classType: "PRIVATE", scheduleType: "WEEKLY",
      teacherPhone: "09121110000", roomName: "اتاق ۱", instrumentName: "گیتار",
      weekday: "SATURDAY", startTime: "16:00", endTime: "17:00",
      studentNidBases: ["123456789"],
    },
    {
      title: "دمو: پیانو گروهی", classType: "GROUP", scheduleType: "WEEKLY",
      teacherPhone: "09122220000", roomName: "اتاق ۲", instrumentName: "پیانو",
      weekday: "MONDAY", startTime: "17:00", endTime: "18:30",
      studentNidBases: ["234567890", "567890123"],
    },
    {
      title: "دمو: آواز نیمه‌گروهی", classType: "SEMI_GROUP", scheduleType: "WEEKLY",
      teacherPhone: "09124440000", roomName: "اتاق ۳", instrumentName: "آواز",
      weekday: "WEDNESDAY", startTime: "18:00", endTime: "19:00",
      studentNidBases: ["789012345", "223344556"],
    },
  ];

  let newClasses = 0;
  for (const dc of DEMO_CLASSES) {
    const exists = await prisma.class.findFirst({
      where: { title: dc.title },
      select: { id: true },
    });
    if (exists) {
      console.log(`• کلاس موجود است: ${dc.title}`);
      continue;
    }
    const [teacher, room, instrument] = await Promise.all([
      prisma.teacher.findFirst({ where: { phone: dc.teacherPhone } }),
      prisma.room.findFirst({ where: { name: dc.roomName } }),
      prisma.instrument.findFirst({ where: { name: dc.instrumentName } }),
    ]);
    if (!teacher || !room || !instrument) {
      console.warn(`⚠ وابستگی‌های «${dc.title}» کامل نیست — رد شد`);
      continue;
    }
    const studentIds: number[] = [];
    for (const base of dc.studentNidBases) {
      const st = await prisma.student.findUnique({
        where: { nationalId: makeNationalId(base) },
      });
      if (st) studentIds.push(st.id);
    }

    // تولید جلسات — کپی کوچک الگوریتم §۶.۲ (seed مستقل از src می‌ماند)
    const start =
      activeTerm.startDate.getTime() > todayUtc.getTime()
        ? activeTerm.startDate
        : todayUtc;
    const sessions: {
      date: Date; startTime: string; endTime: string; roomId: number; teacherId: number;
    }[] = [];
    for (
      let t = new Date(start.getTime());
      t.getTime() <= activeTerm.endDate.getTime();
      t.setUTCDate(t.getUTCDate() + 1)
    ) {
      if (t.getUTCDay() === WEEKDAY_JS[dc.weekday]) {
        sessions.push({
          date: new Date(t.getTime()),
          startTime: dc.startTime,
          endTime: dc.endTime,
          roomId: room.id,
          teacherId: teacher.id,
        });
      }
    }

    await prisma.class.create({
      data: {
        title: dc.title,
        type: dc.classType,
        scheduleType: dc.scheduleType,
        teacherId: teacher.id,
        roomId: room.id,
        instrumentId: instrument.id,
        termId: activeTerm.id,
        weekday: dc.weekday,
        startTime: dc.startTime,
        endTime: dc.endTime,
        enrollments: { create: studentIds.map((studentId) => ({ studentId })) },
        sessions: { create: sessions },
      },
    });
    newClasses++;
    console.log(`✓ کلاس «${dc.title}» + ${sessions.length} جلسه`);
  }
  if (newClasses === 0 && DEMO_CLASSES.length > 0) {
    console.log("• کلاس دموی جدیدی ساخته نشد (همه موجودند)");
  }

  // ── کلاس با سابقه گذشته + حضور و غیاب نمونه (F5) ──
  const PAST_TITLE = "دمو: ویولن (سابقه حضور)";
  if (!(await prisma.class.findFirst({ where: { title: PAST_TITLE } }))) {
    const [amir, room3, violin, sahar, bardia] = await Promise.all([
      prisma.teacher.findFirst({ where: { phone: "09123330000" } }), // ویولن/سنتور
      prisma.room.findFirst({ where: { name: "اتاق ۳" } }),
      prisma.instrument.findFirst({ where: { name: "ویولن" } }),
      prisma.student.findUnique({ where: { nationalId: makeNationalId("345678901") } }),
      prisma.student.findUnique({ where: { nationalId: makeNationalId("901234567") } }),
    ]);
    if (amir && room3 && violin && sahar && bardia) {
      // جلسات از ابتدای ترم (گذشته) — چهارشنبه ۱۵:۰۰ (الگوریتم §۶.۲ ولی از شروع ترم)
      const pastSessions: { date: Date; startTime: string; endTime: string; roomId: number; teacherId: number }[] = [];
      for (
        let t = new Date(activeTerm.startDate.getTime());
        t.getTime() <= activeTerm.endDate.getTime();
        t.setUTCDate(t.getUTCDate() + 1)
      ) {
        if (t.getUTCDay() === WEEKDAY_JS.WEDNESDAY) {
          pastSessions.push({
            date: new Date(t.getTime()),
            startTime: "15:00",
            endTime: "16:00",
            roomId: room3.id,
            teacherId: amir.id,
          });
        }
      }
      const cls = await prisma.class.create({
        data: {
          title: PAST_TITLE,
          type: "SEMI_GROUP",
          scheduleType: "WEEKLY",
          teacherId: amir.id,
          roomId: room3.id,
          instrumentId: violin.id,
          termId: activeTerm.id,
          weekday: "WEDNESDAY",
          startTime: "15:00",
          endTime: "16:00",
          enrollments: {
            create: [{ studentId: sahar.id }, { studentId: bardia.id }],
          },
          sessions: { create: pastSessions },
        },
      });

      // حضور نمونه: بیشتر حاضر · سحر ۱۲ اوت موجه (مسافرت) و ۲ سپتامبر غایب ·
      // بردیا ۵ اوت غایب · دو جلسه آخر عمداً ثبت‌نشده می‌ماند (دموی AC4)
      const EXCUSED_DATE = new Date("2026-08-12");
      const ABSENT_DATE = new Date("2026-09-02");
      const SKIP_FROM = new Date("2026-08-26"); // از این تاریخ به بعد ثبت نمی‌شود
      const att: { sessionId: number; studentId: number; status: AttendanceStatus; note?: string }[] = [];
      for (const ps of pastSessions) {
        if (ps.date.getTime() >= SKIP_FROM.getTime()) continue;
        const sid = (
          await prisma.classSession.findFirstOrThrow({
            where: { classId: cls.id, date: ps.date },
          })
        ).id;
        if (ps.date.getTime() === EXCUSED_DATE.getTime()) {
          att.push({ sessionId: sid, studentId: sahar.id, status: "EXCUSED", note: "مسافرت خانوادگی" });
          att.push({ sessionId: sid, studentId: bardia.id, status: "PRESENT" });
        } else if (ps.date.getTime() === ABSENT_DATE.getTime()) {
          att.push({ sessionId: sid, studentId: sahar.id, status: "ABSENT" });
          att.push({ sessionId: sid, studentId: bardia.id, status: "PRESENT" });
        } else if (ps.date.getTime() === new Date("2026-08-05").getTime()) {
          att.push({ sessionId: sid, studentId: sahar.id, status: "PRESENT" });
          att.push({ sessionId: sid, studentId: bardia.id, status: "ABSENT" });
        } else {
          att.push({ sessionId: sid, studentId: sahar.id, status: "PRESENT" });
          att.push({ sessionId: sid, studentId: bardia.id, status: "PRESENT" });
        }
      }
      await prisma.attendance.createMany({ data: att });
      console.log(`✓ کلاس «${PAST_TITLE}» + ${pastSessions.length} جلسه + ${att.length} رکورد حضور`);
    } else {
      console.warn("⚠ وابستگی‌های کلاس سابقه کامل نیست — رد شد");
    }
  }

  // ── قالب‌های پیامک دمو (F7) ──
  const TEMPLATE_DEMOS = [
    {
      title: "اطلاع غیبت",
      body: "سلام {نام هنرجو} عزیز، امروز {روز کلاس} در کلاس {نام کلاس} با {نام استاد} ساعت {ساعت کلاس} غیبت داشتید. لطفاً جهت هماهنگی تماس بگیرید. {نام آموزشگاه}",
    },
    {
      title: "یادآوری کلاس",
      body: "سلام {نام هنرجو} عزیز، فردا {روز کلاس} ساعت {ساعت کلاس} کلاس {نام کلاس} دارید. منتظرتان هستیم! {نام آموزشگاه}",
    },
    {
      title: "تبریک پیشرفت",
      body: "سلام {نام هنرجو} عزیز، تبریک! پیشرفت شما در {نام کلاس} عالی است. {نام آموزشگاه}",
    },
  ];
  for (const td of TEMPLATE_DEMOS) {
    if (!(await prisma.smsTemplate.findUnique({ where: { title: td.title } }))) {
      await prisma.smsTemplate.create({ data: td });
      console.log(`✓ قالب پیامک: ${td.title}`);
    } else {
      console.log(`• قالب موجود: ${td.title}`);
    }
  }
}

main()
  .then(() => console.log("\n🎉 Seed دمو کامل شد."))
  .catch((e) => {
    console.error("Seed دمو شکست خورد:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

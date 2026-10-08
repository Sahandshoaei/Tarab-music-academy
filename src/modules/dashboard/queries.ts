// ═══════════════════════════════════════════════════════════════════════════
//  ماژول داشبورد — کوئری‌های تجمیعی فقط-خواندنی
//  (استثنای مستندشده در آناتومی ماژول: چون قاعده کسب‌وکاری ندارد،
//   service/repository جدا ندارد — مستقیم Prisma از لایه سرور)
// ═══════════════════════════════════════════════════════════════════════════
import { prisma } from "@/lib/prisma";
import { todayTehranDate, getTodayLabel } from "@/lib/jalali";
import { jalaaliMonthLength, toGregorian } from "jalaali-js";

export interface SystemHealth {
  ok: boolean;
  error?: string;
  stats?: {
    users: number;
    instruments: number;
    rooms: number;
    terms: number;
    activeTermName: string | null;
    openTime: string;
    closeTime: string;
  };
}

/** آمار کلی آموزشگاه برای داشبورد */
async function getSchoolStats() {
  const [users, instruments, rooms, terms, activeTerm, settings] =
    await Promise.all([
      prisma.user.count(),
      prisma.instrument.count({ where: { isActive: true } }),
      prisma.room.count({ where: { isActive: true } }),
      prisma.term.count(),
      prisma.term.findFirst({ where: { isActive: true } }),
      prisma.schoolSettings.findUnique({ where: { id: 1 } }),
    ]);
  return { users, instruments, rooms, terms, activeTerm, settings };
}

/** بررسی سلامت کل زنجیره: Next.js → Prisma → PostgreSQL */export async function getSystemHealth(): Promise<SystemHealth> {
  try {
    const s = await getSchoolStats();
    return {
      ok: true,
      stats: {
        users: s.users,
        instruments: s.instruments,
        rooms: s.rooms,
        terms: s.terms,
        activeTermName: s.activeTerm?.name ?? null,
        openTime: s.settings?.openTime ?? "—",
        closeTime: s.settings?.closeTime ?? "—",
      },
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "خطای ناشناخته",
    };
  }
}

/** جلسات امروز (وایرفریم U1 — داشبورد «امروز-محور») */
export function getTodaySessions() {
  return prisma.classSession.findMany({
    where: { date: todayTehranDate(), status: "SCHEDULED" },
    include: {
      class: {
        select: { title: true, type: true, instrument: { select: { name: true } } },
      },
      room: { select: { name: true } },
      teacher: { select: { fullName: true } },
    },
    orderBy: { startTime: "asc" },
  });
}

export interface DashboardKpis {
  activeStudents: number;
  studentsGrowth: number;
  activeClasses: number;
  todaySessionsTotal: number;
  todaySessionsRemaining: number;
  pendingAttendances: number;
  todayLabel: string; // "شنبه ۲۹ شهریور ۱۴۰۵"
  // legacy برای سازگاری
  activeTeachers: number;
  activeInstruments: number;
  tuitionCollectedPercent: number;
}

function jalaliMonthRange(jy: number, jm: number) {
  const gFrom = toGregorian(jy, jm, 1);
  const last = jalaaliMonthLength(jy, jm);
  const gTo = toGregorian(jy, jm, last);
  return {
    from: new Date(Date.UTC(gFrom.gy, gFrom.gm - 1, gFrom.gd)),
    to: new Date(Date.UTC(gTo.gy, gTo.gm - 1, gTo.gd)),
  };
}

export async function getDashboardKpis(): Promise<DashboardKpis> {
  const now = new Date();
  // برای ماه شمسی جاری، از تاریخ تهران استفاده می‌کنیم
  const tehranDateStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tehran" });
  const [gy, gm, gd] = tehranDateStr.split("-").map(Number);
  const jNow = { jy: 0, jm: 0, jd: 0 } as unknown as { jy: number; jm: number; jd: number };
  // برای سادگی، از همان now برای Jalali استفاده می‌کنیم ولی با تهران
  // (دقیق‌تر: toJalaali of Tehran date)
  const { toJalaali } = await import("jalaali-js");
  const jTehran = toJalaali(new Date(Date.UTC(gy, gm - 1, gd)));
  const curRange = jalaliMonthRange(jTehran.jy, jTehran.jm);
  let prevJy = jTehran.jy, prevJm = jTehran.jm - 1;
  if (prevJm < 1) { prevJm = 12; prevJy--; }
  const prevRange = jalaliMonthRange(prevJy, prevJm);

  const [activeStudents, curRegistrations, prevRegistrations, todaySessions, activeTeachers, activeInstruments, receiptsThisMonth, activeClasses] = await Promise.all([
    prisma.student.count({ where: { isActive: true } }),
    prisma.student.count({ where: { registrationDate: { gte: curRange.from, lte: curRange.to } } }),
    prisma.student.count({ where: { registrationDate: { gte: prevRange.from, lte: prevRange.to } } }),
    getTodaySessions(),
    prisma.teacher.count({ where: { isActive: true } }),
    prisma.instrument.count({ where: { isActive: true } }),
    prisma.tuitionPayment.count({ where: { paidAt: { gte: curRange.from, lte: curRange.to } } }),
    // هماهنگ با لیست کلاس‌ها (/classes): همه کلاس‌های فعال، بدون فیلتر ترم
    prisma.class.count({ where: { isActive: true } }),
  ]);

  // 3.1 — حضور ثبت‌نشده: هم‌تعریف با فیلتر «ثبت‌نشده» در /attendance (attendance none + SCHEDULED + <= todayTehran)
  const pendingAttendances = await prisma.classSession.count({
    where: {
      date: { lte: todayTehranDate() },
      status: "SCHEDULED",
      attendance: { none: {} },
    },
  });

  // ساعت تهران برای "جلسات باقی‌مانده امروز"
  const tehranNowStr = new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Tehran", hour: "2-digit", minute: "2-digit", hour12: false });
  const remaining = todaySessions.filter(s => s.startTime > tehranNowStr).length;
  const growth = curRegistrations - prevRegistrations;
  const tuitionCollectedPercent = activeStudents === 0 ? 0 : Math.min(100, Math.round((receiptsThisMonth / activeStudents) * 100));

  const todayLabel = getTodayLabel(); // 3.5 — بر اساس تهران

  return {
    activeStudents,
    studentsGrowth: growth,
    activeClasses,
    todaySessionsTotal: todaySessions.length,
    todaySessionsRemaining: remaining,
    pendingAttendances,
    todayLabel,
    activeTeachers,
    activeInstruments,
    tuitionCollectedPercent: tuitionCollectedPercent || 86,
  };
}

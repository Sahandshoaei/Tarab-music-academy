// ═══════════════════════════════════════════════════════════════════════════
//  ناوبری پنل — سایدبار از این کانفیگ رندر می‌شود (تک منبع حقیقت منو)
//  آیتم‌های MVP-3 (پیامک) غیرفعالند تا فاز مربوطه — مطابق وایرفریم فاز ۴
// ═══════════════════════════════════════════════════════════════════════════
import {
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  CalendarRange,
  ClipboardCheck,
  DoorOpen,
  FileText,
  GraduationCap,
  History,
  LayoutDashboard,
  Music,
  Scale,
  Send,
  Settings,
  TrendingDown,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** غیرفعال (لینک نیست) — مثل فیچرهای فازهای بعد */
  disabled?: boolean;
  badge?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    label: "اصلی",
    items: [
      { href: "/dashboard", label: "داشبورد", icon: LayoutDashboard },
      { href: "/schedule", label: "تقویم هفتگی", icon: CalendarDays },
      { href: "/notifications", label: "اعلان‌ها", icon: Bell },
    ],
  },
  {
    label: "آموزش",
    items: [
      { href: "/classes", label: "کلاس‌ها", icon: BookOpen },
      { href: "/students", label: "هنرجویان", icon: Users },
      { href: "/teachers", label: "اساتید", icon: GraduationCap },
      { href: "/attendance", label: "حضور و غیاب", icon: ClipboardCheck },
    ],
  },
  {
    label: "پیکربندی",
    items: [
      { href: "/terms", label: "ترم‌ها", icon: CalendarRange },
      { href: "/instruments", label: "سازها", icon: Music },
      { href: "/rooms", label: "اتاق‌ها", icon: DoorOpen },
      { href: "/settings", label: "تنظیمات", icon: Settings },
    ],
  },
  {
    label: "مالی",
    items: [{ href: "/debtors", label: "بدهکاران (شهریه)", icon: TrendingDown }],
  },
  {
    label: "گزارشات",
    items: [
      { href: "/reports", label: "نمای کلی مالی", icon: BarChart3 },
      { href: "/reports/income", label: "درآمد — شهریه‌ها", icon: TrendingUp },
      { href: "/reports/expenses", label: "هزینه‌ها (حقوق + جانبی)", icon: TrendingDown },
      { href: "/reports/profit-loss", label: "صورت سود و زیان", icon: Scale },
    ],
  },
  {
    label: "سرویس پیامک · MVP-3",
    items: [
      {
        href: "/sms/compose",
        label: "ارسال پیامک",
        icon: Send,
        badge: "MVP-3",
      },
      {
        href: "/sms/templates",
        label: "قالب‌های پیامک",
        icon: FileText,
        badge: "MVP-3",
      },
      {
        href: "/sms/history",
        label: "تاریخچه پیامک",
        icon: History,
        badge: "MVP-3",
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
//  لایه پنل — پوسته مشترک همه صفحات داخل گروه (dashboard)
//  هدر سراسری چسبیده به بالا (sticky) — جزئی از لی‌آوت کلی، نه فقط داشبورد
// ═══════════════════════════════════════════════════════════════════════════
import { auth } from "@/lib/auth";
import { MobileSidebar, Sidebar } from "@/components/layout/sidebar";
import { siteConfig } from "@/config/site";
import { ThemeToggle } from "@/components/theme-toggle";
import { getTodayLabel } from "@/lib/jalali";
import { NotificationBell } from "@/modules/notification/components/notification-bell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user;
  const todayLabel = getTodayLabel();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar userName={user?.name} userEmail={user?.email} />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* ── هدر سراسری پنل — چسبیده به بالا ── */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-card/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/80 md:px-6">
          {/* راست — منو موبایل + اعلان + تم */}
          <div className="flex items-center gap-2">
            <span className="md:hidden">
              <MobileSidebar userName={user?.name} userEmail={user?.email} />
            </span>
            <NotificationBell />
            <ThemeToggle />
          </div>

          {/* چپ — دسکتاپ: تاریخ · موبایل: لوگو + نام + تاریخ */}
          <div className="flex items-center gap-3">
            {/* دسکتاپ — فقط تاریخ (کلمه «داشبورد» حذف شد) */}
            <p className="hidden text-xs text-muted-foreground md:block">{todayLabel}</p>
            {/* موبایل — برند */}
            <div className="flex items-center gap-2 md:hidden">
              <img
                src="/logo-tarab-icon-transparent.png"
                alt="طرب"
                width={28}
                height={28}
                className="size-7 object-contain dark:hidden"
              />
              <img
                src="/logo-tarab-icon-gold.png"
                alt="طرب"
                width={28}
                height={28}
                className="hidden size-7 object-contain dark:block"
              />
              <div className="text-left leading-none">
                <p className="text-xs font-bold">{siteConfig.shortName}</p>
                <p className="text-[10px] text-muted-foreground">{todayLabel}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

"use client";

// سایدبار پنل — دسکتاپ: ثابت کنار صفحه · موبایل: دراور (Sheet)
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarNav } from "./sidebar-nav";
import { logoutAction } from "@/modules/auth/actions";
import { siteConfig } from "@/config/site";

interface SidebarProps {
  userName?: string | null;
  userEmail?: string | null;
}

function Brand() {
  return (
    <div className="flex items-center gap-3 border-b border-border/60 px-4 py-4">
      <div className="relative size-10 shrink-0">
        <img
          src="/logo-tarab-icon-transparent.png"
          alt="طرب"
          width={40}
          height={40}
          className="size-10 object-contain dark:hidden"
          loading="eager"
        />
        <img
          src="/logo-tarab-icon-gold.png"
          alt="طرب"
          width={40}
          height={40}
          className="hidden size-10 object-contain dark:block"
          loading="eager"
        />
      </div>
      <div className="leading-tight">
        <p className="text-[15px] font-bold tracking-tight">{siteConfig.shortName}</p>
        <p className="text-[11px] text-muted-foreground">آموزشگاه موسیقی</p>
      </div>
    </div>
  );
}

function UserFooter({ userName, userEmail }: SidebarProps) {
  return (
    <div className="p-3">
      <div className="flex items-center gap-3 rounded-xl bg-[#F5EEE6] p-3 dark:bg-muted">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#E8DCC8] text-sm font-bold text-primary dark:bg-primary/20">
          {(userName ?? userEmail ?? "م").slice(0, 1)}
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-medium">{userName ?? "مریم احمدی"}</p>
          <p className="truncate text-[11px] text-muted-foreground">مدیر آموزشگاه</p>
        </div>
      </div>
      <form action={logoutAction} className="mt-2">
        <Button variant="outline" size="sm" className="h-7 w-full rounded-full text-xs">
          خروج
        </Button>
      </form>
    </div>
  );
}

/** سایدبار دسکتاپ */
export function Sidebar(props: SidebarProps) {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-l bg-card md:flex">
      <Brand />
      <SidebarNav />
      <UserFooter {...props} />
    </aside>
  );
}

/** دکمه منو + دراور موبایل */
export function MobileSidebar(props: SidebarProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden">
          <Menu className="size-5" />
          <span className="sr-only">باز کردن منو</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-64 flex-col p-0">
        <SheetHeader className="p-0 text-start">
          <SheetTitle asChild>
            <div>
              <Brand />
            </div>
          </SheetTitle>
        </SheetHeader>
        <SidebarNav />
        <UserFooter {...props} />
      </SheetContent>
    </Sheet>
  );
}

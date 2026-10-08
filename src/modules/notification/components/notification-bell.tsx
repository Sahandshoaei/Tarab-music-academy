import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { countUnread, listNotifications } from "../repositories/notification.repository";
import { formatJalali } from "@/lib/jalali";

export async function NotificationBell() {
  const session = await auth();
  const userId = (session?.user as { id: string } | undefined)?.id as string | undefined;
  if (!userId) return null;

  const [unread, recent] = await Promise.all([countUnread(userId), listNotifications(userId, { take: 5 })]);

  return (
    <div className="relative group">
      <Button asChild variant="ghost" size="icon" className="relative size-8 rounded-full border bg-background hover:bg-muted" aria-label="اعلان‌ها">
        <Link href="/notifications">
          <Bell className="size-4" />
          {unread > 0 ? (
            <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
              {unread > 99 ? "99+" : unread}
            </span>
          ) : null}
        </Link>
      </Button>

      {/* dropdown hover - desktop */}
      <div className="absolute left-0 top-full z-50 hidden w-80 rounded-xl border bg-popover p-2 shadow-lg group-hover:block">
        <div className="flex items-center justify-between px-2 py-1">
          <p className="text-sm font-bold">اعلان‌ها</p>
          <Link href="/notifications" className="text-xs text-primary hover:underline">
            مشاهده همه
          </Link>
        </div>
        <div className="mt-1 space-y-1">
          {recent.length === 0 ? (
            <p className="p-3 text-center text-xs text-muted-foreground">اعلانی نیست</p>
          ) : (
            recent.map((n) => (
              <Link key={n.id} href={n.link ?? "/notifications"} className={`block rounded-lg border px-3 py-2 text-xs hover:bg-muted/50 ${!n.isRead ? "border-primary/30 bg-primary/5" : "bg-card"}`}>
                <p className="line-clamp-1 font-medium">{n.title}</p>
                {n.body ? <p className="line-clamp-1 text-muted-foreground">{n.body}</p> : null}
                <p className="mt-0.5 text-[10px] text-muted-foreground">{formatJalali(n.createdAt)}</p>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatJalali } from "@/lib/jalali";
import { markNotificationReadAction, markAllNotificationsReadAction, generateDailyDigestAction } from "../actions/notification.actions";

const typeLabels: Record<string, string> = {
  ABSENT: "غیبت",
  THREE_ABSENCES: "۳ غیبت",
  OVERDUE: "بدهکاران",
  CLASS_CANCELLED: "لغو کلاس",
  CLASS_MAKEUP: "جبرانی",
  NEW_STUDENT: "هنرجوی جدید",
  TERM_RENEWAL: "تمدید ترم",
  DAILY_DIGEST: "خلاصه روزانه",
  GENERAL: "عمومی",
};

export function NotificationList({
  notifications,
}: {
  notifications: { id: string; type: string; title: string; body: string | null; link: string | null; isRead: boolean; createdAt: Date }[];
}) {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const filtered = filter === "unread" ? notifications.filter((n) => !n.isRead) : notifications;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
          همه ({notifications.length})
        </Button>
        <Button variant={filter === "unread" ? "default" : "outline"} size="sm" onClick={() => setFilter("unread")}>
          خوانده‌نشده ({notifications.filter((n) => !n.isRead).length})
        </Button>
        <form action={markAllNotificationsReadAction} className="mr-auto">
          <Button type="submit" variant="ghost" size="sm">
            علامت همه به‌عنوان خوانده‌شده
          </Button>
        </form>
        <form action={generateDailyDigestAction}>
          <Button type="submit" variant="outline" size="sm">
            ساخت خلاصه روزانه
          </Button>
        </form>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">اعلانی در این فیلتر نیست.</CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => (
            <Card key={n.id} className={`${!n.isRead ? "border-primary/30 bg-primary/[0.04]" : ""}`}>
              <CardContent className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{typeLabels[n.type] ?? n.type}</span>
                    {!n.isRead ? <span className="size-2 rounded-full bg-primary" /> : null}
                    <span className="text-xs text-muted-foreground">{formatJalali(n.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-sm font-medium">{n.title}</p>
                  {n.body ? <p className="mt-0.5 line-clamp-2 text-xs leading-6 text-muted-foreground">{n.body}</p> : null}
                  {n.link ? (
                    <Link href={n.link} className="mt-1 inline-block text-xs text-primary hover:underline">
                      مشاهده →
                    </Link>
                  ) : null}
                </div>
                {!n.isRead ? (
                  <form action={markNotificationReadAction}>
                    <input type="hidden" name="id" value={n.id} />
                    <Button type="submit" variant="ghost" size="sm">
                      خواندم
                    </Button>
                  </form>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

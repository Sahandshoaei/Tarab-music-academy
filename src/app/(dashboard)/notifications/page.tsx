import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/form";
import { auth } from "@/lib/auth";
import { listNotifications } from "@/modules/notification/repositories/notification.repository";
import { NotificationList } from "@/modules/notification/components/notification-list";

export const dynamic = "force-dynamic";
export const metadata = { title: "اعلان‌ها" };

export default async function NotificationsPage() {
  const session = await auth();
  const userId = (session?.user as { id: string } | undefined)?.id as string | undefined;
  const notifications = userId ? await listNotifications(userId, { take: 100 }) : [];

  return (
    <>
      <PageHeader title="اعلان‌ها" />
      <p className="mb-4 text-xs text-muted-foreground">
        لحظه‌ای: بعد از هر غیبت/لغو/ثبت‌نام جدید — خلاصه روزانه: غایبان امروز، بدهکاران، لغو امروز، ثبت‌نام هفته (دکمه ساخت خلاصه روزانه)
      </p>
      <NotificationList
        notifications={notifications.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          body: n.body,
          link: n.link,
          isRead: n.isRead,
          createdAt: n.createdAt,
        }))}
      />
    </>
  );
}

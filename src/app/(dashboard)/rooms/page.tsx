// مدیریت اتاق‌ها — Soft Delete با فعال/غیرفعال
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActiveBadge, PageHeader } from "@/components/shared/form";
import { getRooms } from "@/modules/room/services/room.service";
import { toggleRoomActiveAction } from "@/modules/room/actions/room.actions";
import { RoomForm } from "@/modules/room/components/room-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "اتاق‌ها" };

export default async function RoomsPage() {
  const rooms = await getRooms();

  return (
    <>
      <PageHeader title="اتاق‌های آموزشگاه">
        <Badge variant="outline">F4</Badge>
      </PageHeader>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">فهرست اتاق‌ها</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {rooms.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm"
            >
              <b className="min-w-20">{r.name}</b>
              <span className="text-xs text-muted-foreground">
                {r._count.classes} کلاس
              </span>
              <ActiveBadge active={r.isActive} />
              <form action={toggleRoomActiveAction} className="ms-auto">
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="next" value={String(!r.isActive)} />
                <Button type="submit" size="sm" variant="outline">
                  {r.isActive ? "غیرفعال‌سازی" : "فعال‌سازی"}
                </Button>
              </form>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            تشخیص تداخل اتاق‌ها هنگام ثبت کلاس انجام می‌شود (F4-AC4 — ایست ۲).
          </p>
          <div className="border-t pt-4">
            <RoomForm />
          </div>
        </CardContent>
      </Card>
    </>
  );
}

// مدیریت سازها (F3-AC2) — Soft Delete با فعال/غیرفعال
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActiveBadge, PageHeader } from "@/components/shared/form";
import { getInstruments } from "@/modules/instrument/services/instrument.service";
import { toggleInstrumentActiveAction } from "@/modules/instrument/actions/instrument.actions";
import { InstrumentForm } from "@/modules/instrument/components/instrument-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "سازها" };

export default async function InstrumentsPage() {
  const instruments = await getInstruments();

  return (
    <>
      <PageHeader title="سازها و رشته‌های آموزشی">
        <Badge variant="outline">F3-AC2</Badge>
      </PageHeader>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">فهرست سازها</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {instruments.map((i) => (
            <div
              key={i.id}
              className="flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm"
            >
              <b className="min-w-20">{i.name}</b>
              <span className="text-xs text-muted-foreground">
                {i._count.students} هنرجو · {i._count.teachers} استاد
              </span>
              <ActiveBadge active={i.isActive} />
              <form action={toggleInstrumentActiveAction} className="ms-auto">
                <input type="hidden" name="id" value={i.id} />
                <input type="hidden" name="next" value={String(!i.isActive)} />
                <Button type="submit" size="sm" variant="outline">
                  {i.isActive ? "غیرفعال‌سازی" : "فعال‌سازی"}
                </Button>
              </form>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            سازِ غیرفعال در فرم‌های انتخاب ظاهر نمی‌شود ولی سوابق حفظ می‌شود.
          </p>
          <div className="border-t pt-4">
            <InstrumentForm />
          </div>
        </CardContent>
      </Card>
    </>
  );
}

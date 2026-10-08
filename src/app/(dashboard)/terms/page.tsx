// مدیریت ترم‌ها (F0) — لیست + فرم + یادآوری تمدید بند ۷
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/form";
import { formatJalali } from "@/lib/jalali";
import { getTerms } from "@/modules/term/services/term.service";
import { activateTermAction } from "@/modules/term/actions/term.actions";
import { TermForm } from "@/modules/term/components/term-form";
import { getStudentsNeedingRenewal } from "@/modules/term/services/renewal.service";
import { RenewalCard } from "@/modules/term/components/renewal-card";

export const dynamic = "force-dynamic";
export const metadata = { title: "ترم‌ها" };

function termStatus(t: { isActive: boolean; startDate: Date; endDate: Date }) {
  if (t.isActive) return <Badge>فعال</Badge>;
  const today = new Date();
  if (t.endDate < today) return <Badge variant="outline">پایان‌یافته</Badge>;
  if (t.startDate > today) return <Badge variant="secondary">آینده</Badge>;
  return <Badge variant="outline">بین ترم‌ها</Badge>;
}

export default async function TermsPage() {
  const [terms, renewalStudents] = await Promise.all([getTerms(), getStudentsNeedingRenewal(7)]);
  const activeTerm = terms.find((t) => t.isActive);

  return (
    <>
      <PageHeader title="ترم‌های تحصیلی">
        <Badge variant="outline">F0</Badge>
      </PageHeader>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ترم‌های ثبت‌شده</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {terms.length === 0 ? (
              <p className="text-sm text-muted-foreground">هنوز ترمی ثبت نشده است.</p>
            ) : (
              terms.map((t) => (
                <div
                  key={t.id}
                  className="flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2.5 text-sm"
                >
                  <b className="min-w-24">{t.name}</b>
                  <span className="text-muted-foreground" dir="ltr">
                    {formatJalali(t.startDate)} → {formatJalali(t.endDate)}
                  </span>
                  {termStatus(t)}
                  <span className="text-xs text-muted-foreground">
                    {t._count.classes} کلاس
                  </span>
                  <form action={activateTermAction} className="ms-auto">
                    <input type="hidden" name="termId" value={t.id} />
                    <Button
                      type="submit"
                      size="sm"
                      variant="outline"
                      disabled={t.isActive}
                    >
                      {t.isActive ? "فعال است" : "فعال‌سازی"}
                    </Button>
                  </form>
                </div>
              ))
            )}
            <p className="pt-2 text-xs text-muted-foreground">
              در هر لحظه حداکثر یک ترم فعال است؛ فعال‌سازی ترم جدید، ترم قبلی را
              پایان می‌دهد (F0-AC2).
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">＋ ترم جدید</CardTitle>
          </CardHeader>
          <CardContent>
            <TermForm />
            <p className="mt-3 text-xs text-muted-foreground">
              کلاس تکرارشونده فقط روی ترم فعال ساخته می‌شود و جلساتش تا پایان همان
              ترم تولید می‌شود (F0-AC3).
            </p>
          </CardContent>
        </Card>
      </div>

      {/* بند ۷ — یادآوری تمدید ترم (فقط پیامک، آزادسازی دستی) */}
      <div className="mt-6">
        {activeTerm ? (
          <RenewalCard students={renewalStudents} termName={activeTerm.name} />
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-6 text-center text-sm text-muted-foreground">ترم فعالی وجود ندارد — یادآوری تمدید معنایی ندارد.</CardContent>
          </Card>
        )}
      </div>
    </>
  );
}

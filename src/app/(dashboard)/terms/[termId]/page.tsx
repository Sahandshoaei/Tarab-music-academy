// جزئیات ترم — خلاصه و کلاس‌های ترم (کلاس‌ها در ایست ۲ کامل می‌شوند)
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/form";
import { formatJalali } from "@/lib/jalali";
import { findTermById } from "@/modules/term/repositories/term.repository";

export const dynamic = "force-dynamic";

export default async function TermDetailPage({
  params,
}: {
  params: Promise<{ termId: string }>;
}) {
  const { termId } = await params;
  const term = await findTermById(Number(termId));
  if (!term) notFound();

  return (
    <>
      <PageHeader title={`ترم ${term.name}`}>
        {term.isActive ? <Badge>فعال</Badge> : null}
      </PageHeader>
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-base">مشخصات ترم</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            بازه:{" "}
            <span dir="ltr">
              {formatJalali(term.startDate)} → {formatJalali(term.endDate)}
            </span>
          </p>
          <p className="text-muted-foreground">
            کلاس‌های این ترم در ایست ۲ (فیچر F4) به این صفحه اضافه می‌شوند.
          </p>
        </CardContent>
      </Card>
    </>
  );
}

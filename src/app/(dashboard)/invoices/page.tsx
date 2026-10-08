import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/form";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default function InvoicesPage() {
  return (
    <>
      <PageHeader title="فاکتورها — حذف شد" />
      <Card className="border-amber-500/40 bg-amber-500/10">
        <CardContent className="p-6 text-sm leading-relaxed">
          <p className="font-bold">سیستم اقساط حذف شده است.</p>
          <p className="mt-2 text-muted-foreground">
            طبق درخواست، اقساط‌بندی شهریه پاک شد و سیستم جدید «شهریه منعطف» جایگزین شد:
            هر کلاس شهریه‌اش از تنظیمات محاسبه می‌شود، پرداخت هر مبلغی با رسید الزامی و تخصیص دستی به کلاس‌ها.
          </p>
          <div className="mt-4 flex gap-2">
            <Button asChild size="sm"><Link href="/debtors">مشاهده بدهکاران (مانده شهریه)</Link></Button>
            <Button asChild variant="outline" size="sm"><Link href="/students">لیست هنرجویان</Link></Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

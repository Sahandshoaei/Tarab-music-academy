import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/form";
import { Button } from "@/components/ui/button";

export default function NewInvoicePage() {
  return (
    <>
      <PageHeader title="صدور فاکتور — حذف شد">
        <Button asChild variant="ghost" size="sm"><Link href="/invoices">← بازگشت</Link></Button>
      </PageHeader>
      <Card className="border-amber-500/40 bg-amber-500/10">
        <CardContent className="p-6 text-sm leading-relaxed">
          <p>صدور فاکتور با اقساط حذف شده — برای ثبت شهریه از صفحه هر هنرجو «ثبت پرداخت منعطف» استفاده کنید.</p>
          <Button asChild size="sm" className="mt-4"><Link href="/students">رفتن به هنرجویان</Link></Button>
        </CardContent>
      </Card>
    </>
  );
}

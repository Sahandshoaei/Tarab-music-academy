import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/form";
import { Button } from "@/components/ui/button";

export default function InvoiceDetailPage() {
  return (
    <>
      <PageHeader title="جزئیات فاکتور — حذف شد">
        <Button asChild variant="ghost" size="sm"><Link href="/invoices">← فاکتورها</Link></Button>
      </PageHeader>
      <Card><CardContent className="p-6 text-sm text-muted-foreground">این صفحه با حذف اقساط دیگر کاربرد ندارد.</CardContent></Card>
    </>
  );
}

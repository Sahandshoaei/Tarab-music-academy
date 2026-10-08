// ثبت هنرجوی جدید (F2-AC1..AC4)
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/form";
import { prisma } from "@/lib/prisma";
import { StudentForm } from "@/modules/student/components/student-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "هنرجوی جدید" };

export default async function NewStudentPage() {
  const instruments = await prisma.instrument.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });

  return (
    <>
      <PageHeader title="ثبت هنرجوی جدید" />
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">مشخصات هنرجو</CardTitle>
        </CardHeader>
        <CardContent>
          <StudentForm instruments={instruments} />
        </CardContent>
      </Card>
    </>
  );
}

// ثبت استاد جدید (F3-AC1)
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/form";
import { prisma } from "@/lib/prisma";
import { TeacherForm } from "@/modules/teacher/components/teacher-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "استاد جدید" };

export default async function NewTeacherPage() {
  const instruments = await prisma.instrument.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });

  return (
    <>
      <PageHeader title="ثبت استاد جدید" />
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">مشخصات استاد</CardTitle>
        </CardHeader>
        <CardContent>
          <TeacherForm instruments={instruments} />
        </CardContent>
      </Card>
    </>
  );
}

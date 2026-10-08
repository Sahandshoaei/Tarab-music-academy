// ویرایش هنرجو — به‌صورت درجا در صفحه پروفایل انجام می‌شود؛ این مسیر فقط برای سازگاری ریدایرکت است
import { redirect } from "next/navigation";

export default async function EditStudentRedirectPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  redirect(`/students/${studentId}`);
}

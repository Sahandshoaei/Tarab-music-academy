// تنظیمات آموزشگاه — ساعات کاری + نرخ شهریه + اکانت ادمین
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/form";
import { getSettings } from "@/modules/settings/services/settings.service";
import { SettingsForm } from "@/modules/settings/components/settings-form";
import { TuitionRatesForm } from "@/modules/settings/components/tuition-rates-form";
import { AdminAccountForm } from "@/modules/settings/components/admin-account-form";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "تنظیمات" };

export default async function SettingsPage() {
  const settings = await getSettings();

  if (!settings) {
    return (
      <>
        <PageHeader title="تنظیمات" />
        <Card className="max-w-lg">
          <CardContent className="p-6 text-sm text-muted-foreground">
            ردیف تنظیمات یافت نشد — <code>pnpm db:seed</code> را اجرا کنید.
          </CardContent>
        </Card>
      </>
    );
  }

  const session = await auth();
  const userId = (session?.user as { id: string } | undefined)?.id as string | undefined;
  const admin = userId
    ? await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } })
    : null;

  return (
    <>
      <PageHeader title="تنظیمات" />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ساعات کاری و روزهای تعطیل هفتگی</CardTitle>
            <CardDescription>بازه کاری آموزشگاه و روزهای تعطیل هفتگی (شنبه-جمعه)</CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsForm
              settings={{
                schoolName: settings.schoolName,
                openTime: settings.openTime,
                closeTime: settings.closeTime,
                closedDays: settings.closedDays,
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">نرخ شهریه پیش‌فرض هر نوع کلاس</CardTitle>
            <CardDescription>برای صدور فاکتور به‌عنوان پیشنهاد استفاده می‌شود (تومان)</CardDescription>
          </CardHeader>
          <CardContent>
            <TuitionRatesForm
              rates={{
                privateRate: (settings as Record<string, unknown>).privateRate as number | null ?? null,
                groupRate: (settings as Record<string, unknown>).groupRate as number | null ?? null,
                semiGroupRate: (settings as Record<string, unknown>).semiGroupRate as number | null ?? null,
                practiceRate: (settings as Record<string, unknown>).practiceRate as number | null ?? null,
              }}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">اکانت ادمین (یوزر و پسورد)</CardTitle>
            <CardDescription>ایمیل و رمز عبور اکانت فعلی — رمز فعلی برای هر تغییر الزامی است</CardDescription>
          </CardHeader>
          <CardContent>
            {admin ? (
              <AdminAccountForm admin={{ name: admin.name ?? null, email: admin.email }} />
            ) : (
              <p className="text-sm text-muted-foreground">نشست یافت نشد — دوباره وارد شوید.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

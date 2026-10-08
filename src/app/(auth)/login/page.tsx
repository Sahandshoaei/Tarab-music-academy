// ═══════════════════════════════════════════════════════════════════════════
//  صفحه ورود — F1 (مطابق وایرفریم: docs/design/wireframes → 02-login)
// ═══════════════════════════════════════════════════════════════════════════
import { LoginForm } from "./login-form";

export const metadata = { title: "ورود" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <LoginForm
        initialError={error ? "ایمیل یا رمز عبور نادرست است." : undefined}
      />
    </main>
  );
}

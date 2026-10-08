import { redirect } from "next/navigation";

// ریشه → داشبورد (مسیر واقعی پنل در گروه (dashboard) است)
export default function RootPage() {
  redirect("/dashboard");
}

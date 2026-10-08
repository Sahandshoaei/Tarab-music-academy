import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// فونت وزیرمتن — لوکال (بدون وابستگی به شبکه در زمان build)
const vazirmatn = localFont({
  variable: "--font-vazirmatn",
  src: [
    { path: "./fonts/Vazirmatn-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/Vazirmatn-Bold.ttf", weight: "700", style: "normal" },
  ],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "طرب — پنل مدیریت آموزشگاه موسیقی",
    template: "%s | طرب",
  },
  description: "سامانه مدیریت آموزشگاه موسیقی و هنرهای نمایشی طرب — MVP-1",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={`${vazirmatn.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-vazirmatn)]">
        {children}
      </body>
    </html>
  );
}

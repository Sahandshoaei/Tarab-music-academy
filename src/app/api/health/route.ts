// ═══════════════════════════════════════════════════════════════════════════
//  Health Endpoint — GET /api/health
//  • عمومی: فقط { ok } — برای مانیتورینگ آپتایم (بدون افشای داده)
//  • با نشست ادمین: آمار کامل زیرساخت
// ═══════════════════════════════════════════════════════════════════════════
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSystemHealth } from "@/modules/dashboard/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const health = await getSystemHealth();

  if (!session) {
    // عمومی — فقط سلامت، بدون جزئیات
    return NextResponse.json({ ok: health.ok });
  }

  return NextResponse.json(health);
}

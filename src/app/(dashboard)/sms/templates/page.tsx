import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/form";
import { listTemplates } from "@/modules/sms/repositories/template.repository";
import { TemplateForm } from "@/modules/sms/components/template-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "قالب‌های پیامک" };

export default async function TemplatesPage() {
  const templates = await listTemplates(true);

  return (
    <>
      <PageHeader title="قالب‌های پیامک">
        <Badge variant="outline">F7-1</Badge>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">قالب جدید</CardTitle>
          </CardHeader>
          <CardContent>
            <TemplateForm />
          </CardContent>
        </Card>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{templates.length} قالب</p>
          {templates.map((t) => (
            <Card key={t.id} className={t.isActive ? "" : "opacity-60"}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  {t.title}
                  <Badge variant={t.isActive ? "default" : "outline"}>{t.isActive ? "فعال" : "غیرفعال"}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="whitespace-pre-wrap rounded bg-muted p-2 text-xs">{t.body}</p>
                <details className="rounded border p-2">
                  <summary className="cursor-pointer text-xs">ویرایش</summary>
                  <div className="pt-3">
                    <TemplateForm template={t} />
                  </div>
                </details>
              </CardContent>
            </Card>
          ))}
          {templates.length === 0 ? <p className="text-sm text-muted-foreground">هنوز قالبی نیست.</p> : null}
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  کامپوننت مشترک: صفحه‌ای که هنوز ساخته نشده (در حال ساخت — فاز ۶)
// ═══════════════════════════════════════════════════════════════════════════
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ComingSoonProps {
  title: string;
  feature: string;
  note?: string;
}

export function ComingSoon({ title, feature, note }: ComingSoonProps) {
  return (
    <Card className="mx-auto mt-16 max-w-md border-dashed">
      <CardHeader className="text-center">
        <span className="mx-auto mb-2 text-4xl">🚧</span>
        <CardTitle>{title}</CardTitle>
        <CardDescription>در حال ساخت — {feature}</CardDescription>
      </CardHeader>
      {note ? (
        <CardContent>
          <p className="text-center text-sm text-muted-foreground">{note}</p>
        </CardContent>
      ) : null}
    </Card>
  );
}

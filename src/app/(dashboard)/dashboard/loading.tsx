import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-5">
              <Skeleton className="size-9 rounded-xl" />
              <Skeleton className="mt-4 h-4 w-24" />
              <Skeleton className="mt-2 h-8 w-16" />
              <Skeleton className="mt-3 h-3 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="overflow-hidden">
        <div className="border-b bg-[#FAF6F0] px-4 py-3 dark:bg-card">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-1 h-3 w-48" />
        </div>
        <div className="space-y-3 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      </Card>
    </div>
  );
}

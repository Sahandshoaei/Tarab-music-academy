"use client";

// محتوای ناوبری — در سایدبار دسکتاپ و دراور موبایل مشترک است
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "cn";
import { navGroups } from "@/config/navigation";

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-3">
      {navGroups.map((group) => (
        <div key={group.label} className="mb-5">
          <p className="mb-2 px-2 text-[11px] font-medium tracking-wide text-muted-foreground/80">
            {group.label}
          </p>
          <ul className="space-y-1">
            {group.items.map((item) => {
              const active =
                !item.disabled && pathname.startsWith(item.href);
              const Icon = item.icon;

              if (item.disabled) {
                return (
                  <li key={item.href}>
                    <span
                      className="flex cursor-not-allowed items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-muted-foreground/50"
                      aria-disabled
                      title={`فاز ${item.badge}`}
                    >
                      <Icon className="size-[18px] shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      <Badge variant="outline" className="rounded-full text-[9px] px-1.5">
                        {item.badge}
                      </Badge>
                    </span>
                  </li>
                );
              }

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                      active
                        ? "bg-primary text-primary-foreground font-medium shadow-sm"
                        : "text-foreground/75 hover:bg-muted",
                    )}
                  >
                    <Icon className="size-[18px] shrink-0" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

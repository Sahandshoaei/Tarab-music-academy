"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldDark = saved === "dark" || (!saved && prefersDark);
    setIsDark(shouldDark);
    document.documentElement.classList.toggle("dark", shouldDark);
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      className="size-8 rounded-full border bg-card hover:bg-muted"
      aria-label="تغییر تم"
      title={isDark ? "حالت روشن" : "حالت تاریک"}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}

import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className={cn(
        "border-input bg-background flex items-center rounded-md border",
        className,
      )}
    >
      <button
        onClick={() => setTheme("light")}
        className={cn(
          "focus-visible:ring-ring relative inline-flex h-6 w-6 items-center justify-center rounded-l-md text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
          theme === "light"
            ? "bg-primary text-primary-foreground shadow-md"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground opacity-60",
        )}
        aria-label="Switch to light mode"
        aria-pressed={theme === "light"}
        title="Light mode"
      >
        <Sun className="h-3 w-3" />
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={cn(
          "border-input focus-visible:ring-ring relative inline-flex h-6 w-6 items-center justify-center rounded-r-md border-l text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
          theme === "dark"
            ? "bg-primary text-primary-foreground shadow-md"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground opacity-60",
        )}
        aria-label="Switch to dark mode"
        aria-pressed={theme === "dark"}
        title="Dark mode"
      >
        <Moon className="h-3 w-3" />
      </button>
    </div>
  );
} 
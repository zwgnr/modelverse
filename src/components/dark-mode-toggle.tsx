import React from "react";
import { Moon, Sun } from "lucide-react";
import { useDarkModeContext } from "./dark-mode-provider";

interface DarkModeToggleProps {
  className?: string;
}

export function DarkModeToggle({ className }: DarkModeToggleProps) {
  const { isDarkMode, toggle } = useDarkModeContext();

  return (
    <div
      className={`border-input bg-background flex w-16 items-center justify-center rounded-md border ${className}`}
    >
      <button
        onClick={() => isDarkMode && toggle()}
        className={`focus-visible:ring-ring relative inline-flex h-6 w-6 items-center justify-center rounded-l-md text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 ${
          !isDarkMode
            ? "bg-primary text-primary-foreground shadow-md"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground opacity-60"
        }`}
        aria-label="Switch to light mode"
        aria-pressed={!isDarkMode}
      >
        <Sun className="h-3 w-3" />
      </button>
      <button
        onClick={() => !isDarkMode && toggle()}
        className={`border-input focus-visible:ring-ring relative inline-flex h-6 w-6 items-center justify-center rounded-r-md border-l text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 ${
          isDarkMode
            ? "bg-primary text-primary-foreground shadow-md"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground opacity-60"
        }`}
        aria-label="Switch to dark mode"
        aria-pressed={isDarkMode}
      >
        <Moon className="h-3 w-3" />
      </button>
    </div>
  );
}

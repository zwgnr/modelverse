import React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "./theme-provider";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
 // const { theme, setTheme } = useTheme();
const theme = 'light'
  return (
    <div
      className={`border-input bg-background flex items-center rounded-md border ${className}`}
    >
      <button
       // onClick={() => setTheme('light')}
        className={`focus-visible:ring-ring relative inline-flex h-6 w-6 items-center justify-center rounded-l-md text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 ${
          theme === 'light'
            ? "bg-primary text-primary-foreground shadow-md"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground opacity-60"
        }`}
        aria-label="Switch to light mode"
        aria-pressed={theme === 'light'}
        title="Light mode"
      >
        <Sun className="h-3 w-3" />
      </button>
      <button
      //  onClick={() => setTheme('dark')}
        className={`border-input focus-visible:ring-ring relative inline-flex h-6 w-6 items-center justify-center border-l border-r text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 ${
          theme === 'light'
            ? "bg-primary text-primary-foreground shadow-md"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground opacity-60"
        }`}
        aria-label="Switch to dark mode"
        aria-pressed={theme === 'light'}
        title="Dark mode"
      >
        <Moon className="h-3 w-3" />
      </button>
      <button
      //  onClick={() => setTheme('system')}
        className={`focus-visible:ring-ring relative inline-flex h-6 w-6 items-center justify-center rounded-r-md text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 ${
          theme === 'light'
            ? "bg-primary text-primary-foreground shadow-md"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground opacity-60"
        }`}
        aria-label="Switch to system mode"
        aria-pressed={theme === 'light'}
        title="System mode"
      >
        <Monitor className="h-3 w-3" />
      </button>
    </div>
  );
} 
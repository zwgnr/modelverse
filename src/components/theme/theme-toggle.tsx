import { Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";

import { useTheme } from "./theme-provider";

interface ThemeToggleProps {
	className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
	const { theme, setTheme } = useTheme();

	return (
		<div
			className={cn(
				"flex items-center rounded-md border border-border bg-background",
				className,
			)}
		>
			<button
				type="button"
				onClick={() => setTheme("light")}
				className={cn(
					"relative inline-flex h-9 w-9 items-center justify-center rounded-l-md font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
					theme === "light"
						? "bg-primary text-primary-foreground shadow-md"
						: "text-muted-foreground opacity-60 hover:bg-secondary hover:text-secondary-foreground",
				)}
				aria-label="Switch to light mode"
				aria-pressed={theme === "light"}
				title="Light mode"
			>
				<Sun className="h-5 w-5" />
			</button>
			<button
				type="button"
				onClick={() => setTheme("dark")}
				className={cn(
					"relative inline-flex h-9 w-9 items-center justify-center rounded-r-md border-border border-l font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
					theme === "dark"
						? "bg-primary text-primary-foreground shadow-md"
						: "text-muted-foreground opacity-60 hover:bg-secondary hover:text-secondary-foreground",
				)}
				aria-label="Switch to dark mode"
				aria-pressed={theme === "dark"}
				title="Dark mode"
			>
				<Moon className="h-5 w-5" />
			</button>
		</div>
	);
}

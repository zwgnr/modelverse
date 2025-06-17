import { Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "../ui/button";
import { useTheme } from "./theme-provider";

interface ThemeToggleProps {
	className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
	const { theme, setTheme } = useTheme();

	return (
		<div
			className={cn(
				"relative flex items-center gap-1 overflow-hidden rounded-xl border border-black/10 bg-black/[0.01] p-1 shadow-black/5 shadow-lg backdrop-blur-md backdrop-saturate-150 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-black/2 before:via-transparent before:to-transparent dark:border-white/10 dark:bg-white/[0.01] dark:shadow-black/30 dark:before:from-white/2",
				className,
			)}
		>
			<Button
				variant={theme === "light" ? "default" : "flat"}
				size="icon"
				onClick={() => setTheme("light")}
				aria-label="Switch to light mode"
				aria-pressed={theme === "light"}
				title="Light mode"
			>
				<Sun className="h-4 w-4" />
			</Button>
			<Button
				variant={theme === "dark" ? "default" : "flat"}
				size="icon"
				onClick={() => setTheme("dark")}
				aria-label="Switch to dark mode"
				aria-pressed={theme === "dark"}
				title="Dark mode"
			>
				<Moon className="h-4 w-4" />
			</Button>
		</div>
	);
}

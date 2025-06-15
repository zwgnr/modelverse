import { createContext, type PropsWithChildren, use, useEffect } from "react";

import { useRouter } from "@tanstack/react-router";

import type { Theme } from "@/server/theme";
import { setThemeServerFn } from "@/server/theme";

type ThemeContextVal = { theme: Theme; setTheme: (val: Theme) => void };
type Props = PropsWithChildren<{ theme: Theme }>;

const ThemeContext = createContext<ThemeContextVal | null>(null);

export function ThemeProvider({ children, theme }: Props) {
	const router = useRouter();

	// Apply theme class to document element immediately
	useEffect(() => {
		document.documentElement.className = theme;
	}, [theme]);

	function setTheme(val: Theme) {
		// Add transitioning class to prevent flashes
		document.documentElement.classList.add("transitioning");

		// Update theme class immediately
		document.documentElement.className = `${val} transitioning`;

		// Remove transitioning class after a brief delay
		setTimeout(() => {
			document.documentElement.classList.remove("transitioning");
		}, 100);

		// Then update server state
		setThemeServerFn({ data: val });
		router.invalidate();
	}

	return (
		<ThemeContext.Provider value={{ theme, setTheme }}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	const val = use(ThemeContext);
	if (!val) throw new Error("useTheme called outside of ThemeProvider!");
	return val;
}

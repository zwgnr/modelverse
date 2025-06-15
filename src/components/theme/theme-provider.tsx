import { createContext, type PropsWithChildren, use } from "react";

import { useRouter } from "@tanstack/react-router";

import type { Theme } from "@/server/theme";
import { setThemeServerFn } from "@/server/theme";

type ThemeContextVal = { theme: Theme; setTheme: (val: Theme) => void };
type Props = PropsWithChildren<{ theme: Theme }>;

const ThemeContext = createContext<ThemeContextVal | null>(null);

export function ThemeProvider({ children, theme }: Props) {
	const router = useRouter();

	function setTheme(val: Theme) {
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

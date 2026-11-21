import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
	theme: Theme;
	toggleTheme: () => void;
	setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "piper_theme";

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
	const [theme, setThemeState] = useState<Theme>(() => {
		// Check localStorage first
		let stored: Theme | null = null;
		try {
			stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
		} catch {
			// Storage blocked: fall back to the device setting
		}
		if (stored === "light" || stored === "dark") {
			return stored;
		}
		// Check system preference
		if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
			return "dark";
		}
		return "light";
	});

	useEffect(() => {
		// Apply theme to document
		const root = document.documentElement;
		if (theme === "dark") {
			root.setAttribute("data-theme", "dark");
			root.classList.add("dark");
		} else {
			root.removeAttribute("data-theme");
			root.classList.remove("dark");
		}
		root.style.colorScheme = theme;
		// The phone's status bar and browser bar blend into the app's header
		document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#1a1a1a" : "#ffffff");
		try {
			localStorage.setItem(THEME_STORAGE_KEY, theme);
		} catch {
			// Private mode: the theme just isn't remembered
		}
	}, [theme]);

	const toggleTheme = () => {
		setThemeState((prev) => (prev === "light" ? "dark" : "light"));
	};

	const setTheme = (newTheme: Theme) => {
		setThemeState(newTheme);
	};

	return (
		<ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
			{children}
		</ThemeContext.Provider>
	);
};

/* eslint-disable react-refresh/only-export-components */
export const useTheme = () => {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
};


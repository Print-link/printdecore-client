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
		const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
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
		// Save to localStorage
		localStorage.setItem(THEME_STORAGE_KEY, theme);
		// Debug log
		console.log("Theme changed to:", theme, "data-theme:", root.getAttribute("data-theme"));
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


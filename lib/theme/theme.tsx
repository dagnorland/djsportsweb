"use client";

/**
 * Dark (default) / light theme. Stored in localStorage (`theme`) so the
 * pre-hydration script in app/layout.tsx can apply it without a flash.
 */
import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Theme = "dark" | "light";
export const KEY = "theme";

export function readTheme(): Theme {
  try {
    return localStorage.getItem(KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function applyTheme(theme: Theme): void {
  const el = document.documentElement;
  el.classList.remove("light", "dark", "sports");
  el.classList.add(theme);
  document.querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme === "light" ? "#FFFFFF" : "#121212");
}


const ThemeContext = createContext<{ theme: Theme; setTheme: (t: Theme) => void }>({
  theme: "dark",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const t = readTheme();
    setThemeState(t);
    applyTheme(t);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    applyTheme(t);
    try { localStorage.setItem(KEY, t); } catch { /* ignore */ }
  }, []);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);

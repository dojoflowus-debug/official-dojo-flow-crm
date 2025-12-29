import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "cinematic";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  cycleTheme: () => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

const STORAGE_KEY = "dojoFlowTheme";

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  switchable = true,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (switchable) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark" || stored === "cinematic") {
        return stored;
      }
    }
    return defaultTheme;
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove("light", "dark", "cinematic");
    root.classList.remove("light-mode", "dark-mode", "cinematic-mode");
    
    // Add the current theme class
    root.classList.add(theme);
    root.classList.add(`${theme}-mode`);
    
    // Also set data attribute for CSS selectors
    root.setAttribute("data-theme", theme);

    if (switchable) {
      localStorage.setItem(STORAGE_KEY, theme);
    }
  }, [theme, switchable]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const cycleTheme = () => {
    setThemeState(prev => {
      if (prev === "light") return "dark";
      if (prev === "dark") return "cinematic";
      return "light";
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme, switchable }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

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
const MIGRATION_KEY = "dojoFlowThemeMigration_v2";

// Marketing/public routes that should always use dark theme
const MARKETING_ROUTES = ["/", "/public", "/schools", "/fitness", "/studios", "/pricing", "/owner"];

function isMarketingRoute(pathname: string): boolean {
  return MARKETING_ROUTES.includes(pathname);
}

// App routes that should always render in light mode regardless of user preference
const FORCED_LIGHT_ROUTES = ["/students"];

function isForcedLightRoute(pathname: string): boolean {
  return FORCED_LIGHT_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'));
}

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  switchable = true,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Check if on marketing page using window.location
    const isMarketing = isMarketingRoute(window.location.pathname);
    const isForcedLight = isForcedLightRoute(window.location.pathname);
    
    // Marketing pages always use dark theme
    if (isMarketing) {
      return "dark";
    }

    // Forced-light pages always use light theme
    if (isForcedLight) {
      return "light";
    }
    
    // Migration: Force dark theme once
    const migrated = localStorage.getItem(MIGRATION_KEY);
    if (!migrated) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(MIGRATION_KEY, "true");
      localStorage.setItem(STORAGE_KEY, "dark");
      return "dark";
    }
    
    if (switchable) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark" || stored === "cinematic") {
        return stored;
      }
    }
    
    return defaultTheme;
  });

  // Listen to route changes via popstate and update theme
  useEffect(() => {
    const handleRouteChange = () => {
      const isMarketing = isMarketingRoute(window.location.pathname);
      const isForcedLight = isForcedLightRoute(window.location.pathname);
      
      if (isMarketing) {
        setThemeState("dark");
      } else if (isForcedLight) {
        setThemeState("light");
      } else if (switchable) {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === "light" || stored === "dark" || stored === "cinematic") {
          setThemeState(stored);
        }
      }
    };

    // Listen for browser navigation (back/forward)
    window.addEventListener("popstate", handleRouteChange);
    
    // Listen for React Router navigation
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    
    window.history.pushState = function(...args) {
      originalPushState.apply(this, args);
      handleRouteChange();
    };
    
    window.history.replaceState = function(...args) {
      originalReplaceState.apply(this, args);
      handleRouteChange();
    };
    
    return () => {
      window.removeEventListener("popstate", handleRouteChange);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, [switchable]);

  useEffect(() => {
    const root = document.documentElement;
    const isMarketing = isMarketingRoute(window.location.pathname);
    
    // Remove all theme classes
    root.classList.remove("light", "dark", "cinematic");
    root.classList.remove("light-mode", "dark-mode", "cinematic-mode");
    
    // Add the current theme class
    root.classList.add(theme);
    root.classList.add(`${theme}-mode`);
    
    // Also set data attribute for CSS selectors
    root.setAttribute("data-theme", theme);
    
    // Only save to localStorage if NOT on marketing pages and switchable
    if (!isMarketing && switchable) {
      localStorage.setItem(STORAGE_KEY, theme);
    }
  }, [theme, switchable]);

  const setTheme = (newTheme: Theme) => {
    const isMarketing = isMarketingRoute(window.location.pathname);
    
    // Prevent theme changes on marketing pages
    if (isMarketing) {
      console.warn("Theme changes are disabled on marketing pages");
      return;
    }
    setThemeState(newTheme);
  };

  const cycleTheme = () => {
    const isMarketing = isMarketingRoute(window.location.pathname);
    
    // Prevent theme changes on marketing pages
    if (isMarketing) {
      console.warn("Theme changes are disabled on marketing pages");
      return;
    }
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

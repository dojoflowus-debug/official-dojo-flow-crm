import { useEffect } from "react";
import PublicLanding from "./PublicLanding";

/**
 * Wrapper for PublicLanding that forces dark theme
 * This ensures the marketing website always displays in dark mode
 * regardless of the user's dashboard theme preference
 */
export default function PublicLandingWrapper() {
  useEffect(() => {
    const root = document.documentElement;
    
    // Force dark theme for marketing pages
    root.classList.remove("light", "cinematic");
    root.classList.remove("light-mode", "cinematic-mode");
    root.classList.add("dark");
    root.classList.add("dark-mode");
    root.setAttribute("data-theme", "dark");
    
    // Cleanup: restore theme from localStorage when leaving this page
    return () => {
      const storedTheme = localStorage.getItem("dojoFlowTheme");
      if (storedTheme && (storedTheme === "light" || storedTheme === "dark" || storedTheme === "cinematic")) {
        root.classList.remove("light", "dark", "cinematic");
        root.classList.remove("light-mode", "dark-mode", "cinematic-mode");
        root.classList.add(storedTheme);
        root.classList.add(`${storedTheme}-mode`);
        root.setAttribute("data-theme", storedTheme);
      }
    };
  }, []);
  
  return <PublicLanding />;
}

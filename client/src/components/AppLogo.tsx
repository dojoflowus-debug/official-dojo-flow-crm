import { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface AppLogoProps {
  className?: string;
  height?: number;
  showText?: boolean;
}

/**
 * Theme-to-logo mapping
 * 
 * Light Mode: Dark logo (high contrast on white background) - DO NOT CHANGE
 * Dark Mode: Light logo (high contrast on dark background)
 * Cinematic Mode: Light logo (high contrast on dark/cinematic background)
 */
function getLogoForTheme(theme: string): { src: string; isDarkBackground: boolean } {
  switch (theme) {
    case 'light':
      // Light Mode: use DARK logo (black text on white background)
      // This is working correctly - DO NOT CHANGE
      return {
        src: '/assets/branding/dojoflow-logo-dark.png',
        isDarkBackground: false
      };
    case 'dark':
      // Dark Mode: use LIGHT logo (white text on dark background)
      return {
        src: '/assets/branding/dojoflow-logo-light.png',
        isDarkBackground: true
      };
    case 'cinematic':
      // Cinematic Mode: ALWAYS use LIGHT logo (light-on-dark variant)
      return {
        src: '/assets/branding/dojoflow-logo-light.png',
        isDarkBackground: true
      };
    default:
      // Fallback to dark logo for unknown themes
      return {
        src: '/assets/branding/dojoflow-logo-dark.png',
        isDarkBackground: false
      };
  }
}

/**
 * AppLogo - Theme-aware DojoFlow logo component with fade animation
 * 
 * Shows the correct logo variant based on the current theme.
 * Includes smooth fade transition when theme changes.
 * Includes fallback to text wordmark if image fails to load.
 */
export function AppLogo({ className = '', height = 32, showText = false }: AppLogoProps) {
  const { theme } = useTheme();
  const [imageError, setImageError] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayedTheme, setDisplayedTheme] = useState(theme);
  const prevThemeRef = useRef(theme);
  
  // Handle theme change with fade animation
  useEffect(() => {
    if (prevThemeRef.current !== theme) {
      // Theme changed - start fade out
      setIsTransitioning(true);
      
      // After fade out, update the logo and fade back in
      const fadeOutTimer = setTimeout(() => {
        setDisplayedTheme(theme);
        setImageError(false); // Reset error state for new logo
        
        // Small delay before fade in
        const fadeInTimer = setTimeout(() => {
          setIsTransitioning(false);
        }, 50);
        
        return () => clearTimeout(fadeInTimer);
      }, 150); // Duration of fade out
      
      prevThemeRef.current = theme;
      return () => clearTimeout(fadeOutTimer);
    }
  }, [theme]);
  
  // Get the correct logo for the displayed theme
  const { src: logoSrc, isDarkBackground } = getLogoForTheme(displayedTheme);
  
  // Fallback text wordmark
  if (imageError) {
    return (
      <div 
        className={`flex items-center gap-2 transition-opacity duration-150 ${className}`}
        style={{ opacity: isTransitioning ? 0 : 1 }}
      >
        <span 
          className={`font-bold text-xl ${
            isDarkBackground ? 'text-white' : 'text-slate-900'
          }`}
          style={{ height }}
        >
          DojoFlow
        </span>
      </div>
    );
  }
  
  return (
    <div 
      className={`flex items-center gap-2 transition-opacity duration-150 ease-in-out ${className}`}
      style={{ opacity: isTransitioning ? 0 : 1 }}
    >
      <img
        src={logoSrc}
        alt="DojoFlow"
        style={{ height, width: 'auto' }}
        className="object-contain"
        onError={() => setImageError(true)}
      />
      {showText && (
        <span 
          className={`font-semibold text-lg ${
            isDarkBackground ? 'text-white' : 'text-slate-900'
          }`}
        >
          DojoFlow
        </span>
      )}
    </div>
  );
}

export default AppLogo;

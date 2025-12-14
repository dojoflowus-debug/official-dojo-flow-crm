import { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface AppLogoProps {
  className?: string;
  height?: number;
  showText?: boolean;
}

/**
 * CENTRALIZED LOGO RESOLVER
 * 
 * Hard-mapped theme-to-logo configuration.
 * All header/topbar components MUST use this resolver.
 * 
 * DO NOT use CSS filters (invert/brightness) on logos.
 * Use the correct asset for each theme instead.
 */
const LOGO_BY_THEME: Record<string, string> = {
  // Light Mode: Dark logo (dark text on light background)
  // This is working correctly - DO NOT CHANGE
  light: '/assets/branding/dojoflow-logo-dark.png',
  
  // Dark Mode: Light logo (light text on dark background)
  dark: '/assets/branding/dojoflow-logo-light-v3.png',
  
  // Cinematic Mode: Light logo (same as dark - light text on dark background)
  cinematic: '/assets/branding/dojoflow-logo-light-v3.png',
};

/**
 * Get the correct logo asset for a given theme
 * Normalizes theme string to lowercase before mapping
 */
function getLogoForTheme(theme: string): { src: string; isDarkBackground: boolean } {
  const normalizedTheme = theme.toLowerCase().trim();
  const logoSrc = LOGO_BY_THEME[normalizedTheme] || LOGO_BY_THEME['light'];
  const isDarkBackground = normalizedTheme === 'dark' || normalizedTheme === 'cinematic';
  
  return { src: logoSrc, isDarkBackground };
}

/**
 * AppLogo - Theme-aware DojoFlow logo component with fade animation
 * 
 * Shows the correct logo variant based on the current theme.
 * Includes smooth fade transition when theme changes.
 * Includes fallback to text wordmark if image fails to load.
 * 
 * IMPORTANT: This is the SINGLE source of truth for logo rendering.
 * All components should use this instead of importing logo assets directly.
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
        {/* Red swirl icon fallback */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
        </div>
        <span 
          className={`font-bold text-xl ${
            isDarkBackground ? 'text-white' : 'text-slate-900'
          }`}
        >
          DojoFlow
        </span>
      </div>
    );
  }
  
  return (
    <div 
      className={`flex items-center gap-2 transition-opacity duration-150 ease-in-out ${className}`}
      style={{ 
        opacity: isTransitioning ? 0 : 1,
        // Ensure no background color interferes with logo
        background: 'transparent'
      }}
    >
      <img
        src={logoSrc}
        alt="DojoFlow"
        style={{ 
          height, 
          width: 'auto',
          // Remove any filters - use correct asset instead
          filter: 'none'
        }}
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

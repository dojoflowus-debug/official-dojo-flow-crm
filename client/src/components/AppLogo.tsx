import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface AppLogoProps {
  className?: string;
  height?: number;
  showText?: boolean;
}

/**
 * AppLogo - Theme-aware DojoFlow logo component
 * 
 * Shows dark logo on light backgrounds, light logo on dark backgrounds.
 * Includes fallback to text wordmark if image fails to load.
 */
export function AppLogo({ className = '', height = 32, showText = false }: AppLogoProps) {
  const { theme } = useTheme();
  const [imageError, setImageError] = useState(false);
  
  // Dark logo for light mode (high contrast on white)
  // Light logo for dark/cinematic mode (high contrast on dark)
  const isDarkBackground = theme === 'dark' || theme === 'cinematic';
  const logoSrc = isDarkBackground 
    ? '/assets/branding/dojoflow-logo-light.png'
    : '/assets/branding/dojoflow-logo-dark.png';
  
  // Fallback text wordmark
  if (imageError) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
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
    <div className={`flex items-center gap-2 ${className}`}>
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

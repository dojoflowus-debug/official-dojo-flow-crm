import { useTheme } from '@/contexts/ThemeContext'

interface BrandLogoProps {
  /** Show only the icon (red swirl) without wordmark */
  iconOnly?: boolean
  /** Custom size for the logo - applies to height */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Custom className for additional styling */
  className?: string
  /** Force a specific variant regardless of theme */
  forceVariant?: 'light' | 'dark'
}

/**
 * BrandLogo - Single source of truth for DojoFlow branding
 * 
 * Uses the official DojoFlow logo assets:
 * - Red swirl icon + "DojoFlow" wordmark
 * - Light variant (white text) for dark backgrounds
 * - Dark variant (dark text) for light backgrounds
 */
export function BrandLogo({ 
  iconOnly = false, 
  size = 'md',
  className = '',
  forceVariant
}: BrandLogoProps) {
  const { theme } = useTheme()
  
  // Determine which logo variant to use based on theme
  // Light mode → dark logo (dark text on light background)
  // Dark/Cinematic mode → light logo (light text on dark background)
  const variant = forceVariant || (theme === 'light' ? 'dark' : 'light')
  
  // Size mappings for the logo
  const sizeClasses = {
    sm: iconOnly ? 'h-6 w-6' : 'h-6',
    md: iconOnly ? 'h-8 w-8' : 'h-8',
    lg: iconOnly ? 'h-10 w-10' : 'h-10',
    xl: iconOnly ? 'h-12 w-12' : 'h-12',
  }
  
  const logoSrc = iconOnly 
    ? 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/IjqOFvsLMkrXFIaF.png'
    : variant === 'light' 
      ? '/logo-light.png' 
      : '/logo-dark.png'
  
  return (
    <img
      src={logoSrc}
      alt="DojoFlow"
      className={`${sizeClasses[size]} object-contain ${className}`}
    />
  )
}

/**
 * BrandLogoWithText - Logo with explicit text for cases where we need more control
 * Combines the icon with a styled text wordmark
 */
export function BrandLogoWithText({
  size = 'md',
  className = '',
  forceVariant
}: Omit<BrandLogoProps, 'iconOnly'>) {
  const { theme } = useTheme()
  const variant = forceVariant || (theme === 'light' ? 'dark' : 'light')
  
  const sizeClasses = {
    sm: { icon: 'h-6 w-6', text: 'text-base' },
    md: { icon: 'h-7 w-7', text: 'text-lg' },
    lg: { icon: 'h-8 w-8', text: 'text-xl' },
    xl: { icon: 'h-10 w-10', text: 'text-2xl' },
  }
  
  const textColor = variant === 'light' ? 'text-white' : 'text-zinc-900'
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/IjqOFvsLMkrXFIaF.png"
        alt=""
        className={`${sizeClasses[size].icon} object-contain`}
      />
      <span className={`${sizeClasses[size].text} font-semibold ${textColor}`}>
        DojoFlow
      </span>
    </div>
  )
}

export default BrandLogo

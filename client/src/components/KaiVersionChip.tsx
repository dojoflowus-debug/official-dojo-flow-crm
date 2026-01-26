import { Link } from 'wouter';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { useSystemHealth, type HealthStatus } from '@/hooks/useSystemHealth';

// Version constant - update this for future releases
export const KAI_VERSION = 'v0.9.0-beta';
export const KAI_VERSION_FULL = 'Kai Core v0.9.0-beta (Pilot Beta)';

interface KaiVersionChipProps {
  onClick?: () => void;
  className?: string;
}

// Health status color mapping
const HEALTH_COLORS = {
  healthy: {
    light: { dot: 'bg-green-500', ping: 'bg-green-500', text: 'text-green-600', border: 'border-green-200', bg: 'bg-green-50/50', hoverBorder: 'hover:border-green-300', gradient: 'from-green-100/50 to-emerald-100/50' },
    dark: { dot: 'bg-green-500', ping: 'bg-green-500', text: 'text-green-400', border: 'border-green-500/20', bg: 'bg-white/5', hoverBorder: 'hover:border-green-500/40', gradient: 'from-green-500/10 to-emerald-500/10', shadow: '0 0 20px rgba(34, 197, 94, 0.15)' },
    cinematic: { dot: 'bg-green-400', ping: 'bg-green-500', text: 'text-green-400', border: 'border-green-500/30', bg: 'bg-black/40', hoverBorder: 'hover:border-green-500/50', gradient: 'from-green-500/10 to-emerald-500/10', shadow: '0 0 20px rgba(34, 197, 94, 0.15)' },
  },
  degraded: {
    light: { dot: 'bg-yellow-500', ping: 'bg-yellow-500', text: 'text-yellow-600', border: 'border-yellow-200', bg: 'bg-yellow-50/50', hoverBorder: 'hover:border-yellow-300', gradient: 'from-yellow-100/50 to-orange-100/50' },
    dark: { dot: 'bg-yellow-500', ping: 'bg-yellow-500', text: 'text-yellow-400', border: 'border-yellow-500/20', bg: 'bg-white/5', hoverBorder: 'hover:border-yellow-500/40', gradient: 'from-yellow-500/10 to-orange-500/10', shadow: '0 0 20px rgba(234, 179, 8, 0.15)' },
    cinematic: { dot: 'bg-yellow-400', ping: 'bg-yellow-500', text: 'text-yellow-400', border: 'border-yellow-500/30', bg: 'bg-black/40', hoverBorder: 'hover:border-yellow-500/50', gradient: 'from-yellow-500/10 to-orange-500/10', shadow: '0 0 20px rgba(234, 179, 8, 0.15)' },
  },
  critical: {
    light: { dot: 'bg-red-600', ping: 'bg-red-600', text: 'text-red-600', border: 'border-red-200', bg: 'bg-red-50/50', hoverBorder: 'hover:border-red-300', gradient: 'from-red-100/50 to-orange-100/50' },
    dark: { dot: 'bg-red-500', ping: 'bg-red-500', text: 'text-red-400', border: 'border-red-500/20', bg: 'bg-white/5', hoverBorder: 'hover:border-red-500/40', gradient: 'from-red-500/10 to-orange-500/10', shadow: '0 0 20px rgba(239, 68, 68, 0.15)' },
    cinematic: { dot: 'bg-red-500', ping: 'bg-red-500', text: 'text-red-400', border: 'border-red-500/30', bg: 'bg-black/40', hoverBorder: 'hover:border-red-500/50', gradient: 'from-red-500/10 to-orange-500/10', shadow: '0 0 20px rgba(239, 68, 68, 0.15)' },
  },
};

export function KaiVersionChip({ onClick, className }: KaiVersionChipProps) {
  const { theme } = useTheme();
  const { status, averageResponseTime } = useSystemHealth();
  const isDark = theme === 'dark';
  const isCinematic = theme === 'cinematic';
  
  // Get colors based on health status and theme
  const themeKey = isCinematic ? 'cinematic' : isDark ? 'dark' : 'light';
  const colors = HEALTH_COLORS[status][themeKey];
  
  // Build tooltip with health info
  const healthTooltip = `${KAI_VERSION_FULL}\nSystem Status: ${status.toUpperCase()}${averageResponseTime > 0 ? `\nAvg Response: ${averageResponseTime}ms` : ''}`;

  const chipContent = (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-2 px-4 py-1.5 rounded-full transition-all duration-200",
        "border focus:outline-none focus:ring-2 focus:ring-offset-2",
        colors.bg,
        colors.border,
        colors.hoverBorder,
        "hover:bg-opacity-80",
        isCinematic ? "focus:ring-offset-black" : isDark ? "focus:ring-offset-[#0a0a0b]" : "focus:ring-offset-white",
        status === 'healthy' ? 'focus:ring-green-500/50' : status === 'degraded' ? 'focus:ring-yellow-500/50' : 'focus:ring-red-500/50',
        className
      )}
      style={{
        backdropFilter: isCinematic || isDark ? 'blur(8px)' : 'none',
        boxShadow: (isCinematic || isDark) && colors.shadow
          ? colors.shadow
          : '0 1px 3px rgba(0, 0, 0, 0.05)',
      }}
      aria-label={healthTooltip}
      title={healthTooltip}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {/* Status indicator dot with pulse animation */}
      <span className="relative flex h-2 w-2">
        <span 
          className={cn(
            "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
            colors.ping
          )}
        />
        <span 
          className={cn(
            "relative inline-flex rounded-full h-2 w-2",
            colors.dot
          )}
        />
      </span>

      {/* Version text */}
      <span 
        className={cn(
          "text-sm font-medium tracking-wide",
          colors.text
        )}
      >
        KAI • {KAI_VERSION}
      </span>

      {/* Subtle glow effect on hover */}
      <span 
        className={cn(
          "absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200",
          `bg-gradient-to-r ${colors.gradient}`
        )}
        style={{ pointerEvents: 'none' }}
      />
    </button>
  );

  return chipContent;
}

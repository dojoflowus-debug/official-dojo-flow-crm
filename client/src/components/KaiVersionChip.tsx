import { Link } from 'wouter';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

// Version constant - update this for future releases
export const KAI_VERSION = 'v0.9.0-beta';
export const KAI_VERSION_FULL = 'Kai Core v0.9.0-beta (Pilot Beta)';

interface KaiVersionChipProps {
  onClick?: () => void;
  className?: string;
}

export function KaiVersionChip({ onClick, className }: KaiVersionChipProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isCinematic = theme === 'cinematic';

  const chipContent = (
    <button
      onClick={onClick}
      title={KAI_VERSION_FULL}
      className={cn(
        "group relative flex items-center gap-2 px-4 py-1.5 rounded-full transition-all duration-200",
        "border focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2",
        isCinematic
          ? "bg-black/40 border-red-500/30 hover:bg-black/60 hover:border-red-500/50 focus:ring-offset-black"
          : isDark
          ? "bg-white/5 border-red-500/20 hover:bg-white/10 hover:border-red-500/40 focus:ring-offset-[#0a0a0b]"
          : "bg-red-50/50 border-red-200 hover:bg-red-50 hover:border-red-300 focus:ring-offset-white",
        className
      )}
      style={{
        backdropFilter: isCinematic || isDark ? 'blur(8px)' : 'none',
        boxShadow: isCinematic || isDark 
          ? '0 0 20px rgba(239, 68, 68, 0.15)' 
          : '0 1px 3px rgba(0, 0, 0, 0.05)',
      }}
      aria-label={`Open Kai - ${KAI_VERSION_FULL}`}
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
            isCinematic || isDark ? "bg-red-500" : "bg-red-600"
          )}
        />
        <span 
          className={cn(
            "relative inline-flex rounded-full h-2 w-2",
            isCinematic || isDark ? "bg-red-500" : "bg-red-600"
          )}
        />
      </span>

      {/* Version text */}
      <span 
        className={cn(
          "text-sm font-medium tracking-wide",
          isCinematic
            ? "text-red-400"
            : isDark
            ? "text-red-400"
            : "text-red-600"
        )}
      >
        KAI • {KAI_VERSION}
      </span>

      {/* Subtle glow effect on hover */}
      <span 
        className={cn(
          "absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200",
          isCinematic || isDark
            ? "bg-gradient-to-r from-red-500/10 to-orange-500/10"
            : "bg-gradient-to-r from-red-100/50 to-orange-100/50"
        )}
        style={{ pointerEvents: 'none' }}
      />
    </button>
  );

  return chipContent;
}

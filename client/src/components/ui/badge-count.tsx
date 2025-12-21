import React from 'react';

interface BadgeCountProps {
  count: number;
  className?: string;
  position?: 'top-right' | 'inline';
}

/**
 * Badge component for displaying notification counts
 * - Only visible when count > 0
 * - Shows "99+" for counts >= 100
 * - Supports top-right positioning for icons or inline display
 */
export function BadgeCount({ count, className = '', position = 'top-right' }: BadgeCountProps) {
  // Don't render if count is 0
  if (count <= 0) {
    return null;
  }

  // Format count: show "99+" for 100 or more
  const displayCount = count >= 100 ? '99+' : count.toString();

  const baseClasses = 'inline-flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-semibold';
  
  const positionClasses = position === 'top-right' 
    ? 'absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1'
    : 'ml-2 min-w-[20px] h-[20px] px-1.5';

  return (
    <span 
      className={`${baseClasses} ${positionClasses} ${className}`}
      aria-label={`${count} notification${count !== 1 ? 's' : ''}`}
    >
      {displayCount}
    </span>
  );
}

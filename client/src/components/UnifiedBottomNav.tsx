/**
 * UnifiedBottomNav Component
 * 
 * Single global bottom navigation bar for all DojoFlow pages.
 * Dark cinematic theme (black/charcoal background, red active state).
 * Replaces BottomNavLayout, AppShell, and GlobalBottomNavigation.
 * 
 * Features:
 * - Fixed positioning at bottom (72px height)
 * - 11 menu items with active state highlighting
 * - Focus Mode support (unmounts when enabled)
 * - Dark cinematic styling (charcoal bg, red accent)
 * - Smooth transitions and hover effects
 * - Badge count support for actionable items
 */

import React, { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Sparkles,
  Calendar,
  UserCog,
  CreditCard,
  BarChart3,
  Settings,
  Monitor,
  Package,
  Grid3x3,
} from 'lucide-react';
import { useFocusMode } from '@/contexts/FocusModeContext';
import { BadgeCount } from '@/components/ui/badge-count';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  paths?: string[];
  badgeCount?: number;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'students', label: 'Students', icon: <Users className="w-5 h-5" />, path: '/students' },
  { id: 'leads', label: 'Leads', icon: <UserPlus className="w-5 h-5" />, path: '/leads' },
  { id: 'kai', label: 'Kai', icon: <Sparkles className="w-5 h-5" />, path: '/kai', paths: ['/kai', '/kai-command'] },
  { id: 'classes', label: 'Classes', icon: <Calendar className="w-5 h-5" />, path: '/classes' },
  { id: 'kiosk', label: 'Kiosk', icon: <Monitor className="w-5 h-5" />, path: '/kiosk-studio' },
  { id: 'floor-plans', label: 'Floor Plans', icon: <Grid3x3 className="w-5 h-5" />, path: '/floor-plans' },
  { id: 'operations', label: 'Operations', icon: <Package className="w-5 h-5" />, path: '/operations/merchandise' },
  { id: 'staff', label: 'Staff', icon: <UserCog className="w-5 h-5" />, path: '/staff' },
  { id: 'billing', label: 'Billing', icon: <CreditCard className="w-5 h-5" />, path: '/billing' },
  { id: 'reports', label: 'Reports', icon: <BarChart3 className="w-5 h-5" />, path: '/reports' },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" />, path: '/settings' },
];

interface UnifiedBottomNavProps {
  badgeCounts?: Record<string, number>;
}

export const UnifiedBottomNav: React.FC<UnifiedBottomNavProps> = ({ badgeCounts = {} }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isFocusMode } = useFocusMode();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Don't render in Focus Mode
  if (isFocusMode) {
    return null;
  }

  const isActive = (item: NavItem): boolean => {
    const currentPath = location.pathname;
    
    // Check alternative paths first
    if (item.paths) {
      return item.paths.some(p => currentPath.startsWith(p));
    }
    
    // Check if current path starts with item path
    return currentPath.startsWith(item.path);
  };

  const handleNavClick = (path: string) => {
    navigate(path);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t transition-all duration-300 ease-out"
      style={{
        borderColor: 'rgba(255, 255, 255, 0.08)',
        backgroundColor: '#0F0F11',
        height: '72px',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 -2px 16px rgba(0, 0, 0, 0.4)',
      }}
    >
      <div className="flex items-center justify-between h-full px-2 max-w-full overflow-x-auto">
        {NAV_ITEMS.map((item, index) => {
          const active = isActive(item);
          const badge = badgeCounts[item.id] || 0;
          const isHovered = hoveredIndex === index;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.path)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg transition-all duration-200 flex-shrink-0 relative group"
              style={{
                color: active ? '#EF4444' : 'rgba(255, 255, 255, 0.6)',
                opacity: active ? 1 : isHovered ? 0.8 : 0.6,
                transform: active ? 'scale(1.08)' : isHovered ? 'scale(1.05)' : 'scale(1)',
                backgroundColor: isHovered ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              }}
              title={item.label}
            >
              <div className="relative">
                {item.icon}
                {badge > 0 && (
                  <BadgeCount count={badge} className="absolute -top-2 -right-2" />
                )}
              </div>
              <span className="text-xs font-medium whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default UnifiedBottomNav;

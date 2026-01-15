/**
 * GlobalBottomNavigation Component
 * 
 * Fixed bottom navigation bar visible across all DojoFlow pages.
 * Includes 12 menu items and respects Focus Mode (unmounts when enabled).
 * 
 * Features:
 * - Fixed positioning at bottom (72px height)
 * - 12 menu items with icons and labels
 * - Active state highlighting with scale animation
 * - Smooth transitions (300ms ease-out)
 * - Focus Mode support (returns null when focus mode is on)
 * - Glass morphism effect with backdrop blur
 */

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Zap,
  BookOpen,
  Monitor,
  Headset,
  Users2,
  CreditCard,
  BarChart3,
  Megaphone,
  Settings,
} from 'lucide-react';
import { useFocusMode } from '@/contexts/FocusModeContext';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  paths?: string[]; // Alternative paths that should highlight this item
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, path: '/kai' },
  { id: 'students', label: 'Students', icon: <Users className="w-5 h-5" />, path: '/students' },
  { id: 'leads', label: 'Leads', icon: <TrendingUp className="w-5 h-5" />, path: '/leads' },
  { id: 'kai', label: 'Kai Command', icon: <Zap className="w-5 h-5" />, path: '/kai-command', paths: ['/kai'] },
  { id: 'classes', label: 'Classes', icon: <BookOpen className="w-5 h-5" />, path: '/classes' },
  { id: 'kiosk', label: 'Kiosk Studio', icon: <Monitor className="w-5 h-5" />, path: '/kiosk-studio' },
  { id: 'receptionist', label: 'Receptionist', icon: <Headset className="w-5 h-5" />, path: '/receptionist' },
  { id: 'staff', label: 'Staff', icon: <Users2 className="w-5 h-5" />, path: '/staff' },
  { id: 'billing', label: 'Billing', icon: <CreditCard className="w-5 h-5" />, path: '/billing' },
  { id: 'reports', label: 'Reports', icon: <BarChart3 className="w-5 h-5" />, path: '/reports' },
  { id: 'marketing', label: 'Marketing', icon: <Megaphone className="w-5 h-5" />, path: '/marketing' },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" />, path: '/settings' },
];

export const GlobalBottomNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isFocusMode } = useFocusMode();

  // Don't render in Focus Mode
  if (isFocusMode) {
    return null;
  }

  const isActive = (item: NavItem): boolean => {
    const currentPath = location.pathname;
    
    // Check exact match or alternative paths
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
        borderColor: 'rgba(0, 0, 0, 0.08)',
        backgroundColor: '#FAFAFA',
        height: '72px',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <div className="flex items-center justify-between h-full px-2 max-w-full overflow-x-auto">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.path)}
              className="flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg transition-all duration-200 hover:bg-gray-100 flex-shrink-0"
              style={{
                color: active ? '#EF4444' : 'rgba(0, 0, 0, 0.6)',
                opacity: active ? 1 : 0.7,
                transform: active ? 'scale(1.05)' : 'scale(1)',
              }}
              title={item.label}
            >
              {item.icon}
              <span className="text-xs font-medium whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default GlobalBottomNavigation;

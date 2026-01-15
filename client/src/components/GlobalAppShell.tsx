/**
 * GlobalAppShell Component
 * 
 * SINGLE global layout wrapper for the entire DojoFlow application.
 * This is the ONLY place where UnifiedBottomNav is rendered.
 * 
 * Requirements:
 * - Wraps all page content
 * - Renders UnifiedBottomNav at the bottom
 * - Applies bottom padding to content (72px when nav is visible)
 * - Unmounts nav when Focus Mode is enabled
 * - NO page should render its own nav or layout wrapper
 */

import React from 'react';
import { useFocusMode } from '@/contexts/FocusModeContext';
import UnifiedBottomNav from '@/components/UnifiedBottomNav';

interface GlobalAppShellProps {
  children: React.ReactNode;
}

export const GlobalAppShell: React.FC<GlobalAppShellProps> = ({ children }) => {
  const { isFocusMode } = useFocusMode();

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#0F0F11' }}>
      {/* Main content with bottom padding for fixed nav */}
      <div
        className="flex-1 transition-all duration-300"
        style={{
          paddingBottom: isFocusMode ? '0px' : '72px',
        }}
      >
        {children}
      </div>

      {/* Global bottom navigation - rendered ONLY here */}
      <UnifiedBottomNav />
    </div>
  );
};

export default GlobalAppShell;

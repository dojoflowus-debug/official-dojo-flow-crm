/**
 * BottomNavLayout Component
 * 
 * DEPRECATED: This component is now a pass-through wrapper.
 * The actual BottomNav is rendered ONLY from GlobalAppShell.
 * 
 * This component exists for backward compatibility with existing pages
 * that wrap themselves with <BottomNavLayout>. It simply renders its
 * children without adding any layout or nav.
 * 
 * All pages can continue to use this wrapper, but the actual navigation
 * is controlled globally from GlobalAppShell.
 */

import React from 'react';

interface BottomNavLayoutProps {
  children: React.ReactNode;
  hiddenInFocusMode?: boolean;
  isUIHidden?: boolean;
}

export const BottomNavLayout: React.FC<BottomNavLayoutProps> = ({ 
  children,
  hiddenInFocusMode,
  isUIHidden 
}) => {
  // Pass-through: just render children
  // The actual BottomNav is rendered from GlobalAppShell
  return <>{children}</>;
};

export default BottomNavLayout;

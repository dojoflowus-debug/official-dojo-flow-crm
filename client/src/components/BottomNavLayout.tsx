import React from 'react'

/**
 * BottomNavLayout - Pass-through wrapper for backward compatibility
 * 
 * LOCKED ARCHITECTURE: The universal BottomNav is rendered ONLY from AppShell.
 * This component exists only to maintain compatibility with existing pages.
 * It does NOT render any navigation - that is handled exclusively by AppShell.
 */
export default function BottomNavLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

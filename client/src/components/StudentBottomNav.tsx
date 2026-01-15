import React from 'react'

/**
 * StudentBottomNav - Pass-through wrapper for backward compatibility
 * 
 * LOCKED ARCHITECTURE: The universal BottomNav is rendered ONLY from AppShell.
 * This component exists only to maintain compatibility with existing student pages.
 * It does NOT render any navigation - that is handled exclusively by AppShell.
 */
export default function StudentBottomNav() {
  return null
}

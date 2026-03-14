import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useFocusMode } from '@/contexts/FocusModeContext'

/**
 * DebugOverlay - DEV ONLY
 * 
 * Shows real-time state of:
 * - Current route
 * - Layout type detected
 * - Whether BottomNav is rendered in DOM
 * - Focus Mode state
 * - Auth state
 * - Kiosk preview mode
 * 
 * Only renders in development mode (check for VITE_DEV or similar)
 */
export function DebugOverlay() {
  const location = useLocation()
  const { user, isLoading } = useAuth()
  const { isFocusMode } = useFocusMode()
  const [bottomNavRendered, setBottomNavRendered] = useState(false)
  const [layoutType, setLayoutType] = useState<string>('unknown')
  const [kioskPreviewMode, setKioskPreviewMode] = useState(false)

  useEffect(() => {
    // Check if BottomNav is in DOM
    const bottomNav = document.querySelector('.app-shell-bottom-nav')
    setBottomNavRendered(!!bottomNav)

    // Detect layout type
    const appShell = document.querySelector('.app-shell')
    const managementLayout = document.querySelector('[class*="management"]')
    
    if (appShell && managementLayout) {
      setLayoutType('ManagementLayout + AppShell')
    } else if (appShell) {
      setLayoutType('AppShell only')
    } else if (managementLayout) {
      setLayoutType('ManagementLayout only')
    } else {
      setLayoutType('none')
    }

    // Check if in kiosk preview mode
    const kioskPreview = document.querySelector('[class*="kiosk-preview"]') || 
                         document.querySelector('[data-kiosk-preview]')
    setKioskPreviewMode(!!kioskPreview)
  }, [location.pathname])

  // Second effect to check after delay (for nested layouts)
  useEffect(() => {
    const timer = setTimeout(() => {
      const bottomNav = document.querySelector('.app-shell-bottom-nav')
      setBottomNavRendered(!!bottomNav)

      const appShell = document.querySelector('.app-shell')
      const managementLayout = document.querySelector('[class*="management"]')
      
      if (appShell && managementLayout) {
        setLayoutType('ManagementLayout + AppShell')
      } else if (appShell) {
        setLayoutType('AppShell only')
      } else if (managementLayout) {
        setLayoutType('ManagementLayout only')
      } else {
        setLayoutType('none')
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [location.pathname])

  // Debug overlay disabled - remove for production
  return null
  // Only render in development
  // if (import.meta.env.MODE !== 'development') {
  //   return null
  // }

  const authStatus = isLoading ? 'loading' : user ? 'authed' : 'unauthed'
  const shouldHaveNav = authStatus === 'authed' && !isFocusMode

  return (
    <div
      className="fixed bottom-4 left-4 z-50 bg-black/80 text-white text-xs p-3 rounded font-mono max-w-xs"
      style={{
        boxShadow: '0 0 10px rgba(255,0,0,0.5)',
        border: shouldHaveNav && !bottomNavRendered ? '2px solid red' : '1px solid green'
      }}
    >
      <div className="space-y-1">
        <div><strong>🐛 DEBUG OVERLAY</strong></div>
        <div>route: <span className="text-blue-300">{location.pathname}</span></div>
        <div>layout: <span className={layoutType === 'none' ? 'text-red-300' : 'text-green-300'}>{layoutType}</span></div>
        <div>
          bottomNavRendered: 
          <span className={bottomNavRendered ? 'text-green-300' : 'text-red-300'}>
            {bottomNavRendered ? ' ✓ true' : ' ✗ false'}
          </span>
        </div>
        <div>focusMode: <span className={isFocusMode ? 'text-yellow-300' : 'text-green-300'}>{isFocusMode ? 'ON' : 'OFF'}</span></div>
        <div>kioskPreview: <span className={kioskPreviewMode ? 'text-yellow-300' : 'text-green-300'}>{kioskPreviewMode ? 'YES' : 'NO'}</span></div>
        <div>auth: <span className={authStatus === 'authed' ? 'text-green-300' : 'text-yellow-300'}>{authStatus}</span></div>
        
        {/* Error state */}
        {shouldHaveNav && !bottomNavRendered && (
          <div className="mt-2 p-2 bg-red-900/50 border border-red-500 rounded">
            <div className="text-red-200">⚠️ BottomNavMissingError</div>
            <div className="text-red-100 text-[10px]">
              Auth={authStatus}, FocusMode={isFocusMode}, Layout={layoutType}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

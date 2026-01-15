import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * AppShellGuard - Developer-only error detection
 * 
 * This component detects if a route is rendered WITHOUT being wrapped by AppShell.
 * If a route is missing AppShell, it logs a developer-only console error.
 * 
 * Usage: Wrap the entire app with this guard to catch architectural violations.
 */
export function AppShellGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const appShellRef = useRef<HTMLDivElement>(null)
  const hasLoggedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    // Check if we're inside an AppShell
    const isInsideAppShell = () => {
      let element = appShellRef.current
      while (element) {
        if (element.classList.contains('app-shell')) {
          return true
        }
        element = element.parentElement
      }
      return false
    }

    // Only check on authenticated routes (exclude public routes)
    const authenticatedRoutes = [
      '/students',
      '/leads',
      '/kai',
      '/classes',
      '/floor-plans',
      '/operations',
      '/kiosk-studio',
      '/staff',
      '/billing',
      '/reports',
      '/marketing',
      '/settings',
      '/dashboard',
    ]

    const isAuthenticatedRoute = authenticatedRoutes.some(route =>
      location.pathname === route || location.pathname.startsWith(route + '/')
    )

    if (isAuthenticatedRoute && !hasLoggedRef.current.has(location.pathname)) {
      // Defer check to next tick to allow AppShell to render
      const timer = setTimeout(() => {
        if (!isInsideAppShell()) {
          console.error(
            `🚨 AppShellMissingError: Route "${location.pathname}" is not wrapped by AppShell!\n` +
            `This is a deployment blocker. All authenticated routes must render inside AppShell.\n` +
            `Fix: Wrap the page component with <AppShell> or use <ManagementLayout>.`
          )
          hasLoggedRef.current.add(location.pathname)
        }
      }, 0)

      return () => clearTimeout(timer)
    }
  }, [location.pathname])

  return (
    <div ref={appShellRef}>
      {children}
    </div>
  )
}

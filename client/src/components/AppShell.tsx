import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Users,
  UserPlus,
  Sparkles,
  Calendar,
  UserCog,
  BookOpen,
  BarChart3,
  Settings,
  Eye,
  EyeOff,
  Package,
  Grid3x3,
  Wand2,
  Star,
  Wallet
} from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { useFocusMode } from '@/contexts/FocusModeContext'
import { trpc } from '@/lib/trpc'
import { BadgeCount } from '@/components/ui/badge-count'
import { ScrollableNav } from '@/components/ScrollableNav'
import { CinematicFocusOverlay } from '@/components/CinematicFocusOverlay'
import { EscHintLabel } from '@/components/EscHintLabel'
import CommandHeader from '@/components/CommandHeader'
import { KaiBar } from '@/components/KaiBar'
import { KaiBarProvider } from '@/contexts/KaiBarContext'
import { EnvironmentSelectorModal } from '@/components/EnvironmentSelectorModal'
import { KaiTutorialProvider } from '@/contexts/KaiTutorialContext'
import { SubscriptionGate } from '@/components/SubscriptionGate'
import { SpotlightOverlay } from '@/components/SpotlightOverlay'
import { GhostModeOffer } from '@/components/GhostModeOffer'
import { TutorialLayer } from '@/components/TutorialLayer'
import { KaiMobileNav } from '@/components/KaiMobileNav'

// Navigation items for bottom bar
const NAVIGATION = [
  { id: 'students', name: 'Students', href: '/students', icon: Users },
  { id: 'leads', name: 'Leads', href: '/leads', icon: UserPlus },
  { id: 'kai-command', name: 'Kai', href: '/kai', icon: Sparkles, isCenter: true },
  { id: 'classes', name: 'Classes', href: '/classes', icon: Calendar },
  { id: 'merchandise', name: 'Merchandise', href: '/merchandise', icon: Package },
  { id: 'kiosk-studio', name: 'Kiosk', href: '/kiosk-studio', icon: Grid3x3 },
  { id: 'staff', name: 'Staff', href: '/staff', icon: UserCog },
  { id: 'programs', name: 'Programs', href: '/programs', icon: BookOpen },
  { id: 'payments-dashboard', name: 'Payments', href: '/payments/dashboard', icon: Wallet },
  { id: 'reports', name: 'Reports', href: '/reports', icon: BarChart3 },
  { id: 'kai-creative', name: 'Creative', href: '/kai/creative', icon: Wand2 },
  { id: 'kai-reviews', name: 'Reviews', href: '/kai/reviews', icon: Star },
]

interface AppShellProps {
  children: React.ReactNode
  hideBottomNav?: boolean
  hideHeader?: boolean
}

export default function AppShell({ children, hideBottomNav = false, hideHeader = false }: AppShellProps) {
  const location = useLocation()
  const { theme } = useTheme()
  const { isFocusMode, toggleFocusMode, showOverlay, isEntering, showEscHint } = useFocusMode()
  
  const isDark = theme === 'dark' || theme === 'cinematic'
  const isCinematic = theme === 'cinematic'
  const isKaiRoute = location.pathname === '/kai'
  
  // Fetch badge counts with polling (every 90 seconds)
  const { data: badgeCounts } = trpc.navBadges.getActionableCounts.useQuery(
    {},
    {
      refetchInterval: 90000,
      refetchOnWindowFocus: true,
    }
  )
  
  // Hover state for Apple dock bubble effect
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  
  // Runtime guard: Assert BottomNav exists (unless Focus Mode or explicitly hidden)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hideBottomNav && !isFocusMode) {
        const bottomNav = document.querySelector('.app-shell-bottom-nav')
        if (!bottomNav) {
          console.error(
            `🚨 BottomNavMissingError: BottomNav not rendered!
` +
            `route: ${location.pathname}
` +
            `hideBottomNav: ${hideBottomNav}
` +
            `focusMode: ${isFocusMode}
` +
            `This is a critical bug - BottomNav MUST render on all authenticated routes.`
          )
        }
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [location.pathname, hideBottomNav, isFocusMode])
  
  // Check if a nav item is active
  const isActive = (href: string) => {
    if (href === '/kai' && location.pathname === '/') return true
    return location.pathname === href || location.pathname.startsWith(href + '/')
  }

  // Detect mobile/tablet (iPad, phones) — bottom nav must ALWAYS be visible on touch devices
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 1024px)').matches
  )
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1024px)')
    const handler = (e: MediaQueryListEvent) => setIsMobileOrTablet(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Detect phone-only (≤768px) — used to hide bottom nav on /kai route
  const [isPhone, setIsPhone] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
  )
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const handler = (e: MediaQueryListEvent) => setIsPhone(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Should show bottom nav:
  // - Always on mobile/tablet (isMobileOrTablet) regardless of focus mode
  // - On desktop: only when not in focus mode and not explicitly hidden
  // - EXCEPTION: hide on phone when on /kai route (replaced by hamburger drawer)
  const showBottomNav = !hideBottomNav && (!isFocusMode || isMobileOrTablet) && !(isKaiRoute && isPhone)

  // Determine page title based on route
  const getPageTitle = () => {
    const path = location.pathname
    const navItem = NAVIGATION.find(item => isActive(item.href))
    if (navItem) return navItem.name
    if (path.startsWith('/kai')) return 'Kai'
    if (path.startsWith('/settings')) return 'Settings'
    return 'Dashboard'
  }

  return (
    <KaiTutorialProvider>
    <KaiBarProvider>
    <SubscriptionGate>
      <div className={`app-shell flex flex-col`} style={{ height: isKaiRoute ? '100dvh' : undefined, minHeight: '100dvh', overflow: isKaiRoute ? 'hidden' : undefined, backgroundColor: isCinematic ? 'oklch(0.05 0 0)' : isDark ? 'oklch(0.05 0 0)' : '#ffffff' }}>
        {/* Universal Top Header */}
        {!hideHeader && <CommandHeader title={getPageTitle()} isDarkMode={isDark} />}
        
        {/* Main Content - with bottom padding for fixed nav and KaiBar (on /kai route only) */}
        <main 
          className={`flex-1 ${isKaiRoute && !isPhone ? 'min-h-0' : ''} ${isDark ? '' : 'bg-background'}`}
          style={{
            // KAI route manages its own height/padding internally; skip AppShell padding-bottom
            paddingBottom: (showBottomNav && !isKaiRoute) ? 'calc(var(--bottom-nav-height, 72px) + env(safe-area-inset-bottom, 0px) + 16px)' : '0px',
            // On phone /kai route: KaiCommand uses position:fixed so main is just a passthrough.
            // On desktop/tablet /kai route: constrain height so composer stays above bottom nav.
            // iOS Safari clips position:fixed children inside overflow:hidden parents.
            // On phone /kai route, use overflow:visible so KaiCommand (position:fixed) is visible.
            overflow: isKaiRoute ? (isPhone ? 'visible' : 'hidden') : undefined,
            // On /kai desktop: explicitly set height to exclude both topbar AND bottom nav
            // so the composer is always visible above the bottom nav
            height: (isKaiRoute && !isPhone && showBottomNav)
              ? 'calc(100dvh - var(--topbar-h, 56px) - var(--bottom-nav-height, 72px))'
              : (isKaiRoute && !isPhone)
                ? 'calc(100dvh - var(--topbar-h, 56px))'
                : undefined,
            maxHeight: (isKaiRoute && !isPhone && showBottomNav)
              ? 'calc(100dvh - var(--topbar-h, 56px) - var(--bottom-nav-height, 72px))'
              : (isKaiRoute && !isPhone)
                ? 'calc(100dvh - var(--topbar-h, 56px))'
                : undefined,
            flexShrink: (isKaiRoute && !isPhone) ? 0 : undefined
          }}
        >
          {children}
        </main>

      {/* Global Fixed Bottom Navigation Bar */}
      {showBottomNav && (
        <nav 
          className="app-shell-bottom-nav"
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 900,
            height: 'var(--bottom-nav-height, 72px)',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            background: isCinematic 
              ? 'rgba(8,6,12,0.88)' 
              : isDark 
                ? 'oklch(0.09 0.008 25)' 
                : '#faf8f5',
            backdropFilter: isDark || isCinematic ? 'blur(24px) saturate(1.5)' : 'none',
            WebkitBackdropFilter: isDark || isCinematic ? 'blur(24px) saturate(1.5)' : 'none',
            boxShadow: isCinematic 
              ? '0 -1px 0 rgba(255,255,255,0.06), 0 -8px 32px rgba(0,0,0,0.7), 0 0 20px rgba(229,57,53,0.12)' 
              : isDark
                ? '0 -1px 0 rgba(255,255,255,0.06), 0 -4px 20px rgba(0,0,0,0.5)'
                : '0 -1px 0 rgba(0,0,0,0.1), 0 -4px 20px rgba(0,0,0,0.08)',
            borderTop: isDark || isCinematic ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.08)',
          }}
        >
          <ScrollableNav 
            activeItemHref={location.pathname}
            isDark={isDark}
            isCinematic={isCinematic}
            className="px-4 h-full"
          >
            {NAVIGATION.map((item, index) => {
              const active = isActive(item.href)
              const Icon = item.icon
              
              // Hover transform for nav items
              const getHoverTransform = () => {
                if (hoveredIndex === index) return 'translateY(-2px) scale(1.06)'
                return 'translateY(0) scale(1)'
              }
              
              // Compute target href with optional filter params
              const targetHref = (() => {
                if (badgeCounts && badgeCounts[item.id]) {
                  if (item.id === 'leads') {
                    return `${item.href}?filter=needs-followup`
                  }
                }
                return item.href
              })()

              return (
                <Link
                  key={item.id}
                  to={targetHref}
                  data-nav-anchor={item.id === 'operations' ? 'operations' : item.id === 'kiosk-studio' ? 'kiosk' : undefined}
                  data-nav={item.id === 'operations' ? 'operations' : item.id === 'kiosk-studio' ? 'kiosk' : undefined}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="flex flex-col items-center justify-center gap-1 pt-2 pb-1.5 sm:pt-1.5 sm:pb-1 text-center transition-all duration-[180ms] ease-out flex-shrink-0 min-w-[60px] sm:min-w-[70px] min-h-[52px] sm:min-h-[48px]"
                  style={{ 
                    transform: getHoverTransform(),
                    color: active ? (isDark || isCinematic ? '#FFFFFF' : '#1a1a1a') : (isDark || isCinematic ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.55)')
                  }}
                >
                  {/* Icon Container with hover glow */}
                  <div 
                    className={`relative flex items-center justify-center ${item.isCenter ? 'h-10 w-10' : 'h-6 w-6'} transition-all duration-200`}
                    style={{
                      filter: active && item.isCenter 
                        ? 'drop-shadow(0 0 10px rgba(229,57,53,0.6))' 
                        : hoveredIndex === index
                          ? item.isCenter 
                            ? 'drop-shadow(0 0 12px rgba(229,57,53,0.5))'
                            : 'drop-shadow(0 0 8px rgba(255,255,255,0.35))'
                          : 'none'
                    }}
                  >
                    {item.isCenter ? (
                      <div className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 ${active ? 'bg-[#E53935]/15' : ''}`}>
                        <img 
                          src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/IjqOFvsLMkrXFIaF.png" 
                          alt="Kai" 
                          className={`h-7 w-7 object-contain transition-all duration-200 ${active ? 'scale-110' : hoveredIndex === index ? 'opacity-100 scale-105' : 'opacity-90'}`}
                        />
                      </div>
                    ) : (
                      <>
                        <div className={`relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${active ? 'bg-[#E53935]/15' : ''}`}>
                          <Icon 
                            className="transition-all duration-200 h-[18px] w-[18px]"
                            style={{
                              color: active 
                                ? '#E53935' 
                                : hoveredIndex === index 
                                  ? (isDark || isCinematic ? '#FFFFFF' : '#1a1a1a') 
                                  : (isDark || isCinematic ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.45)')
                            }}
                          />
                        </div>
                        {/* Badge count */}
                        {badgeCounts && badgeCounts[item.id] && (
                          <BadgeCount 
                            count={badgeCounts[item.id]} 
                            position="top-right"
                          />
                        )}
                      </>
                    )}
                  </div>

                  {/* Label */}
                  <span 
                    className="text-[10px] font-semibold tracking-wide transition-colors duration-200"
                    style={{
                      color: active 
                        ? '#E53935' 
                        : hoveredIndex === index 
                          ? (isDark || isCinematic ? '#FFFFFF' : '#1a1a1a') 
                          : (isDark || isCinematic ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.40)')
                    }}
                  >
                    {item.name}
                  </span>
                </Link>
              )
            })}
          </ScrollableNav>

          {/* Focus Mode Toggle Button - Always visible, improved for mobile */}
          <button
            onClick={toggleFocusMode}
            className={`absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 touch-manipulation ${
              isFocusMode 
                ? 'bg-[#E53935]/20 text-[#E53935]' 
                : 'bg-white/10 text-white/70 hover:bg-white/15 hover:text-white'
            }`}
            style={{
              boxShadow: isFocusMode 
                ? '0 0 20px rgba(229,57,53,0.4), 0 0 40px rgba(229,57,53,0.2)' 
                : 'none',
              animation: isFocusMode ? 'focusPulse 2s ease-in-out infinite' : 'none',
              minWidth: '48px',
              minHeight: '48px',
              WebkitTouchCallout: 'none',
              WebkitUserSelect: 'none'
            }}
            title={isFocusMode ? 'Exit Focus Mode (Tap to disable)' : 'Enter Focus Mode'}
          >
            {isFocusMode ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </nav>
      )}

      {/* Cinematic Focus Mode Overlay */}
      <CinematicFocusOverlay 
        isVisible={showOverlay}
        isEntering={isEntering}
        onAnimationComplete={() => {
          // Animation complete, overlay will fade out
        }}
      />

        {/* ESC Hint Label */}
        <EscHintLabel show={showEscHint} onExit={toggleFocusMode} />
      </div>

      {/* Global KaiBar - Fixed at app root level */}
      <KaiBar />

      {/* Global Environment Selector Modal - rendered at root to avoid re-mount issues */}
      <EnvironmentSelectorModal />

      {/* Kai Tutorial System — Spotlight + Ghost Mode */}
      <TutorialLayer />

      {/* Mobile hamburger drawer — only active on /kai route, phone-only */}
      {isKaiRoute && <KaiMobileNav />}
    </SubscriptionGate>
    </KaiBarProvider>
    </KaiTutorialProvider>
  )
}

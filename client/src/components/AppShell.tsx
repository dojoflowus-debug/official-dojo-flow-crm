import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Users,
  UserPlus,
  Sparkles,
  Calendar,
  UserCog,
  CreditCard,
  BarChart3,
  Settings,
  Eye,
  EyeOff,
  Package,
  Grid3x3
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

// Navigation items for bottom bar
const NAVIGATION = [
  { id: 'students', name: 'Students', href: '/students', icon: Users },
  { id: 'leads', name: 'Leads', href: '/leads', icon: UserPlus },
  { id: 'kai-command', name: 'Kai', href: '/kai', icon: Sparkles, isCenter: true },
  { id: 'classes', name: 'Classes', href: '/classes', icon: Calendar },
  { id: 'floor-plans', name: 'Floor Plans', href: '/floor-plans', icon: Grid3x3 },
  { id: 'operations', name: 'Operations', href: '/operations/merchandise', icon: Package },
  { id: 'kiosk-studio', name: 'Kiosk', href: '/kiosk-studio', icon: Grid3x3 },
  { id: 'staff', name: 'Staff', href: '/staff', icon: UserCog },
  { id: 'billing', name: 'Billing', href: '/billing', icon: CreditCard },
  { id: 'reports', name: 'Reports', href: '/reports', icon: BarChart3 },
  { id: 'settings', name: 'Settings', href: '/settings', icon: Settings },
]

interface AppShellProps {
  children: React.ReactNode
  hideBottomNav?: boolean
}

export default function AppShell({ children, hideBottomNav = false }: AppShellProps) {
  const location = useLocation()
  const { theme } = useTheme()
  const { isFocusMode, toggleFocusMode, showOverlay, isEntering, showEscHint } = useFocusMode()
  
  const isDark = theme === 'dark'
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

  // Should show bottom nav (not in focus mode and not explicitly hidden)
  const showBottomNav = !hideBottomNav && !isFocusMode

  return (
    <KaiBarProvider>
      <div className="app-shell min-h-screen flex flex-col">
        {/* Universal Top Header */}
        <CommandHeader title="Operations" isDarkMode={isDark} />
        
        {/* Main Content - with bottom padding for fixed nav and KaiBar (on /kai route only) */}
        <main 
          className="flex-1"
          style={{
            paddingBottom: showBottomNav 
              ? isKaiRoute 
                ? 'calc(var(--bottom-nav-height, 72px) + 12px + 60px + env(safe-area-inset-bottom, 0px))' // Include KaiBar padding on /kai
                : 'calc(var(--bottom-nav-height, 72px) + env(safe-area-inset-bottom, 0px))' // Only BottomNav padding on other routes
              : '0'
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
              ? 'rgba(5,5,8,0.85)' 
              : isDark 
                ? '#111217' 
                : '#050608',
            backdropFilter: isCinematic ? 'blur(20px)' : 'none',
            WebkitBackdropFilter: isCinematic ? 'blur(20px)' : 'none',
            boxShadow: isCinematic 
              ? '0 -6px 22px rgba(0,0,0,0.85), 0 0 14px rgba(255,90,60,0.18)' 
              : isDark 
                ? '0 -2px 10px rgba(0,0,0,0.6)' 
                : '0 -2px 8px rgba(0,0,0,0.35)',
            borderTop: isCinematic ? '1px solid rgba(255,255,255,0.06)' : 'none',
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
                  } else if (item.id === 'billing') {
                    return `${item.href}?filter=overdue`
                  }
                }
                return item.href
              })()

              return (
                <Link
                  key={item.id}
                  to={targetHref}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="flex flex-col items-center justify-center gap-1 pt-2 pb-1.5 sm:pt-1.5 sm:pb-1 text-center transition-all duration-[180ms] ease-out flex-shrink-0 min-w-[60px] sm:min-w-[70px] min-h-[52px] sm:min-h-[48px]"
                  style={{ 
                    transform: getHoverTransform(),
                    color: active ? '#FFFFFF' : 'rgba(255,255,255,0.72)'
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
                      <img 
                        src="/logo-icon.png" 
                        alt="Kai" 
                        className={`h-7 w-7 object-contain transition-all duration-200 ${active ? 'scale-110' : hoveredIndex === index ? 'opacity-100 scale-105' : 'opacity-90'}`}
                      />
                    ) : (
                      <>
                        <Icon 
                          className="transition-all duration-200 h-[22px] w-[22px] sm:h-[18px] sm:w-[18px]"
                          style={{
                            color: active 
                              ? '#E53935' 
                              : hoveredIndex === index 
                                ? '#FFFFFF' 
                                : 'rgba(255,255,255,0.72)'
                          }}
                        />
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
                    className="text-[11px] font-medium transition-colors duration-200"
                    style={{
                      color: active 
                        ? '#FFFFFF' 
                        : hoveredIndex === index 
                          ? '#FFFFFF' 
                          : 'rgba(255,255,255,0.72)'
                    }}
                  >
                    {item.name}
                  </span>
                </Link>
              )
            })}
          </ScrollableNav>

          {/* Focus Mode Toggle Button - Always visible */}
          <button
            onClick={toggleFocusMode}
            className={`absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
              isFocusMode 
                ? 'bg-[#E53935]/20 text-[#E53935]' 
                : 'bg-white/10 text-white/70 hover:bg-white/15 hover:text-white'
            }`}
            style={{
              boxShadow: isFocusMode 
                ? '0 0 20px rgba(229,57,53,0.4), 0 0 40px rgba(229,57,53,0.2)' 
                : 'none',
              animation: isFocusMode ? 'focusPulse 2s ease-in-out infinite' : 'none'
            }}
            title={isFocusMode ? 'Exit Focus Mode' : 'Enter Focus Mode'}
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
        <EscHintLabel show={showEscHint} />
      </div>

      {/* Global KaiBar - Fixed at app root level */}
      <KaiBar />
    </KaiBarProvider>
  )
}

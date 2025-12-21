import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Sparkles,
  Calendar,
  UserCog,
  CreditCard,
  BarChart3,
  Settings,
  Bell,
  LogOut,
  ChevronDown,
  Eye,
  EyeOff,
  Palette,
  Monitor,
  Package
} from 'lucide-react'
import { useThemeAwareLogo } from '@/hooks/useThemeAwareLogo'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/contexts/ThemeContext'
import { useFocusMode } from '@/contexts/FocusModeContext'
import { useEnvironment } from '@/contexts/EnvironmentContext'
import { EnvironmentSelectorModal } from '@/components/EnvironmentSelectorModal'
import { trpc } from '@/lib/trpc'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import ThemeToggle from '@/components/ThemeToggle'
import { BadgeCount } from '@/components/ui/badge-count'

// Navigation items for bottom bar
const NAVIGATION = [
  { id: 'students', name: 'Students', href: '/students', icon: Users },
  { id: 'leads', name: 'Leads', href: '/leads', icon: UserPlus },
  { id: 'kai-command', name: 'Kai', href: '/kai-command', icon: Sparkles, isCenter: true },
  { id: 'classes', name: 'Classes', href: '/classes', icon: Calendar },
  { id: 'operations', name: 'Operations', href: '/operations/merchandise', icon: Package },
  { id: 'staff', name: 'Staff', href: '/staff', icon: UserCog },
  { id: 'billing', name: 'Billing', href: '/billing', icon: CreditCard },
  { id: 'reports', name: 'Reports', href: '/reports', icon: BarChart3 },
  { id: 'settings', name: 'Settings', href: '/settings', icon: Settings },
]

// Page titles mapping
const PAGE_TITLES: Record<string, string> = {
  '/students': 'Students',
  '/leads': 'Leads',
  '/kai-dashboard': 'Kai Command',
  '/kai-command': 'Kai Command',
  '/kai-chat': 'Kai Command',
  '/classes': 'Classes',
  '/operations/merchandise': 'Merchandise Fulfillment',
  '/operations/merchandise/manage': 'Manage Merchandise',
  '/kiosk/member-login': 'Member Check-In',
  '/kiosk/new-student': 'New Student',
  '/settings/kiosk': 'Kiosk Settings',
  '/enrollment': 'Enrollment',
  '/enrollment/form': 'Enrollment Form',
  '/receptionist': 'Receptionist',
  '/staff': 'Staff',
  '/billing': 'Billing',
  '/reports': 'Reports',
  '/marketing': 'Marketing',
  '/settings': 'Settings',
  '/': 'Kai Command',
}

interface BottomNavLayoutProps {
  children: React.ReactNode
  hideHeader?: boolean
  hiddenInFocusMode?: boolean
  isUIHidden?: boolean // For Focus Mode auto-hide
}

export default function BottomNavLayout({ children, hideHeader = false, hiddenInFocusMode = false, isUIHidden = false }: BottomNavLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { theme } = useTheme()
  const { isFocusMode, isAnimating, showOverlay, toggleFocusMode } = useFocusMode()
  const { currentEnvironment, isTransitioning, openModal, isPresentationMode, presentationProgress } = useEnvironment()
  const logo = useThemeAwareLogo()
  
  const isDark = theme === 'dark'
  const isCinematic = theme === 'cinematic'
  
  // Fetch badge counts with polling (every 90 seconds)
  const { data: badgeCounts } = trpc.navBadges.getActionableCounts.useQuery(
    {},
    {
      refetchInterval: 90000, // Poll every 90 seconds
      refetchOnWindowFocus: true,
    }
  )
  
  // Scroll detection for collapsible bottom nav
  const [isNavVisible, setIsNavVisible] = useState(true)
  const [scrollTimeout, setScrollTimeout] = useState<NodeJS.Timeout | null>(null)
  
  // Hover state for Apple dock bubble effect
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  
  useEffect(() => {
    const handleScroll = () => {
      // Hide nav immediately when scrolling starts
      setIsNavVisible(false)
      
      // Clear existing timeout
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }
      
      // Set new timeout to show nav after scrolling stops
      const timeout = setTimeout(() => {
        setIsNavVisible(true)
      }, 300) // Show nav 300ms after scrolling stops
      
      setScrollTimeout(timeout)
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }
    }
  }, [scrollTimeout])
  
  // Get current page title
  const currentPageTitle = PAGE_TITLES[location.pathname] || 'DojoFlow'
  
  // Check if a nav item is active
  const isActive = (href: string) => {
    if (href === '/kai-command' && location.pathname === '/') return true
    return location.pathname === href || location.pathname.startsWith(href + '/')
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.name) return 'U'
    const names = user.name.split(' ')
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase()
    }
    return user.name.substring(0, 2).toUpperCase()
  }

  // Get background class based on theme
  const getBgClass = () => {
    if (isCinematic) return 'bg-gradient-to-b from-[#0C0C0D] to-[#1A1A1C]'
    if (isDark) return 'bg-[#0F0F11]'
    return 'bg-[#F7F8FA]'
  }

  // Get header styles based on theme - Apple-style design
  const getHeaderStyles = () => {
    if (isCinematic) return {
      bg: 'bg-white/[0.08] backdrop-blur-[20px] border-b border-white/[0.12] rounded-b-3xl',
      shadow: '0 8px 24px rgba(0,0,0,0.55)',
      textColor: 'text-white',
      mutedColor: 'text-gray-300'
    }
    if (isDark) return {
      bg: 'bg-[#1A1B1F] border-b border-[#2A2B2F]',
      shadow: '0 2px 12px rgba(0,0,0,0.45)',
      textColor: 'text-white',
      mutedColor: 'text-gray-400'
    }
    return {
      bg: 'bg-white border-b border-[#E2E3E6]',
      shadow: '0 2px 6px rgba(0,0,0,0.04)',
      textColor: 'text-[#262626]',
      mutedColor: 'text-gray-500'
    }
  }

  const headerStyles = getHeaderStyles()

  // Focus Mode animation styles
  const getFocusModeHeaderStyle = () => {
    if (isFocusMode) {
      return {
        transform: 'translateY(-100%) scale(0.95)',
        opacity: 0,
        filter: 'blur(8px)',
        transition: 'transform 400ms cubic-bezier(0.4, 0, 0.2, 1), opacity 200ms ease-out 150ms, filter 200ms ease-out 150ms'
      }
    }
    return {
      transform: 'translateY(0) scale(1)',
      opacity: 1,
      filter: 'blur(0px)',
      transition: 'transform 400ms cubic-bezier(0.4, 0, 0.2, 1), opacity 200ms ease-in, filter 200ms ease-in'
    }
  }

  return (
    <div className={`min-h-screen flex flex-col ${getBgClass()}`}>
      {/* Environment Selector Modal */}
      <EnvironmentSelectorModal />

      {/* Focus Mode Overlay */}
      {showOverlay && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
          style={{
            animation: 'focusModeOverlay 2.5s ease-in-out forwards'
          }}
        >
          <div className="text-center">
            <h1 
              className="text-4xl md:text-5xl font-bold text-white mb-3"
              style={{ textShadow: '0 0 40px rgba(229,57,53,0.5)' }}
            >
              FOCUS MODE
            </h1>
            <p className="text-lg text-white/70 font-light tracking-wide">
              Noise off. Clarity on.
            </p>
          </div>
        </div>
      )}

      {/* Focus Mode Active Indicator Strip - Auto-hides when idle */}
      {isFocusMode && !showOverlay && (
        <div 
          className={`fixed top-0 left-0 right-0 z-[2001] flex items-center justify-center py-1.5 bg-gradient-to-r from-transparent ${isPresentationMode ? 'via-green-500/30' : 'via-[#E53935]/20'} to-transparent transition-all duration-300 ease-out ${
            isUIHidden ? 'opacity-0 -translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'
          }`}
          style={{
            animation: isUIHidden ? 'none' : 'fadeIn 300ms ease-out forwards'
          }}
        >
          {isPresentationMode ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-white/80 font-medium tracking-wide flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Presentation Mode — {currentEnvironment.name}
              </span>
              {/* Progress bar */}
              <div className="w-24 h-1 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-400 transition-all duration-100 ease-linear"
                  style={{ width: `${presentationProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <span className="text-xs text-white/60 font-medium tracking-wide">
              Focus Mode Active — Press <kbd className="px-1.5 py-0.5 mx-1 rounded bg-white/10 text-white/80 font-mono text-[10px]">Esc</kbd> to exit • <kbd className="px-1.5 py-0.5 mx-1 rounded bg-white/10 text-white/80 font-mono text-[10px]">F</kbd> for full screen
            </span>
          )}
        </div>
      )}

      {/* Top Header - Apple-style */}
      {!hideHeader && (
        <header 
          className={`
            fixed top-0 left-0 right-0 h-[72px]
            ${headerStyles.bg}
          `}
          style={{ 
            boxShadow: headerStyles.shadow,
            zIndex: 2000,
            ...getFocusModeHeaderStyle()
          }}
        >
          <div className="h-full px-6 flex items-center justify-between">
            {/* Left: DojoFlow Logo */}
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2">
                <img 
                  src={logo} 
                  alt="DojoFlow" 
                  className="h-9 object-contain opacity-95"
                />
              </Link>
              
              {/* Page Title - Hidden on mobile */}
              <div className={`hidden md:flex items-center gap-2 ml-4 pl-4 border-l ${isCinematic ? 'border-white/20' : isDark ? 'border-[#2A2B2F]' : 'border-[#E2E3E6]'}`}>
                <span className={`text-base font-semibold ${headerStyles.textColor}`}>
                  {currentPageTitle}
                </span>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* Ask Kai Button */}
              <Button
                onClick={() => navigate('/kai-command')}
                className={`
                  hidden sm:flex items-center gap-2 rounded-full px-4 py-2
                  ${isDark 
                    ? 'bg-[#FF4F4F] hover:bg-[#E53935] text-white' 
                    : 'bg-[#E53935] hover:bg-[#D32F2F] text-white'
                  }
                `}
              >
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">Ask Kai</span>
              </Button>

              {/* Credits */}
              <div className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full ${isDark || isCinematic ? 'bg-[#2A2B2F]' : 'bg-gray-100'}`}>
                <CreditCard className={`h-4 w-4 ${isDark || isCinematic ? 'text-gray-400' : 'text-gray-500'}`} />
                <span className={`text-sm font-medium ${isDark || isCinematic ? 'text-white' : 'text-[#262626]'}`}>
                  Credits: 0
                </span>
              </div>

              {/* Theme Toggle */}
              <div className="hidden md:block">
                <ThemeToggle showCinematic={true} />
              </div>

              {/* Environment Selector (only in Cinematic mode) */}
              {isCinematic && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={openModal}
                  className="relative hidden md:flex h-9 w-9 rounded-full text-white/70 hover:text-white hover:bg-white/10"
                  title="Choose Environment"
                >
                  <Palette className="h-4 w-4" />
                </Button>
              )}

              {/* Notifications */}
              <Button
                variant="ghost"
                size="icon"
                className={`relative rounded-full ${isDark ? 'hover:bg-[#2A2B2F]' : 'hover:bg-gray-100'}`}
              >
                <Bell className={`h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                <span className={`absolute top-1 right-1 h-2 w-2 rounded-full ${isDark ? 'bg-[#FF4F4F]' : 'bg-[#E53935]'}`} />
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`flex items-center gap-2 rounded-full px-2 py-1 ${isDark ? 'hover:bg-[#2A2B2F]' : 'hover:bg-gray-100'}`}
                  >
                    <Avatar className={`h-8 w-8 ${isDark ? 'bg-[#FF4F4F]' : 'bg-[#E53935]'}`}>
                      <AvatarFallback className="text-white text-sm font-medium">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className={`h-4 w-4 hidden sm:block ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className={`w-56 ${isDark ? 'bg-[#1A1B1F] border-[#2A2B2F]' : 'bg-white border-[#E2E3E6]'}`}
                >
                  <div className={`px-3 py-2 ${isDark ? 'text-white' : 'text-[#262626]'}`}>
                    <p className="text-sm font-medium">{user?.name || 'User'}</p>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {user?.email || 'user@example.com'}
                    </p>
                  </div>
                  <DropdownMenuSeparator className={isDark ? 'bg-[#2A2B2F]' : 'bg-[#E2E3E6]'} />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className={`cursor-pointer ${isDark ? 'text-gray-300 hover:bg-[#2A2B2F]' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
      )}

      {/* Main Content - 72px top padding for fixed 72px header, 80px bottom for 68px nav */}
      <main className={`flex-1 ${!hideHeader && !isFocusMode ? 'pt-[72px]' : isFocusMode ? 'pt-6' : ''} ${hiddenInFocusMode ? '' : 'pb-[80px]'}`}>
        {children}
      </main>

      {/* Bottom Navigation Bar - Always Dark Dock - Hidden in Focus Mode */}
      <nav 
        className={`
          fixed left-0 right-0 z-[1500] h-16
          transition-all duration-300 ease-in-out
          ${hiddenInFocusMode ? 'translate-y-full opacity-0 pointer-events-none' : (isNavVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0')}
          bottom-0
          flex items-center justify-around
          ${isCinematic 
            ? 'border-t border-white/[0.06]' 
            : ''
          }
          ${isCinematic ? 'backdrop-blur-[20px]' : ''}
        `}
        style={{
          background: isCinematic 
            ? 'rgba(5,5,8,0.75)' 
            : isDark 
              ? '#111217' 
              : '#050608',
          boxShadow: isCinematic 
            ? '0 -6px 22px rgba(0,0,0,0.85), 0 0 14px rgba(255,90,60,0.18)' 
            : isDark 
              ? '0 -2px 10px rgba(0,0,0,0.6)' 
              : '0 -2px 8px rgba(0,0,0,0.35)'
        }}
      >
        <div className="h-full w-full px-4 flex items-center justify-around">
          {NAVIGATION.map((item, index) => {
            const active = isActive(item.href)
            const Icon = item.icon
            
            // Calculate scale based on hover proximity (Apple dock effect)
            const getScale = () => {
              if (hoveredIndex === null) return item.isCenter ? 1.1 : 1
              if (hoveredIndex === index) return item.isCenter ? 1.25 : 1.2
              const distance = Math.abs(hoveredIndex - index)
              if (distance === 1) return 1.08
              if (distance === 2) return 1.03
              return 1
            }
            
            // Hover transform for nav items
            const getHoverTransform = () => {
              if (hoveredIndex === index) return 'translateY(-2px) scale(1.06)'
              return 'translateY(0) scale(1)'
            }
            
            return (
              <Link
                key={item.id}
                to={() => {
                  // Add filter params when clicking badged items
                  if (badgeCounts && badgeCounts[item.id]) {
                    if (item.id === 'students') {
                      return `${item.href}?filter=needs-attention`
                    } else if (item.id === 'leads') {
                      return `${item.href}?filter=needs-followup`
                    } else if (item.id === 'billing') {
                      return `${item.href}?filter=overdue`
                    }
                  }
                  return item.href
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`
                  flex-1 flex flex-col items-center justify-center gap-1
                  pt-1.5 pb-1 text-center
                  transition-all duration-[180ms] ease-out
                  min-w-0
                `}
                style={{ 
                  transform: getHoverTransform(),
                  color: active ? '#FFFFFF' : 'rgba(255,255,255,0.72)'
                }}
              >
                {/* Icon Container with hover glow */}
                <div 
                  className={`
                    relative flex items-center justify-center
                    ${item.isCenter ? 'h-10 w-10' : 'h-6 w-6'}
                    transition-all duration-200
                  `}
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
                      className={`
                        h-7 w-7 object-contain transition-all duration-200
                        ${active ? 'scale-110' : hoveredIndex === index ? 'opacity-100 scale-105' : 'opacity-90'}
                      `}
                    />
                  ) : (
                    <>
                      <Icon 
                        className="transition-all duration-200 h-[18px] w-[18px]"
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
        </div>

        {/* Focus Mode Toggle Button - Always visible */}
        <button
          onClick={toggleFocusMode}
          className={`
            absolute left-4 top-1/2 -translate-y-1/2
            flex items-center justify-center
            w-10 h-10 rounded-full
            transition-all duration-300
            ${isFocusMode 
              ? 'bg-[#E53935]/20 text-[#E53935]' 
              : 'bg-white/10 text-white/70 hover:bg-white/15 hover:text-white'
            }
          `}
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
    </div>
  )
}

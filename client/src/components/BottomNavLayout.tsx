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
  ChevronDown
} from 'lucide-react'
import { APP_LOGO } from '@/const'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/contexts/ThemeContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import ThemeToggle from '@/components/ThemeToggle'

// Navigation items for bottom bar
const NAVIGATION = [
  { id: 'dashboard', name: 'Dashboard', href: '/crm-dashboard', icon: LayoutDashboard },
  { id: 'students', name: 'Students', href: '/students', icon: Users },
  { id: 'leads', name: 'Leads', href: '/leads', icon: UserPlus },
  { id: 'kai-command', name: 'Kai', href: '/kai-command', icon: Sparkles, isCenter: true },
  { id: 'classes', name: 'Classes', href: '/classes', icon: Calendar },
  { id: 'staff', name: 'Staff', href: '/staff', icon: UserCog },
  { id: 'billing', name: 'Billing', href: '/billing', icon: CreditCard },
  { id: 'reports', name: 'Reports', href: '/reports', icon: BarChart3 },
  { id: 'settings', name: 'Settings', href: '/setup', icon: Settings },
]

// Page titles mapping
const PAGE_TITLES: Record<string, string> = {
  '/crm-dashboard': 'Dashboard',
  '/dashboard': 'Dashboard',
  '/students': 'Students',
  '/leads': 'Leads',
  '/kai-dashboard': 'Kai Command',
  '/kai-command': 'Kai Command',
  '/kai-chat': 'Kai Command',
  '/classes': 'Classes',
  '/receptionist': 'Receptionist',
  '/staff': 'Staff',
  '/billing': 'Billing',
  '/reports': 'Reports',
  '/marketing': 'Marketing',
  '/setup': 'Settings',
  '/': 'Kai Command',
}

interface BottomNavLayoutProps {
  children: React.ReactNode
  hideHeader?: boolean
}

export default function BottomNavLayout({ children, hideHeader = false }: BottomNavLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { theme } = useTheme()
  
  const isDark = theme === 'dark'
  const isCinematic = theme === 'cinematic'
  
  // Scroll detection for collapsible bottom nav
  const [isNavVisible, setIsNavVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  
  // Hover state for Apple dock bubble effect
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const scrollDelta = currentScrollY - lastScrollY
      
      // Only trigger if scroll delta is significant (> 10px)
      if (Math.abs(scrollDelta) > 10) {
        if (scrollDelta > 0 && currentScrollY > 100) {
          // Scrolling down - hide nav
          setIsNavVisible(false)
        } else {
          // Scrolling up - show nav
          setIsNavVisible(true)
        }
        setLastScrollY(currentScrollY)
      }
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])
  
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
      shadow: '0 2px 8px rgba(0,0,0,0.04)',
      textColor: 'text-[#262626]',
      mutedColor: 'text-gray-500'
    }
  }

  const headerStyles = getHeaderStyles()

  return (
    <div className={`min-h-screen flex flex-col ${getBgClass()}`}>
      {/* Top Header - Apple-style */}
      {!hideHeader && (
        <header 
          className={`
            fixed top-0 left-0 right-0 h-16
            ${headerStyles.bg}
          `}
          style={{ 
            boxShadow: headerStyles.shadow,
            zIndex: 2000
          }}
        >
          <div className="h-full px-6 flex items-center justify-between">
            {/* Left: Logo - Theme-aware */}
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2">
                <img 
                  src={isDark || isCinematic ? '/logo-dark.png' : '/logo-light.png'} 
                  alt="DojoFlow" 
                  className="h-8 object-contain"
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
                <ThemeToggle />
              </div>

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

      {/* Main Content - 80px top padding for fixed header */}
      <main className={`flex-1 ${!hideHeader ? 'pt-20' : ''} pb-20`}>
        {children}
      </main>

      {/* Bottom Navigation Bar */}
      <nav 
        className={`
          fixed left-0 right-0 z-50 h-16
          transition-transform duration-300 ease-in-out
          ${isNavVisible ? 'translate-y-0 bottom-0' : 'translate-y-full bottom-0'}
          ${isCinematic 
            ? 'bg-[rgba(20,20,22,0.45)] border-t border-white/10' 
            : isDark 
              ? 'bg-[#1A1B1F]/95 border-t border-[#2A2B2F]' 
              : 'bg-white/95 border-t border-[#E2E3E6]'
          }
          backdrop-blur-xl
          ${isCinematic ? 'rounded-t-2xl mx-4 mb-0' : ''}
        `}
        style={{
          boxShadow: isCinematic 
            ? '0px -4px 18px rgba(0,0,0,0.75)' 
            : isDark 
              ? '0px -2px 12px rgba(0,0,0,0.4)' 
              : '0px -2px 8px rgba(0,0,0,0.04)'
        }}
      >
        <div className="h-full max-w-screen-xl mx-auto px-2 flex items-center justify-around">
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
            
            return (
              <Link
                key={item.id}
                to={item.href}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`
                  relative flex flex-col items-center justify-center gap-0.5 px-2 py-1
                  transition-all duration-[180ms] ease-out
                  ${active ? 'transform' : ''}
                `}
                style={{ transform: `scale(${getScale()})` }}
              >
                {/* Icon Container */}
                <div 
                  className={`
                    relative flex items-center justify-center
                    ${item.isCenter ? 'h-12 w-12' : 'h-8 w-8'}
                    rounded-full transition-all duration-200
                    ${active && item.isCenter 
                      ? isCinematic 
                        ? 'bg-[#FF5A3D]/20 shadow-[0_0_20px_rgba(255,90,61,0.4)]' 
                        : isDark 
                          ? 'bg-[#FF4F4F]/20 shadow-[0_0_20px_rgba(255,79,79,0.4)]' 
                          : 'bg-[#E53935]/10 shadow-[0_0_20px_rgba(229,57,53,0.3)]'
                      : ''
                    }
                  `}
                >
                  {item.isCenter ? (
                    <img 
                      src="/logo-icon.png" 
                      alt="Kai" 
                      className={`
                        h-8 w-8 object-contain transition-all duration-200
                        ${active ? 'scale-110' : 'opacity-80'}
                      `}
                    />
                  ) : (
                    <Icon 
                      className={`
                        transition-all duration-200
                        h-5 w-5
                        ${active 
                          ? isCinematic ? 'text-[#FF5A3D]' : isDark ? 'text-[#FF4F4F]' : 'text-[#E53935]'
                          : isCinematic ? 'text-[#C1C1C3]' : isDark ? 'text-[#9CA0AE]' : 'text-[#6F6F73]'
                        }
                      `}
                    />
                  )}
                  
                  {/* Glow effect for center item when active */}
                  {active && item.isCenter && (
                    <div 
                      className={`
                        absolute inset-0 rounded-full blur-md opacity-50
                        ${isCinematic ? 'bg-[#FF5A3D]' : isDark ? 'bg-[#FF4F4F]' : 'bg-[#E53935]'}
                      `}
                      style={{ zIndex: -1 }}
                    />
                  )}
                </div>

                {/* Label */}
                <span 
                  className={`
                    text-[10px] font-medium transition-colors duration-200
                    ${active 
                      ? isCinematic ? 'text-[#FF5A3D]' : isDark ? 'text-[#FF4F4F]' : 'text-[#E53935]'
                      : isCinematic ? 'text-[#C1C1C3]' : isDark ? 'text-[#9CA0AE]' : 'text-[#6F6F73]'
                    }
                  `}
                >
                  {item.name}
                </span>

                {/* Active indicator pill */}
                {active && (
                  <div 
                    className={`
                      absolute -bottom-1 h-1 rounded-full
                      ${item.isCenter ? 'w-8' : 'w-6'}
                      ${isCinematic ? 'bg-[#FF5A3D]' : isDark ? 'bg-[#FF4F4F]' : 'bg-[#E53935]'}
                    `}
                    style={{
                      boxShadow: isCinematic 
                        ? '0 0 12px rgba(255, 90, 61, 0.7)' 
                        : isDark 
                          ? '0 0 8px rgba(255, 79, 79, 0.6)' 
                          : '0 0 8px rgba(229, 57, 53, 0.4)'
                    }}
                  />
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

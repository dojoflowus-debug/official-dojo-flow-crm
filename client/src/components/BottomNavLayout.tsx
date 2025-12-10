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

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-[#0F0F11]' : 'bg-[#F7F8FA]'}`}>
      {/* Top Header */}
      {!hideHeader && (
        <header 
          className={`
            fixed top-0 left-0 right-0 z-50 h-16
            ${isDark 
              ? 'bg-[#1A1B1F] border-b border-[#2A2B2F]' 
              : 'bg-white border-b border-[#E2E3E6]'
            }
          `}
          style={{
            boxShadow: isDark 
              ? '0px 2px 12px rgba(0,0,0,0.4)' 
              : '0px 2px 8px rgba(0,0,0,0.04)'
          }}
        >
          <div className="h-full px-4 md:px-6 flex items-center justify-between">
            {/* Left: Logo */}
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2">
                <img 
                  src={APP_LOGO} 
                  alt="DojoFlow" 
                  className="h-8 w-8 object-contain"
                />
                <span className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-[#262626]'}`}>
                  DojoFlow
                </span>
              </Link>
              
              {/* Page Title - Hidden on mobile */}
              <div className={`hidden md:flex items-center gap-2 ml-4 pl-4 border-l ${isDark ? 'border-[#2A2B2F]' : 'border-[#E2E3E6]'}`}>
                <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
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
              <div className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full ${isDark ? 'bg-[#2A2B2F]' : 'bg-gray-100'}`}>
                <CreditCard className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-[#262626]'}`}>
                  Credits: 0
                </span>
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

      {/* Main Content */}
      <main className={`flex-1 ${!hideHeader ? 'pt-16' : ''} pb-20`}>
        {children}
      </main>

      {/* Bottom Navigation Bar */}
      <nav 
        className={`
          fixed bottom-0 left-0 right-0 z-50 h-16
          ${isDark 
            ? 'bg-[#1A1B1F]/95 border-t border-[#2A2B2F]' 
            : 'bg-white/95 border-t border-[#E2E3E6]'
          }
          backdrop-blur-xl
        `}
        style={{
          boxShadow: isDark 
            ? '0px -2px 12px rgba(0,0,0,0.4)' 
            : '0px -2px 8px rgba(0,0,0,0.04)'
        }}
      >
        <div className="h-full max-w-screen-xl mx-auto px-2 flex items-center justify-around">
          {NAVIGATION.map((item) => {
            const active = isActive(item.href)
            const Icon = item.icon
            
            return (
              <Link
                key={item.id}
                to={item.href}
                className={`
                  relative flex flex-col items-center justify-center gap-0.5 px-2 py-1
                  transition-all duration-200 ease-out
                  ${item.isCenter ? 'scale-110' : ''}
                  ${active ? 'transform scale-105' : ''}
                `}
              >
                {/* Icon Container */}
                <div 
                  className={`
                    relative flex items-center justify-center
                    ${item.isCenter ? 'h-10 w-10' : 'h-8 w-8'}
                    rounded-full transition-all duration-200
                    ${active && item.isCenter 
                      ? isDark 
                        ? 'bg-[#FF4F4F]/20' 
                        : 'bg-[#E53935]/10'
                      : ''
                    }
                  `}
                >
                  <Icon 
                    className={`
                      transition-all duration-200
                      ${item.isCenter ? 'h-6 w-6' : 'h-5 w-5'}
                      ${active 
                        ? isDark ? 'text-[#FF4F4F]' : 'text-[#E53935]'
                        : isDark ? 'text-[#9CA0AE]' : 'text-[#6F6F73]'
                      }
                    `}
                  />
                  
                  {/* Glow effect for center item when active */}
                  {active && item.isCenter && (
                    <div 
                      className={`
                        absolute inset-0 rounded-full blur-md opacity-50
                        ${isDark ? 'bg-[#FF4F4F]' : 'bg-[#E53935]'}
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
                      ? isDark ? 'text-[#FF4F4F]' : 'text-[#E53935]'
                      : isDark ? 'text-[#9CA0AE]' : 'text-[#6F6F73]'
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
                      ${isDark ? 'bg-[#FF4F4F]' : 'bg-[#E53935]'}
                    `}
                    style={{
                      boxShadow: isDark 
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

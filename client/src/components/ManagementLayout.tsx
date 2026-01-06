import { useState, useRef, useEffect, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  Users,
  UserPlus,
  Calendar,
  UserCog,
  CreditCard,
  BarChart3,
  Settings,
  Sparkles,
  Building2,
  Shield,
  Puzzle,
  Zap,
  Bell,
  HelpCircle,
  LogOut,
  Sun,
  Moon,
  Clapperboard,
  ChevronDown,
  Command,
} from 'lucide-react'
import { useTheme, Theme } from '@/contexts/ThemeContext'
import { useAuth } from '@/hooks/useAuth'
import { trpc } from '@/lib/trpc'
import { cn } from '@/lib/utils'
import LowCreditBanner from '@/components/LowCreditBanner'
import KaiCommandOverlay from '@/components/KaiCommandOverlay'
import { BrandLogo } from '@/components/BrandLogo'
import AppShell from '@/components/AppShell'

// Management navigation items - standard SaaS structure
const MANAGEMENT_NAV = [
  { id: 'students', name: 'Students', href: '/students', icon: Users },
  { id: 'leads', name: 'Leads', href: '/leads', icon: UserPlus },
  { id: 'classes', name: 'Classes', href: '/classes', icon: Calendar },
  { id: 'staff', name: 'Staff', href: '/staff', icon: UserCog },
  { id: 'billing', name: 'Billing', href: '/billing', icon: CreditCard },
  { id: 'reports', name: 'Reports', href: '/reports', icon: BarChart3 },
  { id: 'settings', name: 'Settings', href: '/settings', icon: Settings },
]

const themeOptions: { id: Theme; label: string; icon: typeof Sun }[] = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'cinematic', label: 'Cinematic', icon: Clapperboard },
]

interface ManagementLayoutProps {
  children: React.ReactNode
  title?: string
}

export default function ManagementLayout({ children, title }: ManagementLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const [kaiOverlayOpen, setKaiOverlayOpen] = useState(false)
  
  const isDark = theme === 'dark' || theme === 'cinematic'
  
  // Keyboard shortcut for Kai Command (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setKaiOverlayOpen(true)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
  
  // Fetch credit balance
  const { data: creditBalance } = trpc.credits.getBalance.useQuery(undefined, {
    refetchInterval: 60000,
  })
  
  // Check if a nav item is active
  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/')
  }
  
  // Get user initials for avatar
  const getUserInitials = () => {
    const displayName = user?.name || user?.email?.split('@')[0]
    if (!displayName) return 'U'
    const names = displayName.split(' ')
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase()
    }
    return displayName.substring(0, 2).toUpperCase()
  }
  
  // Get display name
  const getDisplayName = () => {
    if (user?.name) return user.name
    if (user?.email) return user.email.split('@')[0]
    return 'User'
  }
  
  // Handle logout
  const handleLogout = async () => {
    await logout()
    navigate('/owner')
  }
  
  // Get current page title from nav or prop
  const getCurrentTitle = () => {
    if (title) return title
    const currentNav = MANAGEMENT_NAV.find(item => isActive(item.href))
    return currentNav?.name || 'Dashboard'
  }

  // Logo variant based on theme - using BrandLogo component

  return (
    <AppShell hideBottomNav={false}>
      <div className={cn(
        "min-h-screen flex flex-col",
        isDark ? "bg-[#0a0a0b]" : "bg-[#FAFBFC]"
      )}>
      {/* Low Credit Banner */}
      <LowCreditBanner />
      
      {/* Top Navigation Bar */}
      <header className={cn(
        "sticky top-0 z-50 h-16 border-b flex items-center justify-between px-4 lg:px-6",
        isDark 
          ? "bg-[#111113] border-white/10" 
          : "bg-white border-gray-200"
      )}>
        {/* Left: Logo + Navigation */}
        <div className="flex items-center gap-6">
          {/* Logo - Using official DojoFlow branding */}
          <Link to="/students" className="flex items-center gap-2 shrink-0">
            <BrandLogo size="md" />
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {MANAGEMENT_NAV.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              
              return (
                <Link
                  key={item.id}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? isDark
                        ? "bg-white/10 text-white"
                        : "bg-gray-100 text-gray-900"
                      : isDark
                        ? "text-white/60 hover:text-white hover:bg-white/5"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
        
        {/* Right: Actions + Profile */}
        <div className="flex items-center gap-3">
          {/* Ask Kai Button */}
          <button onClick={() => setKaiOverlayOpen(true)}>
            <Button 
              variant="outline" 
              size="sm"
              className={cn(
                "gap-2 border-red-500/30 hover:border-red-500/50",
                isDark
                  ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                  : "bg-red-50 text-red-600 hover:bg-red-100"
              )}
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Ask Kai</span>
              <kbd className={cn(
                "hidden md:inline-flex h-5 items-center gap-1 rounded border px-1.5 text-[10px] font-medium",
                isDark
                  ? "border-white/20 bg-white/5 text-white/60"
                  : "border-gray-300 bg-gray-100 text-gray-500"
              )}>
                <Command className="h-3 w-3" />K
              </kbd>
            </Button>
          </button>
          
          {/* Credits */}
          <Link to="/billing/credits">
            <Button 
              variant="ghost" 
              size="sm"
              className={cn(
                "gap-2",
                isDark ? "text-white/60 hover:text-white" : "text-gray-600 hover:text-gray-900"
              )}
            >
              <Zap className="h-4 w-4 text-emerald-500" />
              <span className="font-semibold tabular-nums">
                {creditBalance?.balance?.toLocaleString() ?? '---'}
              </span>
            </Button>
          </Link>
          
          {/* Theme Toggle */}
          <div className={cn(
            "hidden sm:flex items-center rounded-lg border p-0.5",
            isDark ? "bg-white/5 border-white/10" : "bg-gray-100 border-gray-200"
          )}>
            {themeOptions.map((t) => {
              const Icon = t.icon
              const isActive = theme === t.id
              
              return (
                <Button
                  key={t.id}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-7 w-7 p-0",
                    isActive && (isDark ? "bg-white/10 text-white" : "bg-white shadow-sm text-gray-900")
                  )}
                  onClick={() => setTheme(t.id)}
                  title={t.label}
                >
                  <Icon className="h-3.5 w-3.5" />
                </Button>
              )
            })}
          </div>
          
          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2 pl-2 pr-1"
              >
                <Avatar className="h-7 w-7">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className={cn(
                    "text-xs font-medium",
                    isDark ? "bg-white/10 text-white" : "bg-gray-100 text-gray-600"
                  )}>
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className={cn(
                  "h-4 w-4",
                  isDark ? "text-white/40" : "text-gray-400"
                )} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {/* Profile Header */}
              <div className="px-3 py-2 border-b">
                <p className="font-medium">{getDisplayName()}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
              
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                Account
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigate('/settings/profile')}>
                <Users className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings/school')}>
                <Building2 className="h-4 w-4 mr-2" />
                School Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/staff')}>
                <Shield className="h-4 w-4 mr-2" />
                Staff & Permissions
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                Billing
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigate('/billing')}>
                <CreditCard className="h-4 w-4 mr-2" />
                Billing & Subscription
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/billing/credits')}>
                <Zap className="h-4 w-4 mr-2" />
                AI Credits
                <span className="ml-auto text-xs text-emerald-500 font-medium">
                  {creditBalance?.balance?.toLocaleString() ?? '---'}
                </span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                Settings
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigate('/settings/integrations')}>
                <Puzzle className="h-4 w-4 mr-2" />
                Integrations
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings/notifications')}>
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={() => navigate('/help')}>
                <HelpCircle className="h-4 w-4 mr-2" />
                Help & Support
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={handleLogout}
                className="text-red-500 focus:text-red-500"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      
      {/* Mobile Bottom Navigation */}
      <nav className={cn(
        "lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t",
        isDark 
          ? "bg-[#111113] border-white/10" 
          : "bg-white border-gray-200"
      )}
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
      >
        <div className="flex items-center justify-around h-16 px-2">
          {MANAGEMENT_NAV.slice(0, 5).map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            
            return (
              <Link
                key={item.id}
                to={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg transition-colors min-w-[60px]",
                  active
                    ? isDark
                      ? "text-red-400"
                      : "text-red-600"
                    : isDark
                      ? "text-white/60"
                      : "text-gray-500"
                )}
              >
                <Icon className={cn(
                  "h-5 w-5",
                  active && "scale-110"
                )} />
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            )
          })}
          
          {/* More menu for remaining items */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg transition-colors min-w-[60px]",
                isDark ? "text-white/60" : "text-gray-500"
              )}>
                <Settings className="h-5 w-5" />
                <span className="text-[10px] font-medium">More</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="mb-2">
              {MANAGEMENT_NAV.slice(5).map((item) => {
                const Icon = item.icon
                return (
                  <DropdownMenuItem key={item.id} onClick={() => navigate(item.href)}>
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </DropdownMenuItem>
                )
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/kai')}>
                <Sparkles className="h-4 w-4 mr-2 text-red-500" />
                Ask Kai
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className="flex-1 pb-20 lg:pb-0">
        {children}
      </main>
      
      {/* Kai Command Overlay */}
      <KaiCommandOverlay 
        isOpen={kaiOverlayOpen} 
        onClose={() => setKaiOverlayOpen(false)} 
      />
      </div>
    </AppShell>
  )
}

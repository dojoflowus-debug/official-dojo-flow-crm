import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Sparkles,
  Tablet,
  Headphones,
  Calendar,
  UserCog,
  CreditCard,
  BarChart3,
  TrendingUp,
  Settings,
  Eye,
  EyeOff,
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  X
} from 'lucide-react'
import { APP_LOGO } from '@/const'
import { useAuth } from '@/hooks/useAuth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

// Navigation items
const NAVIGATION = [
  { id: 'dashboard', name: 'Dashboard', href: '/crm-dashboard', icon: LayoutDashboard },
  { id: 'students', name: 'Students', href: '/students', icon: Users },
  { id: 'leads', name: 'Leads', href: '/leads', icon: UserPlus },
  { id: 'kai-command', name: 'Kai Command', href: '/kai-command', icon: Sparkles },
  { id: 'classes', name: 'Classes', href: '/classes', icon: Calendar },
  { id: 'kiosk', name: 'Kiosk', href: '/kiosk', icon: Tablet },
  { id: 'receptionist', name: 'Receptionist', href: '/receptionist', icon: Headphones },
  { id: 'staff', name: 'Staff', href: '/staff', icon: UserCog },
  { id: 'billing', name: 'Billing', href: '/billing', icon: CreditCard },
  { id: 'reports', name: 'Reports', href: '/reports', icon: BarChart3 },
  { id: 'marketing', name: 'Marketing', href: '/marketing', icon: TrendingUp },
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
  '/kiosk': 'Kiosk',
  '/receptionist': 'Receptionist',
  '/staff': 'Staff',
  '/billing': 'Billing',
  '/reports': 'Reports',
  '/marketing': 'Marketing',
  '/setup': 'Settings',
}

interface DojoFlowLayoutProps {
  children: React.ReactNode
}

export default function DojoFlowLayout({ children }: DojoFlowLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  
  // Sidebar visibility state (persisted)
  const [sidebarVisible, setSidebarVisible] = useState(() => {
    const saved = localStorage.getItem('dojoflow-sidebar-visible')
    return saved !== null ? JSON.parse(saved) : true
  })
  
  // Top bar visibility state (persisted)
  const [topBarVisible, setTopBarVisible] = useState(() => {
    const saved = localStorage.getItem('dojoflow-topbar-visible')
    return saved !== null ? JSON.parse(saved) : true
  })
  
  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Hover reveal state for collapsed sidebar
  const [hoverRevealed, setHoverRevealed] = useState(false)

  // Persist sidebar state
  useEffect(() => {
    localStorage.setItem('dojoflow-sidebar-visible', JSON.stringify(sidebarVisible))
  }, [sidebarVisible])

  // Persist top bar state
  useEffect(() => {
    localStorage.setItem('dojoflow-topbar-visible', JSON.stringify(topBarVisible))
  }, [topBarVisible])

  // Get current page title
  const getPageTitle = () => {
    const path = location.pathname
    // Check exact match first
    if (PAGE_TITLES[path]) return PAGE_TITLES[path]
    // Check prefix match
    for (const [key, title] of Object.entries(PAGE_TITLES)) {
      if (path.startsWith(key)) return title
    }
    return 'DojoFlow'
  }

  // Check if nav item is active
  const isActive = (href: string) => {
    if (href === '/crm-dashboard') {
      return location.pathname === '/crm-dashboard' || location.pathname === '/dashboard'
    }
    return location.pathname.startsWith(href)
  }

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible)
    setHoverRevealed(false)
  }

  // Handle hover reveal
  const handleMouseEnter = () => {
    if (!sidebarVisible) {
      setHoverRevealed(true)
    }
  }

  const handleMouseLeave = () => {
    setHoverRevealed(false)
  }

  // Determine if sidebar should be shown (either visible or hover revealed)
  const showSidebar = sidebarVisible || hoverRevealed

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-black border-r border-slate-900 z-40 transition-all duration-300 ease-in-out ${
          showSidebar ? 'w-64' : 'w-0'
        } ${!sidebarVisible && !hoverRevealed ? 'overflow-hidden' : ''}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex flex-col h-full">
          {/* Logo and Eye Toggle */}
          <div className="flex items-center justify-between p-4 border-b border-slate-800">
            <Link to="/crm-dashboard" className="flex items-center gap-2">
              {APP_LOGO ? (
                <img src={APP_LOGO} alt="DojoFlow" className="h-8 w-auto" />
              ) : (
                <span className="text-xl font-bold text-white">DojoFlow</span>
              )}
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-8 w-8"
              title={sidebarVisible ? 'Hide navigation' : 'Show navigation'}
            >
              {sidebarVisible ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {NAVIGATION.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              
              return (
                <Link
                  key={item.id}
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    active
                      ? 'bg-[#ED393D] text-white font-medium'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <Icon className={`h-5 w-5 flex-shrink-0 ${active ? 'text-white' : ''}`} />
                  <span className="truncate">{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* User Section at Bottom */}
          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-slate-800 text-white text-sm">
                  {user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-white">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email || ''}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-900"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Hover trigger zone when sidebar is hidden */}
      {!sidebarVisible && (
        <div
          className="fixed left-0 top-0 w-4 h-full z-30"
          onMouseEnter={handleMouseEnter}
        />
      )}

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          showSidebar ? 'ml-64' : 'ml-0'
        }`}
      >
        {/* Top Bar */}
        <header
          className={`sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-slate-800 transition-all duration-300 ${
            topBarVisible ? 'h-16' : 'h-0 overflow-hidden border-b-0'
          }`}
        >
          <div className="flex items-center justify-between h-16 px-6">
            {/* Left: Mobile Menu + Page Title */}
            <div className="flex items-center gap-4">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              
              {/* Eye toggle for desktop when sidebar is hidden */}
              {!sidebarVisible && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  className="hidden md:flex h-8 w-8"
                  title="Show navigation"
                >
                  <EyeOff className="h-4 w-4" />
                </Button>
              )}
              
              {/* Page Title */}
              <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              {/* Ask Kai Button */}
              <Button
                onClick={() => navigate('/kai-dashboard')}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Ask Kai</span>
              </Button>

              {/* Credits Indicator */}
              <div className="hidden md:flex items-center gap-1 px-3 py-1.5 bg-muted rounded-lg text-sm">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span>Credits: <strong>0</strong></span>
              </div>

              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-slate-800 text-white text-sm">
                        {user?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user?.name || 'User'}</p>
                    <p className="text-xs text-muted-foreground">{user?.email || ''}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/setup')}>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTopBarVisible(!topBarVisible)}>
                    {topBarVisible ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                    {topBarVisible ? 'Hide Top Menu' : 'Show Top Menu'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Show top bar toggle when hidden */}
        {!topBarVisible && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTopBarVisible(true)}
            className="fixed top-2 right-2 z-40 bg-background/80 backdrop-blur"
          >
            <Eye className="h-4 w-4 mr-1" />
            Top Menu
          </Button>
        )}

        {/* Mobile Navigation Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div 
              className="absolute inset-0 bg-black/50" 
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="absolute left-0 top-0 h-full w-64 bg-card shadow-xl">
              <div className="flex items-center justify-between p-4 border-b border-slate-800">
                <span className="text-xl font-bold text-white">DojoFlow</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className="p-3 space-y-1">
                {NAVIGATION.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  
                  return (
                    <Link
                      key={item.id}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        active
                          ? 'bg-[#EEF2FF] text-primary font-medium'
                          : 'text-muted-foreground hover:bg-accent'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${active ? 'text-primary' : ''}`} />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

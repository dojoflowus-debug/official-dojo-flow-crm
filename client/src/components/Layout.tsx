import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Calendar,
  CreditCard,
  BarChart3,
  Settings,
  X,
  Sun,
  Moon,
  LogOut,
  Tablet,
  Headphones,
  UserCog,
  TrendingUp,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Menu,
  Sparkles
} from 'lucide-react'
import { APP_LOGO } from '@/const'
// import CreditCounter from './CreditCounter' // TODO: Create CreditCounter component

export default function Layout({ children, onLogout = () => {}, theme = 'dark', toggleTheme = () => {} }) {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024)
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 768)
  // Detect touch devices (phones, tablets, iPads) for showing arrows vs grip
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  const location = useLocation()
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)

  const defaultNavigation = [
    { id: 'dashboard', name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { id: 'students', name: 'Students', href: '/students', icon: Users },
    // { id: 'kiosk', name: 'Kiosk', href: '/kiosk', icon: Tablet },
    { id: 'leads', name: 'Leads', href: '/leads', icon: UserPlus },
    // { id: 'receptionist', name: 'Receptionist', href: '/test-page', icon: Headphones },
    // { id: 'classes', name: 'Classes', href: '/classes', icon: Calendar },
    // { id: 'staff', name: 'Staff', href: '/staff', icon: UserCog },
    // { id: 'billing', name: 'Billing', href: '/billing', icon: CreditCard },
    // { id: 'reports', name: 'Reports', href: '/reports', icon: BarChart3 },
    // { id: 'marketing', name: 'Marketing', href: '/marketing', icon: TrendingUp },
    // { id: 'subscription', name: 'Subscription', href: '/subscription', icon: CreditCard },
    // { id: 'setup', name: 'Setup', href: '/setup', icon: Settings },
  ]

  // Load navigation order from localStorage
  const [navigation, setNavigation] = useState(() => {
    return defaultNavigation
  })

  // Save navigation order to localStorage whenever it changes
  useEffect(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('sidebar-order', JSON.stringify(navigation))
      }
    } catch (e) {
      // Safari private browsing blocks localStorage
    }
  }, [navigation])

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      setIsSmallScreen(width < 768)
      if (width >= 1024) {
        setSidebarOpen(true)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard'
    }
    return location.pathname.startsWith(path)
  }

  // Touch-friendly drag handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', e.target)
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDrop = (e, dropIndex) => {
    e.preventDefault()
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const items = Array.from(navigation)
    const [draggedItem] = items.splice(draggedIndex, 1)
    items.splice(dropIndex, 0, draggedItem)

    setNavigation(items)
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  // Arrow button handlers for mobile
  const moveItemUp = (index) => {
    if (index === 0) return
    const items = Array.from(navigation)
    const [item] = items.splice(index, 1)
    items.splice(index - 1, 0, item)
    setNavigation(items)
  }

  const moveItemDown = (index) => {
    if (index === navigation.length - 1) return
    const items = Array.from(navigation)
    const [item] = items.splice(index, 1)
    items.splice(index + 1, 0, item)
    setNavigation(items)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Overlay - dims content when sidebar is open */}
      {isSmallScreen && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 bg-card ${
          isSmallScreen
            ? sidebarOpen
              ? 'w-64 translate-x-0'
              : 'w-64 -translate-x-full'
            : sidebarOpen
            ? 'w-64'
            : 'w-16'
        } border-r border-border`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div 
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <img src={APP_LOGO} alt="Dojo Flow" className="h-8 w-8" />
              {(sidebarOpen || isSmallScreen) && (
                <span className="font-semibold text-lg">Dojo Flow</span>
              )}
            </div>
            {/* X button removed - only logo toggles sidebar */}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navigation.map((item, index) => {
              const Icon = item.icon
              const isDragging = draggedIndex === index
              const isOver = dragOverIndex === index
              
              return (
                <div
                  key={item.id}
                  data-nav-item
                  draggable={!isTouchDevice && sidebarOpen}
                  onDragStart={!isTouchDevice ? (e) => handleDragStart(e, index) : undefined}
                  onDragOver={!isTouchDevice ? (e) => handleDragOver(e, index) : undefined}
                  onDrop={!isTouchDevice ? (e) => handleDrop(e, index) : undefined}
                  onDragEnd={!isTouchDevice ? handleDragEnd : undefined}

                  className={`relative ${isDragging ? 'opacity-30' : ''} ${
                    isOver && !isDragging ? 'border-t-2 border-primary' : ''
                  }`}
                >
                  <Link
                    to={item.href}
                    className={`flex items-center gap-3 rounded-lg transition-colors ${
                      sidebarOpen ? 'px-4 py-3' : 'px-3 py-3 justify-center'
                    } ${
                      isActive(item.href)
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                    onClick={(e) => {
                      if (isDragging) {
                        e.preventDefault()
                        return
                      }
                      // Don't auto-close sidebar - only logo click toggles it
                    }}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {sidebarOpen && (
                      <>
                        <span className="flex-1">{item.name}</span>
                        {isTouchDevice ? (
                          <div className="flex gap-1">
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                moveItemUp(index)
                              }}
                              disabled={index === 0}
                              className="p-1 hover:bg-accent rounded disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                moveItemDown(index)
                              }}
                              disabled={index === navigation.length - 1}
                              className="p-1 hover:bg-accent rounded disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div 
                            className="cursor-grab active:cursor-grabbing opacity-60 hover:opacity-100 transition-opacity"
                          >
                            <GripVertical className="h-4 w-4" />
                          </div>
                        )}
                      </>
                    )}
                  </Link>
                </div>
              )
            })}
          </nav>

          {/* Theme Toggle & Logout */}
          <div className="p-4 border-t border-border space-y-2">
            <Button
              variant="ghost"
              className={`w-full ${sidebarOpen ? 'justify-start' : 'justify-center px-0'}`}
              onClick={toggleTheme}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-5 w-5" />
                  {sidebarOpen && <span className="ml-3">Light Mode</span>}
                </>
              ) : (
                <>
                  <Moon className="h-5 w-5" />
                  {sidebarOpen && <span className="ml-3">Dark Mode</span>}
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              className={`w-full text-destructive hover:text-destructive hover:bg-destructive/10 ${
                sidebarOpen ? 'justify-start' : 'justify-center px-0'
              }`}
              onClick={onLogout}
            >
              <LogOut className="h-5 w-5" />
              {sidebarOpen && <span className="ml-3">Logout</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ${
          isSmallScreen ? 'ml-0' : sidebarOpen ? 'ml-64' : 'ml-16'
        }`}
      >
        {/* Header */}
        <header className="sticky top-0 z-20 bg-card border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Mobile menu button */}
            {isSmallScreen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden"
              >
                <Menu className="h-6 w-6" />
              </Button>
            )}
            
            {/* Credit Counter */}
            {/* <div className="ml-auto">
              <CreditCounter 
                organizationId={1}
                onPurchaseClick={() => window.location.href = '/subscription'}
              />
            </div> */}
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}


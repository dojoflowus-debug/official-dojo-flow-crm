import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from '@/components/ui/button'
import {
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
  ChevronUp,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Palette,
  Mail,
  Zap,
  MessageSquare,
  Shield,
  Wrench
} from 'lucide-react'
import { APP_LOGO } from '@/const'
import { useAuth } from '@/hooks/useAuth'
import { LogOut } from 'lucide-react'

// Navigation item types
type NavigationItem = {
  id: string
  name: string
  href: string
  icon: string
  children?: NavigationItem[]
}

const DEFAULT_NAVIGATION: NavigationItem[] = [
  { id: 'students', name: 'Students', href: '/students', icon: 'Users' },
  { id: 'leads', name: 'Leads', href: '/leads', icon: 'UserPlus' },
  { id: 'classes', name: 'Classes', href: '/classes', icon: 'Calendar' },
  { id: 'kiosk', name: 'Kiosk', href: '/kiosk', icon: 'Tablet' },
  { id: 'receptionist', name: 'Receptionist', href: '/receptionist', icon: 'Headphones' },
  { id: 'staff', name: 'Staff', href: '/staff', icon: 'UserCog' },
  { id: 'billing', name: 'Billing', href: '/billing', icon: 'CreditCard' },
  { id: 'reports', name: 'Reports', href: '/reports', icon: 'BarChart3' },
  { id: 'marketing', name: 'Marketing', href: '/marketing', icon: 'TrendingUp' },
  { 
    id: 'settings', 
    name: 'Settings', 
    href: '/setup', 
    icon: 'Settings',
    children: [
      { id: 'setup-general', name: 'General', href: '/setup', icon: 'Wrench' },
      { id: 'themes', name: 'Themes', href: '/themes', icon: 'Palette' },
      { id: 'subscription', name: 'Subscription', href: '/subscription', icon: 'CreditCard' },
      { id: 'ai-setup', name: 'AI/Kai Setup', href: '/ai-setup', icon: 'Sparkles' },
      { id: 'kiosk-setup', name: 'Kiosk Setup', href: '/kiosk-setup', icon: 'Tablet' },
      { id: 'security', name: 'Security & Roles', href: '/security', icon: 'Shield' }
    ]
  }
]

const ICON_MAP = {
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
  Palette,
  Mail,
  Zap,
  MessageSquare,
  Shield,
  Wrench
}

// Logout Button Component
function LogoutButton() {
  const { logout } = useAuth()
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={logout}
      className="p-2 hover:bg-accent rounded-lg transition-colors"
      title="Logout"
    >
      <LogOut className="h-5 w-5" />
    </Button>
  )
}

export default function SimpleLayout({ children }) {
  // Load sidebar state from localStorage
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen')
    return saved !== null ? JSON.parse(saved) : true
  })

  // Track expanded sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('expandedSections')
    return saved ? JSON.parse(saved) : { marketing: false, settings: false }
  })

  // Load menu order from localStorage - use DEFAULT_NAVIGATION if not found or invalid
  const [navigation, setNavigation] = useState<NavigationItem[]>(() => {
    try {
      const saved = localStorage.getItem('menuOrder')
      if (!saved) return DEFAULT_NAVIGATION
      
      const savedNav = JSON.parse(saved)
      // Simple validation: check if it's an array
      if (Array.isArray(savedNav) && savedNav.length > 0) {
        // Migration: Remove Marketing children if they exist (old structure)
        const migratedNav = savedNav.map(item => {
          if (item.id === 'marketing' && item.children) {
            // Remove children from Marketing item
            const { children, ...rest } = item
            return rest
          }
          return item
        })
        
        // Filter out standalone Campaigns, Automations, Conversations items
        const cleanedNav = migratedNav.filter(item => 
          !['campaigns', 'automations', 'conversations'].includes(item.id)
        )
        
        // If migration changed the structure, save it back
        if (JSON.stringify(cleanedNav) !== JSON.stringify(savedNav)) {
          localStorage.setItem('menuOrder', JSON.stringify(cleanedNav))
          return cleanedNav
        }
        
        return savedNav
      }
    } catch (error) {
      console.error('Error loading menu order:', error)
    }
    
    return DEFAULT_NAVIGATION
  })

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dropIndicatorIndex, setDropIndicatorIndex] = useState<number | null>(null)
  const location = useLocation()
  const { theme } = useTheme()
  const isDarkMode = theme === 'dark' || theme === 'cinematic'

  // Persist sidebar state
  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(sidebarOpen))
  }, [sidebarOpen])

  // Persist expanded sections
  useEffect(() => {
    localStorage.setItem('expandedSections', JSON.stringify(expandedSections))
  }, [expandedSections])

  // Note: We don't auto-persist navigation changes to avoid infinite loops.
  // Navigation is only saved when explicitly modified by drag-and-drop or move actions.

  const isActive = (path: string) => {
    return location.pathname.startsWith(path)
  }

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  // Haptic feedback helper - vibrate on mobile devices
  const vibrate = (pattern: number | number[] = 20) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  }

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newNavigation = [...navigation]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    if (targetIndex < 0 || targetIndex >= newNavigation.length) return
    
    // Swap items
    const temp = newNavigation[index]
    newNavigation[index] = newNavigation[targetIndex]
    newNavigation[targetIndex] = temp
    
    setNavigation(newNavigation)
    
    // Haptic feedback on mobile
    vibrate(15)
  }

  // Drag and drop handlers for desktop
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML)
    // Add slight opacity to dragged item
    ;(e.currentTarget as HTMLElement).style.opacity = '0.5'
  }

  const handleDragEnd = (e: React.DragEvent) => {
    ;(e.currentTarget as HTMLElement).style.opacity = '1'
    setDraggedIndex(null)
    setDropIndicatorIndex(null)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    
    // Show drop indicator at the position where item will be inserted
    if (draggedIndex !== null && draggedIndex !== index) {
      setDropIndicatorIndex(index)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if leaving the nav container entirely
    const relatedTarget = e.relatedTarget as HTMLElement
    if (!relatedTarget || !relatedTarget.closest('nav')) {
      setDropIndicatorIndex(null)
    }
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDropIndicatorIndex(null)
      return
    }
    
    const newNavigation = [...navigation]
    const draggedItem = newNavigation[draggedIndex]
    
    // Remove dragged item
    newNavigation.splice(draggedIndex, 1)
    
    // Insert at new position
    newNavigation.splice(dropIndex, 0, draggedItem)
    
    setNavigation(newNavigation)
    setDraggedIndex(null)
    setDropIndicatorIndex(null)
    
    // Haptic feedback on mobile
    vibrate(20)
  }

  const renderNavItem = (item: NavigationItem, index: number) => {
    const Icon = ICON_MAP[item.icon]
    const isDragging = draggedIndex === index
    const showDropIndicator = dropIndicatorIndex === index
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedSections[item.id]
    
    return (
      <div key={item.id}>
        {/* Drop indicator line - show above the item */}
        {showDropIndicator && draggedIndex !== null && draggedIndex < index && (
          <div className="h-1 bg-primary shadow-lg shadow-primary/50 rounded-full mb-2 animate-in fade-in duration-200" />
        )}
        
        <div 
          className="group relative"
          draggable={sidebarOpen && !hasChildren} // Only draggable when sidebar is open and no children
          onDragStart={(e) => handleDragStart(e, index)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={(e) => handleDrop(e, index)}
        >
          {hasChildren ? (
            // Section with children - clickable to expand/collapse
            <div
              onClick={() => toggleSection(item.id)}
              className={`flex items-center gap-3 rounded-lg transition-all cursor-pointer ${
                sidebarOpen ? 'px-4 py-3 hover:ring-2 hover:ring-primary/30' : 'px-3 py-3 justify-center'
              } ${
                isActive(item.href)
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-accent'
              } ${
                isDragging ? 'opacity-50' : ''
              }`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {sidebarOpen && (
                <>
                  <span className="flex-1">{item.name}</span>
                  <ChevronDown 
                    className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                  />
                </>
              )}
            </div>
          ) : (
            // Regular navigation item
            <Link
              to={item.href}
              className={`flex items-center gap-3 rounded-lg transition-all ${
                sidebarOpen ? 'px-4 py-3 cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-primary/30' : 'px-3 py-3 justify-center'
              } ${
                isActive(item.href)
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              } ${
                isDragging ? 'opacity-50' : ''
              }`}
              draggable={false} // Prevent Link from being draggable
              title={sidebarOpen ? "Drag to reorder" : ""}
            >
              {/* Drag handle icon - only show on desktop when sidebar is open */}
              {sidebarOpen && (
                <GripVertical className="h-4 w-4 flex-shrink-0 pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity hidden lg:block" />
              )}
              <Icon className="h-5 w-5 flex-shrink-0 pointer-events-none" />
              {sidebarOpen && <span className="flex-1 pointer-events-none">{item.name}</span>}
            </Link>
          )}
          
          {/* Reorder arrows - only show on mobile/tablet (lg:hidden) for items without children */}
          {sidebarOpen && !hasChildren && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-0.5 lg:hidden">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  moveItem(index, 'up')
                }}
                disabled={index === 0}
                className="p-0.5 rounded hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed"
                title="Move up"
              >
                <ChevronUp className="h-3 w-3" />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  moveItem(index, 'down')
                }}
                disabled={index === navigation.length - 1}
                className="p-0.5 rounded hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed"
                title="Move down"
              >
                <ChevronDown className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
        
        {/* Child items - only show when expanded */}
        {hasChildren && isExpanded && sidebarOpen && (
          <div className="ml-4 mt-1 space-y-1 border-l-2 border-border pl-2">
            {item.children!.map((child) => {
              const ChildIcon = ICON_MAP[child.icon]
              return (
                <Link
                  key={child.id}
                  to={child.href}
                  className={`flex items-center gap-3 rounded-lg px-4 py-2 transition-all ${
                    isActive(child.href)
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  }`}
                >
                  <ChildIcon className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1 text-sm">{child.name}</span>
                </Link>
              )
            })}
          </div>
        )}
        
        {/* Drop indicator line - show below the item */}
        {showDropIndicator && draggedIndex !== null && draggedIndex > index && (
          <div className="h-1 bg-primary shadow-lg shadow-primary/50 rounded-full mt-2 animate-in fade-in duration-200" />
        )}
      </div>
    )
  }

  return (
    <div className={`flex h-screen ${isDarkMode ? 'bg-[#0F1115]' : 'bg-background'}`}>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-16'
        } transition-all duration-300 ease-in-out border-r border-border flex flex-col fixed lg:relative h-full z-50 bg-background ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isDarkMode ? 'bg-[#0F1115] border-white/10' : 'bg-background'}`}
      >
        {/* Logo */}
        <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-white/10' : 'border-border'}`}>
          <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <img src={APP_LOGO} alt="Dojo Flow" className="h-8 w-8" />
            {sidebarOpen && (
              <span className="font-semibold text-lg">Dojo Flow</span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1" onDragLeave={handleDragLeave}>
          {navigation.map((item, index) => renderNavItem(item, index))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header with Hamburger */}
        <div className={`lg:hidden flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-white/10 bg-[#0F1115]' : 'border-border bg-background'}`}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <img src={APP_LOGO} alt="Dojo Flow" className="h-8 w-8" />
          <LogoutButton />
        </div>
        
        <main className="flex-1 overflow-y-auto p-3 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

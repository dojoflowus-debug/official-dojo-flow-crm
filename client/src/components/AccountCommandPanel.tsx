import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTheme, Theme } from '@/contexts/ThemeContext'
import { useAuth } from '@/hooks/useAuth'
import { trpc } from '@/lib/trpc'
import {
  Building2,
  Users,
  CreditCard,
  Puzzle,
  Sun,
  Moon,
  Sparkles,
  Zap,
  Bell,
  HelpCircle,
  LogOut,
  Pencil,
  ChevronRight,
  X,
  Settings,
  Shield
} from 'lucide-react'

interface AccountCommandPanelProps {
  isOpen: boolean
  onClose: () => void
  anchorRef: React.RefObject<HTMLElement>
}

const themeOptions: { id: Theme; label: string; icon: typeof Sun }[] = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'cinematic', label: 'Cinematic', icon: Sparkles },
]

export function AccountCommandPanel({ isOpen, onClose, anchorRef }: AccountCommandPanelProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const panelRef = useRef<HTMLDivElement>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  
  const isDark = theme === 'dark' || theme === 'cinematic'
  const isCinematic = theme === 'cinematic'
  
  // Fetch credit balance
  const { data: creditBalance } = trpc.credits.getBalance.useQuery(undefined, {
    enabled: isOpen,
    refetchInterval: 60000,
  })
  
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
  
  // Get user role
  const getUserRole = () => {
    if (user?.globalRole === 'platform_admin') return 'Platform Admin'
    if (user?.role === 'admin') return 'Admin'
    if (user?.role === 'owner') return 'Owner'
    return 'Owner'
  }
  
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])
  
  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose()
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose, anchorRef])
  
  // Animation control
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true)
    }
  }, [isOpen])
  
  // Handle logout
  const handleLogout = async () => {
    onClose()
    await logout()
    navigate('/owner')
  }
  
  // Navigation handlers
  const handleNavigate = (path: string) => {
    onClose()
    navigate(path)
  }
  
  // Focus trap
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Tab' && panelRef.current) {
      const focusableElements = panelRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement
      
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault()
        lastElement?.focus()
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault()
        firstElement?.focus()
      }
    }
  }, [])
  
  if (!isOpen && !isAnimating) return null
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className={`
          fixed inset-0 z-[9998] transition-opacity duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
        onClick={onClose}
      />
      
      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Account menu"
        onKeyDown={handleKeyDown}
        onTransitionEnd={() => {
          if (!isOpen) setIsAnimating(false)
        }}
        className={`
          fixed z-[9999] w-[400px] max-w-[calc(100vw-32px)]
          right-4 top-[72px]
          rounded-2xl overflow-hidden
          transition-all duration-300 ease-out
          ${isOpen 
            ? 'opacity-100 translate-y-0 scale-100' 
            : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'
          }
        `}
        style={{
          background: isCinematic 
            ? 'linear-gradient(135deg, rgba(26, 26, 28, 0.95) 0%, rgba(15, 15, 17, 0.98) 100%)'
            : isDark 
              ? 'linear-gradient(135deg, rgba(26, 27, 31, 0.98) 0%, rgba(15, 15, 17, 0.99) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(247, 248, 250, 0.99) 100%)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          boxShadow: isCinematic
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            : isDark
              ? '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08)'
              : '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`
            absolute top-4 right-4 p-1.5 rounded-full
            transition-colors duration-200
            ${isDark 
              ? 'text-gray-400 hover:text-white hover:bg-white/10' 
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }
          `}
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
        
        {/* Identity Section */}
        <div className={`px-6 pt-6 pb-5 ${isDark ? 'border-b border-white/10' : 'border-b border-gray-200'}`}>
          <div className="flex items-start gap-4">
            {/* Large Avatar */}
            <div className="relative group">
              <Avatar className={`h-20 w-20 ring-4 ${isDark ? 'ring-white/10' : 'ring-gray-100'}`}>
                <AvatarImage src={user?.avatar} />
                <AvatarFallback 
                  className={`text-xl font-semibold ${isDark ? 'bg-[#FF4F4F] text-white' : 'bg-[#E53935] text-white'}`}
                >
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              {/* Edit overlay */}
              <button
                onClick={() => handleNavigate('/settings/profile')}
                className={`
                  absolute inset-0 flex items-center justify-center rounded-full
                  opacity-0 group-hover:opacity-100 transition-opacity duration-200
                  ${isDark ? 'bg-black/50' : 'bg-black/30'}
                `}
                aria-label="Edit profile photo"
              >
                <Pencil className="h-5 w-5 text-white" />
              </button>
            </div>
            
            {/* User Info */}
            <div className="flex-1 min-w-0 pt-1">
              <h2 className={`text-lg font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {getDisplayName()}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge 
                  variant="secondary"
                  className={`
                    text-xs font-medium px-2 py-0.5
                    ${isDark 
                      ? 'bg-[#FF4F4F]/20 text-[#FF6B6B] border-[#FF4F4F]/30' 
                      : 'bg-[#E53935]/10 text-[#E53935] border-[#E53935]/20'
                    }
                  `}
                >
                  <Shield className="h-3 w-3 mr-1" />
                  {getUserRole()}
                </Badge>
              </div>
              <p className={`text-sm mt-1.5 truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {user?.email || 'user@example.com'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Main Actions */}
        <div className={`px-3 py-3 ${isDark ? 'border-b border-white/10' : 'border-b border-gray-200'}`}>
          <MenuButton
            icon={Building2}
            label="School Profile"
            onClick={() => handleNavigate('/settings/school')}
            isDark={isDark}
          />
          <MenuButton
            icon={Users}
            label="Staff & Permissions"
            onClick={() => handleNavigate('/staff')}
            isDark={isDark}
          />
          <MenuButton
            icon={CreditCard}
            label="Billing & Subscription"
            onClick={() => handleNavigate('/billing')}
            isDark={isDark}
          />
          <MenuButton
            icon={Puzzle}
            label="Integrations"
            onClick={() => handleNavigate('/settings/integrations')}
            isDark={isDark}
          />
        </div>
        
        {/* System Controls */}
        <div className={`px-3 py-3 ${isDark ? 'border-b border-white/10' : 'border-b border-gray-200'}`}>
          {/* Theme Selector */}
          <div className={`px-3 py-3 rounded-xl ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                  {theme === 'light' ? (
                    <Sun className={`h-4 w-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
                  ) : theme === 'dark' ? (
                    <Moon className={`h-4 w-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
                  ) : (
                    <Sparkles className={`h-4 w-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
                  )}
                </div>
                <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  Theme
                </span>
              </div>
            </div>
            
            {/* Theme Toggle Buttons */}
            <div 
              className={`
                flex items-center gap-1 p-1 rounded-xl
                ${isDark ? 'bg-white/5' : 'bg-gray-100'}
              `}
            >
              {themeOptions.map((t) => {
                const isActive = theme === t.id
                const Icon = t.icon
                
                return (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`
                      flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg
                      text-xs font-medium transition-all duration-200
                      ${isActive 
                        ? isDark
                          ? 'bg-[#FF4F4F] text-white shadow-lg'
                          : 'bg-[#E53935] text-white shadow-lg'
                        : isDark
                          ? 'text-gray-400 hover:text-white hover:bg-white/10'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                      }
                    `}
                    style={{
                      boxShadow: isActive ? '0 4px 12px rgba(229, 57, 53, 0.3)' : 'none'
                    }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{t.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
          
          {/* Credits Display */}
          <MenuButton
            icon={Zap}
            label="Credits"
            onClick={() => handleNavigate('/billing/credits')}
            isDark={isDark}
            badge={
              <span className={`
                text-sm font-semibold tabular-nums
                ${isDark ? 'text-amber-400' : 'text-amber-600'}
              `}>
                {creditBalance?.balance?.toLocaleString() ?? '0'}
              </span>
            }
          />
          
          {/* Notifications */}
          <MenuButton
            icon={Bell}
            label="Notifications"
            onClick={() => handleNavigate('/settings/notifications')}
            isDark={isDark}
            badge={
              <span className={`
                flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-xs font-medium
                ${isDark ? 'bg-[#FF4F4F] text-white' : 'bg-[#E53935] text-white'}
              `}>
                3
              </span>
            }
          />
        </div>
        
        {/* Footer */}
        <div className="px-3 py-3">
          <MenuButton
            icon={HelpCircle}
            label="Help & Support"
            onClick={() => handleNavigate('/help')}
            isDark={isDark}
          />
          
          {/* Sign Out Button */}
          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center gap-3 px-3 py-3 rounded-xl
              transition-all duration-200
              ${isDark 
                ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300' 
                : 'text-red-600 hover:bg-red-50 hover:text-red-700'
              }
            `}
          >
            <div className={`p-2 rounded-lg ${isDark ? 'bg-red-500/10' : 'bg-red-50'}`}>
              <LogOut className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </div>
    </>
  )
}

// Menu Button Component
interface MenuButtonProps {
  icon: typeof Building2
  label: string
  onClick: () => void
  isDark: boolean
  badge?: React.ReactNode
}

function MenuButton({ icon: Icon, label, onClick, isDark, badge }: MenuButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-3 rounded-xl
        transition-all duration-200
        ${isDark 
          ? 'text-gray-200 hover:bg-white/5 hover:text-white' 
          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
        }
      `}
    >
      <div className={`p-2 rounded-lg ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
        <Icon className={`h-4 w-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
      </div>
      <span className="flex-1 text-left text-sm font-medium">{label}</span>
      {badge || (
        <ChevronRight className={`h-4 w-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
      )}
    </button>
  )
}

export default AccountCommandPanel

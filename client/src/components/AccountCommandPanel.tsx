import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useTheme, Theme } from '@/contexts/ThemeContext'
import { useAuth } from '@/hooks/useAuth'
import { trpc } from '@/lib/trpc'
import { BrandLogo } from '@/components/BrandLogo'
import { getUserAvatarUrl, getUserInitials as getInitials } from '@/lib/avatarHelper'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import {
  User,
  Settings,
  BarChart3,
  CreditCard,
  Calendar,
  Mail,
  Database,
  Puzzle,
  HelpCircle,
  ExternalLink,
  X,
  ChevronRight,
  Sun,
  Moon,
  Sparkles,
  Zap,
  Shield,
  Bell,
  Building2,
  Users,
  LogOut,
  Cloud,
  Loader2,
  Camera,
  Trash2,
} from 'lucide-react'
interface AccountCommandPanelProps {
  isOpen: boolean
  onClose: () => void
  anchorRef: React.RefObject<HTMLElement>
}

type SectionId = 'account' | 'settings' | 'usage' | 'billing' | 'scheduled' | 'mail' | 'data' | 'cloud' | 'connectors' | 'integrations'

interface NavItem {
  id: SectionId
  label: string
  icon: React.ComponentType<any>
}

const navItems: NavItem[] = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'usage', label: 'Usage', icon: BarChart3 },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'scheduled', label: 'Scheduled tasks', icon: Calendar },
  { id: 'mail', label: 'Mail Manus', icon: Mail },
  { id: 'data', label: 'Data controls', icon: Database },
  { id: 'cloud', label: 'Cloud browser', icon: Cloud },
  { id: 'connectors', label: 'Connectors', icon: Puzzle },
  { id: 'integrations', label: 'Integrations', icon: Zap },
]

const AccountCommandPanel = ({ isOpen, onClose, anchorRef }: AccountCommandPanelProps) => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const panelRef = useRef<HTMLDivElement>(null)
  const [activeSection, setActiveSection] = useState<SectionId>('account')
  const [isAnimating, setIsAnimating] = useState(false)
  const { toast } = useToast()

  // Handle keyboard escape
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
  
  // Animation control + scroll prevention
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true)
      // Prevent background scrolling when modal is open
      document.body.style.overflow = 'hidden'
    } else {
      // Restore scrolling when modal closes
      document.body.style.overflow = ''
    }
    
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])
  
  // Handle logout
  const handleLogout = async () => {
    onClose()
    await logout()
    navigate('/owner')
  }

  const handleNavigate = (path: string) => {
    navigate(path)
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  const themeOptions: Array<{ id: Theme; label: string; icon: React.ComponentType<any> }> = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'cinematic', label: 'Cinematic', icon: Sparkles },
  ]

  const renderContent = () => {
    switch (activeSection) {
      case 'usage':
        return (
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">Usage</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>

            {/* Usage Content */}
            <div className="space-y-6">
              {/* Manus Pro Card */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-500/10 dark:to-blue-500/10 border border-purple-200 dark:border-purple-500/20">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Manus Pro</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Renewal date: Feb 13, 2026</p>
                  </div>
                  <button className="px-4 py-2 rounded-lg bg-white dark:bg-zinc-800 text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors">
                    Manage
                  </button>
                </div>
              </div>

              {/* Credits Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-5 h-5 text-amber-500" />
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Credits</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">Free credits</p>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">43,356</p>
                  </div>
                  <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">Monthly credits</p>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">43,067 / 110,000</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">Daily refresh credits</p>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">0</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2">Refresh to 200 at 23:00 every day</p>
                </div>
              </div>

              {/* Website Usage & Billing */}
              <button className="w-full p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left flex items-center justify-between">
                <span className="font-medium text-zinc-900 dark:text-zinc-100">Website usage & billing</span>
                <ChevronRight className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
          </div>
        )
      
      case 'account':
        return (
          <div className="h-full overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">Account</h2>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>
            
            {/* Profile Section */}
            <div className="space-y-6">
              {/* User Profile Card */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-500/10 dark:to-cyan-500/10 border border-blue-200 dark:border-blue-500/20">
                <div className="flex items-start gap-4 mb-6">
                  <Avatar className="w-16 h-16 border-2 border-white dark:border-zinc-800 shadow-lg">
                    <AvatarImage src={getUserAvatarUrl(user)} alt={user?.name} />
                    <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-lg">{user?.name}</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">{user?.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Active</span>
                    </div>
                  </div>
                </div>

                {/* Edit Profile Button */}
                <button className="w-full px-4 py-2 rounded-lg bg-white dark:bg-zinc-800 text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors">
                  Edit Profile
                </button>
              </div>

              {/* Theme Selection */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">Theme</label>
                <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-200 dark:bg-zinc-700">
                  {themeOptions.map((t) => {
                    const isActive = theme === t.id
                    const Icon = t.icon
                    
                    return (
                      <button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className={`
                          flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg
                          text-xs font-medium transition-all duration-200
                          ${isActive 
                            ? 'bg-white dark:bg-zinc-600 text-zinc-800 dark:text-zinc-100 shadow-sm'
                            : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                          }
                        `}
                      >
                        <Icon className="w-4 h-4" />
                        {t.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        )
      
      case 'settings':
        return (
          <div className="h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">Settings</h2>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={() => handleNavigate('/settings')}
                className="w-full p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left flex items-center justify-between group"
              >
                <span className="font-medium text-zinc-900 dark:text-zinc-100">Manage Settings</span>
                <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors" />
              </button>
            </div>
          </div>
        )
      
      case 'billing':
        return (
          <div className="h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">Billing</h2>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-500/10 dark:to-green-500/10 border border-emerald-200 dark:border-emerald-500/20">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Billing Portal</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">Manage your subscription and payment methods</p>
                <button className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors">
                  Open Billing Portal
                </button>
              </div>
            </div>
          </div>
        )
      
      default:
        return (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center mb-4">
              <Settings className="w-8 h-8 text-zinc-400" />
            </div>
            <h3 className="text-lg font-medium text-zinc-700 dark:text-zinc-300 mb-2">Coming Soon</h3>
            <p className="text-sm text-zinc-500 max-w-[200px]">This section is under development and will be available soon.</p>
          </div>
        )
    }
  }
  
  return createPortal(
    <>
      {/* Fog/Blur Overlay Background */}
      <div 
        className={`
          fixed inset-0 z-40 transition-all duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        style={{ 
          position: 'fixed',
          inset: '0',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        onKeyDown={handleKeyDown}
        onTransitionEnd={() => {
          if (!isOpen) setIsAnimating(false)
        }}
        className={`
          fixed z-50 
          top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          rounded-3xl overflow-hidden
          transition-all duration-300 ease-out
          ${isOpen 
            ? 'opacity-100 scale-100' 
            : 'opacity-0 scale-95 pointer-events-none'
          }
        `}
        style={{
          position: 'fixed',
          width: '94vw',
          height: '90vh',
          maxWidth: 'none',
          maxHeight: 'none',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 999998,
          pointerEvents: isOpen ? 'auto' : 'none',
          background: 'var(--modal-bg, #ffffff)',
          border: '1px solid var(--modal-border, rgba(255, 255, 255, 0.1))',
          boxShadow: `
            0 25px 50px -12px rgba(0, 0, 0, 0.6),
            0 0 0 1px rgba(255, 255, 255, 0.05),
            0 0 40px rgba(0, 0, 0, 0.3)
          `,
          borderRadius: '24px',
        }}
      >
        <div className="flex h-full bg-white dark:bg-zinc-900">
          {/* Left Sidebar */}
          <div className="w-[300px] h-full flex flex-col border-r border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 flex-shrink-0">
            {/* Logo/Brand - Using official DojoFlow branding */}
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-700">
              <BrandLogo size="md" />
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">Account Settings</p>
            </div>
            
            {/* Navigation */}
            <nav className="flex-1 py-3 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = activeSection === item.id
                
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`
                      w-full flex items-center gap-3 px-6 py-3 text-left transition-all h-12
                      ${isActive 
                        ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-r-2 border-red-600 dark:border-red-400' 
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700/50'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                )
              })}
            </nav>
            
            {/* Footer Links */}
            <div className="p-3 border-t border-zinc-200 dark:border-zinc-700">
              <button 
                onClick={() => handleNavigate('/help')}
                className="w-full flex items-center gap-3 px-3 py-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                <span className="text-sm">Get help</span>
                <ExternalLink className="w-3 h-3 ml-auto" />
              </button>
            </div>
          </div>
          
          {/* Right Content Panel */}
          <div className="flex-1 overflow-y-auto bg-white dark:bg-zinc-900">
            <div className="p-8">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
      

    </>,
    document.body
  )
}

export default AccountCommandPanel

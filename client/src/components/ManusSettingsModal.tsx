import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useTheme, Theme } from '@/contexts/ThemeContext'
import { useAuth } from '@/hooks/useAuth'
import { trpc } from '@/lib/trpc'
import {
  User,
  Settings,
  BarChart3,
  CreditCard,
  Calendar,
  Mail,
  Database,
  Puzzle,
  ExternalLink,
  HelpCircle,
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
} from 'lucide-react'

interface ManusSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

type SectionId = 'account' | 'settings' | 'usage' | 'billing' | 'scheduled' | 'mail' | 'data' | 'connectors' | 'integrations'

interface NavItem {
  id: SectionId
  label: string
  icon: typeof User
}

const navItems: NavItem[] = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'usage', label: 'Usage', icon: BarChart3 },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'scheduled', label: 'Scheduled tasks', icon: Calendar },
  { id: 'mail', label: 'Mail Dojo', icon: Mail },
  { id: 'data', label: 'Data controls', icon: Database },
  { id: 'connectors', label: 'Connectors', icon: Puzzle },
  { id: 'integrations', label: 'Integrations', icon: Puzzle },
]

const themeOptions: { id: Theme; label: string; icon: typeof Sun }[] = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'cinematic', label: 'Cinema', icon: Sparkles },
]

export function ManusSettingsModal({ isOpen, onClose }: ManusSettingsModalProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const modalRef = useRef<HTMLDivElement>(null)
  const [activeSection, setActiveSection] = useState<SectionId>('usage')
  const [isAnimating, setIsAnimating] = useState(false)
  
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
    return 'School Owner'
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
        modalRef.current &&
        !modalRef.current.contains(e.target as Node)
      ) {
        onClose()
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])
  
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
  
  if (!isOpen && !isAnimating) return null

  // Sample usage data for the Usage section
  const usageData = [
    { details: 'DOJO FLOW', date: '2026-01-02 17:33', credits: -361002 },
    { details: 'Upgrade plan', date: '2026-01-02 11:50', credits: 85000 },
    { details: 'Understanding Uploaded Files and Their Contents', date: '2026-01-02 11:39', credits: -491 },
    { details: 'This task has been deleted', date: '2025-12-31 21:11', credits: -763 },
  ]

  const renderContent = () => {
    switch (activeSection) {
      case 'usage':
        return (
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Usage</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
            
            {/* Plan Info */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <h3 className="text-lg font-medium text-white">DojoFlow Pro</h3>
                  <p className="text-sm text-zinc-500">Renewal date: Feb 2, 2026</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 text-sm font-medium text-white bg-white/10 hover:bg-white/15 rounded-lg transition-colors">
                    Manage
                  </button>
                  <button className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                    Add credits
                  </button>
                </div>
              </div>
            </div>
            
            {/* Credits Stats */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-zinc-400" />
                  <span className="text-sm text-zinc-300">Credits</span>
                  <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-zinc-500">?</span>
                </div>
                <span className="text-lg font-semibold text-white tabular-nums">
                  {creditBalance?.balance?.toLocaleString() ?? '72,913'}
                </span>
              </div>
              
              <div className="pl-6 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Free credits</span>
                  <span className="text-zinc-300">74</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Monthly credits</span>
                  <span className="text-zinc-300">{creditBalance?.balance?.toLocaleString() ?? '72,839'} / 85,000</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-zinc-400" />
                  <span className="text-sm text-zinc-300">Daily refresh credits</span>
                  <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-zinc-500">?</span>
                </div>
                <span className="text-lg font-semibold text-white tabular-nums">115</span>
              </div>
              <p className="pl-6 text-xs text-zinc-600">Refresh to 300 at 23:00 every day</p>
            </div>
            
            {/* Website Usage & Billing */}
            <div className="flex-1">
              <button 
                onClick={() => handleNavigate('/billing/credits')}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-zinc-400" />
                  <span className="text-sm font-medium text-zinc-300">Website usage & billing</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
              </button>
              
              {/* Usage Table */}
              <div className="mt-4 rounded-xl border border-white/5 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Details</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Credits change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usageData.map((item, index) => (
                      <tr key={index} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 text-sm text-zinc-300 max-w-[200px] truncate">{item.details}</td>
                        <td className="px-4 py-3 text-sm text-zinc-500">{item.date}</td>
                        <td className={`px-4 py-3 text-sm text-right tabular-nums ${item.credits > 0 ? 'text-emerald-400' : 'text-zinc-400'}`}>
                          {item.credits > 0 ? '+' : ''}{item.credits.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              <div className="flex items-center justify-center gap-2 mt-4 text-sm">
                <button className="px-3 py-1 text-zinc-500 hover:text-zinc-300 transition-colors">&lt; Previous</button>
                <button className="px-2 py-1 text-white bg-white/10 rounded">1</button>
                <button className="px-2 py-1 text-zinc-500 hover:text-zinc-300 transition-colors">2</button>
                <button className="px-2 py-1 text-zinc-500 hover:text-zinc-300 transition-colors">3</button>
                <button className="px-2 py-1 text-zinc-500 hover:text-zinc-300 transition-colors">4</button>
                <span className="text-zinc-600">...</span>
                <button className="px-2 py-1 text-zinc-500 hover:text-zinc-300 transition-colors">21</button>
                <button className="px-2 py-1 text-zinc-500 hover:text-zinc-300 transition-colors">22</button>
                <button className="px-3 py-1 text-zinc-500 hover:text-zinc-300 transition-colors">Next &gt;</button>
              </div>
            </div>
          </div>
        )
      
      case 'account':
        return (
          <div className="h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Account</h2>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
            
            {/* Profile Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <Avatar className="h-16 w-16 rounded-xl">
                  <AvatarImage src={user?.avatar} className="rounded-xl" />
                  <AvatarFallback className="rounded-xl text-lg font-bold bg-gradient-to-br from-red-500 to-orange-600 text-white">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-white">{getDisplayName()}</h3>
                  <p className="text-sm text-zinc-500">{user?.email || 'owner@dojoflow.com'}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <Shield className="w-3 h-3 text-amber-400" />
                    <span className="text-xs font-medium text-amber-400">{getUserRole()}</span>
                  </div>
                </div>
                <button className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                  Edit
                </button>
              </div>
              
              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => handleNavigate('/settings/school')}
                  className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors text-left group"
                >
                  <Building2 className="w-5 h-5 text-amber-400 mb-2" />
                  <h4 className="text-sm font-medium text-zinc-300 group-hover:text-white">School Profile</h4>
                  <p className="text-xs text-zinc-600">Manage dojo details</p>
                </button>
                <button 
                  onClick={() => handleNavigate('/staff')}
                  className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors text-left group"
                >
                  <Users className="w-5 h-5 text-blue-400 mb-2" />
                  <h4 className="text-sm font-medium text-zinc-300 group-hover:text-white">Staff & Roles</h4>
                  <p className="text-xs text-zinc-600">Team management</p>
                </button>
              </div>
              
              {/* Theme Selector */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-white/[0.05] flex items-center justify-center">
                    {theme === 'light' ? (
                      <Sun className="w-4 h-4 text-amber-400" />
                    ) : theme === 'dark' ? (
                      <Moon className="w-4 h-4 text-indigo-400" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-purple-400" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-zinc-300">Theme</span>
                </div>
                
                <div className="flex items-center gap-1 p-1 rounded-xl bg-black/30">
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
                            ? 'bg-white/10 text-white shadow-lg'
                            : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]'
                          }
                        `}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{t.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
              
              {/* Sign Out */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-500/[0.08] hover:bg-red-500/[0.15] border border-red-500/20 hover:border-red-500/30 transition-all duration-200"
              >
                <LogOut className="w-4 h-4 text-red-400" />
                <span className="text-sm font-medium text-red-400">Sign Out</span>
              </button>
            </div>
          </div>
        )
      
      case 'settings':
        return (
          <div className="h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Settings</h2>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={() => handleNavigate('/settings/notifications')}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-sky-400" />
                  <span className="text-sm font-medium text-zinc-300">Notifications</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
              </button>
              
              <button 
                onClick={() => handleNavigate('/settings/integrations')}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Puzzle className="w-5 h-5 text-purple-400" />
                  <span className="text-sm font-medium text-zinc-300">Integrations</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
              </button>
              
              <button 
                onClick={() => handleNavigate('/security')}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-medium text-zinc-300">Security & Privacy</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
              </button>
            </div>
          </div>
        )
      
      case 'billing':
        return (
          <div className="h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Billing</h2>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-zinc-400">Current Plan</span>
                  <span className="px-2 py-0.5 text-xs font-medium text-emerald-400 bg-emerald-500/20 rounded-full">Active</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-1">DojoFlow Pro</h3>
                <p className="text-sm text-zinc-500">Next billing: Feb 2, 2026</p>
              </div>
              
              <button 
                onClick={() => handleNavigate('/billing')}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-zinc-400" />
                  <span className="text-sm font-medium text-zinc-300">Manage subscription</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
              </button>
              
              <button 
                onClick={() => handleNavigate('/billing/credits')}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-medium text-zinc-300">AI Credits</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-emerald-400 tabular-nums">
                    {creditBalance?.balance?.toLocaleString() ?? '72,913'}
                  </span>
                  <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                </div>
              </button>
            </div>
          </div>
        )
      
      default:
        return (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center mb-4">
              <Settings className="w-8 h-8 text-zinc-600" />
            </div>
            <h3 className="text-lg font-medium text-zinc-300 mb-2">Coming Soon</h3>
            <p className="text-sm text-zinc-600 max-w-[200px]">This section is under development and will be available soon.</p>
          </div>
        )
    }
  }
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className={`
          fixed inset-0 z-[9998] transition-all duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        style={{ 
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
        }}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        onTransitionEnd={() => {
          if (!isOpen) setIsAnimating(false)
        }}
        className={`
          fixed z-[9999] 
          top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-[800px] max-w-[calc(100vw-48px)] h-[600px] max-h-[calc(100vh-96px)]
          rounded-2xl overflow-hidden
          transition-all duration-300 ease-out
          ${isOpen 
            ? 'opacity-100 scale-100' 
            : 'opacity-0 scale-95 pointer-events-none'
          }
        `}
        style={{
          background: '#1a1a1d',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div className="flex h-full">
          {/* Left Sidebar */}
          <div 
            className="w-[220px] h-full flex flex-col border-r border-white/[0.06]"
            style={{ background: '#141416' }}
          >
            {/* Logo/Brand */}
            <div className="p-5 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-base font-semibold text-white">dojoflow</span>
              </div>
            </div>
            
            {/* Navigation */}
            <nav className="flex-1 py-2 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = activeSection === item.id
                
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`
                      w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors
                      ${isActive 
                        ? 'bg-white/[0.08] text-white' 
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                )
              })}
            </nav>
            
            {/* Footer Links */}
            <div className="p-3 border-t border-white/[0.06]">
              <button 
                onClick={() => handleNavigate('/help')}
                className="w-full flex items-center gap-3 px-3 py-2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                <span className="text-sm">Get help</span>
                <ExternalLink className="w-3 h-3 ml-auto" />
              </button>
            </div>
          </div>
          
          {/* Right Content Panel */}
          <div className="flex-1 p-6 overflow-y-auto">
            {renderContent()}
          </div>
        </div>
      </div>
    </>
  )
}

export default ManusSettingsModal

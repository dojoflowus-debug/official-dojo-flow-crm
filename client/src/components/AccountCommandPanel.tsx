import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  ChevronRight,
  X,
  Shield,
  Command,
} from 'lucide-react'

interface AccountCommandPanelProps {
  isOpen: boolean
  onClose: () => void
  anchorRef: React.RefObject<HTMLElement>
}

const themeOptions: { id: Theme; label: string; icon: typeof Sun }[] = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'cinematic', label: 'Cinema', icon: Sparkles },
]

export function AccountCommandPanel({ isOpen, onClose, anchorRef }: AccountCommandPanelProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const panelRef = useRef<HTMLDivElement>(null)
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

  const primaryActions = [
    {
      icon: Building2,
      label: 'School Profile',
      description: 'Manage dojo details',
      path: '/settings/school',
      gradient: 'from-amber-500 to-orange-600',
      glow: 'shadow-amber-500/20',
    },
    {
      icon: Users,
      label: 'Staff & Roles',
      description: 'Team management',
      path: '/staff',
      gradient: 'from-blue-500 to-cyan-500',
      glow: 'shadow-blue-500/20',
    },
    {
      icon: CreditCard,
      label: 'Billing',
      description: 'Plans & invoices',
      path: '/billing',
      gradient: 'from-emerald-500 to-green-500',
      glow: 'shadow-emerald-500/20',
    },
    {
      icon: Puzzle,
      label: 'Integrations',
      description: 'Connected services',
      path: '/settings/integrations',
      gradient: 'from-purple-500 to-pink-500',
      glow: 'shadow-purple-500/20',
    },
  ]
  
  return (
    <>
      {/* Cinematic Backdrop */}
      <div 
        className={`
          fixed inset-0 z-[9998] transition-all duration-500
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        style={{ 
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.85) 100%)',
          backdropFilter: 'blur(8px)',
        }}
        onClick={onClose}
      />
      
      {/* Command Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Account Command Panel"
        onKeyDown={handleKeyDown}
        onTransitionEnd={() => {
          if (!isOpen) setIsAnimating(false)
        }}
        className={`
          fixed z-[9999] w-[440px] max-w-[calc(100vw-32px)]
          top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          rounded-3xl overflow-hidden
          transition-all duration-500 ease-out
          ${isOpen 
            ? 'opacity-100 scale-100' 
            : 'opacity-0 scale-95 pointer-events-none'
          }
        `}
        style={{
          background: 'linear-gradient(165deg, rgba(24, 24, 27, 0.97) 0%, rgba(9, 9, 11, 0.99) 100%)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          boxShadow: `
            0 0 0 1px rgba(255, 255, 255, 0.08),
            0 0 80px -20px rgba(0, 0, 0, 0.8),
            0 0 60px -30px rgba(239, 68, 68, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.05)
          `,
        }}
      >
        {/* Glass texture overlays */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.04),transparent_60%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.3))] pointer-events-none" />
        
        {/* Subtle noise texture */}
        <div 
          className="absolute inset-0 opacity-[0.015] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-10 p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.12] transition-all duration-200 group"
          aria-label="Close panel"
        >
          <X className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
        </button>

        {/* Keyboard hint */}
        <div className="absolute top-5 left-5 flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/[0.03] border border-white/[0.06]">
          <Command className="w-3 h-3 text-zinc-600" />
          <span className="text-[10px] font-medium text-zinc-600 tracking-wide">ESC</span>
        </div>

        {/* Content */}
        <div className="relative pt-14 pb-2">
          
          {/* Profile Header */}
          <div className="px-6 pb-5">
            <div className="flex items-center gap-4">
              {/* Avatar with glow */}
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 blur-xl opacity-40" />
                <Avatar className="relative h-[72px] w-[72px] rounded-2xl ring-2 ring-white/10">
                  <AvatarImage src={user?.avatar} className="rounded-2xl" />
                  <AvatarFallback className="rounded-2xl text-xl font-bold bg-gradient-to-br from-red-500 to-orange-600 text-white">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                {/* Status indicator */}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-[3px] border-zinc-900 flex items-center justify-center">
                  <Sparkles className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
              
              {/* User Info */}
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-white truncate tracking-tight">
                  {getDisplayName()}
                </h2>
                <p className="text-sm text-zinc-500 truncate mt-0.5">
                  {user?.email || 'owner@dojoflow.com'}
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                    <Shield className="w-3 h-3 text-amber-400" />
                    <span className="text-xs font-medium text-amber-400">{getUserRole()}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Gradient divider */}
          <div className="mx-6 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* Primary Actions Grid */}
          <div className="px-4 py-4">
            <div className="grid grid-cols-2 gap-2.5">
              {primaryActions.map((action) => (
                <button
                  key={action.path}
                  onClick={() => handleNavigate(action.path)}
                  className="group relative p-4 rounded-2xl text-left transition-all duration-300 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] hover:border-white/[0.08] hover:-translate-y-0.5"
                >
                  {/* Hover glow */}
                  <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br ${action.gradient} blur-xl -z-10`} style={{ opacity: 0.1 }} />
                  
                  <div className="relative">
                    {/* Icon container */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-gradient-to-br ${action.gradient} shadow-lg ${action.glow}`}>
                      <action.icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">
                      {action.label}
                    </h3>
                    <p className="text-xs text-zinc-600 group-hover:text-zinc-500 transition-colors mt-0.5">
                      {action.description}
                    </p>
                  </div>
                  <ChevronRight className="absolute top-4 right-3 w-4 h-4 text-zinc-700 group-hover:text-zinc-500 group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>
          </div>

          {/* Gradient divider */}
          <div className="mx-6 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* System Controls */}
          <div className="px-4 py-3">
            <p className="px-2 text-[10px] font-semibold text-zinc-600 uppercase tracking-widest mb-2">System</p>
            
            {/* Theme Selector */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] mb-2">
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
              
              {/* Theme Toggle Pills */}
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

            {/* Credits */}
            <button
              onClick={() => handleNavigate('/billing/credits')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-200 group mb-2"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-sm font-medium text-zinc-300">AI Credits</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-emerald-400 tabular-nums">
                  {creditBalance?.balance?.toLocaleString() ?? '2,450'}
                </span>
                <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all" />
              </div>
            </button>

            {/* Notifications */}
            <button
              onClick={() => handleNavigate('/settings/notifications')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-500/20 to-blue-500/20 flex items-center justify-center relative">
                  <Bell className="w-4 h-4 text-sky-400" />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-zinc-900" />
                </div>
                <span className="text-sm font-medium text-zinc-300">Notifications</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-400">
                  3
                </span>
                <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all" />
              </div>
            </button>
          </div>

          {/* Gradient divider */}
          <div className="mx-6 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* Footer Actions */}
          <div className="px-4 py-4">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => handleNavigate('/help')}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] hover:border-white/[0.1] transition-all duration-200 group"
              >
                <HelpCircle className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                <span className="text-sm font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors">Help Center</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-500/[0.08] hover:bg-red-500/[0.15] border border-red-500/20 hover:border-red-500/30 transition-all duration-200 group"
              >
                <LogOut className="w-4 h-4 text-red-400 group-hover:text-red-300 transition-colors" />
                <span className="text-sm font-medium text-red-400 group-hover:text-red-300 transition-colors">Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom accent gradient */}
        <div className="h-1 bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 opacity-70" />
      </div>
    </>
  )
}

export default AccountCommandPanel

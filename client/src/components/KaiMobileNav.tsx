/**
 * KaiMobileNav
 * Mobile-only hamburger drawer for the /kai route.
 * Replaces the bottom navigation bar on phones (≤768px).
 * Desktop and tablet layouts are completely unaffected.
 *
 * Opens via a custom DOM event: window.dispatchEvent(new CustomEvent('kai-mobile-nav-open'))
 * This allows CommandHeader to trigger it without prop drilling.
 */
import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { X } from 'lucide-react'
import {
  Users,
  UserPlus,
  Sparkles,
  Calendar,
  UserCog,
  BookOpen,
  BarChart3,
  Package,
  Grid3x3,
  Wand2,
  Star,
  Wallet,
  LogOut,
  User,
} from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/_core/hooks/useAuth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { trpc } from '@/lib/trpc'
import { BadgeCount } from '@/components/ui/badge-count'
import { cn } from '@/lib/utils'
import { useModal } from '@/contexts/ModalContext'

const NAV_ITEMS = [
  { id: 'kai-command', name: 'Kai AI', href: '/kai', icon: Sparkles, accent: true },
  { id: 'students', name: 'Students', href: '/students', icon: Users },
  { id: 'leads', name: 'Leads', href: '/leads', icon: UserPlus },
  { id: 'classes', name: 'Classes', href: '/classes', icon: Calendar },
  { id: 'merchandise', name: 'Merchandise', href: '/merchandise', icon: Package },
  { id: 'payments-dashboard', name: 'Payments', href: '/payments/dashboard', icon: Wallet },
  { id: 'reports', name: 'Reports', href: '/reports', icon: BarChart3 },
  { id: 'staff', name: 'Staff', href: '/staff', icon: UserCog },
  { id: 'programs', name: 'Programs', href: '/programs', icon: BookOpen },
  { id: 'kiosk-studio', name: 'Kiosk', href: '/kiosk-studio', icon: Grid3x3 },
  { id: 'kai-creative', name: 'Creative Studio', href: '/kai/creative', icon: Wand2 },
  { id: 'kai-reviews', name: 'Reviews', href: '/kai/reviews', icon: Star },
]

export function KaiMobileNav() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const { theme } = useTheme()
  const { user, logout } = useAuth()
  const { openSettings } = useModal()
  const isDark = theme === 'dark' || theme === 'cinematic'
  const isCinematic = theme === 'cinematic'

  // Listen for the open event dispatched by CommandHeader
  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener('kai-mobile-nav-open', handler)
    return () => window.removeEventListener('kai-mobile-nav-open', handler)
  }, [])

  // Close drawer on route change
  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  const { data: badgeCounts } = trpc.navBadges.getActionableCounts.useQuery(
    {},
    { refetchInterval: 90000, refetchOnWindowFocus: true }
  )

  const isActive = (href: string) =>
    location.pathname === href || location.pathname.startsWith(href + '/')

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const bgColor = isCinematic
    ? 'rgba(8,6,12,0.97)'
    : isDark
    ? 'oklch(0.09 0.008 25)'
    : '#ffffff'

  const borderColor = isDark || isCinematic
    ? 'rgba(255,255,255,0.08)'
    : 'rgba(0,0,0,0.08)'

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm md:hidden"
        style={{
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.25s ease',
        }}
        onClick={() => setOpen(false)}
      />

      {/* Slide-in drawer */}
      <div
        className="fixed top-0 left-0 bottom-0 z-[9999] w-[280px] flex flex-col md:hidden"
        style={{
          background: bgColor,
          borderRight: `1px solid ${borderColor}`,
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: open ? '4px 0 32px rgba(0,0,0,0.3)' : 'none',
        }}
      >
        {/* Drawer header */}
        <div
          className="flex items-center justify-between px-5 flex-shrink-0"
          style={{
            height: 56,
            borderBottom: `1px solid ${borderColor}`,
          }}
        >
          <div className="flex items-center gap-2">
            <img
              src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/IjqOFvsLMkrXFIaF.png"
              alt="Kai"
              className="h-7 w-7 object-contain"
            />
            <span
              className="font-bold text-base tracking-tight"
              style={{ color: isDark || isCinematic ? '#ffffff' : '#1a1a1a' }}
            >
              DojoFlow
            </span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="flex items-center justify-center w-9 h-9 rounded-full"
            style={{
              background: isDark || isCinematic ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              color: isDark || isCinematic ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)',
            }}
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav items */}
        <div className="flex-1 overflow-y-auto py-3">
          {NAV_ITEMS.map(item => {
            const active = isActive(item.href)
            const Icon = item.icon
            const badge = badgeCounts?.[item.id as keyof typeof badgeCounts]
            return (
              <Link
                key={item.id}
                to={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 mx-3 px-3 py-3 rounded-xl transition-all duration-150 relative',
                  active
                    ? isDark || isCinematic
                      ? 'bg-white/10 text-white'
                      : 'bg-[#E53935]/8 text-[#E53935]'
                    : isDark || isCinematic
                    ? 'text-white/65 hover:text-white hover:bg-white/6'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                <div className="relative flex-shrink-0">
                  <div
                    className={cn(
                      'flex items-center justify-center w-9 h-9 rounded-xl',
                      active
                        ? item.accent
                          ? 'bg-[#E53935]/15'
                          : isDark || isCinematic
                          ? 'bg-white/12'
                          : 'bg-[#E53935]/10'
                        : isDark || isCinematic
                        ? 'bg-white/5'
                        : 'bg-gray-100'
                    )}
                  >
                    {item.accent ? (
                      <img
                        src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/IjqOFvsLMkrXFIaF.png"
                        alt="Kai"
                        className="h-5 w-5 object-contain"
                      />
                    ) : (
                      <Icon
                        className="h-4 w-4"
                        style={{
                          color: active
                            ? '#E53935'
                            : isDark || isCinematic
                            ? 'rgba(255,255,255,0.7)'
                            : 'rgba(0,0,0,0.55)',
                        }}
                      />
                    )}
                  </div>
                  {badge ? (
                    <BadgeCount count={badge as number} position="top-right" />
                  ) : null}
                </div>
                <span className="font-medium text-sm">{item.name}</span>
                {active && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#E53935]" />
                )}
              </Link>
            )
          })}
        </div>

        {/* User footer */}
        <div
          className="flex-shrink-0 px-4 py-4"
          style={{ borderTop: `1px solid ${borderColor}` }}
        >
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-9 w-9 flex-shrink-0">
              <AvatarImage src={user?.photoUrl} />
              <AvatarFallback
                className="text-xs"
                style={{
                  background: isDark || isCinematic ? 'rgba(255,255,255,0.1)' : '#f0f0f0',
                  color: isDark || isCinematic ? '#fff' : '#333',
                }}
              >
                {user?.name ? getInitials(user.name) : '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-semibold truncate"
                style={{ color: isDark || isCinematic ? '#fff' : '#1a1a1a' }}
              >
                {user?.name || 'User'}
              </p>
              <p
                className="text-xs truncate"
                style={{ color: isDark || isCinematic ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)' }}
              >
                {user?.email || ''}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setOpen(false); openSettings({ initialTab: 'profile' }) }}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{
                background: isDark || isCinematic ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                color: isDark || isCinematic ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
              }}
            >
              <User className="h-3.5 w-3.5" />
              Profile
            </button>
            <button
              onClick={() => { setOpen(false); logout() }}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{
                background: 'rgba(229,57,53,0.1)',
                color: '#E53935',
              }}
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

import { useState, useEffect } from 'react'
import SettingsPortalModal from '@/components/modals/SettingsPortalModal'
import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { useAuth } from '@/_core/hooks/useAuth'
import { useEnvironment } from '@/contexts/EnvironmentContext'
import { useModal } from '@/contexts/ModalContext'
import { trpc } from '@/lib/trpc'
import { Coins, Sun, Moon, Clapperboard, LogOut, Settings, User, Palette, Lock, Menu } from 'lucide-react'
import { BrandLogo } from '@/components/BrandLogo'
import { KaiVersionChip } from '@/components/KaiVersionChip'

interface CommandStats {
  active: number
  trial: number
  at_risk: number
  needs_attention: number
  pending_followups: number
  estimated_value: number
}

interface CommandHeaderProps {
  title: string
  stats?: CommandStats
  isDarkMode: boolean
}

export default function CommandHeader({ title, isDarkMode }: CommandHeaderProps) {
  const { theme, setTheme } = useTheme()
  const { user, logout, loading: authLoading } = useAuth()
  const { openModal: openEnvironmentModal } = useEnvironment()
  const { openSettings } = useModal()
  const location = useLocation()

  const isCinematic = theme === 'cinematic'
  const isKaiRoute = location.pathname === '/kai'

  // Detect mobile (≤768px) for Kai route special layout
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
  )
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Open the mobile nav drawer via custom event
  const openMobileNav = () => {
    window.dispatchEvent(new CustomEvent('kai-mobile-nav-open'))
  }

  // Get real internal credit balance from DB
  const { data: creditBalance } = trpc.credits.getBalance.useQuery(
    undefined,
    { enabled: !!user?.activeOrgId, refetchInterval: 30_000 }
  )
  const displayCredits = creditBalance?.creditsRemaining ?? 0
  const creditWarning = creditBalance?.warningLevel ?? 'none'
  const creditColor = creditWarning === 'blocking' || creditWarning === 'critical'
    ? 'text-red-400'
    : creditWarning === 'warning'
    ? 'text-orange-400'
    : ''

  const handleOpenProfile = () => openSettings({ initialTab: 'profile' })
  const handleOpenSettings = () => openSettings({ initialTab: 'account' })

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  // ─── Mobile Kai Header ────────────────────────────────────────────────────
  // On mobile (/kai route only): hamburger left | KAI centered | avatar right
  if (isKaiRoute && isMobile) {
    return (
      <header
        className={cn(
          'h-14 border-b flex items-center flex-shrink-0',
          isCinematic
            ? 'bg-black/70 backdrop-blur-xl border-white/8 text-white'
            : isDarkMode
            ? 'bg-[oklch(0.10_0.006_25)] border-[oklch(0.22_0.006_25)]'
            : 'bg-white/95 backdrop-blur-sm border-[oklch(0.91_0.003_60)]'
        )}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10000,
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          padding: '0 16px',
          boxShadow: isDarkMode || isCinematic
            ? '0 1px 0 oklch(1 1 1 / 0.04), 0 2px 8px oklch(0 0 0 / 0.3)'
            : '0 1px 0 oklch(0 0 0 / 0.04), 0 2px 8px oklch(0 0 0 / 0.04)',
        }}
      >
        {/* Left: Hamburger */}
        <div className="flex items-center">
          <button
            onClick={openMobileNav}
            className="flex items-center justify-center w-10 h-10 rounded-xl"
            style={{
              background: isDarkMode || isCinematic ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
              color: isDarkMode || isCinematic ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.6)',
              minWidth: 40,
              minHeight: 40,
            }}
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {/* Center: KAI chip */}
        <div className="flex items-center justify-center">
          <KaiVersionChip />
        </div>

        {/* Right: Avatar only */}
        <div className="flex items-center justify-end gap-2">
          {/* Credits (compact) */}
          <button
            onClick={() => openSettings({ initialTab: 'account' })}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold',
              creditColor || (isCinematic ? 'text-white/70' : isDarkMode ? 'text-white/60' : 'text-gray-600')
            )}
          >
            <Coins className="h-3.5 w-3.5" />
            <span>{displayCredits.toLocaleString()}</span>
          </button>

          {/* Avatar dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="p-0 h-auto">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.photoUrl} />
                  <AvatarFallback className={cn('text-xs', isDarkMode ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-600')}>
                    {authLoading ? '' : (user?.name ? getInitials(user.name) : '')}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onSelect={handleOpenProfile}><User className="h-4 w-4 mr-2" />Profile</DropdownMenuItem>
              <DropdownMenuItem onSelect={handleOpenSettings}><Settings className="h-4 w-4 mr-2" />Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => logout()} className="text-red-500">
                <LogOut className="h-4 w-4 mr-2" />Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <SettingsPortalModal />
      </header>
    )
  }

  // ─── Default Header (desktop + tablet + non-kai routes) ───────────────────
  return (
    <header
      className={cn(
        'h-14 border-b flex items-center px-5 flex-shrink-0',
        isCinematic
          ? 'bg-black/70 backdrop-blur-xl border-white/8 text-white'
          : isDarkMode
          ? 'bg-[oklch(0.10_0.006_25)] border-[oklch(0.22_0.006_25)]'
          : 'bg-white/95 backdrop-blur-sm border-[oklch(0.91_0.003_60)]'
      )}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10000,
        pointerEvents: 'auto',
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        boxShadow: isDarkMode || isCinematic
          ? '0 1px 0 oklch(1 1 1 / 0.04), 0 2px 8px oklch(0 0 0 / 0.3)'
          : '0 1px 0 oklch(0 0 0 / 0.04), 0 2px 8px oklch(0 0 0 / 0.04)',
        gap: '1rem',
      }}
    >
      {/* Left section: Logo and breadcrumb */}
      <div className="flex items-center gap-4 min-w-0">
        <Link
          to="/kai"
          className="flex items-center gap-2 overflow-visible flex-shrink-0"
          style={{ display: 'flex', alignItems: 'center', height: '36px' }}
        >
          <BrandLogo size="md" />
        </Link>

        <div className={cn('h-6 w-px flex-shrink-0', isDarkMode ? 'bg-white/10' : 'bg-gray-200')} />

        <nav className="flex items-center gap-1 min-w-0">
          <Link
            to="/kai"
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer flex-shrink-0',
              isCinematic
                ? 'text-white hover:text-white hover:bg-white/10'
                : isDarkMode
                ? 'text-white/60 hover:text-white hover:bg-white/5'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            )}
          >
            Dashboard
          </Link>
          <span className={cn('text-sm font-medium truncate', isCinematic ? 'text-white' : isDarkMode ? 'text-white' : 'text-gray-900')}></span>
        </nav>
      </div>

      {/* Center section: Kai Version Chip */}
      <div className="flex items-center justify-center">
        <KaiVersionChip />
      </div>

      {/* Right section: Controls and user menu */}
      <div className="flex items-center gap-2 justify-end">
        <Button
          variant="ghost"
          size="sm"
          className={cn('gap-2', creditColor || (isCinematic ? 'text-white hover:text-white' : isDarkMode ? 'text-white/60 hover:text-white' : 'text-gray-600 hover:text-gray-900'))}
          title="View credit balance"
          onClick={() => openSettings({ initialTab: 'account' })}
        >
          <Coins className="h-4 w-4" />
          <span className="font-semibold">{displayCredits.toLocaleString()}</span>
          <span className="text-xs opacity-70">Credits</span>
        </Button>

        <div className={cn(
          'flex items-center rounded-full border p-0.5 gap-0.5',
          isCinematic ? 'bg-white/8 border-white/12'
          : isDarkMode ? 'bg-white/5 border-white/8'
          : 'bg-gray-100/80 border-gray-200/80'
        )}>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-6 px-2.5 rounded-full text-xs font-medium transition-all duration-150',
              theme === 'light'
                ? 'bg-white shadow-sm text-gray-900 hover:bg-white'
                : isDarkMode ? 'text-white/50 hover:text-white hover:bg-white/8' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/60'
            )}
            onClick={() => setTheme('light')}
          >
            <Sun className="h-3 w-3 mr-1" />Light
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-6 px-2.5 rounded-full text-xs font-medium transition-all duration-150',
              theme === 'dark'
                ? isCinematic ? 'bg-white/20 text-white' : 'bg-white/12 text-white shadow-sm'
                : isDarkMode ? 'text-white/50 hover:text-white hover:bg-white/8' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/60'
            )}
            onClick={() => setTheme('dark')}
          >
            <Moon className="h-3 w-3 mr-1" />Night
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-6 px-2.5 rounded-full text-xs font-medium transition-all duration-150',
              theme === 'cinematic'
                ? 'bg-white/20 text-white shadow-sm'
                : isDarkMode ? 'text-white/50 hover:text-white hover:bg-white/8' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/60'
            )}
            onClick={() => setTheme('cinematic')}
          >
            <Clapperboard className="h-3 w-3 mr-1" />Cinema
          </Button>
        </div>

        {isCinematic && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-white hover:text-white hover:bg-white/10"
            onClick={() => openEnvironmentModal()}
            title="Change cinematic background"
          >
            <Palette className="h-4 w-4" />Backdrop
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={user?.photoUrl} />
                <AvatarFallback className={cn('text-xs', isDarkMode ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-600')}>
                  {authLoading ? '' : (user?.name ? getInitials(user.name) : '')}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onSelect={handleOpenProfile} onMouseDown={(e) => { e.preventDefault(); handleOpenProfile() }}><User className="h-4 w-4 mr-2" />Profile</DropdownMenuItem>
            <DropdownMenuItem onSelect={handleOpenSettings} onMouseDown={(e) => { e.preventDefault(); handleOpenSettings() }}><Settings className="h-4 w-4 mr-2" />Settings</DropdownMenuItem>
            {user?.role === 'staff' && (
              <DropdownMenuItem asChild>
                <Link to="/staff/change-password" className="flex items-center w-full cursor-pointer">
                  <Lock className="h-4 w-4 mr-2" />Change Password
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => logout()} className="text-red-500">
              <LogOut className="h-4 w-4 mr-2" />Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <SettingsPortalModal />
      </div>
    </header>
  )
}

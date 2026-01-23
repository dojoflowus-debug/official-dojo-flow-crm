import { useState } from 'react'
import SettingsModal from '@/components/SettingsModal'
import { Link } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { useAuth } from '@/_core/hooks/useAuth'
import { useEnvironment } from '@/contexts/EnvironmentContext'
import { Coins, Sun, Moon, Clapperboard, LogOut, Settings, User, Palette } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CinematicEnvironmentSelector } from '@/components/CinematicEnvironmentSelector'
import { BrandLogo } from '@/components/BrandLogo'
import { KaiVersionChip } from '@/components/KaiVersionChip'
import { useLocation } from 'wouter'

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
  stats: CommandStats
  isDarkMode: boolean
}

export default function CommandHeader({ title, isDarkMode }: CommandHeaderProps) {
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()
  const { setEnvironment } = useEnvironment()
  const [, navigate] = useLocation()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isEnvironmentSelectorOpen, setIsEnvironmentSelectorOpen] = useState(false)
  const isCinematic = theme === 'cinematic'
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  // Logo variant based on theme - using BrandLogo component

  return (
    <header 
      className={cn(
        "h-14 border-b flex items-center px-4 flex-shrink-0",
        isCinematic 
          ? "bg-black/70 backdrop-blur-md border-white/10 text-white" 
          : isDarkMode 
            ? "bg-[#0a0a0b] border-white/10" 
            : "bg-white border-gray-200"
      )}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10000,
        pointerEvents: 'auto',
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        gap: '1rem',
      }}
    >
      {/* Left section: Logo and breadcrumb */}
      <div className="flex items-center gap-4 min-w-0">
        {/* Logo - Using official DojoFlow branding */}
        <Link 
          to="/kai" 
          className="flex items-center gap-2 overflow-visible flex-shrink-0"
          style={{ display: 'flex', alignItems: 'center', height: '36px' }}
        >
          <BrandLogo size="md" />
        </Link>
        
        <div className={cn("h-6 w-px flex-shrink-0", isDarkMode ? "bg-white/10" : "bg-gray-200")} />
        
        {/* Navigation with proper react-router-dom Link */}
        <nav className="flex items-center gap-1 min-w-0">
          <Link 
            to="/kai" 
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer flex-shrink-0",
              isCinematic
                ? "text-white hover:text-white hover:bg-white/10"
                : isDarkMode 
                ? "text-white/60 hover:text-white hover:bg-white/5" 
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            )}
          >
            Dashboard
          </Link>
          <span className={cn("text-sm font-medium truncate", isCinematic ? "text-white" : isDarkMode ? "text-white" : "text-gray-900")}>
            / {title}
          </span>
        </nav>
      </div>
      
      {/* Center section: Kai Version Chip */}
      <div className="flex items-center justify-center">
        <KaiVersionChip onClick={() => navigate('/kai')} />
      </div>
      
      {/* Right section: Controls and user menu */}
      <div className="flex items-center gap-2 justify-end">
        <Link to="/billing/credits">
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn("gap-2", isCinematic ? "text-white hover:text-white" : isDarkMode ? "text-white/60 hover:text-white" : "text-gray-600 hover:text-gray-900")} 
            title="View credit dashboard"
          >
            <Coins className="h-4 w-4" />Credits
          </Button>
        </Link>
        
        <div className={cn("flex items-center rounded-lg border p-0.5", isCinematic ? "bg-white/10 border-white/20" : isDarkMode ? "bg-white/5 border-white/10" : "bg-gray-100 border-gray-200")}>
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn("h-7 px-2 text-white", theme === 'light' && (isCinematic ? "bg-white/20" : "bg-white shadow-sm text-gray-900"))} 
            onClick={() => setTheme('light')}
          >
            <Sun className="h-3.5 w-3.5 mr-1" />Light
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn("h-7 px-2 text-white", theme === 'dark' && (isCinematic ? "bg-white/20" : isDarkMode ? "bg-white/10 text-white" : "bg-gray-200"))} 
            onClick={() => setTheme('dark')}
          >
            <Moon className="h-3.5 w-3.5 mr-1" />Dark
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn("h-7 px-2 text-white", theme === 'cinematic' && (isCinematic ? "bg-white/20" : isDarkMode ? "bg-white/10 text-white" : "bg-gray-200"))} 
            onClick={() => setTheme('cinematic')}
          >
            <Clapperboard className="h-3.5 w-3.5 mr-1" />Cinematic
          </Button>
        </div>
        
        {/* Cinematic Environment Selector Button */}
        {isCinematic && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-white hover:text-white hover:bg-white/10"
            onClick={() => setIsEnvironmentSelectorOpen(true)}
            title="Change cinematic background"
          >
            <Palette className="h-4 w-4" />Backdrop
          </Button>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={user?.avatarUrl} />
                <AvatarFallback className={cn("text-xs", isDarkMode ? "bg-white/10 text-white" : "bg-gray-100 text-gray-600")}>
                  {user?.name ? getInitials(user.name) : 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem><User className="h-4 w-4 mr-2" />Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}><Settings className="h-4 w-4 mr-2" />Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()} className="text-red-500">
              <LogOut className="h-4 w-4 mr-2" />Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <SettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)}
          isDarkMode={isDarkMode}
        />
        
        {/* Cinematic Environment Selector Dialog */}
        <Dialog open={isEnvironmentSelectorOpen} onOpenChange={setIsEnvironmentSelectorOpen}>
          <DialogContent className="max-w-md bg-black/90 border-white/20">
            <DialogHeader>
              <DialogTitle className="text-white">Choose Cinematic Backdrop</DialogTitle>
            </DialogHeader>
            <CinematicEnvironmentSelector
              onEnvironmentSelect={(envId) => {
                setEnvironment(envId as any);
                setIsEnvironmentSelectorOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </header>
  )
}

import { cn } from '@/lib/utils'
import { Link } from 'wouter'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { useAuth } from '@/_core/hooks/useAuth'
import { Sparkles, Coins, Sun, Moon, Clapperboard, LogOut, Settings, User } from 'lucide-react'

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
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <header className={cn("h-14 border-b flex items-center justify-between px-4", isDarkMode ? "bg-[#0a0a0b] border-white/10" : "bg-white border-gray-200")}>
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2">
          <img src="/dojoflow-icon.svg" alt="DojoFlow" className="h-8 w-8" />
          <span className={cn("font-bold text-lg hidden sm:inline", isDarkMode ? "text-white" : "text-gray-900")}>DojoFlow</span>
        </Link>
        <div className={cn("h-6 w-px", isDarkMode ? "bg-white/10" : "bg-gray-200")} />
        <nav className="flex items-center gap-1">
          <Link href="/" className={cn("px-3 py-1.5 rounded-lg text-sm transition-colors", isDarkMode ? "text-white/60 hover:text-white hover:bg-white/5" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100")}>Dashboard</Link>
          <span className={cn("text-sm", isDarkMode ? "text-white" : "text-gray-900")}>{title}</span>
        </nav>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className={cn("gap-2", isDarkMode ? "bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-400 hover:from-red-500/30 hover:to-orange-500/30" : "bg-gradient-to-r from-red-50 to-orange-50 text-red-600 hover:from-red-100 hover:to-orange-100")}>
          <Sparkles className="h-4 w-4" />Ask Kai
        </Button>
        <Button variant="ghost" size="sm" className={cn("gap-2", isDarkMode ? "text-white/60 hover:text-white" : "text-gray-600 hover:text-gray-900")} title="View credit dashboard">
          <Coins className="h-4 w-4" />Credits: 0
        </Button>
        <div className={cn("flex items-center rounded-lg border p-0.5", isDarkMode ? "bg-white/5 border-white/10" : "bg-gray-100 border-gray-200")}>
          <Button variant="ghost" size="sm" className={cn("h-7 px-2", theme === 'light' && "bg-white shadow-sm text-gray-900")} onClick={() => setTheme('light')}><Sun className="h-3.5 w-3.5 mr-1" />Light</Button>
          <Button variant="ghost" size="sm" className={cn("h-7 px-2", theme === 'dark' && (isDarkMode ? "bg-white/10 text-white" : "bg-gray-200"))} onClick={() => setTheme('dark')}><Moon className="h-3.5 w-3.5 mr-1" />Dark</Button>
          <Button variant="ghost" size="sm" className={cn("h-7 px-2", theme === 'cinematic' && (isDarkMode ? "bg-white/10 text-white" : "bg-gray-200"))} onClick={() => setTheme('cinematic')}><Clapperboard className="h-3.5 w-3.5 mr-1" />Cinematic</Button>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={user?.avatarUrl} />
                <AvatarFallback className={cn("text-xs", isDarkMode ? "bg-white/10 text-white" : "bg-gray-100 text-gray-600")}>{user?.name ? getInitials(user.name) : 'U'}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem><User className="h-4 w-4 mr-2" />Profile</DropdownMenuItem>
            <DropdownMenuItem><Settings className="h-4 w-4 mr-2" />Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()} className="text-red-500"><LogOut className="h-4 w-4 mr-2" />Sign Out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

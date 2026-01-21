import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Moon, Sun, Clapperboard, User, Settings, LogOut, Coins } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { BrandLogo } from "./BrandLogo";
import SettingsModal from "./SettingsModal";
import { useState } from "react";
import { KaiVersionChip } from "./KaiVersionChip";

interface CommandHeaderProps {
  title: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function CommandHeader({ title }: CommandHeaderProps) {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const isDarkMode = theme === 'dark';
  const isCinematic = theme === 'cinematic';
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <header 
      className={cn(
        "sticky top-0 z-50 w-full border-b backdrop-blur-sm",
        isCinematic 
          ? "bg-black/40 border-white/10" 
          : isDarkMode 
          ? "bg-black/40 border-white/5" 
          : "bg-white/80 border-gray-200"
      )}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10000,
        pointerEvents: 'auto',
      }}
    >
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left section: Logo + Breadcrumb */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <Link 
            to="/kai" 
            className="flex items-center gap-2"
          >
            <BrandLogo size="md" />
          </Link>
          
          <div className={cn("h-6 w-px", isDarkMode ? "bg-white/10" : "bg-gray-200")} />
          
          <nav className="flex items-center gap-1">
            <Link 
              to="/kai" 
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer",
                isCinematic
                  ? "text-white hover:text-white hover:bg-white/10"
                  : isDarkMode 
                  ? "text-white/60 hover:text-white hover:bg-white/5" 
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              Dashboard
            </Link>
            <span className={cn("text-sm font-medium", isCinematic ? "text-white" : isDarkMode ? "text-white" : "text-gray-900")}>
              / {title}
            </span>
          </nav>
        </div>
        
        {/* Center section: Kai Version Chip */}
        <div className="flex-shrink-0">
          <KaiVersionChip isDarkMode={isDarkMode} isCinematic={isCinematic} />
        </div>
        
        {/* Right section: Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
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
        </div>
      </div>
    </header>
  )
}

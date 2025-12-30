import { ReactNode } from "react";
import { Bell, Search, User } from "lucide-react";
import { MasterDashboardSidebar } from "./MasterDashboardSidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MasterDashboardLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  alertBanner?: {
    message: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  };
}

export function MasterDashboardLayout({
  children,
  title,
  subtitle,
  alertBanner,
}: MasterDashboardLayoutProps) {
  // Mock user data - replace with actual auth
  const user = {
    name: "Vincent Holmes",
    email: "vincent@dojoflow.com",
    role: "Administrator",
    avatar: undefined,
  };

  return (
    <div className="master-dashboard min-h-screen">
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-radial from-red-500/5 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-radial from-purple-500/5 via-transparent to-transparent" />
        
        {/* Subtle particles */}
        <div className="md-particle" style={{ top: "10%", left: "70%", animationDelay: "0s" }} />
        <div className="md-particle" style={{ top: "30%", left: "85%", animationDelay: "2s" }} />
        <div className="md-particle" style={{ top: "60%", left: "75%", animationDelay: "4s" }} />
        <div className="md-particle" style={{ top: "80%", left: "90%", animationDelay: "1s" }} />
      </div>

      {/* Sidebar */}
      <MasterDashboardSidebar user={user} onLogout={() => console.log("Logout")} />

      {/* Main Content */}
      <main className="ml-64 min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-30 backdrop-blur-xl bg-[#111113]/80 border-b border-white/5">
          <div className="flex items-center justify-between px-8 py-4">
            <div>
              {title && (
                <h1 className="text-2xl font-semibold text-white">{title}</h1>
              )}
              {subtitle && (
                <p className="text-sm text-white/50 mt-1">{subtitle}</p>
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  placeholder="Search schools, users..."
                  className="w-64 pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-red-500/50 focus:ring-red-500/20"
                />
              </div>

              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative text-white/70 hover:text-white hover:bg-white/5"
                  >
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-80 bg-[#1a1a1d] border-white/10"
                >
                  <div className="p-4 border-b border-white/10">
                    <h3 className="font-medium text-white">Notifications</h3>
                  </div>
                  <div className="p-2">
                    <DropdownMenuItem className="p-3 text-white/70 hover:text-white hover:bg-white/5 rounded-lg">
                      <div>
                        <p className="text-sm">New school signup: Apex Karate</p>
                        <p className="text-xs text-white/40 mt-1">2 minutes ago</p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="p-3 text-white/70 hover:text-white hover:bg-white/5 rounded-lg">
                      <div>
                        <p className="text-sm">Payment failed: Harmony Yoga</p>
                        <p className="text-xs text-white/40 mt-1">1 hour ago</p>
                      </div>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Profile */}
              <Avatar className="w-9 h-9 border-2 border-white/10 cursor-pointer">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="bg-gradient-to-br from-red-500 to-red-600 text-white text-sm">
                  VH
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          {/* Alert Banner */}
          {alertBanner && (
            <div className="px-8 pb-4">
              <div className="md-alert-banner">
                <span className="text-white/90">{alertBanner.message}</span>
                {alertBanner.action && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={alertBanner.action.onClick}
                    className="text-white hover:bg-white/10"
                  >
                    {alertBanner.action.label}
                    <span className="ml-2">→</span>
                  </Button>
                )}
              </div>
            </div>
          )}
        </header>

        {/* Page Content */}
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}

export default MasterDashboardLayout;

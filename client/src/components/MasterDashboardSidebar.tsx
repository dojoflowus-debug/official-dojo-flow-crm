import { cn } from '@/lib/utils'
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  UserPlus,
  BarChart3,
  Sparkles,
  CreditCard,
  HeadphonesIcon,
  Settings,
  LogOut,
  ChevronDown,
  Bell,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  badge?: number;
  children?: { label: string; href: string }[];
}

interface MasterDashboardSidebarProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role: string;
  };
  onLogout?: () => void;
}

export function MasterDashboardSidebar({ user, onLogout }: MasterDashboardSidebarProps) {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>(["Schools"]);

  // Get user initials for avatar
  const getUserInitials = () => {
    const displayName = user?.name || user?.email?.split('@')[0];
    if (!displayName) return 'AD';
    const names = displayName.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return displayName.substring(0, 2).toUpperCase();
  };

  // Get display name with fallback
  const getDisplayName = () => {
    if (user?.name) return user.name;
    if (user?.email) return user.email.split('@')[0];
    return 'Admin User';
  };

  // Fetch actual school count from the API
  const { data: schoolsData } = trpc.masterDashboard.getSchools.useQuery(
    { status: "all", limit: 1, offset: 0 },
    { staleTime: 30000 } // Cache for 30 seconds
  );

  // Build nav items with dynamic school count
  const navItems: NavItem[] = useMemo(() => [
    { label: "Dashboard", icon: LayoutDashboard, href: "/master" },
    {
      label: "Schools",
      icon: Building2,
      href: "/master/schools",
      badge: schoolsData?.total || 0,
      children: [
        { label: "All Schools", href: "/master/schools" },
        { label: "Onboarding", href: "/master/schools/onboarding" },
        { label: "At Risk", href: "/master/schools/at-risk" },
      ],
    },
    { label: "Analytics", icon: BarChart3, href: "/master/analytics" },
    { label: "AI Usage", icon: Sparkles, href: "/master/ai-usage" },
    { label: "Billing", icon: CreditCard, href: "/master/billing" },
    { label: "Support", icon: HeadphonesIcon, href: "/master/support" },
    { label: "System Settings", icon: Settings, href: "/master/settings" },
  ], [schoolsData?.total]);

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  const isActive = (href: string) => {
    if (href === "/master") {
      return location.pathname === "/master";
    }
    return location.pathname.startsWith(href);
  };

  return (
    <aside className="md-sidebar w-64 h-screen flex flex-col fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <Link to="/master" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/20">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-6 h-6 text-white"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="text-xl font-semibold text-white">DojoFlow</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <div key={item.label}>
            {item.children ? (
              <>
                <button
                  onClick={() => toggleExpanded(item.label)}
                  className={cn(
                    "md-sidebar-item w-full relative",
                    isActive(item.href) && "active"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-red-500/20 text-red-400 rounded-full">
                      {item.badge}
                    </span>
                  )}
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 transition-transform",
                      expandedItems.includes(item.label) && "rotate-180"
                    )}
                  />
                </button>
                {expandedItems.includes(item.label) && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        to={child.href}
                        className={cn(
                          "block px-4 py-2 text-sm rounded-lg transition-colors",
                          location.pathname === child.href
                            ? "text-white bg-white/5"
                            : "text-white/60 hover:text-white hover:bg-white/5"
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Link
                to={item.href}
                className={cn(
                  "md-sidebar-item relative",
                  isActive(item.href) && "active"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-red-500/20 text-red-400 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-white/5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
              <Avatar className="w-10 h-10 border-2 border-white/10">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-gradient-to-br from-red-500 to-red-600 text-white text-sm">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-white">
                  {getDisplayName()}
                </p>
                <p className="text-xs text-white/50">
                  {user?.role || "Administrator"}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-white/50" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 bg-[#1a1a1d] border-white/10"
          >
            <DropdownMenuItem className="text-white/70 hover:text-white hover:bg-white/5">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </DropdownMenuItem>
            <DropdownMenuItem className="text-white/70 hover:text-white hover:bg-white/5">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              onClick={onLogout}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}

export default MasterDashboardSidebar;

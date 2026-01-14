/**
 * Platform Admin Layout
 * Internal CRM layout for DojoFlow administrators
 */

import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PlatformAdminLayoutProps {
  children: ReactNode;
}

export default function PlatformAdminLayout({ children }: PlatformAdminLayoutProps) {
  const [location, navigate] = useLocation();

  const logoutMutation = trpc.platformAuth.logout.useMutation({
    onSuccess: () => {
      toast.success("Logged out successfully");
      navigate("/admin");
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navItems = [
    { path: "/admin/organizations", label: "Organizations", icon: "🏢" },
    { path: "/admin/stats", label: "Platform Stats", icon: "📊" },
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Top Navigation */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <span className="text-white font-semibold text-lg">DojoFlow Platform</span>
              </div>

              <nav className="flex items-center gap-1">
                {navItems.map((item) => (
                  <Link key={item.path} href={item.path}>
                    <a
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        location === item.path
                          ? "bg-slate-700 text-white"
                          : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                      }`}
                    >
                      <span className="mr-2">{item.icon}</span>
                      {item.label}
                    </a>
                  </Link>
                ))}
              </nav>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-slate-300 hover:text-white hover:bg-slate-700"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}

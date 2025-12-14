import { ReactNode, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requireSetup?: boolean;
}

/**
 * Protected Route Component
 * 
 * Guards routes that require authentication
 * 
 * @param requireSetup - If true, redirects to setup wizard if setup is not completed
 *                      If false, allows access regardless of setup status
 * 
 * Flow:
 * 1. Check if user is authenticated
 *    - Not authenticated → Redirect to /login
 * 
 * 2. Check setup completion (if requireSetup is true)
 *    - Setup incomplete → Redirect to /setup-wizard
 *    - Setup complete → Allow access
 */
export default function ProtectedRoute({ children, requireSetup = true }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading) {
      // Not authenticated - redirect to login
      if (!isAuthenticated) {
        navigate("/login", { 
          replace: true,
          state: { from: location.pathname }
        });
        return;
      }

      // Authenticated but setup not completed
      if (requireSetup && user && !user.setupCompleted) {
        // Don't redirect if already on setup wizard
        if (location.pathname !== "/setup-wizard") {
          navigate("/setup-wizard", { replace: true });
        }
        return;
      }

      // Authenticated and setup completed, but on setup wizard
      if (user && user.setupCompleted && location.pathname === "/setup-wizard") {
        navigate("/kai-command", { replace: true });
      }
    }
  }, [isLoading, isAuthenticated, user, requireSetup, navigate, location]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Setup required but not completed
  if (requireSetup && user && !user.setupCompleted && location.pathname !== "/setup-wizard") {
    return null;
  }

  // All checks passed - render children
  return <>{children}</>;
}

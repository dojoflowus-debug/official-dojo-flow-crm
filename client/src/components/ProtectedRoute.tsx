import { ReactNode, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface ProtectedRouteProps {
  children: ReactNode;
  requireSetup?: boolean;
}

/**
 * Protected Route Component
 *
 * Guards routes that require authentication
 *
 * Flow:
 * 1. Not authenticated → Redirect to /owner (login)
 * 2. Authenticated but email not verified (password accounts only) → Redirect to /verify-email
 * 3. Authenticated but setup not completed → Redirect to /setup-wizard
 * 4. All checks passed → Render children
 */
export default function ProtectedRoute({ children, requireSetup = true }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // auth.me includes emailVerified and authProvider fields
  const { data: meData, isLoading: meLoading } = trpc.auth.me.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (isLoading || (isAuthenticated && meLoading)) return;

    // Not authenticated — redirect to login
    if (!isAuthenticated) {
      navigate("/owner", {
        replace: true,
        state: { from: location.pathname },
      });
      return;
    }

    // Email not verified — only enforce for password/local accounts (not Google OAuth)
    if (meData) {
      const authProvider = (meData as any).authProvider ?? "password";
      const emailVerified = (meData as any).emailVerified ?? false;
      if (!emailVerified && authProvider !== "google" && location.pathname !== "/verify-email") {
        navigate("/verify-email", { replace: true });
        return;
      }
    }

    // Authenticated but setup not completed
    if (requireSetup && user && !user.setupCompleted) {
      if (location.pathname !== "/setup-wizard") {
        navigate("/setup-wizard", { replace: true });
      }
      return;
    }

    // Authenticated and setup completed, but still on setup wizard
    if (user && user.setupCompleted && location.pathname === "/setup-wizard") {
      navigate("/kai", { replace: true });
    }
  }, [isLoading, meLoading, isAuthenticated, user, meData, requireSetup, navigate, location]);

  // Show loading spinner while checking auth or email verification status
  if (isLoading || (isAuthenticated && meLoading)) {
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

  // Email not verified (password accounts)
  if (meData) {
    const authProvider = (meData as any).authProvider ?? "password";
    const emailVerified = (meData as any).emailVerified ?? false;
    if (!emailVerified && authProvider !== "google" && location.pathname !== "/verify-email") {
      return null;
    }
  }

  // Setup required but not completed
  if (requireSetup && user && !user.setupCompleted && location.pathname !== "/setup-wizard") {
    return null;
  }

  // All checks passed — render children
  return <>{children}</>;
}

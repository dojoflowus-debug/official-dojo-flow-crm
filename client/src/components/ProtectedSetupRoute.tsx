import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { trpc } from "@/lib/trpc";

interface ProtectedSetupRouteProps {
  children: ReactNode;
}

/**
 * ProtectedSetupRoute Component
 * 
 * Guards dashboard routes to ensure setup is completed or explicitly skipped.
 * 
 * Routing logic:
 * - If onboardingStatus = not_started or in_progress → redirect to /kai-setup
 * - If onboardingStatus = completed → allow access
 * - If onboardingStatus = skipped → allow access (show reminder banner)
 */
export function ProtectedSetupRoute({ children }: ProtectedSetupRouteProps) {
  const { data: authData, isLoading: authLoading } = trpc.auth.me.useQuery();
  
  // Get setup status if organization ID is available
  const { data: setupStatus, isLoading: setupLoading } = trpc.setupMode.getStatus.useQuery(
    { organizationId: authData?.organizationId || 0 },
    { enabled: !!authData?.organizationId }
  );

  // Still loading
  if (authLoading || setupLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // Not authenticated
  if (!authData) {
    return <Navigate to="/owner" replace />;
  }

  // No organization (shouldn't happen, but handle it)
  if (!authData.organizationId) {
    return <Navigate to="/owner" replace />;
  }

  // Setup not started or in progress - redirect to setup wizard
  if (setupStatus?.status === "not_started" || setupStatus?.status === "in_progress") {
    return <Navigate to="/kai-setup" replace />;
  }

  // Setup completed or skipped - allow access
  return <>{children}</>;
}

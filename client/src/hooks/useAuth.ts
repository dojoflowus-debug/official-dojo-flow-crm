import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";

export interface AuthUser {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  role: "user" | "admin";
  setupCompleted: boolean;
}

/**
 * Authentication hook
 * 
 * Manages user authentication state and setup completion status
 * Returns:
 * - user: Current authenticated user with setup status
 * - isLoading: Loading state during auth check
 * - isAuthenticated: Whether user is logged in
 * - logout: Function to log out user
 */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get current user from API
  const { data: currentUser, isLoading: userLoading } = trpc.auth.getCurrentUser.useQuery(
    undefined,
    {
      retry: false,
      refetchOnWindowFocus: false,
    }
  );

  // Get setup completion status from dojo settings
  const { data: dojoSettings, isLoading: settingsLoading } = trpc.settings.getDojoSettings.useQuery(
    undefined,
    {
      enabled: !!currentUser,
      retry: false,
      refetchOnWindowFocus: false,
    }
  );

  useEffect(() => {
    if (!userLoading && !settingsLoading) {
      if (currentUser) {
        setUser({
          id: currentUser.id,
          openId: currentUser.openId,
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role,
          setupCompleted: dojoSettings?.setupCompleted === 1,
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    }
  }, [currentUser, dojoSettings, userLoading, settingsLoading]);

  const logout = async () => {
    try {
      // Clear session cookie by calling logout endpoint
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      
      // Clear local state
      setUser(null);
      
      // Redirect to login
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
  };
}

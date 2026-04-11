import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";

export interface AuthUser {
  id: number;
  openId: string;
  name: string | null;
  preferredName?: string | null;
  email: string | null;
  role: "user" | "admin" | "owner" | "staff";
  setupCompleted: boolean;
  photoUrl?: string | null;
  photoUrlSmall?: string | null;
  globalRole?: "platform_admin" | "support" | "none";
  activeOrgId?: number | null;
  phone?: string | null;
  bio?: string | null;
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
  const { data: dojoSettings, isLoading: settingsLoading } = trpc.kai.settings.getDojoSettings.useQuery(
    undefined,
    {
      enabled: !!currentUser,
      retry: false,
      refetchOnWindowFocus: false,
    }
  );

  useEffect(() => {
    // If user query is still loading, don't proceed
    if (userLoading) {
      return;
    }
    
    // If user is authenticated, wait for settings to load
    if (currentUser && settingsLoading) {
      return;
    }
    
    // User is authenticated and settings loaded, or user is not authenticated
    if (currentUser) {
      // Persist org ID and user ID in localStorage so tRPC headers can send them
      // IMPORTANT: Only update localStorage if getCurrentUser returned a non-demo user,
      // OR if localStorage is empty. Never overwrite a real user ID with demo user ID (1).
      const storedUserId = localStorage.getItem('dojo_user_id');
      const storedOrgId = localStorage.getItem('dojo_active_org_id');
      const isDemoUser = currentUser.id === 1; // demo@dojoflow.com is always ID 1
      
      if (!isDemoUser || !storedUserId) {
        // Safe to update: either this is a real user, or nothing is stored yet
        if (currentUser.activeOrgId) {
          localStorage.setItem('dojo_active_org_id', String(currentUser.activeOrgId));
        }
        if (currentUser.id) {
          localStorage.setItem('dojo_user_id', String(currentUser.id));
        }
        setUser({
          id: currentUser.id,
          openId: currentUser.openId,
          name: currentUser.name,
          preferredName: (currentUser as any).preferredName ?? null,
          email: currentUser.email,
          role: currentUser.role,
          setupCompleted: dojoSettings?.setupCompleted === 1,
          photoUrl: currentUser.photoUrl,
          photoUrlSmall: currentUser.photoUrlSmall,
          activeOrgId: currentUser.activeOrgId,
          globalRole: currentUser.globalRole,
          phone: currentUser.phone,
          bio: currentUser.bio,
        });
      } else {
        // getCurrentUser returned demo user but localStorage has a real user — keep the stored user state
        // Only update setupCompleted from dojoSettings
        console.log('[useAuth] Keeping stored user', storedUserId, 'org', storedOrgId, '— ignoring demo user from getCurrentUser');
        setUser(prev => prev ? { ...prev, setupCompleted: dojoSettings?.setupCompleted === 1 } : prev);
      }
    } else {
      setUser(null);
    }
    setIsLoading(false);
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
      
      // Redirect to owner login page
      window.location.href = "/owner";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const utils = trpc.useUtils();
  const refresh = () => {
    // Invalidate getCurrentUser query to force a re-fetch from the server
    // This is called after KAI updates the user's preferred name
    utils.auth.getCurrentUser.invalidate();
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
    refresh,
  };
}

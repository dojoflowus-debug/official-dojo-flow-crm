import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
        };
      };
    };
  }
}

interface GoogleSignInButtonProps {
  userType?: "student" | "owner" | "staff";
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
  redirectTo?: string;
}

/**
 * Google Sign-In Button Component
 * 
 * Handles Google OAuth authentication flow:
 * 1. Loads Google Identity Services library
 * 2. Handles sign-in and token generation
 * 3. Sends token to backend for verification
 * 4. Creates session and redirects
 */
export function GoogleSignInButton({
  userType = "student",
  onSuccess,
  onError,
  className = "",
  redirectTo,
}: GoogleSignInButtonProps) {
  const navigate = useNavigate();
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const verifyGoogleToken = trpc.googleAuth.verifyGoogleToken.useMutation({
    onSuccess: (data) => {
      setIsLoading(false);

      if (data.success) {
        toast.success(
          data.isNewUser
            ? "Account created successfully!"
            : "Welcome back!"
        );

        // Redirect new users to onboarding, existing users to dashboard
        let redirectUrl: string;
        if (data.isNewUser) {
          redirectUrl = "/onboarding";
        } else {
          redirectUrl = redirectTo || getDefaultRedirect(userType);
        }
        setTimeout(() => {
          navigate(redirectUrl);
        }, 500);

        onSuccess?.();
      }
    },
    onError: (error) => {
      setIsLoading(false);
      
      // Extract detailed error message
      let message = "Google sign-in failed. Please try again.";
      
      if (error.data?.code === "FORBIDDEN") {
        message = error.message || message;
      } else if (error.message) {
        // Include the backend error message for debugging
        message = `Google sign-in failed: ${error.message}`;
      }
      
      console.error("[GoogleSignIn] Error:", {
        code: error.data?.code,
        message: error.message,
        fullError: error,
      });

      toast.error(message);
      onError?.(message);
    },
  });

  // Load Google Identity Services library
  useEffect(() => {
    // Suppress GSI popup errors that occur on dev/preview environments
    const originalError = console.error;
    const gsiErrorFilter = (...args: any[]) => {
      const message = args[0];
      if (typeof message === 'string' && message.includes('[GSI_LOGGER]')) {
        return; // Silently suppress GSI popup errors
      }
      originalError.apply(console, args);
    };
    console.error = gsiErrorFilter as any;

    const loadGoogleScript = () => {
      if (window.google) {
        initializeGoogle();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogle;
      script.onerror = () => {
        console.error("Failed to load Google Identity Services");
        onError?.("Failed to load Google Sign-In");
      };
      document.head.appendChild(script);
    };

    loadGoogleScript();

    return () => {
      console.error = originalError; // Restore original console.error
    };
  }, []);

  const initializeGoogle = () => {
    if (!window.google || isInitialized) return;

    try {
      // Check if client ID is configured
      if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
        console.warn("Google Client ID not configured");
        setIsInitialized(true);
        return;
      }

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleGoogleSignIn,
        auto_select: false,
      });

      // Render the button if ref is available
      if (googleButtonRef.current) {
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          type: "standard",
          size: "large",
          text: "signin_with",
          theme: "outline",
          logo_alignment: "center",
          width: "100%",
        });
      }

      setIsInitialized(true);
    } catch (error) {
      // Silently fail on dev environments where Google OAuth isn't configured
      if (error instanceof Error && error.message.includes('popup')) {
        console.warn("Google Sign-In popup blocked (likely dev environment)");
      } else {
        console.error("Failed to initialize Google Sign-In:", error);
        onError?.("Failed to initialize Google Sign-In");
      }
      setIsInitialized(true);
    }
  };

  const handleGoogleSignIn = async (response: any) => {
    if (!response.credential) {
      const errorMsg = "No credential received from Google";
      console.error("[GoogleSignIn]", errorMsg);
      toast.error(errorMsg);
      return;
    }

    setIsLoading(true);
    console.log("[GoogleSignIn] Sending token to backend for userType:", userType);

    try {
      // Send token to backend for verification
      verifyGoogleToken.mutate({
        idToken: response.credential,
        userType,
      });
    } catch (error) {
      setIsLoading(false);
      console.error("[GoogleSignIn] Error during sign-in:", error);
      toast.error("An error occurred during sign-in");
      onError?.("An error occurred during sign-in");
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {isLoading && (
        <div className="flex items-center justify-center py-3 bg-blue-50 rounded-lg border border-blue-200">
          <Loader2 className="w-4 h-4 animate-spin mr-2 text-blue-600" />
          <span className="text-sm text-blue-600">Signing in with Google...</span>
        </div>
      )}

      {!isLoading && (
        <div
          ref={googleButtonRef}
          className="flex justify-center"
          style={{ display: isInitialized ? "block" : "none" }}
        />
      )}

      {!isInitialized && !isLoading && (
        <div className="text-center text-sm text-gray-500">
          Loading Google Sign-In...
        </div>
      )}
    </div>
  );
}

/**
 * Get default redirect URL based on user type
 */
function getDefaultRedirect(userType: string): string {
  switch (userType) {
    case "owner":
      return "/owner/command-center";
    case "staff":
      return "/staff/dashboard";
    case "student":
    default:
      return "/student/dashboard";
  }
}

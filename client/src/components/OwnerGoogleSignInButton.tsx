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

interface OwnerGoogleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

/**
 * Owner/Admin Google Sign-In Button Component
 * 
 * Enforces owner-level authorization:
 * - Only users with owner/admin roles can sign in
 * - Prevents unauthorized access
 * - Shows clear error messages for non-authorized users
 * - Handles account linking for existing owner accounts
 */
export function OwnerGoogleSignInButton({
  onSuccess,
  onError,
  className = "",
}: OwnerGoogleSignInButtonProps) {
  const navigate = useNavigate();
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const verifyGoogleToken = trpc.googleAuth.verifyGoogleToken.useMutation({
    onSuccess: (data) => {
      setIsLoading(false);

      if (data.success) {
        toast.success("Welcome back, Owner!");

        // Redirect to command center
        setTimeout(() => {
          navigate("/kai");
        }, 500);

        onSuccess?.();
      }
    },
    onError: (error) => {
      setIsLoading(false);

      // Handle authorization errors specifically
      if (error.data?.code === "FORBIDDEN") {
        // Staff members should use the staff login page instead
        toast.info("Staff members: please use the Staff Login page.", {
          duration: 5000,
          action: {
            label: "Go to Staff Login",
            onClick: () => navigate("/staff/login"),
          },
        });
        onError?.(error.message);
      } else {
        const message = "Google sign-in failed. Please try again.";
        toast.error(message);
        onError?.(message);
      }
    },
  });

  // Load Google Identity Services library
  useEffect(() => {
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
  }, []);

  const initializeGoogle = () => {
    if (!window.google || isInitialized) return;

    try {
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
      console.error("Failed to initialize Google Sign-In:", error);
      onError?.("Failed to initialize Google Sign-In");
    }
  };

  const handleGoogleSignIn = async (response: any) => {
    if (!response.credential) {
      toast.error("No credential received from Google");
      return;
    }

    setIsLoading(true);

    try {
      // Send token to backend for verification with owner authorization
      verifyGoogleToken.mutate({
        idToken: response.credential,
        userType: "owner", // Enforce owner-level authorization
      });
    } catch (error) {
      setIsLoading(false);
      console.error("Error during Google sign-in:", error);
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

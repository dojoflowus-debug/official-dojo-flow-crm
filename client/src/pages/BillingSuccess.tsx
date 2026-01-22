import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export function BillingSuccess() {
  const location = useLocation();
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { user } = useAuth();

  // Extract session_id from URL query params
  const searchParams = new URLSearchParams(location.search);
  const sessionId = searchParams.get('session_id');
  const isTrialParam = searchParams.get('trial') === 'true';

  // Determine if this is a trial based on user subscription status
  const [isTrial, setIsTrial] = useState(isTrialParam);

  useEffect(() => {
    // Show welcome toast notification
    if (sessionId) {
      const message = isTrial 
        ? "🎉 Welcome to your 7-day free trial! Kai is ready to help you manage your dojo."
        : "✨ Your subscription is now active! Welcome to DojoFlow.";
      
      toast.success(message, {
        duration: 5000,
        description: "You'll be redirected to your dashboard shortly.",
      });

      console.log('Checkout session completed:', sessionId);
    }
  }, [sessionId, isTrial]);

  // Auto-redirect countdown
  useEffect(() => {
    if (!sessionId) return;

    if (redirectCountdown === 0) {
      setIsRedirecting(true);
      window.location.href = '/dashboard';
      return;
    }

    const timer = setTimeout(() => {
      setRedirectCountdown(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [redirectCountdown, sessionId]);

  if (!sessionId) {
    return (
      <div className="min-h-full flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Invalid Session</CardTitle>
            <CardDescription>
              No checkout session found. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/pricing'} className="w-full">
              Return to Pricing
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-full flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            {isRedirecting ? (
              <Loader2 className="w-10 h-10 text-green-600 dark:text-green-400 animate-spin" />
            ) : (
              <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {isTrial ? "Trial Activated! 🎉" : "Subscription Activated!"}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {isTrial 
              ? "Your 7-day free trial is now active. Enjoy unlimited access to all premium features!"
              : "Your payment was successful and your subscription is now active."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/50 border">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              What's Next?
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                <span>
                  {isTrial 
                    ? "You have 100 AI credits to explore Kai's capabilities"
                    : "Your AI credits have been added to your account"}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                <span>Kai is ready to help automate your dojo operations</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                <span>You'll receive a confirmation email shortly</span>
              </li>
              {isTrial && (
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                  <span>Your trial expires in 7 days - no credit card required</span>
                </li>
              )}
            </ul>
          </div>

          {/* Auto-redirect countdown */}
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              {isRedirecting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Redirecting to dashboard...
                </span>
              ) : (
                <span>
                  Redirecting to dashboard in <span className="font-semibold">{redirectCountdown}</span> seconds
                </span>
              )}
            </p>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={() => window.location.href = '/dashboard'} 
              className="flex-1"
              disabled={isRedirecting}
            >
              {isRedirecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Redirecting...
                </>
              ) : (
                "Go to Dashboard Now"
              )}
            </Button>
            <Button 
              onClick={() => window.location.href = '/billing'} 
              variant="outline" 
              className="flex-1"
              disabled={isRedirecting}
            >
              View Billing
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default BillingSuccess;

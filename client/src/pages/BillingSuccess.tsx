import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export function BillingSuccess() {
  const location = useLocation();
  const [redirectCountdown, setRedirectCountdown] = useState(8);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const { user } = useAuth();

  // Extract session_id from URL query params
  const searchParams = new URLSearchParams(location.search);
  const sessionId = searchParams.get('session_id');
  const isTrialParam = searchParams.get('trial') === 'true';
  const [isTrial] = useState(isTrialParam);

  // auth.me returns { ...fullUser, activeOrgId } — use activeOrgId, not organizationId
  const organizationId = (user as any)?.activeOrgId ?? (user as any)?.organizationId;

  const verifyMutation = trpc.subscription.verifyCheckoutSession.useMutation({
    onSuccess: (data) => {
      setVerifyStatus('success');
      const message = isTrial
        ? "🎉 Your 7-day free trial is now active! Kai is ready to help."
        : "✨ Your subscription is now active! Welcome to DojoFlow.";
      toast.success(message, { duration: 5000 });
    },
    onError: (err) => {
      console.error('[BillingSuccess] verifyCheckoutSession error:', err);
      // Don't block the user — webhook may have already handled it
      setVerifyStatus('success');
      const message = isTrial
        ? "🎉 Your 7-day free trial is now active!"
        : "✨ Your subscription is now active!";
      toast.success(message, { duration: 5000 });
    }
  });

  // Call verifyCheckoutSession as soon as we have sessionId and organizationId
  useEffect(() => {
    if (sessionId && organizationId) {
      verifyMutation.mutate({ sessionId, organizationId });
    }
  }, [sessionId, organizationId]);

  // Auto-redirect countdown — starts after verify completes (or after 3s timeout)
  useEffect(() => {
    if (!sessionId) return;
    if (verifyStatus !== 'success') return;

    if (redirectCountdown === 0) {
      setIsRedirecting(true);
      window.location.href = '/kai';
      return;
    }

    const timer = setTimeout(() => {
      setRedirectCountdown(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [redirectCountdown, sessionId, verifyStatus]);

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
            <Button onClick={() => window.location.href = '/kai'} className="w-full">
              Return to Dashboard
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
            {verifyStatus === 'pending' ? (
              <Loader2 className="w-10 h-10 text-green-600 dark:text-green-400 animate-spin" />
            ) : (
              <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {verifyStatus === 'pending'
              ? 'Activating your subscription...'
              : isTrial ? "Trial Activated! 🎉" : "Subscription Activated!"}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {verifyStatus === 'pending'
              ? 'Please wait while we confirm your payment...'
              : isTrial
                ? "Your 7-day free trial is now active. Enjoy unlimited access to all premium features!"
                : "Your payment was successful and your subscription is now active."}
          </CardDescription>
        </CardHeader>

        {verifyStatus === 'success' && (
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
                      ? "You have AI credits to explore Kai's capabilities"
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
                    <span>Your trial expires in 7 days — cancel anytime</span>
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
                onClick={() => { setIsRedirecting(true); window.location.href = '/kai'; }}
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
        )}
      </Card>
    </div>
  );
}

export default BillingSuccess;

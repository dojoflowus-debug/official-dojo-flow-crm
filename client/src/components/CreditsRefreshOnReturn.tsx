import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/hooks/use-toast';

/**
 * CreditsRefreshOnReturn
 * 
 * Handles credit balance refresh when user returns from Stripe checkout.
 * Watches for credits=success or credits=cancel query params and:
 * - Refetches credit balance
 * - Shows appropriate toast notification
 * - Cleans up query params
 * 
 * Uses StrictMode guard to prevent double-execution in development.
 */
export function CreditsRefreshOnReturn() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const hasHandledReturn = useRef(false);

  // Get the credit balance query utilities
  const utils = trpc.useUtils();

  useEffect(() => {
    // Guard against double-execution in React StrictMode
    if (hasHandledReturn.current) return;

    const credits = searchParams.get('credits');

    if (credits === 'success') {
      hasHandledReturn.current = true;

      // Show success toast
      toast({
        title: 'Credits Added ✅',
        description: 'Your credits have been successfully added to your account.'
      });

      // Invalidate related queries to update UI and trigger refetch
      utils.subscription.getCreditBalance.invalidate().catch((error) => {
        console.error('[CreditsRefresh] Failed to refetch balance:', error);
        toast({
          title: 'Refresh Error',
          description: 'Payment succeeded, but we couldn\'t refresh your credits yet. Please refresh the page.',
          variant: 'destructive'
        });
      });
      utils.subscription.getCreditTransactions.invalidate();

      // Clean up query param (remove credits=success, keep other params)
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('credits');
      setSearchParams(newParams, { replace: true });
    } else if (credits === 'cancel') {
      hasHandledReturn.current = true;

      // Show cancel toast
      toast({
        title: 'Checkout Canceled',
        description: 'Your purchase was canceled. You can try again anytime.'
      });

      // Clean up query param
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('credits');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams, toast, utils]);

  // This component doesn't render anything
  return null;
}

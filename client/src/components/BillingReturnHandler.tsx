import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

/**
 * BillingReturnHandler
 * 
 * Watches for billing=return query parameter after user returns from Stripe portal.
 * Refetches billing snapshot, payment method, and credit balance.
 * Shows toast notification and cleans up URL.
 */
export function BillingReturnHandler() {
  const [searchParams, setSearchParams] = useSearchParams();
  const hasProcessed = useRef(false);
  
  // Queries to refetch on return
  const billingSnapshotQuery = trpc.subscription.getBillingSnapshot.useQuery(
    { organizationId: 0 },
    { enabled: false }
  );
  
  const paymentMethodQuery = trpc.subscription.getDefaultPaymentMethod.useQuery(
    { organizationId: 0 },
    { enabled: false }
  );
  
  const creditBalanceQuery = trpc.credits.getBalance.useQuery(undefined, {
    enabled: false,
  });

  useEffect(() => {
    const billingParam = searchParams.get('billing');
    
    // Only process once per mount
    if (hasProcessed.current) return;
    
    if (billingParam === 'return') {
      hasProcessed.current = true;
      
      // Show success toast
      toast.success('Billing information updated');
      
      // Refetch all billing-related data
      Promise.all([
        billingSnapshotQuery.refetch(),
        paymentMethodQuery.refetch(),
        creditBalanceQuery.refetch(),
      ]).catch((error) => {
        console.error('Failed to refetch billing data:', error);
      });
      
      // Clean up URL by removing billing param
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('billing');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams, billingSnapshotQuery, paymentMethodQuery, creditBalanceQuery]);

  return null;
}

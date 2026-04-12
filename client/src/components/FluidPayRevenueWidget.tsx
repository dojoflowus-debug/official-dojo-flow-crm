/**
 * FluidPayRevenueWidget
 *
 * Live month-to-date revenue card powered by FluidPay.
 * Shows total collected, transaction count, and the 5 most recent transactions.
 * Refreshes every 5 minutes automatically.
 */

import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { DollarSign, TrendingUp, RefreshCw, CreditCard, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function FluidPayRevenueWidget() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const { data, isLoading, error, refetch, isFetching } = trpc.kaiData.getFluidPayRevenue.useQuery(
    { year, month },
    {
      refetchInterval: 5 * 60 * 1000, // auto-refresh every 5 minutes
      retry: 1,
    }
  );

  const { data: txData, refetch: refetchTx } = trpc.kaiData.getFluidPayTransactions.useQuery(
    { limit: 5 },
    {
      refetchInterval: 5 * 60 * 1000,
      retry: 1,
    }
  );

  const handleRefresh = () => {
    refetch();
    refetchTx();
  };

  const monthName = now.toLocaleString('default', { month: 'long' });

  if (error) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 flex items-center gap-3 text-muted-foreground">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">FluidPay not connected</p>
            <p className="text-xs mt-0.5">Connect FluidPay in Settings to see live revenue data.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalCollected = data?.totalDollars ?? 0;
  const settled = data?.settledDollars ?? 0;
  const pending = data?.pendingDollars ?? 0;
  const txCount = data?.transactionCount ?? 0;

  const transactions: any[] = txData?.transactions ?? [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <DollarSign className="w-4 h-4 text-green-500" />
            {monthName} Revenue (FluidPay)
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleRefresh}
            disabled={isFetching}
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm py-4 justify-center">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Loading revenue data…
          </div>
        ) : (
          <>
            {/* Main metric */}
            <div className="flex items-end gap-3">
              <span className="text-3xl font-bold tracking-tight">
                ${totalCollected.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-sm text-muted-foreground mb-1">
                {txCount} transaction{txCount !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Breakdown row */}
            <div className="flex gap-4 text-xs text-muted-foreground">
              <div>
                <span className="font-medium text-foreground">
                  ${settled.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>{' '}
                settled
              </div>
              {pending > 0 && (
                <div>
                  <span className="font-medium text-amber-500">
                    ${pending.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>{' '}
                  pending
                </div>
              )}
            </div>

            {/* Recent transactions */}
            {transactions.length > 0 && (
              <div className="pt-2 border-t space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Recent Transactions
                </p>
                {transactions.slice(0, 5).map((t: any, i: number) => {
                  const billingName = (() => {
                    if (t.billing) {
                      const n = `${t.billing.first_name || ''} ${t.billing.last_name || ''}`.trim();
                      if (n) return n;
                    }
                    if (t.description?.trim()) return t.description.trim();
                    if (t.order_id?.trim()) return `Order ${t.order_id.trim()}`;
                    if (t.customer_id?.trim()) return `Customer ${t.customer_id.trim()}`;
                    return `Txn ${(t.id || '').slice(-6)}`;
                  })();
                  const amount = ((t.amount || 0) / 100).toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  });
                  const date = t.created_at
                    ? new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : '';
                  return (
                    <div key={t.id || i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <CreditCard className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <span className="truncate text-foreground">{billingName}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <span className="font-medium text-green-600 dark:text-green-400">{amount}</span>
                        {date && <span className="text-muted-foreground">{date}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Link to billing page */}
            <div className="pt-1">
              <a
                href="/billing/tuition-plans"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <TrendingUp className="w-3 h-3" />
                View billing &amp; tuition plans
              </a>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

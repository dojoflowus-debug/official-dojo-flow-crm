import React, { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { trpc } from '../utils/trpc';

interface CreditBalanceMonitorProps {
  organizationId?: number;
  showDetails?: boolean;
  compact?: boolean;
}

type AlertLevel = 'none' | 'warning' | 'critical' | 'blocked';

export default function CreditBalanceMonitor({
  organizationId,
  showDetails = false,
  compact = false,
}: CreditBalanceMonitorProps) {
  const { isDark } = useTheme();
  const [alertLevel, setAlertLevel] = useState<AlertLevel>('none');

  // Fetch credit balance
  const { data: balance, isLoading, refetch } = trpc.credits.getBalance.useQuery(
    { organizationId: organizationId || 0 },
    { enabled: !!organizationId }
  );

  // Refetch balance every 30 seconds
  useEffect(() => {
    if (!organizationId) return;

    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [organizationId, refetch]);

  // Update alert level based on balance
  useEffect(() => {
    if (!balance) return;

    if (balance.creditsRemaining <= 0) {
      setAlertLevel('blocked');
    } else if (balance.creditsRemaining < 10) {
      setAlertLevel('critical');
    } else if (balance.creditsRemaining < 50) {
      setAlertLevel('warning');
    } else {
      setAlertLevel('none');
    }
  }, [balance?.creditsRemaining]);

  if (isLoading || !balance) {
    return null;
  }

  const getAlertColor = (level: AlertLevel) => {
    switch (level) {
      case 'blocked':
        return isDark ? 'bg-red-900/20 border-red-500/30' : 'bg-red-50 border-red-200';
      case 'critical':
        return isDark ? 'bg-orange-900/20 border-orange-500/30' : 'bg-orange-50 border-orange-200';
      case 'warning':
        return isDark ? 'bg-yellow-900/20 border-yellow-500/30' : 'bg-yellow-50 border-yellow-200';
      default:
        return isDark ? 'bg-green-900/20 border-green-500/30' : 'bg-green-50 border-green-200';
    }
  };

  const getAlertTextColor = (level: AlertLevel) => {
    switch (level) {
      case 'blocked':
        return isDark ? 'text-red-200' : 'text-red-900';
      case 'critical':
        return isDark ? 'text-orange-200' : 'text-orange-900';
      case 'warning':
        return isDark ? 'text-yellow-200' : 'text-yellow-900';
      default:
        return isDark ? 'text-green-200' : 'text-green-900';
    }
  };

  const getAlertIcon = (level: AlertLevel) => {
    switch (level) {
      case 'blocked':
        return '🚫';
      case 'critical':
        return '🚨';
      case 'warning':
        return '⚠️';
      default:
        return '✅';
    }
  };

  const getAlertMessage = (level: AlertLevel) => {
    switch (level) {
      case 'blocked':
        return 'No credits available. Please purchase credits to continue.';
      case 'critical':
        return `Critical: Only ${balance.creditsRemaining} credits remaining. Purchase more credits immediately.`;
      case 'warning':
        return `Warning: Low balance (${balance.creditsRemaining} credits). Consider purchasing more.`;
      default:
        return `You have ${balance.creditsRemaining} credits available.`;
    }
  };

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold border ${getAlertColor(alertLevel)}`}
      >
        <span className="text-lg">{getAlertIcon(alertLevel)}</span>
        <span className={getAlertTextColor(alertLevel)}>
          {balance.creditsRemaining} credits
        </span>
      </div>
    );
  }

  return (
    <div
      className={`p-4 rounded-lg border ${getAlertColor(alertLevel)}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{getAlertIcon(alertLevel)}</span>
        <div className="flex-1">
          <p className={`font-semibold ${getAlertTextColor(alertLevel)}`}>
            Credit Balance: {balance.creditsRemaining}
          </p>
          <p className={`text-sm mt-1 ${getAlertTextColor(alertLevel)}`}>
            {getAlertMessage(alertLevel)}
          </p>

          {showDetails && (
            <div className={`mt-3 pt-3 border-t ${isDark ? 'border-white/10' : 'border-black/10'}`}>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className={`text-xs opacity-75 ${getAlertTextColor(alertLevel)}`}>
                    Used This Period
                  </p>
                  <p className={`font-semibold ${getAlertTextColor(alertLevel)}`}>
                    {balance.creditsUsed}
                  </p>
                </div>
                <div>
                  <p className={`text-xs opacity-75 ${getAlertTextColor(alertLevel)}`}>
                    Plan Allowance
                  </p>
                  <p className={`font-semibold ${getAlertTextColor(alertLevel)}`}>
                    {balance.planAllowance}
                  </p>
                </div>
                <div>
                  <p className={`text-xs opacity-75 ${getAlertTextColor(alertLevel)}`}>
                    Renewal
                  </p>
                  <p className={`font-semibold ${getAlertTextColor(alertLevel)}`}>
                    {balance.renewalDate
                      ? new Date(balance.renewalDate).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3">
                <div className={`w-full h-2 rounded-full ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
                  <div
                    className={`h-full rounded-full transition-all ${
                      alertLevel === 'blocked'
                        ? 'bg-red-500'
                        : alertLevel === 'critical'
                        ? 'bg-orange-500'
                        : alertLevel === 'warning'
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{
                      width: `${Math.min(
                        (balance.creditsRemaining / balance.planAllowance) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
                <p className={`text-xs mt-1 opacity-75 ${getAlertTextColor(alertLevel)}`}>
                  {Math.round((balance.creditsRemaining / balance.planAllowance) * 100)}% of plan
                  allowance remaining
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

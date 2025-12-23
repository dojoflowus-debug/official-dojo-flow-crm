import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { trpc } from '../lib/trpc';

/**
 * LowCreditBanner
 * Displays warning banner when credit balance is low
 */
const LowCreditBanner = () => {
  const [dismissed, setDismissed] = React.useState(false);
  const { data: creditBalance } = trpc.subscription.getCreditBalance.useQuery();

  // Don't show banner if dismissed or credits are sufficient
  if (dismissed || !creditBalance || creditBalance.creditsRemaining >= 50) {
    return null;
  }

  const isOutOfCredits = creditBalance.creditsRemaining === 0;
  const isCritical = creditBalance.creditsRemaining < 10;

  return (
    <div
      className={`w-full px-4 py-3 flex items-center gap-3 ${
        isOutOfCredits
          ? 'bg-red-500/20 border-b border-red-500'
          : isCritical
          ? 'bg-red-500/20 border-b border-red-500'
          : 'bg-amber-500/20 border-b border-amber-500'
      }`}
    >
      <AlertCircle
        className={`w-5 h-5 flex-shrink-0 ${
          isOutOfCredits ? 'text-red-400' : isCritical ? 'text-red-400' : 'text-amber-400'
        }`}
      />
      <div className="flex-1 text-sm">
        {isOutOfCredits ? (
          <span className="text-red-400 font-semibold">
            Out of Credits - AI features are disabled. Purchase credits or upgrade your plan to continue.
          </span>
        ) : isCritical ? (
          <span className="text-red-400 font-semibold">
            Critical: Only {creditBalance.creditsRemaining} credits remaining. Top up now to avoid service
            interruption.
          </span>
        ) : (
          <span className="text-amber-400 font-semibold">
            Low Credits: {creditBalance.creditsRemaining} credits remaining. Consider purchasing more credits.
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <Link
          to="/pricing"
          className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all ${
            isOutOfCredits || isCritical
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-amber-500 hover:bg-amber-600 text-white'
          }`}
        >
          {isOutOfCredits ? 'Get Credits' : 'Top Up'}
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="p-1.5 hover:bg-white/10 rounded transition-all"
          title="Dismiss"
        >
          <X className={`w-4 h-4 ${isOutOfCredits || isCritical ? 'text-red-400' : 'text-amber-400'}`} />
        </button>
      </div>
    </div>
  );
};

export default LowCreditBanner;

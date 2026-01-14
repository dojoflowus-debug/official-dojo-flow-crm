import React, { useState, useEffect } from 'react';
import { Zap, TrendingDown, AlertTriangle } from 'lucide-react';

/**
 * CreditCounter Component
 * Displays current credit balance in the dashboard header
 * Shows warnings when credits are low
 */
const CreditCounter = ({ organizationId = 1, onPurchaseClick }) => {
  const [creditData, setCreditData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCreditBalance();
    // Refresh every 30 seconds
    const interval = setInterval(fetchCreditBalance, 30000);
    return () => clearInterval(interval);
  }, [organizationId]);

  const fetchCreditBalance = async () => {
    try {
      const response = await fetch(`/api/subscription/credits/balance`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCreditData(data);
        setError(null);
      } else {
        setError('Failed to load credits');
      }
    } catch (err) {
      setError('Connection error');
      console.error('Error fetching credit balance:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg animate-pulse">
        <div className="w-16 h-4 bg-slate-700 rounded"></div>
      </div>
    );
  }

  if (error || !creditData) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-red-900/20 border border-red-500 rounded-lg">
        <AlertTriangle className="w-4 h-4 text-red-500" />
        <span className="text-sm text-red-400">{error || 'No data'}</span>
      </div>
    );
  }

  const { current_balance, monthly_allocation } = creditData;
  const percentageUsed = ((monthly_allocation - current_balance) / monthly_allocation) * 100;
  const isLow = current_balance < monthly_allocation * 0.2; // Less than 20%
  const isCritical = current_balance < monthly_allocation * 0.1; // Less than 10%

  return (
    <div className="flex items-center gap-3">
      {/* Credit Balance Display */}
      <div
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all cursor-pointer hover:scale-105 ${
          isCritical
            ? 'bg-red-900/20 border-red-500'
            : isLow
            ? 'bg-yellow-900/20 border-yellow-500'
            : 'bg-emerald-900/20 border-emerald-500'
        }`}
        onClick={onPurchaseClick}
        title="Click to purchase more credits"
      >
        <Zap
          className={`w-5 h-5 ${
            isCritical
              ? 'text-red-400'
              : isLow
              ? 'text-yellow-400'
              : 'text-emerald-400'
          }`}
          fill="currentColor"
        />
        <div className="flex flex-col">
          <div className="flex items-baseline gap-2">
            <span
              className={`text-lg font-bold ${
                isCritical
                  ? 'text-red-300'
                  : isLow
                  ? 'text-yellow-300'
                  : 'text-emerald-300'
              }`}
            >
              {current_balance.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">credits</span>
          </div>
          <div className="text-xs text-slate-500">
            {monthly_allocation.toLocaleString()} / month
          </div>
        </div>
      </div>

      {/* Warning Badge */}
      {isLow && (
        <div
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
            isCritical
              ? 'bg-red-500 text-white'
              : 'bg-yellow-500 text-slate-900'
          }`}
        >
          <TrendingDown className="w-3 h-3" />
          {isCritical ? 'Critical' : 'Low'}
        </div>
      )}

      {/* Progress Bar (optional, can be hidden on small screens) */}
      <div className="hidden lg:flex flex-col gap-1 min-w-[100px]">
        <div className="text-xs text-slate-400">
          {percentageUsed.toFixed(0)}% used
        </div>
        <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              isCritical
                ? 'bg-red-500'
                : isLow
                ? 'bg-yellow-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${percentageUsed}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default CreditCounter;


import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { trpc } from '../utils/trpc';

interface CreditPackage {
  id: string;
  credits: number;
  price: number;
  savings?: number;
  popular?: boolean;
}

interface CreditPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'package_500',
    credits: 500,
    price: 49.99,
  },
  {
    id: 'package_2000',
    credits: 2000,
    price: 149.99,
    savings: 40,
    popular: true,
  },
  {
    id: 'package_5000',
    credits: 5000,
    price: 299.99,
    savings: 100,
  },
  {
    id: 'package_15000',
    credits: 15000,
    price: 799.99,
    savings: 300,
  },
];

export default function CreditPurchaseModal({
  isOpen,
  onClose,
  onSuccess,
}: CreditPurchaseModalProps) {
  const { isDark } = useTheme();
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(
    CREDIT_PACKAGES[1]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const purchaseMutation = trpc.fluidPay.purchaseCredits.useMutation({
    onSuccess: () => {
      setError(null);
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      setError(err.message || 'Failed to process purchase');
    },
  });

  const handlePurchase = async () => {
    if (!selectedPackage) return;

    setLoading(true);
    try {
      await purchaseMutation.mutateAsync({
        amount: selectedPackage.price,
        credits: selectedPackage.credits,
        planId: selectedPackage.id,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        className={`rounded-lg shadow-xl max-w-2xl w-full mx-4 ${
          isDark ? 'bg-gray-900' : 'bg-white'
        }`}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${
            isDark ? 'border-white/10' : 'border-gray-200'
          }`}
        >
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Purchase Credits
          </h2>
          <button
            onClick={onClose}
            className={`text-2xl leading-none ${
              isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {/* Error Message */}
          {error && (
            <div
              className={`mb-6 p-4 rounded-lg border ${
                isDark
                  ? 'bg-red-900/20 border-red-500/30 text-red-200'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              {error}
            </div>
          )}

          {/* Credit Packages */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {CREDIT_PACKAGES.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg)}
                className={`relative p-4 rounded-lg border-2 transition-all ${
                  selectedPackage?.id === pkg.id
                    ? isDark
                      ? 'border-red-500 bg-red-900/20'
                      : 'border-red-500 bg-red-50'
                    : isDark
                    ? 'border-gray-700 hover:border-gray-600'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        isDark
                          ? 'bg-red-600 text-white'
                          : 'bg-red-500 text-white'
                      }`}
                    >
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-left">
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {pkg.credits.toLocaleString()}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Credits
                  </p>

                  <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                    <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      ${pkg.price.toFixed(2)}
                    </p>
                    {pkg.savings && (
                      <p className="text-xs text-green-500 font-semibold">
                        Save ${pkg.savings.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Summary */}
          {selectedPackage && (
            <div
              className={`p-4 rounded-lg border ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                  {selectedPackage.credits.toLocaleString()} Credits
                </span>
                <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  ${selectedPackage.price.toFixed(2)}
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                {(selectedPackage.credits / selectedPackage.price).toFixed(2)} credits per dollar
              </p>
            </div>
          )}

          {/* Info Box */}
          <div
            className={`mt-6 p-4 rounded-lg border ${
              isDark ? 'bg-blue-900/20 border-blue-500/30' : 'bg-blue-50 border-blue-200'
            }`}
          >
            <p
              className={`text-sm ${
                isDark ? 'text-blue-200' : 'text-blue-900'
              }`}
            >
              <strong>How credits work:</strong> Each operation consumes credits from your balance. AI chats cost 1 credit, SMS costs 1 credit, emails cost 2 credits, and calls cost approximately 10 credits.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`px-6 py-4 border-t flex gap-3 justify-end ${
            isDark ? 'border-white/10' : 'border-gray-200'
          }`}
        >
          <button
            onClick={onClose}
            disabled={loading}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              isDark
                ? 'bg-gray-800 hover:bg-gray-700 disabled:bg-gray-700 text-white'
                : 'bg-gray-200 hover:bg-gray-300 disabled:bg-gray-300 text-gray-900'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handlePurchase}
            disabled={loading || !selectedPackage}
            className="px-6 py-2 rounded-lg font-semibold bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white transition-colors"
          >
            {loading ? 'Processing...' : 'Purchase Credits'}
          </button>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { AlertCircle, CreditCard, ArrowRight } from 'lucide-react';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTrial: () => void;
  onManageBilling: () => void;
  subscriptionStatus?: 'no_subscription' | 'past_due' | 'canceled';
  featureName?: string;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onClose,
  onStartTrial,
  onManageBilling,
  subscriptionStatus = 'no_subscription',
  featureName = 'this feature',
}) => {
  if (!isOpen) return null;

  const getTitle = () => {
    switch (subscriptionStatus) {
      case 'past_due':
        return 'Payment Required';
      case 'canceled':
        return 'Subscription Canceled';
      default:
        return 'Start Your Free Trial';
    }
  };

  const getDescription = () => {
    switch (subscriptionStatus) {
      case 'past_due':
        return `Your payment couldn't be processed. Please update your billing information to continue using ${featureName}.`;
      case 'canceled':
        return `Your subscription has been canceled. Reactivate your subscription to access ${featureName}.`;
      default:
        return `Get 7 days free access to ${featureName} and all premium features. No credit card required to start.`;
    }
  };

  const getPrimaryButtonText = () => {
    switch (subscriptionStatus) {
      case 'past_due':
      case 'canceled':
        return 'Update Billing';
      default:
        return 'Start 7-Day Free Trial';
    }
  };

  const getPrimaryButtonAction = () => {
    switch (subscriptionStatus) {
      case 'past_due':
      case 'canceled':
        return onManageBilling;
      default:
        return onStartTrial;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-red-500 to-orange-500 rounded-t-2xl p-6 text-white">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-center gap-3 mb-2">
              {subscriptionStatus === 'no_subscription' ? (
                <CreditCard className="w-6 h-6" />
              ) : (
                <AlertCircle className="w-6 h-6" />
              )}
              <h2 className="text-xl font-bold">{getTitle()}</h2>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
              {getDescription()}
            </p>

            {/* Benefits (only show for no_subscription) */}
            {subscriptionStatus === 'no_subscription' && (
              <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  Included in your trial:
                </p>
                <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    Unlimited AI chat messages
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    SMS and email automation
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    AI phone calls
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    Full feature access
                  </li>
                </ul>
              </div>
            )}

            {/* Trial Info */}
            {subscriptionStatus === 'no_subscription' && (
              <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
                After your trial, you'll be charged monthly. Cancel anytime.
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 space-y-3 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={getPrimaryButtonAction()}
              className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 group"
            >
              {getPrimaryButtonText()}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            {subscriptionStatus === 'no_subscription' && (
              <button
                onClick={onManageBilling}
                className="w-full text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium py-2 px-4 rounded-lg border border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 transition-colors"
              >
                Manage Billing
              </button>
            )}

            <button
              onClick={onClose}
              className="w-full text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium py-2 px-4 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaywallModal;

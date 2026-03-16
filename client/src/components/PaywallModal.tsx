import React from 'react';
import { AlertCircle, CreditCard, ArrowRight, X } from 'lucide-react';

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
        return `Get 7 days free access to ${featureName} and all premium features. Just $1 today to verify your card — then $49.99/month after your trial. Cancel anytime.`;
    }
  };

  const getPrimaryButtonText = () => {
    switch (subscriptionStatus) {
      case 'past_due':
      case 'canceled':
        return 'Update Billing';
      default:
        return 'Start 7-Day Free Trial →';
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

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop - Subtle blur and dim */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-md z-9990 transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal - Luxury black & white design with premium styling */}
      <div className="fixed inset-0 z-10000 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-white rounded-xl shadow-2xl pointer-events-auto animate-in fade-in zoom-in-95 duration-300 overflow-hidden flex flex-col"
          style={{
            maxWidth: '440px',
            maxHeight: '72vh',
            width: 'calc(100vw - 32px)',
            border: '1px solid rgba(255, 255, 255, 0.55)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.55)',
          }}
        >
          {/* Header - Matte black with white text (reduced padding) */}
          <div className="relative bg-black px-6 py-5 text-white flex-shrink-0">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors duration-200 p-1"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon and Title */}
            <div className="flex items-start gap-3 pr-8">
              <div className="flex-shrink-0 mt-0.5">
                {subscriptionStatus === 'no_subscription' ? (
                  <CreditCard className="w-6 h-6 text-white" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight">{getTitle()}</h2>
                <div className="h-0.5 w-10 bg-red-600 mt-2 rounded-full" />
              </div>
            </div>
          </div>

          {/* Content - Pure white background (scrollable) */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 bg-white">
            {/* Description */}
            <p className="text-gray-700 text-sm leading-relaxed font-light">
              {getDescription()}
            </p>

            {/* Benefits - Light gray card (only for no_subscription) */}
            {subscriptionStatus === 'no_subscription' && (
              <div className="space-y-3 bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Included in your trial:
                </p>
                <ul className="space-y-2 text-xs text-gray-700">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 flex-shrink-0" />
                    <span>Unlimited AI chat messages</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 flex-shrink-0" />
                    <span>SMS and email automation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 flex-shrink-0" />
                    <span>AI phone calls</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 flex-shrink-0" />
                    <span>Full feature access</span>
                  </li>
                </ul>
              </div>
            )}

            {/* Trial Info */}
            {subscriptionStatus === 'no_subscription' && (
              <div className="text-xs text-gray-500 text-center font-light leading-snug">
                $1 card verification today. $49.99/month after your 7-day trial. Cancel anytime.
              </div>
            )}
          </div>

          {/* Actions - Buttons (sticky footer) */}
          <div className="px-6 py-4 space-y-2.5 bg-white border-t border-gray-100 flex-shrink-0">
            {/* Primary CTA - Red button with prominence */}
            <button
              onClick={getPrimaryButtonAction()}
              className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold py-3 px-5 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-red-600/30 text-sm tracking-wide"
              style={{
                boxShadow: '0 10px 25px -5px rgba(220, 38, 38, 0.2)',
              }}
            >
              {getPrimaryButtonText()}
            </button>

            {/* Secondary Button - Manage Billing (only for no_subscription) */}
            {subscriptionStatus === 'no_subscription' && (
              <button
                onClick={onManageBilling}
                className="w-full text-gray-900 hover:text-gray-700 hover:bg-gray-50 font-semibold py-2.5 px-5 rounded-lg border border-gray-300 hover:border-gray-400 transition-all duration-200 text-sm"
              >
                Manage Billing
              </button>
            )}

            {/* Close Button - Subtle text button */}
            <button
              onClick={onClose}
              className="w-full text-gray-500 hover:text-gray-700 font-medium py-2 px-4 transition-colors duration-200 text-xs"
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

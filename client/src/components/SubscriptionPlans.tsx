import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { trpc } from '../utils/trpc';

interface SubscriptionPlan {
  id: string;
  name: string;
  credits: number;
  price: number;
  billingCycle: 'monthly' | 'annual';
  features: string[];
  popular?: boolean;
}

interface SubscriptionPlansProps {
  onSubscribe?: (planId: string) => void;
}

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan_starter',
    name: 'Starter',
    credits: 500,
    price: 49,
    billingCycle: 'monthly',
    features: [
      '500 credits/month',
      'Up to 500 AI chats',
      'Basic support',
      'Monthly billing',
    ],
  },
  {
    id: 'plan_growth',
    name: 'Growth',
    credits: 1500,
    price: 99,
    billingCycle: 'monthly',
    features: [
      '1,500 credits/month',
      'Up to 1,500 AI chats',
      'Email & chat support',
      'Monthly billing',
      'Priority processing',
    ],
    popular: true,
  },
  {
    id: 'plan_pro',
    name: 'Pro',
    credits: 4000,
    price: 199,
    billingCycle: 'monthly',
    features: [
      '4,000 credits/month',
      'Up to 4,000 AI chats',
      'Priority support',
      'Monthly billing',
      'Advanced analytics',
      'API access',
    ],
  },
  {
    id: 'plan_elite',
    name: 'Elite',
    credits: 10000,
    price: 499,
    billingCycle: 'monthly',
    features: [
      '10,000 credits/month',
      'Unlimited AI chats',
      '24/7 phone support',
      'Monthly billing',
      'Custom integrations',
      'Dedicated account manager',
    ],
  },
];

export default function SubscriptionPlans({ onSubscribe }: SubscriptionPlansProps) {
  const { isDark } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subscribeMutation = trpc.fluidPay.subscribeToplan.useMutation({
    onSuccess: () => {
      setError(null);
      onSubscribe?.(selectedPlan || '');
    },
    onError: (err) => {
      setError(err.message || 'Failed to subscribe');
    },
  });

  const handleSubscribe = async (planId: string) => {
    setSelectedPlan(planId);
    setLoading(true);

    try {
      await subscribeMutation.mutateAsync({
        planId,
        billingCycle: 'monthly',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Header */}
      <div className={`px-6 py-12 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
        <h1 className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Subscription Plans
        </h1>
        <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Choose a plan that fits your needs. Upgrade or downgrade anytime.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-6 py-4">
          <div
            className={`p-4 rounded-lg border ${
              isDark
                ? 'bg-red-900/20 border-red-500/30 text-red-200'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            {error}
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-lg border-2 overflow-hidden transition-all ${
                plan.popular
                  ? isDark
                    ? 'border-red-500 bg-red-900/10'
                    : 'border-red-500 bg-red-50'
                  : isDark
                  ? 'border-gray-700 bg-gray-800'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
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

              <div className="p-6">
                {/* Plan Name */}
                <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {plan.name}
                </h3>

                {/* Credits */}
                <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {plan.credits.toLocaleString()} credits/month
                </p>

                {/* Price */}
                <div className="mb-6">
                  <span className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    ${plan.price}
                  </span>
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    /month
                  </span>
                </div>

                {/* Subscribe Button */}
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading && selectedPlan === plan.id}
                  className={`w-full py-2 px-4 rounded-lg font-semibold mb-6 transition-colors ${
                    plan.popular
                      ? 'bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white'
                      : isDark
                      ? 'bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 disabled:bg-gray-300 text-gray-900'
                  }`}
                >
                  {loading && selectedPlan === plan.id ? 'Processing...' : 'Subscribe'}
                </button>

                {/* Features */}
                <div className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <span className="text-red-500 mt-1">✓</span>
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className={`px-6 py-12 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
        <div className="max-w-3xl mx-auto">
          <h2 className={`text-2xl font-bold mb-8 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Can I change my plan anytime?
              </h3>
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle.
              </p>
            </div>

            <div>
              <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                What happens to unused credits?
              </h3>
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                Credits reset at the beginning of each billing cycle. Unused credits do not roll over to the next month.
              </p>
            </div>

            <div>
              <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Do you offer annual billing?
              </h3>
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                Yes, annual billing is available for all plans with a 20% discount. Contact support for more information.
              </p>
            </div>

            <div>
              <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                What if I need more credits?
              </h3>
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                You can purchase additional credits anytime. One-time purchases are available in various packages.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

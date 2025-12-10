import React, { useState, useEffect } from 'react';
import { Check, Zap, Crown, Building2, ArrowRight } from 'lucide-react';
import CreditPurchaseModal from '../components/CreditPurchaseModal';

/**
 * Pricing Page
 * Displays 3 subscription tiers: LITE, PRO, ELITE
 */
const Pricing = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(null);

  useEffect(() => {
    fetchPlans();
    fetchCurrentSubscription();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/subscription/plans');
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans);
      }
    } catch (err) {
      console.error('Error fetching plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentSubscription = async () => {
    try {
      const response = await fetch('/api/subscription/status');
      if (response.ok) {
        const data = await response.json();
        setCurrentPlan(data.plan_name);
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
    }
  };

  const getPlanIcon = (planName) => {
    switch (planName) {
      case 'LITE':
        return <Zap className="w-8 h-8" />;
      case 'PRO':
        return <Crown className="w-8 h-8" />;
      case 'ELITE':
        return <Building2 className="w-8 h-8" />;
      default:
        return <Zap className="w-8 h-8" />;
    }
  };

  const getPlanColor = (planName) => {
    switch (planName) {
      case 'LITE':
        return 'blue';
      case 'PRO':
        return 'emerald';
      case 'ELITE':
        return 'purple';
      default:
        return 'blue';
    }
  };

  const parseFeatures = (featuresJson) => {
    try {
      return JSON.parse(featuresJson);
    } catch {
      return [];
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading pricing...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto text-center mb-16">
        <h1 className="text-5xl font-bold text-white mb-4">
          Choose Your Plan
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
          Transform your martial arts school with AI-powered management.
          Start with a 14-day free trial, no credit card required.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {plans.map((plan) => {
          const color = getPlanColor(plan.name);
          const features = parseFeatures(plan.features_json);
          const isCurrentPlan = currentPlan === plan.name;
          const isPopular = plan.name === 'PRO';

          return (
            <div
              key={plan.id}
              className={`relative bg-slate-800 rounded-2xl border-2 transition-all hover:scale-105 ${
                isPopular
                  ? 'border-emerald-500 shadow-2xl shadow-emerald-500/20'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              {/* Popular Badge */}
              {isPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-emerald-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                    MOST POPULAR
                  </div>
                </div>
              )}

              {/* Current Plan Badge */}
              {isCurrentPlan && (
                <div className="absolute top-4 right-4">
                  <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                    CURRENT PLAN
                  </div>
                </div>
              )}

              <div className="p-8">
                {/* Icon */}
                <div className={`text-${color}-400 mb-4`}>
                  {getPlanIcon(plan.name)}
                </div>

                {/* Plan Name */}
                <h3 className="text-2xl font-bold text-white mb-2">
                  {plan.display_name}
                </h3>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-white">
                      ${plan.price_monthly}
                    </span>
                    <span className="text-slate-400">/month</span>
                  </div>
                </div>

                {/* Credits */}
                <div className={`bg-${color}-900/20 border border-${color}-500 rounded-lg p-4 mb-6`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className={`w-4 h-4 text-${color}-400`} fill="currentColor" />
                    <span className={`text-${color}-300 font-bold`}>
                      {plan.credits_monthly.toLocaleString()} credits/month
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Unused credits roll over (50% cap)
                  </div>
                </div>

                {/* Limits */}
                <div className="space-y-2 mb-6 text-sm">
                  <div className="flex justify-between text-slate-300">
                    <span>Users:</span>
                    <span className="font-semibold">
                      {plan.max_users ? plan.max_users : 'Unlimited'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Locations:</span>
                    <span className="font-semibold">
                      {plan.max_locations}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3 mb-8">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className={`w-5 h-5 text-${color}-400 flex-shrink-0 mt-0.5`} />
                      <span className="text-slate-300 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <button
                  onClick={async () => {
                    if (isCurrentPlan) return;
                    setCheckoutLoading(plan.name);
                    
                    try {
                      const response = await fetch('/api/stripe/checkout/subscription', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          plan_name: plan.name.toLowerCase().split(' ')[0],
                          email: 'owner@dojo.com',
                          org_name: 'Default Dojo',
                          success_url: `${window.location.origin}/subscription/success`,
                          cancel_url: `${window.location.origin}/pricing`
                        })
                      });

                      if (!response.ok) throw new Error('Failed to create checkout');
                      const data = await response.json();
                      window.location.href = data.url;
                    } catch (err) {
                      console.error('Checkout error:', err);
                      alert('Failed to start checkout. Please try again.');
                      setCheckoutLoading(null);
                    }
                  }}
                  className={`w-full py-3 px-6 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-2 ${
                    isCurrentPlan
                      ? 'bg-slate-600 cursor-not-allowed'
                      : isPopular
                      ? 'bg-emerald-500 hover:bg-emerald-600'
                      : `bg-${color}-500 hover:bg-${color}-600`
                  } disabled:opacity-50`}
                  disabled={isCurrentPlan || checkoutLoading === plan.name}
                >
                  {checkoutLoading === plan.name ? (
                    'Loading...'
                  ) : isCurrentPlan ? (
                    'Current Plan'
                  ) : (
                    <>
                      Get Started
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {!isCurrentPlan && (
                  <div className="text-center text-xs text-slate-500 mt-3">
                    14-day free trial • No credit card required
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add-on Credits */}
      <div className="max-w-4xl mx-auto bg-slate-800 rounded-2xl border border-slate-700 p-8">
        <h3 className="text-2xl font-bold text-white mb-4">
          Need More Credits?
        </h3>
        <p className="text-slate-400 mb-6">
          Purchase add-on credit packages anytime. Credits never expire and
          stack with your monthly allocation.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { amount: 500, price: 10 },
            { amount: 1000, price: 18 },
            { amount: 2500, price: 40 },
            { amount: 5000, price: 75 },
          ].map((pkg) => (
            <div
              key={pkg.amount}
              onClick={() => setShowCreditModal(true)}
              className="bg-slate-700 rounded-lg p-4 text-center hover:bg-slate-600 transition-all cursor-pointer"
            >
              <div className="text-2xl font-bold text-emerald-400 mb-1">
                {pkg.amount.toLocaleString()}
              </div>
              <div className="text-sm text-slate-400 mb-3">credits</div>
              <div className="text-xl font-bold text-white">${pkg.price}</div>
              <div className="text-xs text-slate-500 mt-1">
                ${(pkg.price / pkg.amount * 100).toFixed(2)}/100 credits
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ or Features Comparison */}
      <div className="max-w-4xl mx-auto mt-16 text-center">
        <h3 className="text-2xl font-bold text-white mb-4">
          All plans include:
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-300">
          <div>
            <div className="text-4xl mb-2">🔒</div>
            <div className="font-semibold mb-1">Secure & Private</div>
            <div className="text-sm text-slate-400">
              Enterprise-grade security with encrypted data
            </div>
          </div>
          <div>
            <div className="text-4xl mb-2">📱</div>
            <div className="font-semibold mb-1">Mobile Ready</div>
            <div className="text-sm text-slate-400">
              Works on any device - desktop, tablet, or phone
            </div>
          </div>
          <div>
            <div className="text-4xl mb-2">💬</div>
            <div className="font-semibold mb-1">24/7 Support</div>
            <div className="text-sm text-slate-400">
              Email and chat support for all customers
            </div>
          </div>
        </div>
      </div>

      {/* Credit Purchase Modal */}
      <CreditPurchaseModal
        isOpen={showCreditModal}
        onClose={() => setShowCreditModal(false)}
        organizationId={1}
      />
    </div>
  );
};

export default Pricing;


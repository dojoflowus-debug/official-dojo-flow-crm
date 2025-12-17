import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ChevronLeft, Check } from 'lucide-react';

interface PricingStepProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
  onSkip: () => void;
  isSubmitting: boolean;
}

const MEMBERSHIP_PLANS = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: '$99/month',
    description: 'Flexible month-to-month membership',
    features: ['Unlimited classes', 'Cancel anytime', 'Equipment included'],
  },
  {
    id: 'quarterly',
    name: 'Quarterly',
    price: '$270/quarter',
    description: 'Save 10% with 3-month commitment',
    features: ['Unlimited classes', 'Free uniform', 'Equipment included', 'Priority scheduling'],
    popular: true,
  },
  {
    id: 'annual',
    name: 'Annual',
    price: '$990/year',
    description: 'Best value - save 20%',
    features: ['Unlimited classes', 'Free uniform', 'Equipment included', 'Priority scheduling', 'Guest passes'],
  },
];

export default function PricingStep({ data, onNext, onBack, onSkip, isSubmitting }: PricingStepProps) {
  const [selectedPlan, setSelectedPlan] = useState(data.selectedMembershipPlan || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onNext({
      selectedMembershipPlan: selectedPlan || undefined,
    });
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 md:p-12">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
      >
        <ChevronLeft className="w-5 h-5" />
        Back
      </button>

      <div className="mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
          Choose Your Membership
        </h2>
        <p className="text-slate-400">
          Select a plan that works for you (you can change this later)
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Membership Plans */}
        <div className="grid gap-4">
          {MEMBERSHIP_PLANS.map((plan) => (
            <button
              key={plan.id}
              type="button"
              onClick={() => setSelectedPlan(plan.name)}
              className={`relative p-6 rounded-xl border-2 text-left transition-all ${
                selectedPlan === plan.name
                  ? 'border-red-600 bg-red-600/10'
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded-full">
                  MOST POPULAR
                </div>
              )}
              
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-xl font-bold text-white">{plan.name}</div>
                  <div className="text-2xl font-bold text-red-500 mt-1">{plan.price}</div>
                </div>
                {selectedPlan === plan.name && (
                  <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              
              <p className="text-slate-400 text-sm mb-4">{plan.description}</p>
              
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-slate-300">
                    <Check className="w-4 h-4 text-red-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <p className="text-slate-400 text-sm">
            💡 <strong className="text-white">Note:</strong> Final pricing will be discussed with our staff. 
            We offer family discounts and flexible payment options.
          </p>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <Button
            type="button"
            onClick={onSkip}
            variant="outline"
            className="flex-1 h-14 text-lg bg-transparent border-slate-600 text-white hover:bg-slate-800"
          >
            Decide Later
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 h-14 text-lg bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold"
          >
            {isSubmitting ? 'Saving...' : 'Continue'}
          </Button>
        </div>
      </form>
    </div>
  );
}

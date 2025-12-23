import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, TrendingUp, Building2, Crown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";


export function Pricing() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const { user } = useAuth();
  
  const { data: plans, isLoading } = trpc.subscription.getPlans.useQuery();
  const { data: currentSub } = trpc.subscription.getCurrentSubscription.useQuery(
    { organizationId: 1 }, // TODO: Get from organization context
    { enabled: !!user } // Only fetch when user is authenticated
  );

  const checkoutMutation = trpc.subscription.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      toast.error(`Checkout failed: ${error.message}`);
      setSelectedPlanId(null);
    },
  });

  const handleSelectPlan = (plan: any) => {
    if (!user) {
      toast.error("Please log in to subscribe");
      return;
    }

    if (plan.monthlyPrice === 0) {
      // Enterprise plan - contact sales
      toast.info("Please contact sales for enterprise pricing");
      return;
    }

    setSelectedPlanId(plan.id);
    checkoutMutation.mutate({
      organizationId: 1, // TODO: Get from organization context
      planId: plan.id,
      customerEmail: user.email || undefined
    });
  };

  const getPlanIcon = (slug: string) => {
    switch (slug) {
      case 'starter':
        return <Zap className="w-6 h-6" />;
      case 'growth':
        return <TrendingUp className="w-6 h-6" />;
      case 'pro':
        return <Building2 className="w-6 h-6" />;
      case 'enterprise':
        return <Crown className="w-6 h-6" />;
      default:
        return <Zap className="w-6 h-6" />;
    }
  };

  const getPlanColor = (slug: string) => {
    switch (slug) {
      case 'starter':
        return 'from-blue-500/10 to-blue-600/10 border-blue-500/20';
      case 'growth':
        return 'from-purple-500/10 to-purple-600/10 border-purple-500/20';
      case 'pro':
        return 'from-orange-500/10 to-orange-600/10 border-orange-500/20';
      case 'enterprise':
        return 'from-amber-500/10 to-amber-600/10 border-amber-500/20';
      default:
        return 'from-gray-500/10 to-gray-600/10 border-gray-500/20';
    }
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(0)}`;
  };

  if (isLoading) {
    return (
      <div className="container py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="container py-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Choose Your DojoFlow Plan
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Kai is your AI-powered operational assistant. Credits represent AI labor performed, not user actions.
        </p>

        {/* Billing Toggle */}
        <div className="inline-flex items-center gap-2 p-1 bg-muted rounded-lg mb-12">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              billingCycle === 'monthly'
                ? 'bg-background shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              billingCycle === 'annual'
                ? 'bg-background shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Annual
            <Badge variant="secondary" className="ml-2">Save 20%</Badge>
          </button>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="container pb-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans?.map((plan) => {
            const isCurrentPlan = currentSub?.planId === plan.id;
            const features = JSON.parse(plan.features) as string[];
            const isPopular = plan.slug === 'growth';

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col bg-gradient-to-br ${getPlanColor(plan.slug)} ${
                  isPopular ? 'ring-2 ring-purple-500 shadow-lg scale-105' : ''
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-purple-500 text-white">Most Popular</Badge>
                  </div>
                )}

                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-background/50">
                      {getPlanIcon(plan.slug)}
                    </div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  </div>
                  
                  <div className="flex items-baseline gap-1">
                    {plan.monthlyPrice > 0 ? (
                      <>
                        <span className="text-4xl font-bold">
                          {formatPrice(plan.monthlyPrice)}
                        </span>
                        <span className="text-muted-foreground">/month</span>
                      </>
                    ) : (
                      <span className="text-2xl font-bold">Custom Pricing</span>
                    )}
                  </div>

                  <CardDescription className="mt-2">
                    {plan.maxStudents === 999999 ? 'Unlimited' : `Up to ${plan.maxStudents}`} students
                    {' • '}
                    {plan.maxLocations === 999 ? 'Unlimited' : plan.maxLocations} location{plan.maxLocations > 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1">
                  <div className="space-y-3">
                    {/* Credit Allowance */}
                    <div className="p-3 rounded-lg bg-background/50 border">
                      <div className="font-semibold text-sm mb-1">AI Credits</div>
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {plan.monthlyCredits.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">per month</div>
                    </div>

                    {/* Features */}
                    <ul className="space-y-2 text-sm">
                      {features.slice(0, 6).map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>

                <CardFooter>
                  {isCurrentPlan ? (
                    <Button variant="outline" className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      variant={isPopular ? 'default' : 'outline'}
                      onClick={() => handleSelectPlan(plan)}
                      disabled={checkoutMutation.isPending && selectedPlanId === plan.id}
                    >
                      {checkoutMutation.isPending && selectedPlanId === plan.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>{plan.monthlyPrice > 0 ? 'Select Plan' : 'Contact Sales'}</>
                      )}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Credit Top-Ups Section */}
      <div className="container pb-16">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-600/10 border-indigo-500/20">
            <CardHeader>
              <CardTitle className="text-2xl">Need More AI Credits?</CardTitle>
              <CardDescription>
                Purchase additional credits anytime to keep Kai working for you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-background/50 border text-center">
                  <div className="text-sm text-muted-foreground mb-1">Starter</div>
                  <div className="text-2xl font-bold mb-1">100 credits</div>
                  <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">$20</div>
                </div>
                <div className="p-4 rounded-lg bg-background/50 border text-center ring-2 ring-purple-500">
                  <Badge variant="secondary" className="mb-2">Best Value</Badge>
                  <div className="text-sm text-muted-foreground mb-1">Growth</div>
                  <div className="text-2xl font-bold mb-1">200 credits</div>
                  <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">$30</div>
                </div>
                <div className="p-4 rounded-lg bg-background/50 border text-center">
                  <div className="text-sm text-muted-foreground mb-1">Pro</div>
                  <div className="text-2xl font-bold mb-1">Custom</div>
                  <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">Volume pricing</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Credit Usage Guide */}
      <div className="container pb-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center">How Credits Work</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Credits Are Used For</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
                    <span>Kai AI chat responses (1 credit)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
                    <span>AI-written SMS (1 credit)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
                    <span>AI-written emails (2 credits)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
                    <span>AI phone calls (8-15 credits)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
                    <span>Automated follow-up sequences (5-10 credits)</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">No Credits Used For</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <span>Logging in</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <span>Viewing dashboards</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <span>Manual messages</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <span>Basic CRM actions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <span>Kiosk check-ins</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Pricing;

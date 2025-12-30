import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Calculator, MessageSquare, Mail, Phone, Zap, TrendingUp, Building2, Crown } from "lucide-react";

// Credit costs per operation
const CREDIT_COSTS = {
  kaiChat: 1,
  sms: 1,
  email: 2,
  phoneCall: 10, // average per call
};

// Plan credit allocations (synced with database values)
// Prices are in cents, converted to dollars for display
const PLAN_CREDITS = [
  { name: "Starter", slug: "starter", credits: 500, price: 49, icon: Zap },
  { name: "Growth", slug: "growth", credits: 1500, price: 99, icon: TrendingUp },
  { name: "Pro", slug: "pro", credits: 4000, price: 199, icon: Building2 },
  { name: "Elite", slug: "elite", credits: 10000, price: 499, icon: Crown },
];

export function CreditCalculator() {
  const [kaiChats, setKaiChats] = useState(50);
  const [smsMessages, setSmsMessages] = useState(30);
  const [emails, setEmails] = useState(20);
  const [phoneCalls, setPhoneCalls] = useState(5);

  const totalCredits = useMemo(() => {
    return (
      kaiChats * CREDIT_COSTS.kaiChat +
      smsMessages * CREDIT_COSTS.sms +
      emails * CREDIT_COSTS.email +
      phoneCalls * CREDIT_COSTS.phoneCall
    );
  }, [kaiChats, smsMessages, emails, phoneCalls]);

  const recommendedPlan = useMemo(() => {
    // Find the smallest plan that covers the estimated usage with 20% buffer
    const usageWithBuffer = totalCredits * 1.2;
    const plan = PLAN_CREDITS.find(p => p.credits >= usageWithBuffer);
    return plan || PLAN_CREDITS[PLAN_CREDITS.length - 1];
  }, [totalCredits]);

  const getUsagePercentage = (planCredits: number) => {
    return Math.min((totalCredits / planCredits) * 100, 100);
  };

  return (
    <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-600/10 border-blue-500/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/20">
            <Calculator className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <CardTitle className="text-xl">Credit Calculator</CardTitle>
            <CardDescription>Estimate your monthly credit usage</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Sliders */}
        <div className="space-y-6">
          {/* Kai Chats */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-400" />
                <span className="font-medium">Kai AI Chats</span>
                <span className="text-xs text-muted-foreground">(1 credit each)</span>
              </div>
              <span className="font-bold text-lg">{kaiChats}</span>
            </div>
            <Slider
              value={[kaiChats]}
              onValueChange={(value) => setKaiChats(value[0])}
              max={200}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span>200/month</span>
            </div>
          </div>

          {/* SMS Messages */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-green-400" />
                <span className="font-medium">AI SMS Messages</span>
                <span className="text-xs text-muted-foreground">(1 credit each)</span>
              </div>
              <span className="font-bold text-lg">{smsMessages}</span>
            </div>
            <Slider
              value={[smsMessages]}
              onValueChange={(value) => setSmsMessages(value[0])}
              max={150}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span>150/month</span>
            </div>
          </div>

          {/* Emails */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400" />
                <span className="font-medium">AI Emails</span>
                <span className="text-xs text-muted-foreground">(2 credits each)</span>
              </div>
              <span className="font-bold text-lg">{emails}</span>
            </div>
            <Slider
              value={[emails]}
              onValueChange={(value) => setEmails(value[0])}
              max={100}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span>100/month</span>
            </div>
          </div>

          {/* Phone Calls */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-orange-400" />
                <span className="font-medium">AI Phone Calls</span>
                <span className="text-xs text-muted-foreground">(~10 credits each)</span>
              </div>
              <span className="font-bold text-lg">{phoneCalls}</span>
            </div>
            <Slider
              value={[phoneCalls]}
              onValueChange={(value) => setPhoneCalls(value[0])}
              max={30}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span>30/month</span>
            </div>
          </div>
        </div>

        {/* Total Estimate */}
        <div className="p-4 rounded-xl bg-background/60 border border-border/50">
          <div className="text-center mb-4">
            <div className="text-sm text-muted-foreground mb-1">Estimated Monthly Usage</div>
            <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              {totalCredits.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">credits</div>
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-2 gap-2 text-sm mb-4">
            <div className="flex justify-between px-2 py-1 rounded bg-muted/30">
              <span className="text-muted-foreground">Kai Chats:</span>
              <span>{kaiChats * CREDIT_COSTS.kaiChat}</span>
            </div>
            <div className="flex justify-between px-2 py-1 rounded bg-muted/30">
              <span className="text-muted-foreground">SMS:</span>
              <span>{smsMessages * CREDIT_COSTS.sms}</span>
            </div>
            <div className="flex justify-between px-2 py-1 rounded bg-muted/30">
              <span className="text-muted-foreground">Emails:</span>
              <span>{emails * CREDIT_COSTS.email}</span>
            </div>
            <div className="flex justify-between px-2 py-1 rounded bg-muted/30">
              <span className="text-muted-foreground">Calls:</span>
              <span>{phoneCalls * CREDIT_COSTS.phoneCall}</span>
            </div>
          </div>

          {/* Recommended Plan */}
          <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Recommended Plan</div>
                <div className="flex items-center gap-2">
                  <recommendedPlan.icon className="w-5 h-5 text-purple-400" />
                  <span className="font-bold text-lg">{recommendedPlan.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {recommendedPlan.credits} credits
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">${recommendedPlan.price}</div>
                <div className="text-xs text-muted-foreground">/month</div>
              </div>
            </div>
          </div>
        </div>

        {/* Plan Comparison Bars */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-muted-foreground">Usage vs Plan Allocations</div>
          {PLAN_CREDITS.map((plan) => {
            const percentage = getUsagePercentage(plan.credits);
            const isRecommended = plan.slug === recommendedPlan.slug;
            const isOver = percentage >= 100;
            
            return (
              <div key={plan.slug} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <plan.icon className={`w-4 h-4 ${isRecommended ? 'text-purple-400' : 'text-muted-foreground'}`} />
                    <span className={isRecommended ? 'font-medium' : ''}>{plan.name}</span>
                    {isRecommended && (
                      <Badge variant="outline" className="text-xs border-purple-500/50 text-purple-400">
                        Best Fit
                      </Badge>
                    )}
                  </div>
                  <span className="text-muted-foreground">{plan.credits} credits</span>
                </div>
                <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isOver
                        ? 'bg-red-500'
                        : isRecommended
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500'
                        : 'bg-muted-foreground/50'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-right text-muted-foreground">
                  {percentage.toFixed(0)}% of plan
                  {isOver && <span className="text-red-400 ml-1">(exceeds)</span>}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default CreditCalculator;

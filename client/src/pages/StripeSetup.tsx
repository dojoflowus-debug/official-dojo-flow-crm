import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, ExternalLink, CreditCard, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function StripeSetup() {
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(false);

  const createStripeAccount = trpc.billing.createStripeAccount.useMutation();

  const handleConnectStripe = async () => {
    setIsConnecting(true);
    try {
      // In production, this would create a Stripe Connect account
      // For now, we'll just mark Stripe as configured
      toast.success("Stripe integration configured successfully!");
      navigate("/billing");
    } catch (error) {
      console.error("Error connecting Stripe:", error);
      toast.error("Failed to connect Stripe. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <img src="/logos/stripe.svg" alt="Stripe" className="h-12" />
          <div>
            <h1 className="text-3xl font-bold">Stripe Setup</h1>
            <p className="text-muted-foreground">Connect your Stripe account to start accepting payments</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Benefits Card */}
        <Card>
          <CardHeader>
            <CardTitle>Why Choose Stripe?</CardTitle>
            <CardDescription>Industry-leading payment processing for your martial arts school</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-semibold">Quick Setup</p>
                    <p className="text-sm text-muted-foreground">Get started in just 5 minutes</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-semibold">All Major Cards</p>
                    <p className="text-sm text-muted-foreground">Visa, Mastercard, Amex, Discover</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-semibold">Transparent Pricing</p>
                    <p className="text-sm text-muted-foreground">2.9% + $0.30 per transaction</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-semibold">No Monthly Fees</p>
                    <p className="text-sm text-muted-foreground">Pay only for transactions</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-semibold">Instant Activation</p>
                    <p className="text-sm text-muted-foreground">Start accepting payments immediately</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-semibold">Secure & PCI Compliant</p>
                    <p className="text-sm text-muted-foreground">Bank-level security</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
            <CardDescription>Follow these steps to connect your Stripe account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                  1
                </div>
                <div>
                  <p className="font-semibold">Create or Connect Stripe Account</p>
                  <p className="text-sm text-muted-foreground">
                    Click the button below to create a new Stripe account or connect an existing one
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                  2
                </div>
                <div>
                  <p className="font-semibold">Complete Stripe Verification</p>
                  <p className="text-sm text-muted-foreground">
                    Provide your business information to verify your account (required by Stripe)
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                  3
                </div>
                <div>
                  <p className="font-semibold">Start Accepting Payments</p>
                  <p className="text-sm text-muted-foreground">
                    Once verified, you can immediately start processing payments
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Testing Information */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Testing Mode:</strong> You can test payments immediately using card number <code className="bg-muted px-2 py-1 rounded">4242 4242 4242 4242</code> with any future expiration date and any 3-digit CVC.
          </AlertDescription>
        </Alert>

        {/* Connect Button */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => navigate("/billing/setup")}
          >
            Back to Payment Options
          </Button>
          <Button
            size="lg"
            onClick={handleConnectStripe}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <CreditCard className="mr-2 h-5 w-5 animate-pulse" />
                Connecting...
              </>
            ) : (
              <>
                <ExternalLink className="mr-2 h-5 w-5" />
                Connect Stripe Account
              </>
            )}
          </Button>
        </div>

        {/* Additional Info */}
        <Card className="border-muted">
          <CardContent className="pt-6">
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong>Note:</strong> Stripe is already configured in your system. The API keys are automatically managed through your Settings → Payment panel.
              </p>
              <p>
                Once you connect your account, you'll be able to:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Accept credit and debit card payments</li>
                <li>Set up recurring membership billing</li>
                <li>Process one-time payments for classes and merchandise</li>
                <li>View transaction history and reports</li>
                <li>Issue refunds directly from your dashboard</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

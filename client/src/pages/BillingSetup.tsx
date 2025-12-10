import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, FileText, CheckCircle } from "lucide-react";

export default function BillingSetup() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Payment Processing Setup</h1>
        <p className="text-muted-foreground">
          Choose a payment processor to accept credit card payments from your students
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Stripe Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <img src="/logos/stripe.svg" alt="Stripe" className="h-8" />
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-semibold">
                RECOMMENDED
              </span>
            </div>
            <CardTitle>Stripe</CardTitle>
            <CardDescription>
              Fast, secure payment processing with instant setup
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <p className="text-sm">Quick 5-minute setup</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <p className="text-sm">Accept all major credit cards</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <p className="text-sm">2.9% + $0.30 per transaction</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <p className="text-sm">No monthly fees or minimums</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <p className="text-sm">Instant activation</p>
              </div>
            </div>

            <Button 
              className="w-full" 
              onClick={() => navigate("/billing/stripe-setup")}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Setup Stripe
            </Button>
          </CardContent>
        </Card>

        {/* PC Bancard Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="mb-4">
              <img src="/logos/pcbancard.jpg" alt="PC Bancard" className="h-8" />
            </div>
            <CardTitle>PC Bancard</CardTitle>
            <CardDescription>
              Traditional merchant account with competitive rates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <p className="text-sm">Competitive processing rates</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <p className="text-sm">Dedicated account representative</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <p className="text-sm">Randy Sinclair: 682-218-1669</p>
              </div>
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-blue-600 mt-0.5" />
                <p className="text-sm">Requires document submission</p>
              </div>
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-blue-600 mt-0.5" />
                <p className="text-sm">2-3 business days processing</p>
              </div>
            </div>

            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => navigate("/billing/pcbancard-application")}
            >
              <FileText className="mr-2 h-4 w-4" />
              Apply for PC Bancard
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Requirements Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>PC Bancard Application Requirements</CardTitle>
          <CardDescription>
            If you choose PC Bancard, you'll need to provide the following documents:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Required Documents:</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Copy of driver's license</li>
                <li>• Voided check (matching bank account)</li>
                <li>• Copy of state EIN #</li>
                <li>• Business address verification</li>
                <li>• Bank letter (good standing confirmation)</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Important Notes:</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Business address must match application</li>
                <li>• Bank account info must match across all documents</li>
                <li>• Bank letter must show account # and routing #</li>
                <li>• Processing time: 2-3 business days</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

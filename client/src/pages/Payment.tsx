import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  DollarSign
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export default function Payment() {
  const [, setLocation] = useLocation();
  const [submitted, setSubmitted] = useState(false);
  const [paymentType, setPaymentType] = useState("dues");
  const [amount, setAmount] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [zipCode, setZipCode] = useState("");

  const paymentOptions = [
    { value: "dues", label: "Monthly Dues", amount: "$150" },
    { value: "testing", label: "Belt Testing Fee", amount: "$75" },
    { value: "uniform", label: "Uniform Purchase", amount: "$60" },
    { value: "custom", label: "Custom Amount", amount: "" }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full border-slate-800 bg-slate-900/50 backdrop-blur-sm p-12">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-6 rounded-full bg-gradient-to-br from-green-600 to-green-700 shadow-lg">
                <CheckCircle2 className="h-20 w-20 text-white" />
              </div>
            </div>

            <div>
              <h2 className="text-4xl font-bold text-white mb-2">
                Payment Successful!
              </h2>
              <p className="text-xl text-slate-300 mb-4">
                Your payment has been processed
              </p>
            </div>

            <div className="p-6 rounded-lg bg-slate-800/50">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400">Amount Paid:</span>
                <span className="text-2xl font-bold text-white">${amount || "150"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Payment Type:</span>
                <span className="text-white capitalize">
                  {paymentOptions.find(p => p.value === paymentType)?.label}
                </span>
              </div>
            </div>

            <p className="text-slate-400 text-sm">
              A receipt has been sent to your phone
            </p>

            <Button
              size="lg"
              onClick={() => setLocation("/")}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
            >
              Done
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-6 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">Make a Payment</h1>
            <p className="text-sm text-slate-400">Pay dues, fees, or make a purchase</p>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Student Lookup */}
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm p-6">
              <Label htmlFor="phone" className="text-white text-lg mb-3 block">
                Student Phone Number *
              </Label>
              <Input
                id="phone"
                type="tel"
                required
                placeholder="(555) 123-4567"
                value={studentPhone}
                onChange={(e) => setStudentPhone(e.target.value)}
                className="h-12 bg-slate-800 border-slate-700 text-white text-lg"
              />
              <p className="text-sm text-slate-400 mt-2">
                Enter your phone number to look up your account
              </p>
            </Card>

            {/* Payment Type Selection */}
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm p-6">
              <Label className="text-white text-lg mb-4 block">
                What are you paying for? *
              </Label>
              <RadioGroup value={paymentType} onValueChange={setPaymentType}>
                <div className="space-y-3">
                  {paymentOptions.map((option) => (
                    <div
                      key={option.value}
                      className="flex items-center space-x-3 p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer"
                      onClick={() => setPaymentType(option.value)}
                    >
                      <RadioGroupItem value={option.value} id={option.value} />
                      <Label
                        htmlFor={option.value}
                        className="flex-1 text-white text-lg cursor-pointer"
                      >
                        {option.label}
                      </Label>
                      {option.amount && (
                        <span className="text-green-500 font-semibold text-lg">
                          {option.amount}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </RadioGroup>

              {paymentType === "custom" && (
                <div className="mt-4">
                  <Label htmlFor="amount" className="text-white text-lg mb-2 block">
                    Enter Amount
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      id="amount"
                      type="number"
                      required
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="h-12 pl-10 bg-slate-800 border-slate-700 text-white text-lg"
                    />
                  </div>
                </div>
              )}
            </Card>

            {/* Payment Information */}
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-lg bg-gradient-to-br from-green-600 to-green-700">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">Payment Information</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="cardNumber" className="text-white text-lg mb-2 block">
                    Card Number *
                  </Label>
                  <Input
                    id="cardNumber"
                    type="text"
                    required
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    maxLength={19}
                    className="h-12 bg-slate-800 border-slate-700 text-white text-lg"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="expiry" className="text-white text-lg mb-2 block">
                      Expiry *
                    </Label>
                    <Input
                      id="expiry"
                      type="text"
                      required
                      placeholder="MM/YY"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      maxLength={5}
                      className="h-12 bg-slate-800 border-slate-700 text-white text-lg"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvv" className="text-white text-lg mb-2 block">
                      CVV *
                    </Label>
                    <Input
                      id="cvv"
                      type="text"
                      required
                      placeholder="123"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      maxLength={4}
                      className="h-12 bg-slate-800 border-slate-700 text-white text-lg"
                    />
                  </div>
                  <div>
                    <Label htmlFor="zip" className="text-white text-lg mb-2 block">
                      ZIP Code *
                    </Label>
                    <Input
                      id="zip"
                      type="text"
                      required
                      placeholder="12345"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      maxLength={5}
                      className="h-12 bg-slate-800 border-slate-700 text-white text-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-lg bg-blue-950/30 border border-blue-900/50">
                <p className="text-sm text-blue-300 flex items-start gap-2">
                  <span className="text-blue-500">🔒</span>
                  <span>Your payment information is encrypted and secure. We use industry-standard security measures to protect your data.</span>
                </p>
              </div>
            </Card>

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 h-14 text-lg"
            >
              Process Payment
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}


import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { APP_LOGO, APP_TITLE } from "@/const";
import { 
  ArrowLeft,
  CreditCard,
  DollarSign,
  Download,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import { useLocation } from "wouter";

/**
 * Student Payments - View payment history and make payments
 */
export default function StudentPayments() {
  const [, setLocation] = useLocation();
  const [payments, setPayments] = useState<any[]>([]);
  const [accountBalance, setAccountBalance] = useState(0);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");

  useEffect(() => {
    // Check if student is logged in
    const isLoggedIn = localStorage.getItem("student_logged_in");
    if (!isLoggedIn) {
      setLocation("/student-login");
      return;
    }

    // TODO: Fetch payment history from backend API
    // Mock data for now
    setAccountBalance(0);
    setPayments([
      {
        id: 1,
        date: "Oct 1, 2025",
        description: "Monthly Membership - October",
        amount: 150.00,
        status: "completed",
        method: "Credit Card",
        invoice: "INV-2025-001"
      },
      {
        id: 2,
        date: "Sep 1, 2025",
        description: "Monthly Membership - September",
        amount: 150.00,
        status: "completed",
        method: "Credit Card",
        invoice: "INV-2025-002"
      },
      {
        id: 3,
        date: "Aug 15, 2025",
        description: "Uniform Purchase",
        amount: 75.00,
        status: "completed",
        method: "Debit Card",
        invoice: "INV-2025-003"
      },
      {
        id: 4,
        date: "Aug 1, 2025",
        description: "Monthly Membership - August",
        amount: 150.00,
        status: "completed",
        method: "Credit Card",
        invoice: "INV-2025-004"
      },
      {
        id: 5,
        date: "Jul 1, 2025",
        description: "Monthly Membership - July",
        amount: 150.00,
        status: "completed",
        method: "Credit Card",
        invoice: "INV-2025-005"
      }
    ]);
  }, [setLocation]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-600 text-white border-0">Completed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-600 text-white border-0">Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-600 text-white border-0">Failed</Badge>;
      default:
        return null;
    }
  };

  const handleMakePayment = () => {
    setShowPaymentDialog(true);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Process payment through backend API
    console.log("Processing payment:", paymentAmount);
    setShowPaymentDialog(false);
    setPaymentAmount("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setLocation("/student-dashboard")}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-white">Payments</h1>
              <p className="text-xs text-slate-400">View payment history and make payments</p>
            </div>
          </div>
          
          {APP_LOGO && (
            <img 
              src={APP_LOGO} 
              alt={APP_TITLE} 
              className="h-10 w-auto"
            />
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Account Balance Card */}
          <Card className="bg-gradient-to-br from-blue-600 to-blue-800 border-0 p-8 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm mb-2">Current Balance</p>
                <p className="text-5xl font-bold text-white mb-4">
                  ${accountBalance.toFixed(2)}
                </p>
                {accountBalance === 0 ? (
                  <Badge className="bg-green-500 text-white border-0">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    All Paid Up
                  </Badge>
                ) : (
                  <Badge className="bg-yellow-500 text-white border-0">
                    <Clock className="h-3 w-3 mr-1" />
                    Payment Due
                  </Badge>
                )}
              </div>
              <div className="p-4 rounded-full bg-white/20">
                <DollarSign className="h-12 w-12 text-white" />
              </div>
            </div>
            
            {accountBalance > 0 && (
              <Button
                onClick={handleMakePayment}
                className="w-full mt-6 bg-white text-blue-600 hover:bg-blue-50"
                size="lg"
              >
                <CreditCard className="h-5 w-5 mr-2" />
                Make Payment
              </Button>
            )}
          </Card>

          {/* Payment History */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">Payment History</h2>
            <p className="text-slate-400 mb-6">View all your past transactions</p>
          </div>

          <div className="space-y-4">
            {payments.map((payment) => (
              <Card 
                key={payment.id}
                className="bg-slate-900/50 backdrop-blur-sm border-slate-800 p-6 hover:border-blue-600 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-3 rounded-full bg-blue-600/20">
                      {getStatusIcon(payment.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-white mb-1">
                            {payment.description}
                          </h3>
                          <p className="text-sm text-slate-400">
                            {payment.date} • {payment.method}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            Invoice: {payment.invoice}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-white mb-1">
                            ${payment.amount.toFixed(2)}
                          </p>
                          {getStatusBadge(payment.status)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {payment.status === "completed" && (
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    <Button
                      variant="ghost"
                      className="text-blue-400 hover:text-blue-300"
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Receipt
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* Make Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Make a Payment</DialogTitle>
            <DialogDescription className="text-slate-400">
              Enter payment details to complete your transaction
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div>
              <Label htmlFor="amount" className="text-white">Payment Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
                required
              />
            </div>

            <div>
              <Label htmlFor="card" className="text-white">Card Number</Label>
              <Input
                id="card"
                type="text"
                placeholder="1234 5678 9012 3456"
                className="bg-slate-800 border-slate-700 text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiry" className="text-white">Expiry Date</Label>
                <Input
                  id="expiry"
                  type="text"
                  placeholder="MM/YY"
                  className="bg-slate-800 border-slate-700 text-white"
                  required
                />
              </div>
              <div>
                <Label htmlFor="cvv" className="text-white">CVV</Label>
                <Input
                  id="cvv"
                  type="text"
                  placeholder="123"
                  className="bg-slate-800 border-slate-700 text-white"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPaymentDialog(false)}
                className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Process Payment
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

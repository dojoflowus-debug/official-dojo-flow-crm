import { useNavigate } from 'react-router-dom';
import DojoFlowLayout from '@/components/DojoFlowLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DollarSign, CreditCard, AlertCircle, TrendingUp, Plus, Download, Settings, FileText, CheckCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export default function Billing() {
  const navigate = useNavigate();
  const { data: paymentMethod } = trpc.billing.getActivePaymentMethod.useQuery();
  const { data: applications } = trpc.billing.getApplications.useQuery();

  const payments = [
    { id: 1, student: 'Sarah Johnson', amount: 150, date: '2024-10-01', status: 'Paid', method: 'Credit Card' },
    { id: 2, student: 'Mike Chen', amount: 150, date: '2024-10-02', status: 'Paid', method: 'Bank Transfer' },
    { id: 3, student: 'Emma Davis', amount: 150, date: '2024-10-05', status: 'Overdue', method: 'Credit Card' },
    { id: 4, student: 'Alex Martinez', amount: 200, date: '2024-10-03', status: 'Paid', method: 'Cash' },
    { id: 5, student: 'Lisa Wang', amount: 150, date: '2024-10-04', status: 'Paid', method: 'Credit Card' },
  ];

  const hasActivePaymentProcessor = paymentMethod && paymentMethod.isActive;
  const hasPendingApplications = applications && applications.some(app => 
    app.status === 'submitted' || app.status === 'under_review'
  );

  return (
    <DojoFlowLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Billing & Payments</h1>
            <p className="text-muted-foreground">Manage memberships, payments, and invoices</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/billing/applications')}>
              <FileText className="h-4 w-4 mr-2" />
              Applications
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </Button>
          </div>
        </div>

        {/* Payment Processor Setup Alert */}
        {!hasActivePaymentProcessor && (
          <Alert className="border-blue-200 bg-blue-50">
            <Settings className="h-4 w-4 text-blue-600" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <strong className="text-blue-900">Payment Processor Setup Required</strong>
                <p className="text-blue-800 mt-1">
                  {hasPendingApplications 
                    ? "Your payment processor application is being reviewed. You'll be able to accept payments once approved."
                    : "Set up a payment processor to start accepting credit card payments from your students."}
                </p>
              </div>
              <Button 
                variant="outline" 
                className="ml-4 border-blue-300 text-blue-900 hover:bg-blue-100"
                onClick={() => navigate('/billing/setup')}
              >
                {hasPendingApplications ? 'View Status' : 'Setup Now'}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Active Payment Processor Card */}
        {hasActivePaymentProcessor && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-green-900">Payment Processor Active</h3>
                    <p className="text-sm text-green-800">
                      {paymentMethod.provider === 'stripe' ? 'Stripe' : 
                       paymentMethod.provider === 'pcbancard' ? 'PC Bancard' : 
                       paymentMethod.providerName || 'Payment Processor'} is configured and ready to accept payments
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-green-300 text-green-900 hover:bg-green-100"
                  onClick={() => navigate('/billing/applications')}
                >
                  Manage
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-foreground">$21,000</p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Collected This Month</p>
                  <p className="text-2xl font-bold text-foreground">$18,500</p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <CreditCard className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overdue Payments</p>
                  <p className="text-2xl font-bold text-foreground">$450</p>
                </div>
                <div className="p-3 bg-red-500/10 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Growth</p>
                  <p className="text-2xl font-bold text-foreground">+15%</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
            <CardDescription>
              {hasActivePaymentProcessor 
                ? "View and manage recent payment transactions"
                : "Setup a payment processor to start tracking transactions"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Student</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Method</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-border hover:bg-accent/50 transition-colors">
                      <td className="py-4 px-4">
                        <p className="font-medium text-foreground">{payment.student}</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm font-semibold text-foreground">${payment.amount}</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-muted-foreground">{payment.date}</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-muted-foreground">{payment.method}</p>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          payment.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <Button variant="outline" size="sm">
                          View Invoice
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DojoFlowLayout>
  );
}

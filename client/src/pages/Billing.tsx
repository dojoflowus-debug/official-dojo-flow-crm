import { useNavigate } from 'react-router-dom';
import ManagementLayout from '@/components/ManagementLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DollarSign, CreditCard, AlertCircle, TrendingUp,
  Plus, Download, FileText, CheckCircle, Sliders,
  Settings, Receipt, ArrowUpRight
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
export default function Billing() {
  const navigate = useNavigate();

  const { data: paymentMethod } = trpc.billing.getActivePaymentMethod.useQuery();
  const { data: applications } = trpc.billing.getApplications.useQuery();

  const hasActivePaymentProcessor = paymentMethod && paymentMethod.isActive;
  const hasPendingApplications = applications && applications.some(
    (app) => app.status === 'submitted' || app.status === 'under_review'
  );

  // Real stats — all zero until payment processor is connected and payments flow in
  const stats = [
    {
      label: 'Monthly Revenue',
      value: hasActivePaymentProcessor ? '$0' : '—',
      icon: DollarSign,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      note: hasActivePaymentProcessor ? 'No payments this month' : 'Connect a processor',
    },
    {
      label: 'Collected This Month',
      value: hasActivePaymentProcessor ? '$0' : '—',
      icon: CreditCard,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      note: hasActivePaymentProcessor ? 'No collections yet' : 'Connect a processor',
    },
    {
      label: 'Overdue Payments',
      value: hasActivePaymentProcessor ? '$0' : '—',
      icon: AlertCircle,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      note: hasActivePaymentProcessor ? 'No overdue payments' : 'Connect a processor',
    },
    {
      label: 'Active Members',
      value: '—',
      icon: TrendingUp,
      color: 'text-primary',
      bg: 'bg-primary/10',
      note: 'Connect processor to track',
    },
  ];

  return (
    <ManagementLayout>
      <div className="space-y-6 animate-in fade-in duration-500">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Billing & Payments</h1>
            <p className="text-muted-foreground">Manage memberships, payments, and invoices</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/billing/structure')}>
              <Sliders className="h-4 w-4 mr-2" />
              Programs & Plans
            </Button>
            <Button variant="outline" onClick={() => navigate('/billing/applications')}>
              <FileText className="h-4 w-4 mr-2" />
              Applications
            </Button>
            <Button variant="outline" disabled={!hasActivePaymentProcessor}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90"
              disabled={!hasActivePaymentProcessor}
              onClick={() => hasActivePaymentProcessor && navigate('/billing/new-invoice')}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </Button>
          </div>
        </div>

        {/* ── Payment Processor Alert / Active Badge ────────────────── */}
        {!hasActivePaymentProcessor ? (
          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800">
            <Settings className="h-4 w-4 text-blue-600" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <strong className="text-blue-900 dark:text-blue-200">
                  Payment Processor Setup Required
                </strong>
                <p className="text-blue-800 dark:text-blue-300 mt-1">
                  {hasPendingApplications
                    ? 'Your payment processor application is being reviewed. You\'ll be able to accept payments once approved.'
                    : 'Set up a payment processor to start accepting credit card payments from your students.'}
                </p>
              </div>
              <Button
                variant="outline"
                className="ml-4 border-blue-300 text-blue-900 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-200 dark:hover:bg-blue-900/40 shrink-0"
                onClick={() => navigate('/billing/setup')}
              >
                {hasPendingApplications ? 'View Status' : 'Setup Now'}
                <ArrowUpRight className="h-3 w-3 ml-1" />
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-green-900 dark:text-green-200">
                      Payment Processor Active
                    </h3>
                    <p className="text-sm text-green-800 dark:text-green-300">
                      {paymentMethod.provider === 'stripe'
                        ? 'Stripe'
                        : paymentMethod.provider === 'pcbancard'
                        ? 'PC Bancard'
                        : paymentMethod.providerName || 'Payment Processor'}{' '}
                      is configured and ready to accept payments
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-green-300 text-green-900 hover:bg-green-100 dark:border-green-700 dark:text-green-200"
                  onClick={() => navigate('/billing/applications')}
                >
                  Manage
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Stats Grid ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    {stat.note && (
                      <p className="text-xs text-muted-foreground mt-0.5">{stat.note}</p>
                    )}
                  </div>
                  <div className={`p-3 ${stat.bg} rounded-lg`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Recent Payments ───────────────────────────────────────────── */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
            <CardDescription>
              {hasActivePaymentProcessor
                ? 'View and manage recent payment transactions'
                : 'Set up a payment processor to start tracking transactions'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!hasActivePaymentProcessor ? (
              /* Empty state — no processor */
              <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
                <div className="p-4 bg-muted/40 rounded-full">
                  <Receipt className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">No payment records yet</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    Once you connect a payment processor and students start paying, their transactions will appear here.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => navigate('/billing/setup')}
                  className="mt-2"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Set Up Payment Processor
                </Button>
              </div>
            ) : (
              /* Empty state — processor active but no payments yet */
              <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
                <div className="p-4 bg-muted/40 rounded-full">
                  <Receipt className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">No payments recorded yet</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    Payments from your students will appear here once they start coming in.
                  </p>
                </div>
                <Button
                  className="bg-primary hover:bg-primary/90 mt-2"
                  onClick={() => navigate('/billing/new-invoice')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Invoice
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ManagementLayout>
  );
}

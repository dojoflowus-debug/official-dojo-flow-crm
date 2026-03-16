import { useNavigate } from 'react-router-dom';
import ManagementLayout from '@/components/ManagementLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DollarSign, CreditCard, AlertCircle, TrendingUp,
  Plus, Download, FileText, Sliders, Receipt
} from 'lucide-react';
export default function Billing() {
  const navigate = useNavigate();

  // Real stats — all zero until payments flow in
  const stats = [
    {
      label: 'Monthly Revenue',
      value: '$0',
      icon: DollarSign,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      note: 'No payments this month',
    },
    {
      label: 'Collected This Month',
      value: '$0',
      icon: CreditCard,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      note: 'No collections yet',
    },
    {
      label: 'Overdue Payments',
      value: '$0',
      icon: AlertCircle,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      note: 'No overdue payments',
    },
    {
      label: 'Active Members',
      value: '—',
      icon: TrendingUp,
      color: 'text-primary',
      bg: 'bg-primary/10',
      note: 'Coming soon',
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
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={() => navigate('/billing/new-invoice')}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </Button>
          </div>
        </div>



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
            <CardDescription>View and manage recent payment transactions</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>
    </ManagementLayout>
  );
}

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { AlertCircle, TrendingUp, Users, Calendar, Target, DollarSign, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type DateRange = 'today' | '7d' | '30d';

export function OwnerCommandCenter() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange>('today');
  const [selectedLocation, setSelectedLocation] = useState<number | undefined>();

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = trpc.system.stats.useQuery({});

  // Check if user is owner or admin
  const isOwnerOrAdmin = user?.role === 'owner' || user?.role === 'admin';

  if (!isOwnerOrAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-amber-500" />
          <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
          <p className="text-muted-foreground">Only owners and admins can view the command center.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Command Center</h1>
              <p className="text-muted-foreground mt-1">Real-time business metrics and insights</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Organization: {user?.activeOrgId}</p>
              <p className="text-sm font-medium">{new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4 items-center">
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-2">Date Range</label>
              <div className="flex gap-2">
                {(['today', '7d', '30d'] as const).map((range) => (
                  <Button
                    key={range}
                    variant={dateRange === range ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDateRange(range)}
                  >
                    {range === 'today' ? 'Today' : range === '7d' ? '7 Days' : '30 Days'}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* KPI Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {/* Active Students */}
          <KPITile
            icon={Users}
            label="Active Students"
            value={stats?.active_students || 0}
            trend={0}
            link="/students"
            isLoading={statsLoading}
          />

          {/* Today's Attendance */}
          <KPITile
            icon={Calendar}
            label="Today's Attendance"
            value={stats?.todays_attendance || 0}
            trend={0}
            link="/students"
            isLoading={statsLoading}
          />

          {/* New Leads */}
          <KPITile
            icon={Target}
            label={`New Leads (${dateRange})`}
            value={stats?.new_leads || 0}
            trend={0}
            link="/leads"
            isLoading={statsLoading}
          />

          {/* Trials Scheduled */}
          <KPITile
            icon={TrendingUp}
            label="Trials Scheduled"
            value={stats?.trials_scheduled || 0}
            trend={0}
            link="/leads"
            isLoading={statsLoading}
          />

          {/* New Enrollments */}
          <KPITile
            icon={Users}
            label="New Enrollments"
            value={stats?.new_enrollments || 0}
            trend={0}
            link="/students"
            isLoading={statsLoading}
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Enrollment Funnel */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Enrollment Funnel</h2>
              <div className="space-y-4">
                <FunnelStage label="Leads" value={stats?.total_leads || 0} percentage={100} />
                <FunnelStage label="Trials Scheduled" value={stats?.trials_scheduled || 0} percentage={stats?.total_leads ? Math.round((stats.trials_scheduled / stats.total_leads) * 100) : 0} />
                <FunnelStage label="Trials Attended" value={0} percentage={0} notAvailable={true} />
                <FunnelStage label="Enrolled" value={stats?.new_enrollments || 0} percentage={stats?.total_leads ? Math.round((stats.new_enrollments / stats.total_leads) * 100) : 0} />
              </div>
              <div className="mt-6 pt-4 border-t">
                <Button variant="outline" className="w-full" asChild>
                  <a href="/leads">View Leads Pipeline</a>
                </Button>
              </div>
            </Card>
          </div>

          {/* Alerts Panel */}
          <div>
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Alerts & Signals
              </h2>
              <div className="space-y-3">
                {stats?.alerts && stats.alerts.length > 0 ? (
                  stats.alerts.map((alert: any) => (
                    <a
                      key={alert.id}
                      href={alert.link}
                      className="block p-3 rounded-lg hover:opacity-80 transition border"
                    >
                      <div className={`font-semibold text-sm ${alert.severity === 'critical' ? 'text-red-500' : 'text-amber-500'}`}>
                        {alert.title}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{alert.description}</div>
                    </a>
                  ))
                ) : (
                  <AlertItem
                    severity="info"
                    title="All Clear"
                    description="No critical alerts"
                  />
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Attendance Trend */}
        <Card className="p-6 mt-6">
          <h2 className="text-lg font-semibold mb-4">Attendance Trend</h2>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <p>Attendance data coming soon</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

// KPI Tile Component
function KPITile({
  icon: Icon,
  label,
  value,
  trend,
  link,
  isLoading,
  notAvailable,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  trend: number;
  link: string;
  isLoading: boolean;
  notAvailable?: boolean;
}) {
  return (
    <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = link}>
      <div className="flex items-start justify-between mb-2">
        <Icon className="w-5 h-5 text-primary" />
        {trend !== 0 && (
          <span className={`text-xs font-semibold ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      {notAvailable ? (
        <p className="text-xs text-muted-foreground italic">Not available yet</p>
      ) : (
        <p className="text-2xl font-bold">{isLoading ? '—' : value}</p>
      )}
    </Card>
  );
}

// Funnel Stage Component
function FunnelStage({
  label,
  value,
  percentage,
  notAvailable,
}: {
  label: string;
  value: number;
  percentage: number;
  notAvailable?: boolean;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium">{label}</span>
        {notAvailable ? (
          <span className="text-xs text-muted-foreground italic">Not tracked</span>
        ) : (
          <span className="text-sm font-semibold">{value}</span>
        )}
      </div>
      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        <div
          className="bg-primary h-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Alert Item Component
function AlertItem({
  severity,
  title,
  description,
  cta,
  link,
}: {
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  cta?: string;
  link?: string;
}) {
  const severityColors = {
    critical: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
    warning: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
    info: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
  };

  const severityIcons = {
    critical: <AlertCircle className="w-4 h-4 text-red-600" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-600" />,
    info: <AlertCircle className="w-4 h-4 text-blue-600" />,
  };

  return (
    <div className={`p-3 rounded-lg border ${severityColors[severity]}`}>
      <div className="flex gap-2 items-start mb-1">
        {severityIcons[severity]}
        <div className="flex-1">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      {cta && link && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-2 h-7 text-xs"
          asChild
        >
          <a href={link}>{cta}</a>
        </Button>
      )}
    </div>
  );
}

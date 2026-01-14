/**
 * KAI Command - Operational Status Dashboard
 * 
 * Premium, minimal command center UI for monitoring incidents, alerts, and operations
 * Color scheme: no green, cyan/blue for positive, amber for warning, red for critical, grayscale for neutral
 */

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X, ChevronRight, Filter } from 'lucide-react';

type SeverityType = 'critical' | 'high' | 'medium' | 'low';
type StatusType = 'open' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed';

// Color mapping - NO GREEN ANYWHERE
const SEVERITY_COLORS: Record<SeverityType, { bg: string; text: string; border: string; icon: string }> = {
  critical: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    text: 'text-red-900 dark:text-red-200',
    border: 'border-red-200 dark:border-red-800',
    icon: 'text-red-600 dark:text-red-400',
  },
  high: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    text: 'text-amber-900 dark:text-amber-200',
    border: 'border-amber-200 dark:border-amber-800',
    icon: 'text-amber-600 dark:text-amber-400',
  },
  medium: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    text: 'text-blue-900 dark:text-blue-200',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-600 dark:text-blue-400',
  },
  low: {
    bg: 'bg-slate-50 dark:bg-slate-900/30',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700',
    icon: 'text-slate-500 dark:text-slate-400',
  },
};

const STATUS_COLORS: Record<StatusType, string> = {
  open: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200',
  acknowledged: 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200',
  in_progress: 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-800 dark:text-cyan-200',
  resolved: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200',
  closed: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200',
};

const ALERT_TYPE_ICONS: Record<string, React.ReactNode> = {
  critical: <AlertCircle className="w-5 h-5" />,
  high: <AlertTriangle className="w-5 h-5" />,
  medium: <Info className="w-5 h-5" />,
  low: <Info className="w-5 h-5" />,
};

export function KaiCommandDashboard() {
  const { user } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'critical' | 'high'>('all');
  const [expandedIncident, setExpandedIncident] = useState<number | null>(null);

  // Get organization ID from user context (default to 1 for now)
  const orgId = 1;

  // Fetch incidents
  const { data: incidents = [], isLoading: incidentsLoading } = trpc.kaiCommand.incidents.list.useQuery(
    {
      organizationId: orgId,
      severity: selectedFilter === 'all' ? undefined : (selectedFilter as SeverityType),
      limit: 50,
    }
  );

  // Fetch alerts
  const { data: alerts = [], isLoading: alertsLoading } = trpc.kaiCommand.alerts.list.useQuery(
    {
      organizationId: orgId,
      dismissed: false,
      limit: 50,
    }
  );

  // Fetch operations log
  const { data: operations = [], isLoading: operationsLoading } = trpc.kaiCommand.operations.getLog.useQuery(
    {
      organizationId: orgId,
      limit: 100,
    }
  );

  // Calculate stats
  const stats = useMemo(() => ({
    critical: incidents.filter((i: any) => i.severity === 'critical').length,
    high: incidents.filter((i: any) => i.severity === 'high').length,
    total: incidents.length,
    activeAlerts: alerts.length,
  }), [incidents, alerts]);

  const isLoading = incidentsLoading || alertsLoading || operationsLoading;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">KAI Command</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">Operational Status Dashboard</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm">
                {user?.name || 'User'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Critical */}
          <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 rounded-lg p-4 hover:border-red-300 dark:hover:border-red-800 transition-colors shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Critical</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-500 mt-1">{stats.critical}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600/50 dark:text-red-500/50" />
            </div>
          </div>

          {/* High */}
          <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 rounded-lg p-4 hover:border-amber-300 dark:hover:border-amber-800 transition-colors shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">High</p>
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-500 mt-1">{stats.high}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-amber-600/50 dark:text-amber-500/50" />
            </div>
          </div>

          {/* Total Incidents */}
          <div className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/50 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-800 transition-colors shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Total</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.total}</p>
              </div>
              <Info className="w-8 h-8 text-blue-600/50 dark:text-blue-500/50" />
            </div>
          </div>

          {/* Active Alerts */}
          <div className="bg-white dark:bg-slate-900 border border-cyan-200 dark:border-cyan-900/50 rounded-lg p-4 hover:border-cyan-300 dark:hover:border-cyan-800 transition-colors shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Alerts</p>
                <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400 mt-1">{stats.activeAlerts}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-cyan-600/50 dark:text-cyan-500/50" />
            </div>
          </div>
        </div>

        {/* Priority Actions */}
        {alerts.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Priority Actions</h2>
              <button className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
                <Filter className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {alerts.slice(0, 5).map((alert: any) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border ${SEVERITY_COLORS[alert.severity as SeverityType].bg} ${SEVERITY_COLORS[alert.severity as SeverityType].border}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={SEVERITY_COLORS[alert.severity as SeverityType].icon}>
                        {ALERT_TYPE_ICONS[alert.severity] || <Info className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className={`font-medium ${SEVERITY_COLORS[alert.severity as SeverityType].text}`}>
                          {alert.title}
                        </p>
                        {alert.message && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{alert.message}</p>
                        )}
                      </div>
                    </div>
                    <button className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Incidents */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Incidents</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedFilter === 'all'
                    ? 'bg-slate-900 dark:bg-slate-700 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedFilter('critical')}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedFilter === 'critical'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                Critical
              </button>
              <button
                onClick={() => setSelectedFilter('high')}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedFilter === 'high'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                High
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin">
                <div className="w-8 h-8 border-2 border-slate-300 dark:border-slate-600 border-t-cyan-500 rounded-full" />
              </div>
              <p className="text-slate-600 dark:text-slate-400 mt-4">Loading incidents...</p>
            </div>
          ) : incidents.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
              <CheckCircle2 className="w-12 h-12 text-cyan-500/50 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">No incidents to display</p>
            </div>
          ) : (
            <div className="space-y-3">
              {incidents.map((incident: any) => (
                <div
                  key={incident.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer shadow-sm"
                  onClick={() => setExpandedIncident(expandedIncident === incident.id ? null : incident.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={SEVERITY_COLORS[incident.severity as SeverityType].icon}>
                        {ALERT_TYPE_ICONS[incident.severity] || <Info className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900 dark:text-white">{incident.title}</h3>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[incident.status as StatusType]}`}>
                            {incident.status}
                          </span>
                        </div>
                        {incident.description && expandedIncident === incident.id && (
                          <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">{incident.description}</p>
                        )}
                        <p className="text-slate-500 dark:text-slate-500 text-xs mt-1">
                          {new Date(incident.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 text-slate-400 dark:text-slate-600 transition-transform ${
                        expandedIncident === incident.id ? 'rotate-90' : ''
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Operations Log */}
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Operations Log</h2>
          {operations.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
              <p className="text-slate-600 dark:text-slate-400">No operations recorded</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto bg-white dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
              {operations.slice(0, 20).map((op: any) => (
                <div
                  key={op.id}
                  className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded p-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span>{op.action}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-500">
                      {new Date(op.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default KaiCommandDashboard;

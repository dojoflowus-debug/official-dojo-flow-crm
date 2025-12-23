/**
 * Organization Detail View
 * Platform admin detailed view of single organization
 */

import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import PlatformAdminLayout from "@/components/PlatformAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function OrganizationDetail() {
  const [, params] = useRoute("/admin/organizations/:id");
  const organizationId = params?.id ? parseInt(params.id) : 0;

  const { data, isLoading } = trpc.platform.getOrganization.useQuery({
    organizationId,
  });

  const formatDate = (date: Date | string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      trial: { variant: "secondary", label: "Trial" },
      active: { variant: "default", label: "Active" },
      past_due: { variant: "destructive", label: "Past Due" },
      cancelled: { variant: "outline", label: "Cancelled" },
      inactive: { variant: "outline", label: "Inactive" },
    };

    const config = variants[status] || { variant: "outline", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <PlatformAdminLayout>
        <div className="text-center py-12 text-slate-400">Loading...</div>
      </PlatformAdminLayout>
    );
  }

  if (!data?.organization) {
    return (
      <PlatformAdminLayout>
        <div className="text-center py-12 text-slate-400">
          Organization not found
        </div>
      </PlatformAdminLayout>
    );
  }

  const { organization, users, subscription, onboarding, flags } = data;

  return (
    <PlatformAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin/organizations">
              <a className="text-sm text-slate-400 hover:text-slate-300 mb-2 inline-block">
                ← Back to Organizations
              </a>
            </Link>
            <h1 className="text-3xl font-bold text-white">{organization.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              {getStatusBadge(organization.subscriptionStatus)}
              {flags && flags.length > 0 && (
                <Badge variant="destructive">{flags.length} Active Flags</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Organization Profile */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Organization Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-slate-400">Status</p>
                <p className="text-white font-medium mt-1">
                  {organization.subscriptionStatus}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Plan ID</p>
                <p className="text-white font-medium mt-1">
                  {organization.planId || "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Trial Ends</p>
                <p className="text-white font-medium mt-1">
                  {formatDate(organization.trialEndsAt)}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Created</p>
                <p className="text-white font-medium mt-1">
                  {formatDate(organization.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Last Activity</p>
                <p className="text-white font-medium mt-1">
                  {formatDate(organization.lastActivity)}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Timezone</p>
                <p className="text-white font-medium mt-1">
                  {organization.timezone}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Users & Access</CardTitle>
          </CardHeader>
          <CardContent>
            {users && users.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">Name</TableHead>
                    <TableHead className="text-slate-300">Email</TableHead>
                    <TableHead className="text-slate-300">Role</TableHead>
                    <TableHead className="text-slate-300">Primary</TableHead>
                    <TableHead className="text-slate-300">Added</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="border-slate-700">
                      <TableCell className="text-white">
                        {user.userName || "—"}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {user.userEmail || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.role}</Badge>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {user.isPrimary ? "Yes" : "No"}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {formatDate(user.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-slate-400 text-center py-8">No users found</p>
            )}
          </CardContent>
        </Card>

        {/* Subscription Info */}
        {subscription && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Subscription Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-slate-400">Plan</p>
                  <p className="text-white font-medium mt-1">{subscription.plan}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Billing Status</p>
                  <p className="text-white font-medium mt-1">
                    {subscription.billingStatus}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Stripe Customer ID</p>
                  <p className="text-white font-medium mt-1 font-mono text-sm">
                    {subscription.stripeCustomerId || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Current Period End</p>
                  <p className="text-white font-medium mt-1">
                    {formatDate(subscription.currentPeriodEnd)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Flags */}
        {flags && flags.length > 0 && (
          <Card className="bg-slate-800 border-slate-700 border-red-900/50">
            <CardHeader>
              <CardTitle className="text-white">Active Flags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {flags.map((flag) => (
                  <div
                    key={flag.id}
                    className="p-4 bg-red-950/30 border border-red-900/50 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant="destructive" className="mb-2">
                          {flag.flagType}
                        </Badge>
                        <p className="text-slate-300 text-sm">{flag.notes}</p>
                        <p className="text-slate-500 text-xs mt-2">
                          Created {formatDate(flag.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Onboarding Progress */}
        {onboarding && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Onboarding Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Status</span>
                  <Badge variant={onboarding.completed ? "default" : "secondary"}>
                    {onboarding.completed ? "Completed" : "In Progress"}
                  </Badge>
                </div>
                {onboarding.lastStepAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Last Step</span>
                    <span className="text-white">{formatDate(onboarding.lastStepAt)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PlatformAdminLayout>
  );
}

/**
 * Organization List View
 * Platform admin view of all organizations
 */

import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import PlatformAdminLayout from "@/components/PlatformAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function OrganizationList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  const { data, isLoading } = trpc.platform.getOrganizations.useQuery({
    search: search || undefined,
    status: statusFilter as any,
    limit: 50,
    offset: 0,
  });

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

  const formatDate = (date: Date | string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString();
  };

  return (
    <PlatformAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Organizations</h1>
            <p className="text-slate-400 mt-1">Manage all dojo accounts</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search organizations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === undefined ? "default" : "outline"}
                  onClick={() => setStatusFilter(undefined)}
                  className="bg-slate-700 hover:bg-slate-600 border-slate-600"
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === "trial" ? "default" : "outline"}
                  onClick={() => setStatusFilter("trial")}
                  className="bg-slate-700 hover:bg-slate-600 border-slate-600"
                >
                  Trial
                </Button>
                <Button
                  variant={statusFilter === "active" ? "default" : "outline"}
                  onClick={() => setStatusFilter("active")}
                  className="bg-slate-700 hover:bg-slate-600 border-slate-600"
                >
                  Active
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Organizations Table */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">
              {data?.total || 0} Organizations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-slate-400">Loading...</div>
            ) : data?.organizations.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                No organizations found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-slate-700/50">
                    <TableHead className="text-slate-300">Name</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300">Plan</TableHead>
                    <TableHead className="text-slate-300">Trial Ends</TableHead>
                    <TableHead className="text-slate-300">Created</TableHead>
                    <TableHead className="text-slate-300">Last Activity</TableHead>
                    <TableHead className="text-slate-300"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.organizations.map((org) => (
                    <TableRow
                      key={org.id}
                      className="border-slate-700 hover:bg-slate-700/50"
                    >
                      <TableCell className="font-medium text-white">
                        {org.name}
                      </TableCell>
                      <TableCell>{getStatusBadge(org.subscriptionStatus)}</TableCell>
                      <TableCell className="text-slate-300">
                        {org.planId ? `Plan ${org.planId}` : "—"}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {formatDate(org.trialEndsAt)}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {formatDate(org.createdAt)}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {formatDate(org.lastActivity)}
                      </TableCell>
                      <TableCell>
                        <Link href={`/admin/organizations/${org.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-400 hover:text-blue-300 hover:bg-slate-700"
                          >
                            View Details →
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </PlatformAdminLayout>
  );
}

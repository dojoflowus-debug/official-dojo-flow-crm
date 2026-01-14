import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { FileText, Plus, ExternalLink } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";

export default function BillingApplications() {
  const navigate = useNavigate();
  const { data: applications, isLoading } = trpc.billing.getApplications.useQuery();

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "outline",
      submitted: "secondary",
      under_review: "default",
      approved: "default",
      rejected: "destructive",
      requires_info: "secondary",
    };

    const labels: Record<string, string> = {
      draft: "Draft",
      submitted: "Submitted",
      under_review: "Under Review",
      approved: "Approved",
      rejected: "Rejected",
      requires_info: "Requires Info",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getProviderName = (provider: string) => {
    return provider === "pcbancard" ? "PC Bancard" : "Stripe";
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Payment Applications</h1>
          <p className="text-muted-foreground">
            View and manage your payment processor applications
          </p>
        </div>
        <Button onClick={() => navigate("/billing/setup")}>
          <Plus className="mr-2 h-4 w-4" />
          New Application
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Application History</CardTitle>
          <CardDescription>
            Track the status of your payment processor applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading applications...
            </div>
          ) : applications && applications.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Monthly Volume</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">
                      {getProviderName(app.provider)}
                    </TableCell>
                    <TableCell>{app.businessName || "—"}</TableCell>
                    <TableCell>{getStatusBadge(app.status)}</TableCell>
                    <TableCell>
                      {app.submittedAt
                        ? format(new Date(app.submittedAt), "MMM d, yyyy")
                        : "Not submitted"}
                    </TableCell>
                    <TableCell>
                      {app.estimatedMonthlyVolume
                        ? `$${app.estimatedMonthlyVolume.toLocaleString()}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/billing/application/${app.id}`)}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Applications Yet</h3>
              <p className="text-muted-foreground mb-4">
                Get started by applying for a payment processor
              </p>
              <Button onClick={() => navigate("/billing/setup")}>
                <Plus className="mr-2 h-4 w-4" />
                Create Application
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing Time Notice */}
      {applications && applications.some(app => app.provider === "pcbancard" && app.status === "submitted") && (
        <Card className="mt-6 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">PC Bancard Processing</h3>
                <p className="text-sm text-blue-800">
                  Your PC Bancard application is being reviewed. Processing typically takes 2-3 business days.
                  You'll receive an email notification once your application status changes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

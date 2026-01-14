import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Package, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function LowStockAlerts() {
  // Using sonner toast
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<number | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");

  const { data: alerts, isLoading, refetch } = trpc.merchandise.getActiveAlerts.useQuery();
  const resolveAlertMutation = trpc.merchandise.resolveAlert.useMutation({
    onSuccess: () => {
      toast.success("Alert resolved", {
        description: "The stock alert has been marked as resolved.",
      });
      setResolveDialogOpen(false);
      setSelectedAlert(null);
      setResolutionNotes("");
      refetch();
    },
    onError: (error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  const handleResolve = (alertId: number) => {
    setSelectedAlert(alertId);
    setResolveDialogOpen(true);
  };

  const confirmResolve = () => {
    if (selectedAlert) {
      resolveAlertMutation.mutate({
        alertId: selectedAlert,
        notes: resolutionNotes || undefined,
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Low Stock Alerts
          </CardTitle>
          <CardDescription>Loading alerts...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const activeAlerts = alerts || [];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Low Stock Alerts
                {activeAlerts.length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {activeAlerts.length}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {activeAlerts.length === 0
                  ? "All items are adequately stocked"
                  : `${activeAlerts.length} item${activeAlerts.length > 1 ? "s" : ""} need attention`}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {activeAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <CheckCircle className="h-12 w-12 mb-3 text-green-500" />
              <p className="text-sm">No low stock alerts at this time</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeAlerts.map((alertData) => {
                const { alert, item } = alertData;
                const isOutOfStock = alert.alertType === "out_of_stock";

                return (
                  <div
                    key={alert.id}
                    className="flex items-start justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <AlertTriangle
                        className={`h-5 w-5 mt-0.5 ${
                          isOutOfStock ? "text-red-500" : "text-orange-500"
                        }`}
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{item.name}</p>
                          <Badge
                            variant={isOutOfStock ? "destructive" : "secondary"}
                            className="text-xs"
                          >
                            {isOutOfStock ? "OUT OF STOCK" : "LOW STOCK"}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-0.5">
                          <p>
                            Current: <span className="font-medium">{item.stockQuantity}</span> |
                            Threshold: <span className="font-medium">{item.lowStockThreshold}</span>
                          </p>
                          <p className="text-xs">
                            Alert sent {alert.alertCount} time{alert.alertCount > 1 ? "s" : ""} •
                            Last: {new Date(alert.lastAlertSent).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResolve(alert.id)}
                      disabled={resolveAlertMutation.isPending}
                    >
                      Resolve
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Stock Alert</DialogTitle>
            <DialogDescription>
              Mark this alert as resolved. Add notes about how the issue was addressed (optional).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="resolutionNotes">Resolution Notes (Optional)</Label>
              <Textarea
                id="resolutionNotes"
                placeholder="e.g., Received shipment of 50 units, updated inventory..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setResolveDialogOpen(false);
                setSelectedAlert(null);
                setResolutionNotes("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmResolve}
              disabled={resolveAlertMutation.isPending}
            >
              {resolveAlertMutation.isPending ? "Resolving..." : "Mark as Resolved"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, CheckCircle, AlertCircle, Clock, Printer } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function MerchandiseFulfillmentContent() {
  const utils = trpc.useUtils();
  const [statusFilter, setStatusFilter] = useState<"pending" | "handed_out" | "confirmed" | "disputed" | undefined>("pending");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Queries
  const { data: fulfillments, isLoading } = trpc.merchandise.getPendingFulfillments.useQuery({
    status: statusFilter,
  });

  const { data: stats } = trpc.merchandise.getStatistics.useQuery();

  // Mutations
  const markHandedOut = trpc.merchandise.markHandedOut.useMutation({
    onSuccess: () => {
      toast.success("Item marked as handed out. Confirmation request sent to parent.");
      utils.merchandise.getPendingFulfillments.invalidate();
      utils.merchandise.getStatistics.invalidate();
      setShowConfirmDialog(false);
      setSelectedItem(null);
    },
    onError: (error) => {
      toast.error(`Failed to mark item as handed out: ${error.message}`);
    },
  });

  const handlePrintSheet = () => {
    toast.info("Print functionality coming soon!");
  };

  const handleMarkHandedOut = (item: any) => {
    setSelectedItem(item);
    setShowConfirmDialog(true);
  };

  const confirmHandOut = () => {
    if (selectedItem) {
      markHandedOut.mutate({ fulfillmentId: selectedItem.id });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "handed_out":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20"><Package className="w-3 h-3 mr-1" />Handed Out</Badge>;
      case "confirmed":
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" />Confirmed</Badge>;
      case "disputed":
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20"><AlertCircle className="w-3 h-3 mr-1" />Disputed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Merchandise Fulfillment</h2>
          <p className="text-muted-foreground mt-1">
            Track and manage merchandise distribution to students
          </p>
        </div>
        <Button onClick={handlePrintSheet} variant="outline">
          <Printer className="w-4 h-4 mr-2" />
          Print Fulfillment Sheet
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Handed Out</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.handedOut || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Confirmed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.confirmed || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Disputed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.disputed || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Fulfillment List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Fulfillment List</CardTitle>
              <CardDescription>View and manage merchandise items by status</CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="handed_out">Handed Out</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="disputed">Disputed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : !fulfillments || fulfillments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No items found for the selected filter.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fulfillments.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.studentName}</TableCell>
                    <TableCell>{item.itemName}</TableCell>
                    <TableCell>{item.size || "—"}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>{new Date(item.assignedAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {item.status === "pending" && (
                        <Button
                          size="sm"
                          onClick={() => handleMarkHandedOut(item)}
                          disabled={markHandedOut.isPending}
                        >
                          Mark Handed Out
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Hand Out</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this item as handed out to {selectedItem?.studentName}?
              <br />
              <br />
              <strong>Item:</strong> {selectedItem?.itemName}
              {selectedItem?.size && (
                <>
                  <br />
                  <strong>Size:</strong> {selectedItem.size}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmHandOut} disabled={markHandedOut.isPending}>
              {markHandedOut.isPending ? "Processing..." : "Confirm Hand Out"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

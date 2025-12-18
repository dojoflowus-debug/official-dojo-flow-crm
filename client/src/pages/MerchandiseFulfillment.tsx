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

export default function MerchandiseFulfillment() {
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
      toast.error(error.message);
    },
  });

  const handleMarkHandedOut = (item: any) => {
    setSelectedItem(item);
    setShowConfirmDialog(true);
  };

  const confirmHandOut = () => {
    if (selectedItem) {
      markHandedOut.mutate({
        id: selectedItem.id,
        handedOutBy: 1, // TODO: Get actual staff ID from context
        sendConfirmation: true,
      });
    }
  };

  const handlePrintSheet = () => {
    // Open print dialog with fulfillment sheet
    window.open(`/print-fulfillment-sheet?status=${statusFilter || "pending"}`, "_blank");
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
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Merchandise Fulfillment</h1>
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

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Fulfillment List</CardTitle>
              <CardDescription>View and manage merchandise items by status</CardDescription>
            </div>
            <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? undefined : value as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
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
                  <TableHead>Program</TableHead>
                  <TableHead>Belt</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fulfillments.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.studentFullName}</TableCell>
                    <TableCell>{item.program || "—"}</TableCell>
                    <TableCell>{item.beltRank || "—"}</TableCell>
                    <TableCell>{item.itemName}</TableCell>
                    <TableCell>{item.size || "—"}</TableCell>
                    <TableCell>{getStatusBadge(item.fulfillmentStatus)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.fulfillmentStatus === "pending" && (
                        <Button
                          size="sm"
                          onClick={() => handleMarkHandedOut(item)}
                        >
                          Mark Handed Out
                        </Button>
                      )}
                      {item.fulfillmentStatus === "disputed" && (
                        <Badge variant="destructive">Needs Attention</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Hand Out</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this item as handed out? A confirmation request will be sent to the parent via SMS and email.
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-2 py-4">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Student:</span>
                <span className="text-sm">{selectedItem.studentFullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Item:</span>
                <span className="text-sm">{selectedItem.itemName}</span>
              </div>
              {selectedItem.size && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Size:</span>
                  <span className="text-sm">{selectedItem.size}</span>
                </div>
              )}
            </div>
          )}
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

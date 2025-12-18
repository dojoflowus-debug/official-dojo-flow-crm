import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Package, Plus, User, Users } from "lucide-react";
import BulkAssignDialog from "@/components/BulkAssignDialog";
import { toast } from "sonner";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

export default function MerchandiseManagement() {
  const utils = trpc.useUtils();

  // State for creating items
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    type: "uniform" as "uniform" | "gear" | "belt" | "equipment" | "other",
    defaultPrice: 0,
    requiresSize: true,
    description: "",
    stockQuantity: undefined as number | undefined,
    lowStockThreshold: undefined as number | undefined,
  });

  // State for attaching items to students
  const [showAttachDialog, setShowAttachDialog] = useState(false);
  const [showBulkAssignDialog, setShowBulkAssignDialog] = useState(false);
  const [attachData, setAttachData] = useState({
    studentId: "",
    itemId: "",
    size: "",
    pricePaid: 0,
    notes: "",
  });

  // Queries
  const { data: items, isLoading: itemsLoading } = trpc.merchandise.getItems.useQuery();
  const { data: students } = trpc.students.getAll.useQuery();

  // Mutations
  const createItem = trpc.merchandise.createItem.useMutation({
    onSuccess: () => {
      toast.success("Merchandise item created successfully");
      utils.merchandise.getItems.invalidate();
      setShowCreateDialog(false);
      setNewItem({
        name: "",
        type: "uniform",
        defaultPrice: 0,
        requiresSize: true,
        description: "",
        stockQuantity: undefined,
        lowStockThreshold: undefined,
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const attachToStudent = trpc.merchandise.attachToStudent.useMutation({
    onSuccess: () => {
      toast.success("Item attached to student successfully");
      utils.merchandise.getPendingFulfillments.invalidate();
      setShowAttachDialog(false);
      setAttachData({
        studentId: "",
        itemId: "",
        size: "",
        pricePaid: 0,
        notes: "",
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleCreateItem = () => {
    createItem.mutate({
      name: newItem.name,
      type: newItem.type,
      defaultPrice: newItem.defaultPrice * 100, // Convert to cents
      requiresSize: newItem.requiresSize,
      sizeOptions: newItem.requiresSize ? SIZE_OPTIONS : undefined,
      description: newItem.description,
    });
  };

  const handleAttachItem = () => {
    const selectedItem = items?.find(i => i.id === parseInt(attachData.itemId));
    if (selectedItem?.requiresSize && !attachData.size) {
      toast.error("Please select a size for this item");
      return;
    }

    attachToStudent.mutate({
      studentId: parseInt(attachData.studentId),
      itemId: parseInt(attachData.itemId),
      size: attachData.size || undefined,
      pricePaid: attachData.pricePaid * 100, // Convert to cents
      notes: attachData.notes || undefined,
    });
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Merchandise Management</h1>
          <p className="text-muted-foreground mt-1">
            Create merchandise items and assign them to students
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowBulkAssignDialog(true)}>
            <Users className="w-4 h-4 mr-2" />
            Bulk Assign
          </Button>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Merchandise Item</DialogTitle>
                <DialogDescription>
                  Add a new merchandise item to your inventory
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Item Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., White Uniform"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={newItem.type} onValueChange={(value: any) => setNewItem({ ...newItem, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="uniform">Uniform</SelectItem>
                      <SelectItem value="gear">Gear</SelectItem>
                      <SelectItem value="belt">Belt</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Default Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newItem.defaultPrice}
                    onChange={(e) => setNewItem({ ...newItem, defaultPrice: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="requiresSize"
                    checked={newItem.requiresSize}
                    onChange={(e) => setNewItem({ ...newItem, requiresSize: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="requiresSize">Requires Size Selection</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Item description..."
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stockQuantity">Stock Quantity (Optional)</Label>
                  <Input
                    id="stockQuantity"
                    type="number"
                    min="0"
                    placeholder="Leave empty for unlimited"
                    value={newItem.stockQuantity ?? ""}
                    onChange={(e) => setNewItem({ ...newItem, stockQuantity: e.target.value ? parseInt(e.target.value) : undefined })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lowStockThreshold">Low Stock Alert Threshold (Optional)</Label>
                  <Input
                    id="lowStockThreshold"
                    type="number"
                    min="0"
                    placeholder="Alert when stock is low"
                    value={newItem.lowStockThreshold ?? ""}
                    onChange={(e) => setNewItem({ ...newItem, lowStockThreshold: e.target.value ? parseInt(e.target.value) : undefined })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateItem} disabled={!newItem.name || createItem.isPending}>
                  {createItem.isPending ? "Creating..." : "Create Item"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showAttachDialog} onOpenChange={setShowAttachDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <User className="w-4 h-4 mr-2" />
                Assign to Student
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Item to Student</DialogTitle>
                <DialogDescription>
                  Select a student and item to create a fulfillment record
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="student">Student</Label>
                  <Select value={attachData.studentId} onValueChange={(value) => setAttachData({ ...attachData, studentId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students?.map((student) => (
                        <SelectItem key={student.id} value={student.id.toString()}>
                          {student.firstName} {student.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item">Item</Label>
                  <Select value={attachData.itemId} onValueChange={(value) => setAttachData({ ...attachData, itemId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select item" />
                    </SelectTrigger>
                    <SelectContent>
                      {items?.map((item) => (
                        <SelectItem key={item.id} value={item.id.toString()}>
                          {item.name} ({item.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {attachData.itemId && items?.find(i => i.id === parseInt(attachData.itemId))?.requiresSize && (
                  <div className="space-y-2">
                    <Label htmlFor="size">Size</Label>
                    <Select value={attachData.size} onValueChange={(value) => setAttachData({ ...attachData, size: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        {SIZE_OPTIONS.map((size) => (
                          <SelectItem key={size} value={size}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="pricePaid">Price Paid ($)</Label>
                  <Input
                    id="pricePaid"
                    type="number"
                    min="0"
                    step="0.01"
                    value={attachData.pricePaid}
                    onChange={(e) => setAttachData({ ...attachData, pricePaid: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any special notes..."
                    value={attachData.notes}
                    onChange={(e) => setAttachData({ ...attachData, notes: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAttachDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAttachItem}
                  disabled={!attachData.studentId || !attachData.itemId || attachToStudent.isPending}
                >
                  {attachToStudent.isPending ? "Assigning..." : "Assign Item"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Items List */}
      <Card>
        <CardHeader>
          <CardTitle>Merchandise Items</CardTitle>
          <CardDescription>All available merchandise items in your inventory</CardDescription>
        </CardHeader>
        <CardContent>
          {itemsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : !items || items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No items yet. Create your first merchandise item to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Requires Size</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.type}</Badge>
                    </TableCell>
                    <TableCell>${(item.defaultPrice / 100).toFixed(2)}</TableCell>
                    <TableCell>
                      {item.stockQuantity !== null && item.stockQuantity !== undefined ? (
                        <div className="flex items-center gap-2">
                          <span className={item.stockQuantity === 0 ? "text-red-600 font-semibold" : item.lowStockThreshold !== null && item.stockQuantity <= item.lowStockThreshold ? "text-orange-600 font-semibold" : ""}>
                            {item.stockQuantity}
                          </span>
                          {item.stockQuantity === 0 && <Badge variant="destructive" className="text-xs">Out of Stock</Badge>}
                          {item.lowStockThreshold !== null && item.stockQuantity > 0 && item.stockQuantity <= item.lowStockThreshold && <Badge variant="outline" className="text-xs text-orange-600 border-orange-600">Low Stock</Badge>}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Unlimited</span>
                      )}
                    </TableCell>
                    <TableCell>{item.requiresSize ? "Yes" : "No"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {item.description || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <BulkAssignDialog
        open={showBulkAssignDialog}
        onOpenChange={setShowBulkAssignDialog}
        items={items || []}
        onSuccess={() => {
          utils.merchandise.getPendingFulfillments.invalidate();
          utils.merchandise.getStatistics.invalidate();
        }}
      />
    </div>
  );
}

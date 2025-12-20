import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Package, Plus, User, Users, Edit, Bell, LayoutGrid, List, Upload, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BulkAssignDialog from "@/components/BulkAssignDialog";
import { ReorderSuggestions } from "@/components/ReorderSuggestions";

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

export default function MerchandiseManagementContent() {
  const utils = trpc.useUtils();
  const navigate = useNavigate();

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
    imageUrl: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

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

  // State for stock adjustment
  const [showStockDialog, setShowStockDialog] = useState(false);
  
  // State for view mode (list or card)
  const [viewMode, setViewMode] = useState<"list" | "card">("list");
  const [stockAdjustment, setStockAdjustment] = useState({
    itemId: 0,
    itemName: "",
    currentStock: 0,
    newQuantity: 0,
    adjustmentReason: "" as "received_shipment" | "inventory_count" | "correction" | "damage_loss" | "other" | "",
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
        imageUrl: "",
      });
      setImageFile(null);
      setImagePreview("");
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

  const updateStock = trpc.merchandise.updateStock.useMutation({
    onSuccess: (data) => {
      const diff = data.difference;
      const sign = diff > 0 ? "+" : "";
      toast.success(`Stock updated successfully (${sign}${diff} items)`);
      utils.merchandise.getItems.invalidate();
      utils.merchandise.getInventoryStatus.invalidate();
      setShowStockDialog(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateItem = async () => {
    let imageUrl = newItem.imageUrl;
    
    // Upload image if file is selected
    if (imageFile) {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', imageFile);
        
        const response = await fetch('/api/upload-merchandise-image', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) throw new Error('Failed to upload image');
        const data = await response.json();
        imageUrl = data.url;
      } catch (error) {
        toast.error('Failed to upload image');
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }
    
    createItem.mutate({
      name: newItem.name,
      type: newItem.type,
      defaultPrice: newItem.defaultPrice * 100, // Convert to cents
      requiresSize: newItem.requiresSize,
      sizeOptions: newItem.requiresSize ? SIZE_OPTIONS : undefined,
      description: newItem.description,
      stockQuantity: newItem.stockQuantity,
      lowStockThreshold: newItem.lowStockThreshold,
      imageUrl: imageUrl || undefined,
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

  const openStockDialog = (item: any) => {
    setStockAdjustment({
      itemId: item.id,
      itemName: item.name,
      currentStock: item.stockQuantity ?? 0,
      newQuantity: item.stockQuantity ?? 0,
      adjustmentReason: "",
      notes: "",
    });
    setShowStockDialog(true);
  };

  const handleStockAdjustment = () => {
    if (!stockAdjustment.adjustmentReason) {
      toast.error("Please select an adjustment reason");
      return;
    }

    updateStock.mutate({
      itemId: stockAdjustment.itemId,
      newQuantity: stockAdjustment.newQuantity,
      adjustmentReason: stockAdjustment.adjustmentReason,
      notes: stockAdjustment.notes || undefined,
    });
  };

  return (
    <div className="space-y-6">
        {/* Reorder Suggestions Section */}
        <ReorderSuggestions />

        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Merchandise Management</h1>
          <p className="text-muted-foreground mt-1">
            Create merchandise items and assign them to students
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 border rounded-md">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-r-none"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "card" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("card")}
              className="rounded-l-none"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
          <Button variant="outline" onClick={() => navigate("/operations/merchandise/alert-settings")}>
            <Bell className="w-4 h-4 mr-2" />
            Alert Settings
          </Button>
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
                  <Label htmlFor="image">Product Image (Optional)</Label>
                  {imagePreview ? (
                    <div className="relative w-full h-48 bg-muted rounded-lg overflow-hidden">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview("");
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      <Label
                        htmlFor="image"
                        className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <div className="text-center">
                          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Click to upload image</p>
                          <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                        </div>
                      </Label>
                    </div>
                  )}
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
                <Button onClick={handleCreateItem} disabled={!newItem.name || createItem.isPending || isUploading}>
                  {isUploading ? "Uploading..." : createItem.isPending ? "Creating..." : "Create Item"}
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
          ) : viewMode === "list" ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Requires Size</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                    <TableCell className="text-right">
                      {item.stockQuantity !== null && item.stockQuantity !== undefined && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openStockDialog(item)}
                          title="Adjust stock quantity"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {items.map((item) => (
                <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square relative bg-muted">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-16 h-16 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary">{item.type}</Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{item.name}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Price:</span>
                        <span className="font-medium">${(item.defaultPrice / 100).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Stock:</span>
                        {item.stockQuantity !== null && item.stockQuantity !== undefined ? (
                          <div className="flex items-center gap-2">
                            <span className={item.stockQuantity === 0 ? "text-red-600 font-semibold" : item.lowStockThreshold !== null && item.stockQuantity <= item.lowStockThreshold ? "text-orange-600 font-semibold" : "font-medium"}>
                              {item.stockQuantity}
                            </span>
                            {item.stockQuantity === 0 && <Badge variant="destructive" className="text-xs">Out</Badge>}
                            {item.lowStockThreshold !== null && item.stockQuantity > 0 && item.stockQuantity <= item.lowStockThreshold && <Badge variant="outline" className="text-xs text-orange-600 border-orange-600">Low</Badge>}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Unlimited</span>
                        )}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Size:</span>
                        <span className="font-medium">{item.requiresSize ? "Required" : "N/A"}</span>
                      </div>
                      {item.description && (
                        <p className="text-muted-foreground text-xs mt-2 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>
                    {item.stockQuantity !== null && item.stockQuantity !== undefined && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-3"
                        onClick={() => openStockDialog(item)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Adjust Stock
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
        </Card>

        {/* Stock Adjustment Dialog */}
        <Dialog open={showStockDialog} onOpenChange={setShowStockDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Stock Quantity</DialogTitle>
            <DialogDescription>
              Update the stock quantity for {stockAdjustment.itemName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Current Stock */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Current Stock</span>
              <span className="text-lg font-bold">{stockAdjustment.currentStock}</span>
            </div>

            {/* New Quantity */}
            <div className="space-y-2">
              <Label htmlFor="newQuantity">New Quantity</Label>
              <Input
                id="newQuantity"
                type="number"
                min="0"
                value={stockAdjustment.newQuantity}
                onChange={(e) => setStockAdjustment({ ...stockAdjustment, newQuantity: parseInt(e.target.value) || 0 })}
              />
            </div>

            {/* Stock Difference */}
            {stockAdjustment.newQuantity !== stockAdjustment.currentStock && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Change</span>
                <span className={`text-lg font-bold ${
                  stockAdjustment.newQuantity > stockAdjustment.currentStock
                    ? "text-green-600"
                    : "text-red-600"
                }`}>
                  {stockAdjustment.newQuantity > stockAdjustment.currentStock ? "+" : ""}
                  {stockAdjustment.newQuantity - stockAdjustment.currentStock}
                </span>
              </div>
            )}

            {/* Adjustment Reason */}
            <div className="space-y-2">
              <Label htmlFor="adjustmentReason">Reason for Adjustment *</Label>
              <Select
                value={stockAdjustment.adjustmentReason}
                onValueChange={(value: any) => setStockAdjustment({ ...stockAdjustment, adjustmentReason: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="received_shipment">Received Shipment</SelectItem>
                  <SelectItem value="inventory_count">Inventory Count</SelectItem>
                  <SelectItem value="correction">Correction</SelectItem>
                  <SelectItem value="damage_loss">Damage/Loss</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional details about this adjustment..."
                value={stockAdjustment.notes}
                onChange={(e) => setStockAdjustment({ ...stockAdjustment, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStockDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleStockAdjustment}
              disabled={updateStock.isPending}
            >
              {updateStock.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
        </Dialog>

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

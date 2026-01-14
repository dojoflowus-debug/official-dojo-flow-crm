import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Power, PowerOff } from "lucide-react";
import Layout from "@/components/Layout";

interface StaffPin {
  id: number;
  name: string;
  role: string | null;
  isActive: number;
  createdAt: Date;
  updatedAt: Date;
  lastUsed: Date | null;
}

export default function AdminStaffPins() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPin, setSelectedPin] = useState<StaffPin | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    pin: "",
    role: "staff",
  });

  const { data: pins = [], refetch } = trpc.staff.listPins.useQuery();
  
  const createPinMutation = trpc.staff.createPin.useMutation();
  const updatePinMutation = trpc.staff.updatePin.useMutation();
  const toggleActiveMutation = trpc.staff.toggleActive.useMutation();
  const deletePinMutation = trpc.staff.deletePin.useMutation();

  const handleAddPin = async () => {
    if (!formData.name || !formData.pin) {
      toast.error("Name and PIN are required");
      return;
    }

    try {
      await createPinMutation.mutateAsync(formData);
      toast.success("PIN created successfully");
      setShowAddDialog(false);
      setFormData({ name: "", pin: "", role: "staff" });
      refetch();
    } catch (error) {
      toast.error("Failed to create PIN");
    }
  };

  const handleEditPin = async () => {
    if (!selectedPin || !formData.name) {
      toast.error("Name is required");
      return;
    }

    try {
      await updatePinMutation.mutateAsync({
        id: selectedPin.id,
        name: formData.name,
        pin: formData.pin || undefined,
        role: formData.role,
      });
      toast.success("PIN updated successfully");
      setShowEditDialog(false);
      setSelectedPin(null);
      setFormData({ name: "", pin: "", role: "staff" });
      refetch();
    } catch (error) {
      toast.error("Failed to update PIN");
    }
  };

  const handleToggleActive = async (pin: StaffPin) => {
    try {
      await toggleActiveMutation.mutateAsync({
        id: pin.id,
        isActive: pin.isActive === 1 ? 0 : 1,
      });
      toast.success(pin.isActive === 1 ? "PIN deactivated" : "PIN activated");
      refetch();
    } catch (error) {
      toast.error("Failed to toggle PIN status");
    }
  };

  const handleDeletePin = async () => {
    if (!selectedPin) return;

    try {
      await deletePinMutation.mutateAsync({ id: selectedPin.id });
      toast.success("PIN deleted successfully");
      setShowDeleteDialog(false);
      setSelectedPin(null);
      refetch();
    } catch (error) {
      toast.error("Failed to delete PIN");
    }
  };

  const openEditDialog = (pin: StaffPin) => {
    setSelectedPin(pin);
    setFormData({
      name: pin.name,
      pin: "",
      role: pin.role || "staff",
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (pin: StaffPin) => {
    setSelectedPin(pin);
    setShowDeleteDialog(true);
  };

  return (
    <SimpleLayout>
      <div className="min-h-screen bg-slate-950 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Staff PIN Management</h1>
              <p className="text-slate-400">Manage staff access PINs for the kiosk dashboard</p>
            </div>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add PIN
            </Button>
          </div>

          <Card className="bg-slate-900 border-slate-800">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-slate-800/50">
                  <TableHead className="text-slate-300">Name</TableHead>
                  <TableHead className="text-slate-300">Role</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-slate-300">Created</TableHead>
                  <TableHead className="text-slate-300">Last Used</TableHead>
                  <TableHead className="text-slate-300 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                      No staff PINs found. Click "Add PIN" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  pins.map((pin) => (
                    <TableRow key={pin.id} className="border-slate-800 hover:bg-slate-800/50">
                      <TableCell className="font-medium text-white">{pin.name}</TableCell>
                      <TableCell className="text-slate-300">{pin.role || "staff"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={pin.isActive === 1 ? "default" : "secondary"}
                          className={
                            pin.isActive === 1
                              ? "bg-green-600 hover:bg-green-700"
                              : "bg-slate-700 hover:bg-slate-600"
                          }
                        >
                          {pin.isActive === 1 ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {new Date(pin.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {pin.lastUsed ? new Date(pin.lastUsed).toLocaleDateString() : "Never"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(pin)}
                            className="text-slate-400 hover:text-white"
                          >
                            {pin.isActive === 1 ? (
                              <PowerOff className="w-4 h-4" />
                            ) : (
                              <Power className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(pin)}
                            className="text-slate-400 hover:text-white"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(pin)}
                            className="text-slate-400 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white">
            <DialogHeader>
              <DialogTitle>Add New Staff PIN</DialogTitle>
              <DialogDescription className="text-slate-400">
                Create a new PIN for staff access to the dashboard
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Staff Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="Enter staff name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pin">4-Digit PIN</Label>
                <Input
                  id="pin"
                  type="password"
                  maxLength={4}
                  value={formData.pin}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, "") })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="••••"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="staff"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowAddDialog(false);
                  setFormData({ name: "", pin: "", role: "staff" });
                }}
                className="text-slate-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddPin}
                disabled={!formData.name || !formData.pin || formData.pin.length !== 4}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
              >
                Create PIN
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white">
            <DialogHeader>
              <DialogTitle>Edit Staff PIN</DialogTitle>
              <DialogDescription className="text-slate-400">
                Update staff information. Leave PIN blank to keep current PIN.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Staff Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="Enter staff name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-pin">New PIN (optional)</Label>
                <Input
                  id="edit-pin"
                  type="password"
                  maxLength={4}
                  value={formData.pin}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, "") })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="Leave blank to keep current"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Input
                  id="edit-role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="staff"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowEditDialog(false);
                  setSelectedPin(null);
                  setFormData({ name: "", pin: "", role: "staff" });
                }}
                className="text-slate-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditPin}
                disabled={!formData.name || (formData.pin.length > 0 && formData.pin.length !== 4)}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
              >
                Update PIN
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white">
            <DialogHeader>
              <DialogTitle>Delete Staff PIN</DialogTitle>
              <DialogDescription className="text-slate-400">
                Are you sure you want to delete the PIN for {selectedPin?.name}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setSelectedPin(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeletePin}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete PIN
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SimpleLayout>
  );
}

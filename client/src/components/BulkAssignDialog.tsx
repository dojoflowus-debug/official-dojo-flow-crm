import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle, AlertCircle } from "lucide-react";
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

interface BulkAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: Array<{ id: number; name: string; type: string; requiresSize: number }>;
  onSuccess: () => void;
}

export default function BulkAssignDialog({ open, onOpenChange, items, onSuccess }: BulkAssignDialogProps) {
  const [selectedItemId, setSelectedItemId] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [beltFilter, setBeltFilter] = useState("");
  const [pricePaid, setPricePaid] = useState(0);
  const [sizeMappings, setSizeMappings] = useState<Record<number, string>>({});
  const [showSizeMapping, setShowSizeMapping] = useState(false);

  // Queries
  const { data: allStudents } = trpc.students.getAll.useQuery();
  const { data: programs } = trpc.programs.getAll.useQuery();

  // Mutation
  const bulkAssign = trpc.merchandise.bulkAssignToStudents.useMutation({
    onSuccess: (result) => {
      toast.success(`Successfully assigned to ${result.successCount} students${result.failedCount > 0 ? `, ${result.failedCount} failed` : ""}`);
      onSuccess();
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Filter students based on program and belt
  const filteredStudents = allStudents?.filter((student) => {
    if (programFilter && student.program !== programFilter) return false;
    if (beltFilter && student.beltRank !== beltFilter) return false;
    return true;
  }) || [];

  // Get unique belt ranks from all students
  const beltRanks = Array.from(new Set(allStudents?.map(s => s.beltRank).filter(Boolean) || []));

  // Get selected item
  const selectedItem = items.find(i => i.id === parseInt(selectedItemId));

  const resetForm = () => {
    setSelectedItemId("");
    setProgramFilter("");
    setBeltFilter("");
    setPricePaid(0);
    setSizeMappings({});
    setShowSizeMapping(false);
  };

  const handleNext = () => {
    if (!selectedItemId) {
      toast.error("Please select an item");
      return;
    }
    if (filteredStudents.length === 0) {
      toast.error("No students match the selected filters");
      return;
    }
    setShowSizeMapping(true);
  };

  const handleBack = () => {
    setShowSizeMapping(false);
  };

  const handleBulkAssign = () => {
    if (!selectedItemId) return;

    const mappings = filteredStudents.map(student => ({
      studentId: student.id,
      size: sizeMappings[student.id] || undefined,
    }));

    bulkAssign.mutate({
      itemId: parseInt(selectedItemId),
      program: programFilter || undefined,
      beltRank: beltFilter || undefined,
      sizeMappings: mappings,
      pricePaid: pricePaid * 100, // Convert to cents
    });
  };

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {showSizeMapping ? "Assign Sizes" : "Bulk Assign Merchandise"}
          </DialogTitle>
          <DialogDescription>
            {showSizeMapping
              ? `Assign sizes to ${filteredStudents.length} students`
              : "Select an item and filter students by program or belt level"}
          </DialogDescription>
        </DialogHeader>

        {!showSizeMapping ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="item">Merchandise Item</Label>
              <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select item" />
                </SelectTrigger>
                <SelectContent>
                  {items.map((item) => (
                    <SelectItem key={item.id} value={item.id.toString()}>
                      {item.name} ({item.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="program">Filter by Program (Optional)</Label>
                <Select value={programFilter} onValueChange={setProgramFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All programs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All programs</SelectItem>
                    {programs?.map((program) => (
                      <SelectItem key={program.id} value={program.name}>
                        {program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="belt">Filter by Belt Level (Optional)</Label>
                <Select value={beltFilter} onValueChange={setBeltFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All belt levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All belt levels</SelectItem>
                    {beltRanks.map((belt) => (
                      <SelectItem key={belt} value={belt}>
                        {belt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price Paid ($)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={pricePaid}
                onChange={(e) => setPricePaid(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-sm">
                    {filteredStudents.length} student{filteredStudents.length !== 1 ? "s" : ""} match your filters
                  </p>
                  {filteredStudents.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {filteredStudents.slice(0, 3).map(s => `${s.firstName} ${s.lastName}`).join(", ")}
                      {filteredStudents.length > 3 && ` and ${filteredStudents.length - 3} more`}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium">
                {selectedItem?.requiresSize
                  ? "Assign a size to each student below"
                  : "No size selection needed for this item"}
              </p>
            </div>

            {selectedItem?.requiresSize && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Belt</TableHead>
                    <TableHead>Size</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        {student.firstName} {student.lastName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{student.program}</Badge>
                      </TableCell>
                      <TableCell>{student.beltRank}</TableCell>
                      <TableCell>
                        <Select
                          value={sizeMappings[student.id] || ""}
                          onValueChange={(value) => setSizeMappings({ ...sizeMappings, [student.id]: value })}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue placeholder="Size" />
                          </SelectTrigger>
                          <SelectContent>
                            {SIZE_OPTIONS.map((size) => (
                              <SelectItem key={size} value={size}>
                                {size}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {!selectedItem?.requiresSize && (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-600" />
                <p>Ready to assign to {filteredStudents.length} students</p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {showSizeMapping ? (
            <>
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button
                onClick={handleBulkAssign}
                disabled={
                  bulkAssign.isPending ||
                  (selectedItem?.requiresSize && Object.keys(sizeMappings).length !== filteredStudents.length)
                }
              >
                {bulkAssign.isPending ? "Assigning..." : `Assign to ${filteredStudents.length} Students`}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleNext} disabled={!selectedItemId || filteredStudents.length === 0}>
                Next
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

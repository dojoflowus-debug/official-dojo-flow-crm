import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { 
  Search, Plus, Download, MapPin, Users, UserCheck, UserX, Clock,
  Phone, Mail, Calendar, Edit2, Save, X, ChevronLeft, ChevronRight
} from "lucide-react";
import { BELT_COLORS, ABC_COLORS, type BeltRank, type ABCCategory, type StudentStatus } from "@shared/types";
import { cn } from "@/lib/utils";
import { MapView } from "@/components/Map";

// Student card component (no flip animation - flip only in modal)
function StudentCard({ 
  student, 
  onClick 
}: { 
  student: any; 
  onClick: () => void;
}) {
  const beltColors = BELT_COLORS[student.beltRank as BeltRank] || BELT_COLORS.white;
  const abcColors = ABC_COLORS[student.category as ABCCategory] || ABC_COLORS.B;
  
  const initials = `${student.firstName?.[0] || ""}${student.lastName?.[0] || ""}`.toUpperCase();
  const photoUrl = student.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.firstName}${student.lastName}`;

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] bg-card"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 border-2 border-border">
            <AvatarImage src={photoUrl} alt={`${student.firstName} ${student.lastName}`} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground truncate">
                {student.firstName} {student.lastName}
              </h3>
              <Badge variant="outline" className={cn("text-xs", abcColors.bg, abcColors.text, abcColors.border)}>
                {student.category}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={cn("text-xs capitalize", beltColors.bg, beltColors.text, beltColors.border)}>
                {student.beltRank} {student.stripes > 0 && `(${student.stripes} stripes)`}
              </Badge>
              {student.program && (
                <span className="text-xs text-muted-foreground">{student.program}</span>
              )}
            </div>
            
            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
              {student.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {student.phone}
                </span>
              )}
              {student.email && (
                <span className="flex items-center gap-1 truncate">
                  <Mail className="h-3 w-3" />
                  {student.email}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Student detail modal with flip animation
function StudentDetailModal({
  student,
  isOpen,
  onClose,
  onUpdate
}: {
  student: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    phone: student?.phone || "",
    email: student?.email || "",
    address: student?.address || "",
    city: student?.city || "",
    state: student?.state || "",
    zipCode: student?.zipCode || "",
    guardianName: student?.guardianName || "",
    guardianPhone: student?.guardianPhone || "",
    guardianEmail: student?.guardianEmail || "",
    guardianRelation: student?.guardianRelation || "",
  });

  const updateMutation = trpc.student.update.useMutation({
    onSuccess: () => {
      toast.success("Student updated successfully");
      setIsEditing(false);
      onUpdate();
    },
    onError: (error) => {
      toast.error("Failed to update: " + error.message);
    },
  });

  if (!student) return null;

  const beltColors = BELT_COLORS[student.beltRank as BeltRank] || BELT_COLORS.white;
  const initials = `${student.firstName?.[0] || ""}${student.lastName?.[0] || ""}`.toUpperCase();
  const photoUrl = student.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.firstName}${student.lastName}`;

  const handleSave = () => {
    updateMutation.mutate({
      id: student.id,
      data: editData,
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      phone: student?.phone || "",
      email: student?.email || "",
      address: student?.address || "",
      city: student?.city || "",
      state: student?.state || "",
      zipCode: student?.zipCode || "",
      guardianName: student?.guardianName || "",
      guardianPhone: student?.guardianPhone || "",
      guardianEmail: student?.guardianEmail || "",
      guardianRelation: student?.guardianRelation || "",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        {/* Card container with flip animation */}
        <div className="relative h-[500px]" style={{ perspective: "1000px" }}>
          <div
            className={cn(
              "absolute inset-0 transition-transform duration-500",
              isFlipped && "[transform:rotateY(180deg)]"
            )}
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Front side - Profile */}
            <div 
              className="absolute inset-0 bg-card rounded-lg flex flex-col"
              style={{ backfaceVisibility: "hidden" }}
            >
              <DialogHeader className="p-6 pb-4 border-b">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-border">
                    <AvatarImage src={photoUrl} />
                    <AvatarFallback className="text-xl font-bold">{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-xl">
                      {student.firstName} {student.lastName}
                    </DialogTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={cn("capitalize", beltColors.bg, beltColors.text)}>
                        {student.beltRank} Belt
                      </Badge>
                      <Badge variant="outline">{student.status}</Badge>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <ScrollArea className="flex-1 p-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Program</h4>
                    <p className="text-muted-foreground">{student.program || "Not assigned"}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Membership</h4>
                    <p className="text-muted-foreground">{student.membershipType || "Standard"}</p>
                    <p className="text-sm text-muted-foreground">
                      ${student.monthlyRate || 0}/month • Credits: {student.credits || 0}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Notes</h4>
                    <p className="text-muted-foreground text-sm">{student.notes || "No notes"}</p>
                  </div>
                </div>
              </ScrollArea>

              {/* Fixed footer */}
              <div className="p-4 border-t bg-muted/50 flex justify-between">
                <Button variant="outline" onClick={() => setIsFlipped(true)}>
                  <ChevronRight className="h-4 w-4 mr-2" />
                  View Contact Info
                </Button>
                <Button variant="ghost" onClick={onClose}>Close</Button>
              </div>
            </div>

            {/* Back side - Contact/DOB/Guardian */}
            <div 
              className="absolute inset-0 bg-card rounded-lg flex flex-col [transform:rotateY(180deg)]"
              style={{ backfaceVisibility: "hidden" }}
            >
              <DialogHeader className="p-6 pb-4 border-b">
                <DialogTitle className="flex items-center gap-2">
                  <ChevronLeft 
                    className="h-5 w-5 cursor-pointer hover:text-primary" 
                    onClick={() => setIsFlipped(false)} 
                  />
                  Contact Information
                </DialogTitle>
              </DialogHeader>

              <ScrollArea className="flex-1 p-6">
                <div className="space-y-4">
                  {/* Contact Info */}
                  <div className="space-y-3">
                    <div>
                      <Label>Phone</Label>
                      {isEditing ? (
                        <Input 
                          value={editData.phone} 
                          onChange={(e) => setEditData({...editData, phone: e.target.value})}
                        />
                      ) : (
                        <p className="text-muted-foreground">{student.phone || "Not provided"}</p>
                      )}
                    </div>
                    <div>
                      <Label>Email</Label>
                      {isEditing ? (
                        <Input 
                          value={editData.email} 
                          onChange={(e) => setEditData({...editData, email: e.target.value})}
                        />
                      ) : (
                        <p className="text-muted-foreground">{student.email || "Not provided"}</p>
                      )}
                    </div>
                    <div>
                      <Label>Date of Birth</Label>
                      <p className="text-muted-foreground">
                        {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : "Not provided"}
                      </p>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-3">Address</h4>
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input 
                          placeholder="Street Address"
                          value={editData.address} 
                          onChange={(e) => setEditData({...editData, address: e.target.value})}
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <Input 
                            placeholder="City"
                            value={editData.city} 
                            onChange={(e) => setEditData({...editData, city: e.target.value})}
                          />
                          <Input 
                            placeholder="State"
                            value={editData.state} 
                            onChange={(e) => setEditData({...editData, state: e.target.value})}
                          />
                          <Input 
                            placeholder="ZIP"
                            value={editData.zipCode} 
                            onChange={(e) => setEditData({...editData, zipCode: e.target.value})}
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        {student.address ? `${student.address}, ${student.city}, ${student.state} ${student.zipCode}` : "Not provided"}
                      </p>
                    )}
                  </div>

                  {/* Guardian Info */}
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-3">Guardian Information</h4>
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input 
                          placeholder="Guardian Name"
                          value={editData.guardianName} 
                          onChange={(e) => setEditData({...editData, guardianName: e.target.value})}
                        />
                        <Input 
                          placeholder="Guardian Phone"
                          value={editData.guardianPhone} 
                          onChange={(e) => setEditData({...editData, guardianPhone: e.target.value})}
                        />
                        <Input 
                          placeholder="Guardian Email"
                          value={editData.guardianEmail} 
                          onChange={(e) => setEditData({...editData, guardianEmail: e.target.value})}
                        />
                        <Input 
                          placeholder="Relationship"
                          value={editData.guardianRelation} 
                          onChange={(e) => setEditData({...editData, guardianRelation: e.target.value})}
                        />
                      </div>
                    ) : (
                      <div className="space-y-1 text-muted-foreground">
                        <p>{student.guardianName || "Not provided"}</p>
                        {student.guardianPhone && <p>{student.guardianPhone}</p>}
                        {student.guardianEmail && <p>{student.guardianEmail}</p>}
                        {student.guardianRelation && <p className="text-sm">({student.guardianRelation})</p>}
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>

              {/* Fixed footer with Edit/Save/Cancel */}
              <div className="p-4 border-t bg-muted/50 flex justify-between">
                <Button variant="outline" onClick={() => setIsFlipped(false)}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back to Profile
                </Button>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button variant="ghost" onClick={handleCancel}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button onClick={handleSave} disabled={updateMutation.isPending}>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" onClick={() => setIsEditing(true)}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Add Student Dialog
function AddStudentDialog({
  isOpen,
  onClose,
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    beltRank: "white" as BeltRank,
    program: "",
    category: "B" as ABCCategory,
    status: "active" as StudentStatus,
  });

  const createMutation = trpc.student.create.useMutation({
    onSuccess: () => {
      toast.success("Student added successfully!");
      onSuccess();
      onClose();
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        beltRank: "white",
        program: "",
        category: "B",
        status: "active",
      });
    },
    onError: (error) => {
      toast.error("Failed to add student: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName) {
      toast.error("First name and last name are required");
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>First Name *</Label>
              <Input
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                required
              />
            </div>
            <div>
              <Label>Last Name *</Label>
              <Input
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                required
              />
            </div>
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div>
            <Label>Phone</Label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Belt Rank</Label>
              <Select value={formData.beltRank} onValueChange={(v) => setFormData({...formData, beltRank: v as BeltRank})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(BELT_COLORS).map((belt) => (
                    <SelectItem key={belt} value={belt} className="capitalize">{belt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v as ABCCategory})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A - Excellent</SelectItem>
                  <SelectItem value="B">B - Good</SelectItem>
                  <SelectItem value="C">C - At Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Program</Label>
            <Input
              value={formData.program}
              onChange={(e) => setFormData({...formData, program: e.target.value})}
              placeholder="e.g., Kids Karate, Adult BJJ"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Adding..." : "Add Student"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Main Students Page
export default function Students() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<StudentStatus>("active");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<ABCCategory | "all">("all");
  const [beltFilter, setBeltFilter] = useState<BeltRank | "all">("all");

  const { data: students, isLoading, refetch } = trpc.student.list.useQuery();
  const { data: stats } = trpc.student.stats.useQuery();

  const filteredStudents = useMemo(() => {
    if (!students) return [];
    
    return students.filter((student) => {
      // Status filter
      if (student.status !== activeTab) return false;
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
        if (!fullName.includes(query) && !student.email?.toLowerCase().includes(query)) {
          return false;
        }
      }
      
      // Category filter
      if (categoryFilter !== "all" && student.category !== categoryFilter) return false;
      
      // Belt filter
      if (beltFilter !== "all" && student.beltRank !== beltFilter) return false;
      
      return true;
    });
  }, [students, activeTab, searchQuery, categoryFilter, beltFilter]);

  const handleExport = () => {
    if (!filteredStudents.length) {
      toast.error("No students to export");
      return;
    }

    const headers = ["ID", "First Name", "Last Name", "Email", "Phone", "Belt", "Category", "Status", "Program"];
    const csvContent = [
      headers.join(","),
      ...filteredStudents.map((s) => [
        s.id,
        s.firstName,
        s.lastName,
        s.email || "",
        s.phone || "",
        s.beltRank,
        s.category,
        s.status,
        s.program || "",
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `students_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("Export downloaded!");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Students</h1>
            <p className="text-muted-foreground">Manage your martial arts students</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("active")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 text-green-600">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.active || 0}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("trial")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.trial || 0}</p>
                  <p className="text-xs text-muted-foreground">Trial</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("inactive")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100 text-gray-600">
                  <UserX className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.inactive || 0}</p>
                  <p className="text-xs text-muted-foreground">Inactive</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCategoryFilter("A")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 text-green-600 font-bold">A</div>
                <div>
                  <p className="text-2xl font-bold">{stats?.categoryA || 0}</p>
                  <p className="text-xs text-muted-foreground">Category A</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCategoryFilter("B")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-100 text-yellow-600 font-bold">B</div>
                <div>
                  <p className="text-2xl font-bold">{stats?.categoryB || 0}</p>
                  <p className="text-xs text-muted-foreground">Category B</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCategoryFilter("C")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100 text-red-600 font-bold">C</div>
                <div>
                  <p className="text-2xl font-bold">{stats?.categoryC || 0}</p>
                  <p className="text-xs text-muted-foreground">Category C</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Map Section */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Student Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] rounded-lg overflow-hidden">
              <MapView
                onMapReady={(map) => {
                  // Add markers for students with coordinates
                  if (students) {
                    students.forEach((student) => {
                      if (student.latitude && student.longitude) {
                        const lat = parseFloat(student.latitude);
                        const lng = parseFloat(student.longitude);
                        if (!isNaN(lat) && !isNaN(lng)) {
                          new google.maps.Marker({
                            position: { lat, lng },
                            map,
                            title: `${student.firstName} ${student.lastName}`,
                          });
                        }
                      }
                    });
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as ABCCategory | "all")}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="A">Category A</SelectItem>
              <SelectItem value="B">Category B</SelectItem>
              <SelectItem value="C">Category C</SelectItem>
            </SelectContent>
          </Select>
          <Select value={beltFilter} onValueChange={(v) => setBeltFilter(v as BeltRank | "all")}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Belt" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Belts</SelectItem>
              {Object.keys(BELT_COLORS).map((belt) => (
                <SelectItem key={belt} value={belt} className="capitalize">{belt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as StudentStatus)}>
          <TabsList>
            <TabsTrigger value="active">Active ({stats?.active || 0})</TabsTrigger>
            <TabsTrigger value="trial">Trial ({stats?.trial || 0})</TabsTrigger>
            <TabsTrigger value="inactive">Inactive ({stats?.inactive || 0})</TabsTrigger>
            <TabsTrigger value="frozen">Frozen ({stats?.frozen || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                          <Skeleton className="h-3 w-2/3" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredStudents.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No students found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery ? "Try adjusting your search or filters" : "Add your first student to get started"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStudents.map((student) => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    onClick={() => setSelectedStudent(student)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Student Detail Modal */}
      <StudentDetailModal
        student={selectedStudent}
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        onUpdate={() => {
          refetch();
          setSelectedStudent(null);
        }}
      />

      {/* Add Student Dialog */}
      <AddStudentDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSuccess={refetch}
      />
    </div>
  );
}

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  Search, Plus, Phone, Mail, Calendar, Edit2, Trash2, 
  ChevronRight, Users, Target, TrendingUp, CheckCircle, XCircle
} from "lucide-react";
import { LEAD_STAGES, type LeadStage } from "@shared/types";
import { cn } from "@/lib/utils";

// Lead card component
function LeadCard({
  lead,
  onEdit,
  onMoveStage
}: {
  lead: any;
  onEdit: () => void;
  onMoveStage: (stage: LeadStage) => void;
}) {
  const initials = `${lead.firstName?.[0] || ""}${lead.lastName?.[0] || ""}`.toUpperCase();
  const currentStageIndex = LEAD_STAGES.findIndex(s => s.id === lead.stage);
  const nextStage = LEAD_STAGES[currentStageIndex + 1];
  const prevStage = LEAD_STAGES[currentStageIndex - 1];

  return (
    <Card className="mb-3 hover:shadow-md transition-shadow cursor-pointer" onClick={onEdit}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 bg-primary/10">
            <AvatarFallback className="text-primary font-semibold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-foreground truncate">
              {lead.firstName} {lead.lastName}
            </h4>
            
            <div className="mt-1 space-y-1 text-xs text-muted-foreground">
              {lead.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {lead.phone}
                </div>
              )}
              {lead.email && (
                <div className="flex items-center gap-1 truncate">
                  <Mail className="h-3 w-3" />
                  {lead.email}
                </div>
              )}
              {lead.interestedProgram && (
                <Badge variant="outline" className="text-xs mt-1">
                  {lead.interestedProgram}
                </Badge>
              )}
            </div>

            {/* Quick stage navigation */}
            <div className="flex gap-1 mt-3" onClick={(e) => e.stopPropagation()}>
              {prevStage && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-xs px-2"
                  onClick={() => onMoveStage(prevStage.id)}
                >
                  ← {prevStage.label}
                </Button>
              )}
              {nextStage && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-xs px-2 ml-auto"
                  onClick={() => onMoveStage(nextStage.id)}
                >
                  {nextStage.label} →
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Kanban column
function KanbanColumn({
  stage,
  leads,
  onEditLead,
  onMoveStage
}: {
  stage: typeof LEAD_STAGES[0];
  leads: any[];
  onEditLead: (lead: any) => void;
  onMoveStage: (leadId: number, stage: LeadStage) => void;
}) {
  return (
    <div className="flex-shrink-0 w-72">
      <div className="bg-muted/50 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-3">
          <div className={cn("w-3 h-3 rounded-full", stage.color)} />
          <h3 className="font-medium text-sm">{stage.label}</h3>
          <Badge variant="secondary" className="ml-auto text-xs">
            {leads.length}
          </Badge>
        </div>
        
        <ScrollArea className="h-[calc(100vh-280px)]">
          {leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onEdit={() => onEditLead(lead)}
              onMoveStage={(newStage) => onMoveStage(lead.id, newStage)}
            />
          ))}
          {leads.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-8">
              No leads
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}

// Add/Edit Lead Dialog
function LeadDialog({
  lead,
  isOpen,
  onClose,
  onSuccess
}: {
  lead: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    firstName: lead?.firstName || "",
    lastName: lead?.lastName || "",
    email: lead?.email || "",
    phone: lead?.phone || "",
    stage: (lead?.stage || "new") as LeadStage,
    source: lead?.source || "",
    interestedProgram: lead?.interestedProgram || "",
    notes: lead?.notes || "",
  });

  const createMutation = trpc.lead.create.useMutation({
    onSuccess: () => {
      toast.success("Lead added successfully!");
      onSuccess();
      onClose();
    },
    onError: (error) => {
      toast.error("Failed to add lead: " + error.message);
    },
  });

  const updateMutation = trpc.lead.update.useMutation({
    onSuccess: () => {
      toast.success("Lead updated successfully!");
      onSuccess();
      onClose();
    },
    onError: (error) => {
      toast.error("Failed to update lead: " + error.message);
    },
  });

  const deleteMutation = trpc.lead.delete.useMutation({
    onSuccess: () => {
      toast.success("Lead deleted");
      onSuccess();
      onClose();
    },
    onError: (error) => {
      toast.error("Failed to delete lead: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName) {
      toast.error("First name and last name are required");
      return;
    }
    
    if (lead) {
      updateMutation.mutate({
        id: lead.id,
        data: formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = () => {
    if (lead && confirm("Are you sure you want to delete this lead?")) {
      deleteMutation.mutate({ id: lead.id });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{lead ? "Edit Lead" : "Add New Lead"}</DialogTitle>
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
              <Label>Stage</Label>
              <Select value={formData.stage} onValueChange={(v) => setFormData({...formData, stage: v as LeadStage})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_STAGES.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>{stage.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Source</Label>
              <Input
                value={formData.source}
                onChange={(e) => setFormData({...formData, source: e.target.value})}
                placeholder="e.g., Website, Referral"
              />
            </div>
          </div>
          <div>
            <Label>Interested Program</Label>
            <Input
              value={formData.interestedProgram}
              onChange={(e) => setFormData({...formData, interestedProgram: e.target.value})}
              placeholder="e.g., Kids Karate, Adult BJJ"
            />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
            />
          </div>
          <DialogFooter className="flex justify-between">
            {lead && (
              <Button 
                type="button" 
                variant="destructive" 
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {lead ? "Update" : "Add"} Lead
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Main Leads Page
export default function Leads() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: leads, isLoading, refetch } = trpc.lead.list.useQuery();
  
  const updateMutation = trpc.lead.update.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Lead moved successfully");
    },
    onError: (error) => {
      toast.error("Failed to move lead: " + error.message);
    },
  });

  // Group leads by stage
  const leadsByStage = useMemo(() => {
    if (!leads) return {};
    
    const filtered = leads.filter((lead) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      const fullName = `${lead.firstName} ${lead.lastName}`.toLowerCase();
      return fullName.includes(query) || lead.email?.toLowerCase().includes(query);
    });
    
    const grouped: Record<string, any[]> = {};
    LEAD_STAGES.forEach((stage) => {
      grouped[stage.id] = filtered.filter((lead) => lead.stage === stage.id);
    });
    
    return grouped;
  }, [leads, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    if (!leads) return { total: 0, new: 0, won: 0, lost: 0, conversionRate: 0 };
    
    const total = leads.length;
    const newLeads = leads.filter(l => l.stage === "new").length;
    const won = leads.filter(l => l.stage === "won").length;
    const lost = leads.filter(l => l.stage === "lost").length;
    const conversionRate = total > 0 ? Math.round((won / total) * 100) : 0;
    
    return { total, new: newLeads, won, lost, conversionRate };
  }, [leads]);

  const handleMoveStage = (leadId: number, newStage: LeadStage) => {
    updateMutation.mutate({
      id: leadId,
      data: { stage: newStage },
    });
  };

  const handleEditLead = (lead: any) => {
    setSelectedLead(lead);
    setIsDialogOpen(true);
  };

  const handleAddLead = () => {
    setSelectedLead(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Leads Pipeline</h1>
            <p className="text-muted-foreground">Track and manage your prospective students</p>
          </div>
          <Button onClick={handleAddLead}>
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Leads</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.new}</p>
                  <p className="text-xs text-muted-foreground">New Leads</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.won}</p>
                  <p className="text-xs text-muted-foreground">Won</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.conversionRate}%</p>
                  <p className="text-xs text-muted-foreground">Conversion Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Kanban Board */}
        {isLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-72">
                <div className="bg-muted/50 rounded-lg p-3">
                  <Skeleton className="h-6 w-24 mb-3" />
                  <Skeleton className="h-32 w-full mb-3" />
                  <Skeleton className="h-32 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {LEAD_STAGES.map((stage) => (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                leads={leadsByStage[stage.id] || []}
                onEditLead={handleEditLead}
                onMoveStage={handleMoveStage}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lead Dialog */}
      <LeadDialog
        lead={selectedLead}
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedLead(null);
        }}
        onSuccess={refetch}
      />
    </div>
  );
}

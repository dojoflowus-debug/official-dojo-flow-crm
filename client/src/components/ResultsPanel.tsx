/**
 * Results Panel Component
 * Right-side drawer for displaying student and lead data cards
 * Triggered by clicking chips in Kai Command chat
 */

import { X, User, Mail, Phone, MapPin, Calendar, Award, CreditCard, Pencil } from "lucide-react";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

export type ResultsPanelData = 
  | { type: "student_card"; studentId: number }
  | { type: "student_list"; studentIds: number[] }
  | { type: "lead_card"; leadId: number }
  | { type: "lead_list"; leadIds: number[] }
  | null;

interface ResultsPanelProps {
  data: ResultsPanelData;
  onClose: () => void;
}

export function ResultsPanel({ data, onClose }: ResultsPanelProps) {
  const [showEscHint, setShowEscHint] = useState(false);

  // ESC key handler
  useEffect(() => {
    if (!data) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [data, onClose]);

  // Show ESC hint once on first open
  useEffect(() => {
    if (!data) return;

    const hasSeenHint = localStorage.getItem('kai-results-panel-esc-hint-seen');
    if (!hasSeenHint) {
      setShowEscHint(true);
      localStorage.setItem('kai-results-panel-esc-hint-seen', 'true');
      
      // Hide hint after 3 seconds
      const timer = setTimeout(() => setShowEscHint(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [data]);

  if (!data) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 z-[99] backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-[420px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 shadow-2xl z-[100] flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header - Simple for lists */}
      {(data.type === "student_list" || data.type === "lead_list") && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {data.type === "student_list" && `Students (${data.studentIds.length})`}
            {data.type === "lead_list" && `Leads (${data.leadIds.length})`}
          </h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Close</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      {/* ESC Hint */}
      {showEscHint && (
        <div className="px-6 py-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-600 dark:text-slate-400 text-center">
            Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-slate-700 dark:text-slate-300 font-mono">ESC</kbd> to close
          </p>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {data.type === "student_card" && <StudentCard studentId={data.studentId} onClose={onClose} />}
        {data.type === "student_list" && <StudentList studentIds={data.studentIds} />}
        {data.type === "lead_card" && <LeadCard leadId={data.leadId} />}
        {data.type === "lead_list" && <LeadList leadIds={data.leadIds} />}
      </div>
      </div>
    </>
  );
}

function StudentCard({ studentId, onClose }: { studentId: number; onClose?: () => void }) {
  const { data: student, isLoading } = trpc.kaiData.getStudent.useQuery({ studentId });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const utils = trpc.useUtils();
  const updateStudentMutation = trpc.students.update.useMutation({
    onSuccess: () => {
      utils.kaiData.getStudent.invalidate({ studentId });
      toast.success('Student updated successfully');
      setIsEditModalOpen(false);
    },
    onError: (error) => {
      toast.error('Failed to update student');
      console.error('Update error:', error);
    },
  });

  // Initialize edit form when student data loads
  useEffect(() => {
    if (student) {
      setEditForm({
        firstName: student.firstName || '',
        lastName: student.lastName || '',
        email: student.email || '',
        phone: student.phone || '',
        streetAddress: student.streetAddress || '',
        city: student.city || '',
        state: student.state || '',
        zipCode: student.zipCode || '',
        program: student.program || '',
        beltRank: student.beltRank || '',
        status: student.status || 'Active',
        membershipStatus: student.membershipStatus || '',
        guardianName: student.guardianName || '',
        guardianRelationship: student.guardianRelationship || '',
        guardianPhone: student.guardianPhone || '',
        guardianEmail: student.guardianEmail || '',
      });
    }
  }, [student]);

  const handleSaveEdit = async () => {
    try {
      await updateStudentMutation.mutateAsync({
        id: studentId,
        ...editForm,
      });
    } catch (error) {
      // Error handled by mutation callbacks
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-12 text-slate-500">
        Student not found
      </div>
    );
  }

  return (
    <>
      {/* Sticky Header with Avatar, Name, Status, and Actions */}
      <div className="sticky top-0 bg-white dark:bg-slate-900 z-10 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {student.photoUrl ? (
              <img
                src={student.photoUrl}
                alt={`${student.firstName} ${student.lastName}`}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-lg font-semibold">
                {student.firstName[0]}{student.lastName[0]}
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {student.firstName} {student.lastName}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  student.status === "Active" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" :
                  student.status === "On Hold" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" :
                  "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                }`}>
                  {student.status}
                </span>
                {student.beltRank && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                    {student.beltRank}
                  </span>
                )}
              </div>
            </div>
          </div>
          <TooltipProvider>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Pencil className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Edit Profile</TooltipContent>
              </Tooltip>
              {onClose && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={onClose}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Close</TooltipContent>
                </Tooltip>
              )}
            </div>
          </TooltipProvider>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="space-y-6 px-6 py-4">
        {/* Contact Info */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Contact Information
          </h4>
          {student.email && (
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-slate-400" />
              <a href={`mailto:${student.email}`} className="text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400">
                {student.email}
              </a>
            </div>
          )}
          {student.phone && (
            <div className="flex items-center gap-3 text-sm">
              <Phone className="w-4 h-4 text-slate-400" />
              <a href={`tel:${student.phone}`} className="text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400">
                {student.phone}
              </a>
            </div>
          )}
          {(student.streetAddress || student.city) && (
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600 dark:text-slate-400">
                {student.streetAddress && `${student.streetAddress}, `}
                {student.city && `${student.city}, `}
                {student.state} {student.zipCode}
              </span>
            </div>
          )}
        </div>

        {/* Program Info */}
        {student.program && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Program
            </h4>
            <div className="flex items-center gap-3 text-sm">
              <Award className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600 dark:text-slate-400">{student.program}</span>
            </div>
          </div>
        )}

        {/* Membership Status */}
        {student.membershipStatus && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Membership
            </h4>
            <div className="flex items-center gap-3 text-sm">
              <CreditCard className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600 dark:text-slate-400">{student.membershipStatus}</span>
            </div>
          </div>
        )}

        {/* Guardian Info */}
        {student.guardianName && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Guardian
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600 dark:text-slate-400">
                  {student.guardianName}
                  {student.guardianRelationship && ` (${student.guardianRelationship})`}
                </span>
              </div>
              {student.guardianPhone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <a href={`tel:${student.guardianPhone}`} className="text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400">
                    {student.guardianPhone}
                  </a>
                </div>
              )}
              {student.guardianEmail && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <a href={`mailto:${student.guardianEmail}`} className="text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400">
                    {student.guardianEmail}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit Student Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Student Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Name */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={editForm.firstName || ''}
                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={editForm.lastName || ''}
                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                />
              </div>
            </div>

            {/* Contact */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editForm.email || ''}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={editForm.phone || ''}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="streetAddress">Street Address</Label>
              <Input
                id="streetAddress"
                value={editForm.streetAddress || ''}
                onChange={(e) => setEditForm({ ...editForm, streetAddress: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={editForm.city || ''}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={editForm.state || ''}
                  onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">Zip Code</Label>
                <Input
                  id="zipCode"
                  value={editForm.zipCode || ''}
                  onChange={(e) => setEditForm({ ...editForm, zipCode: e.target.value })}
                />
              </div>
            </div>

            {/* Program & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="program">Program</Label>
                <Input
                  id="program"
                  value={editForm.program || ''}
                  onChange={(e) => setEditForm({ ...editForm, program: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="beltRank">Belt Rank</Label>
                <Input
                  id="beltRank"
                  value={editForm.beltRank || ''}
                  onChange={(e) => setEditForm({ ...editForm, beltRank: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={editForm.status || 'Active'} onValueChange={(value) => setEditForm({ ...editForm, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="On Hold">On Hold</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="membershipStatus">Membership Status</Label>
                <Input
                  id="membershipStatus"
                  value={editForm.membershipStatus || ''}
                  onChange={(e) => setEditForm({ ...editForm, membershipStatus: e.target.value })}
                />
              </div>
            </div>

            {/* Guardian */}
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Guardian Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="guardianName">Guardian Name</Label>
                  <Input
                    id="guardianName"
                    value={editForm.guardianName || ''}
                    onChange={(e) => setEditForm({ ...editForm, guardianName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guardianRelationship">Relationship</Label>
                  <Input
                    id="guardianRelationship"
                    value={editForm.guardianRelationship || ''}
                    onChange={(e) => setEditForm({ ...editForm, guardianRelationship: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="guardianPhone">Guardian Phone</Label>
                  <Input
                    id="guardianPhone"
                    type="tel"
                    value={editForm.guardianPhone || ''}
                    onChange={(e) => setEditForm({ ...editForm, guardianPhone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guardianEmail">Guardian Email</Label>
                  <Input
                    id="guardianEmail"
                    type="email"
                    value={editForm.guardianEmail || ''}
                    onChange={(e) => setEditForm({ ...editForm, guardianEmail: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={updateStudentMutation.isPending}>
              {updateStudentMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function StudentList({ studentIds }: { studentIds: number[] }) {
  return (
    <div className="space-y-4 p-6">
      {studentIds.map((id) => (
        <StudentCard key={id} studentId={id} />
      ))}
    </div>
  );
}

function LeadCard({ leadId }: { leadId: number }) {
  const { data: lead, isLoading } = trpc.kaiData.getLead.useQuery({ leadId });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-12 text-slate-500">
        Lead not found
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Profile Section */}
      <div className="flex items-start gap-4">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-semibold">
          {lead.firstName[0]}{lead.lastName[0]}
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
            {lead.firstName} {lead.lastName}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              lead.status === "new" ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" :
              lead.status === "contacted" ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" :
              lead.status === "converted" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" :
              "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            }`}>
              {lead.status}
            </span>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
          Contact Information
        </h4>
        {lead.email && (
          <div className="flex items-center gap-3 text-sm">
            <Mail className="w-4 h-4 text-slate-400" />
            <a href={`mailto:${lead.email}`} className="text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400">
              {lead.email}
            </a>
          </div>
        )}
        {lead.phone && (
          <div className="flex items-center gap-3 text-sm">
            <Phone className="w-4 h-4 text-slate-400" />
            <a href={`tel:${lead.phone}`} className="text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400">
              {lead.phone}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function LeadList({ leadIds }: { leadIds: number[] }) {
  return (
    <div className="space-y-4 p-6">
      {leadIds.map((id) => (
        <LeadCard key={id} leadId={id} />
      ))}
    </div>
  );
}

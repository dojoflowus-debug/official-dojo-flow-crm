import { useState, useEffect } from 'react';
import { getAvatarName } from '@/../../shared/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { trpc } from '@/lib/trpc';
import { Loader2, Plus, Trash2, Users2, Mail, Phone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Step6TeamProps {
  onNext: () => void;
  onBack: () => void;
}

interface TeamMemberData {
  id?: number;
  name: string;
  role: 'owner' | 'manager' | 'instructor' | 'front_desk' | 'coach' | 'trainer' | 'assistant';
  email: string;
  phone: string;
  locationIds: string; // JSON string
  addressAs: string;
  focusAreas: string; // JSON string
  canViewFinancials: boolean;
  canEditSchedule: boolean;
  canManageLeads: boolean;
  viewOnly: boolean;
}

const focusAreaOptions = [
  'kids',
  'advanced',
  'beginners',
  'sales',
  'retention',
  'pt',
  'group_classes',
  'private_lessons',
];

export default function Step6Team({ onNext, onBack }: Step6TeamProps) {
  const [avatarName] = useState(() => getAvatarName());
  const [teamMembers, setTeamMembers] = useState<TeamMemberData[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMemberData | null>(null);
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<string[]>([]);

  // Fetch existing data
  const { data: teamData, isLoading, refetch } = trpc.setupWizard.getTeamMembers.useQuery();
  const createMemberMutation = trpc.setupWizard.createTeamMember.useMutation();
  const updateMemberMutation = trpc.setupWizard.updateTeamMember.useMutation();
  const deleteMemberMutation = trpc.setupWizard.deleteTeamMember.useMutation();

  useEffect(() => {
    if (teamData) {
      setTeamMembers(teamData.map((m: any) => ({
        ...m,
        canViewFinancials: m.canViewFinancials === 1,
        canEditSchedule: m.canEditSchedule === 1,
        canManageLeads: m.canManageLeads === 1,
        viewOnly: m.viewOnly === 1,
      })));
    }
  }, [teamData]);

  const handleAddMember = () => {
    setEditingMember({
      name: '',
      role: 'instructor',
      email: '',
      phone: '',
      locationIds: '[]',
      addressAs: '',
      focusAreas: '[]',
      canViewFinancials: false,
      canEditSchedule: false,
      canManageLeads: false,
      viewOnly: true,
    });
    setSelectedFocusAreas([]);
    setIsDialogOpen(true);
  };

  const handleEditMember = (member: TeamMemberData) => {
    setEditingMember(member);
    try {
      const areas = JSON.parse(member.focusAreas || '[]');
      setSelectedFocusAreas(areas);
    } catch {
      setSelectedFocusAreas([]);
    }
    setIsDialogOpen(true);
  };

  const toggleFocusArea = (area: string) => {
    setSelectedFocusAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const handleSaveMember = async () => {
    if (!editingMember || !editingMember.name) {
      alert('Please enter a name');
      return;
    }

    const memberData = {
      ...editingMember,
      focusAreas: JSON.stringify(selectedFocusAreas),
      canViewFinancials: editingMember.canViewFinancials ? 1 : 0,
      canEditSchedule: editingMember.canEditSchedule ? 1 : 0,
      canManageLeads: editingMember.canManageLeads ? 1 : 0,
      viewOnly: editingMember.viewOnly ? 1 : 0,
    };

    try {
      if (editingMember.id) {
        await updateMemberMutation.mutateAsync({ id: editingMember.id, ...memberData });
      } else {
        await createMemberMutation.mutateAsync(memberData);
      }
      refetch();
      setIsDialogOpen(false);
      setEditingMember(null);
      setSelectedFocusAreas([]);
    } catch (error) {
      console.error('Error saving team member:', error);
      alert('Failed to save team member. Please try again.');
    }
  };

  const handleDeleteMember = async (id: number) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;

    try {
      await deleteMemberMutation.mutateAsync({ id });
      refetch();
    } catch (error) {
      console.error('Error deleting team member:', error);
      alert('Failed to delete team member. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Kai Bubble */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-lg">
            K
          </div>
          <div className="flex-1">
            <p className="text-sm text-foreground">
              <span className="font-semibold">{avatarName} says:</span> "Introduce me to your team. I'll remember who leads what, and I can route tasks, leads, and alerts to the right person."
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Team & Roles</h2>
            <p className="text-sm text-muted-foreground">
              Add your staff with roles, permissions, and focus areas
            </p>
          </div>
          <Button onClick={handleAddMember} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Team Member
          </Button>
        </div>

        {/* Team Members List */}
        {teamMembers.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users2 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center mb-4">
                No team members added yet. Add your staff to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teamMembers.map((member) => {
              let focusAreas: string[] = [];
              try {
                focusAreas = JSON.parse(member.focusAreas || '[]');
              } catch {}

              return (
                <Card key={member.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-bold">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold">{member.name}</div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {member.role.replace('_', ' ')}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMember(member.id!)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {member.addressAs && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Address as:</span>{' '}
                        <span className="font-medium">{member.addressAs}</span>
                      </p>
                    )}
                    {member.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {member.email}
                      </div>
                    )}
                    {member.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {member.phone}
                      </div>
                    )}
                    {focusAreas.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {focusAreas.map((area) => (
                          <Badge key={area} variant="secondary" className="text-xs">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => handleEditMember(member)}
                    >
                      Edit Details
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Team Member Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMember?.id ? 'Edit Team Member' : 'Add Team Member'}
            </DialogTitle>
          </DialogHeader>
          {editingMember && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="memberName">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="memberName"
                  placeholder="e.g., Sarah Johnson"
                  value={editingMember.name}
                  onChange={(e) =>
                    setEditingMember({ ...editingMember, name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={editingMember.role}
                  onValueChange={(value: any) =>
                    setEditingMember({ ...editingMember, role: value })
                  }
                >
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="instructor">Instructor</SelectItem>
                    <SelectItem value="front_desk">Front Desk</SelectItem>
                    <SelectItem value="coach">Coach</SelectItem>
                    <SelectItem value="trainer">Trainer</SelectItem>
                    <SelectItem value="assistant">Assistant</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={editingMember.email}
                    onChange={(e) =>
                      setEditingMember({ ...editingMember, email: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="(555) 123-4567"
                    value={editingMember.phone}
                    onChange={(e) =>
                      setEditingMember({ ...editingMember, phone: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="addressAs">How should members address them?</Label>
                <Input
                  id="addressAs"
                  placeholder="e.g., Coach Sarah, Professor João, Master Holmes"
                  value={editingMember.addressAs}
                  onChange={(e) =>
                    setEditingMember({ ...editingMember, addressAs: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Areas of Focus</Label>
                <div className="grid grid-cols-2 gap-2">
                  {focusAreaOptions.map((area) => (
                    <div key={area} className="flex items-center space-x-2">
                      <Checkbox
                        id={area}
                        checked={selectedFocusAreas.includes(area)}
                        onCheckedChange={() => toggleFocusArea(area)}
                      />
                      <label
                        htmlFor={area}
                        className="text-sm capitalize cursor-pointer"
                      >
                        {area.replace('_', ' ')}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t">
                <Label>Permissions</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="canViewFinancials" className="text-sm">
                      View Financials
                    </label>
                    <Checkbox
                      id="canViewFinancials"
                      checked={editingMember.canViewFinancials}
                      onCheckedChange={(checked) =>
                        setEditingMember({
                          ...editingMember,
                          canViewFinancials: checked as boolean,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label htmlFor="canEditSchedule" className="text-sm">
                      Edit Schedule
                    </label>
                    <Checkbox
                      id="canEditSchedule"
                      checked={editingMember.canEditSchedule}
                      onCheckedChange={(checked) =>
                        setEditingMember({
                          ...editingMember,
                          canEditSchedule: checked as boolean,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label htmlFor="canManageLeads" className="text-sm">
                      Manage Leads
                    </label>
                    <Checkbox
                      id="canManageLeads"
                      checked={editingMember.canManageLeads}
                      onCheckedChange={(checked) =>
                        setEditingMember({
                          ...editingMember,
                          canManageLeads: checked as boolean,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label htmlFor="viewOnly" className="text-sm">
                      View Only (No Edits)
                    </label>
                    <Checkbox
                      id="viewOnly"
                      checked={editingMember.viewOnly}
                      onCheckedChange={(checked) =>
                        setEditingMember({
                          ...editingMember,
                          viewOnly: checked as boolean,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveMember}
                  disabled={
                    !editingMember.name ||
                    createMemberMutation.isPending ||
                    updateMemberMutation.isPending
                  }
                >
                  {(createMemberMutation.isPending || updateMemberMutation.isPending) && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  Save Team Member
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext}>Continue to Member Journey</Button>
      </div>
    </div>
  );
}

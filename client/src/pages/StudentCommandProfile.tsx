import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';
import BottomNavLayout from '@/components/BottomNavLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ChevronLeft, Phone, Mail, MessageSquare, Edit, Save, X, AlertCircle, CheckCircle2, Calendar, MapPin, Users, FileText } from 'lucide-react';

interface EditableField {
  field: string;
  value: string;
  isEditing: boolean;
}

function StudentCommandProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const studentId = id ? parseInt(id) : 0;

  const [editingFields, setEditingFields] = useState<Record<string, EditableField>>({});
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { data: studentDetail, isLoading, error } = trpc.students.getDetail.useQuery(
    { id: studentId },
    { enabled: !!studentId }
  );

  const { data: notes } = trpc.students.getNotes.useQuery(
    { studentId },
    { enabled: !!studentId }
  );

  const updateMutation = trpc.students.update.useMutation();
  const student = studentDetail?.student;

  useEffect(() => {
    if (student) {
      const fields: Record<string, EditableField> = {
        firstName: { field: 'firstName', value: student.firstName || '', isEditing: false },
        lastName: { field: 'lastName', value: student.lastName || '', isEditing: false },
        email: { field: 'email', value: student.email || '', isEditing: false },
        phone: { field: 'phone', value: student.phone || '', isEditing: false },
        dateOfBirth: { field: 'dateOfBirth', value: student.dateOfBirth || '', isEditing: false },
        streetAddress: { field: 'streetAddress', value: student.streetAddress || '', isEditing: false },
        city: { field: 'city', value: student.city || '', isEditing: false },
        state: { field: 'state', value: student.state || '', isEditing: false },
        zipCode: { field: 'zipCode', value: student.zipCode || '', isEditing: false },
        guardianName: { field: 'guardianName', value: student.guardianName || '', isEditing: false },
        guardianRelationship: { field: 'guardianRelationship', value: student.guardianRelationship || '', isEditing: false },
        guardianPhone: { field: 'guardianPhone', value: student.guardianPhone || '', isEditing: false },
        guardianEmail: { field: 'guardianEmail', value: student.guardianEmail || '', isEditing: false },
        emergencyContactName: { field: 'emergencyContactName', value: student.emergencyContactName || '', isEditing: false },
        emergencyContactRelationship: { field: 'emergencyContactRelationship', value: student.emergencyContactRelationship || '', isEditing: false },
        emergencyContactPhone: { field: 'emergencyContactPhone', value: student.emergencyContactPhone || '', isEditing: false },
      };
      setEditingFields(fields);
    }
  }, [student]);

  const handleFieldChange = (fieldName: string, value: string) => {
    setEditingFields(prev => ({
      ...prev,
      [fieldName]: { ...prev[fieldName], value }
    }));
  };

  const toggleFieldEdit = (fieldName: string) => {
    setEditingFields(prev => ({
      ...prev,
      [fieldName]: { ...prev[fieldName], isEditing: !prev[fieldName].isEditing }
    }));
  };

  const handleSaveAll = async () => {
    if (!student) return;
    setIsSaving(true);
    setSaveError(null);

    try {
      const updateData: Record<string, any> = { id: student.id };
      Object.entries(editingFields).forEach(([key, field]) => {
        if (field.value !== (student as any)[key]) {
          updateData[key] = field.value || null;
        }
      });

      await updateMutation.mutateAsync(updateData);
      setEditingFields(prev => 
        Object.fromEntries(
          Object.entries(prev).map(([key, field]) => [key, { ...field, isEditing: false }])
        )
      );
      setShowSaveConfirm(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!student) return;
    try {
      await updateMutation.mutateAsync({ id: student.id, status: newStatus });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleBeltChange = async (newBelt: string) => {
    if (!student) return;
    try {
      await updateMutation.mutateAsync({ id: student.id, beltRank: newBelt });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update belt');
    }
  };

  if (isLoading) {
    return (
      <BottomNavLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground">Loading student profile...</p>
        </div>
      </BottomNavLayout>
    );
  }

  if (error || !student) {
    return (
      <BottomNavLayout>
        <div className="min-h-screen bg-background pb-24">
          <div className="container mx-auto px-4 py-6">
            <Button variant="ghost" size="sm" onClick={() => navigate('/students')} className="gap-2 mb-6">
              <ChevronLeft className="w-4 h-4" />
              Back to Students
            </Button>
            <div className="flex items-center justify-center h-64 space-y-3">
              <AlertCircle className="w-12 h-12 text-red-500/50" />
              <p className="text-muted-foreground">Student not found</p>
            </div>
          </div>
        </div>
      </BottomNavLayout>
    );
  }

  return (
    <BottomNavLayout>
      <div className="min-h-screen bg-background pb-24">
        <div className="sticky top-0 z-30 bg-background/50 backdrop-blur-xl border-b border-white/5">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => navigate('/students')} className="gap-2">
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
              <h1 className="text-2xl font-bold text-foreground">Student Profile</h1>
              <div className="w-10" />
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 space-y-6">
          {saveError && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-400">{saveError}</p>
            </div>
          )}

          {/* Identity Panel */}
          <Card className="bg-white/[0.03] border border-white/10 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-shrink-0">
                  <Avatar className="w-24 h-24 ring-4 ring-white/10">
                    <AvatarImage src={student.photoUrl || undefined} />
                    <AvatarFallback className="text-lg font-bold">
                      {`${student.firstName?.charAt(0) || ''}${student.lastName?.charAt(0) || ''}`}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-3xl font-bold text-foreground">
                      {student.firstName} {student.lastName}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">{student.email}</p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Belt Rank</p>
                      <Select value={student.beltRank || 'White Belt'} onValueChange={handleBeltChange}>
                        <SelectTrigger className="w-40 bg-transparent border-0 focus:ring-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="White Belt">White Belt</SelectItem>
                          <SelectItem value="Yellow Belt">Yellow Belt</SelectItem>
                          <SelectItem value="Orange Belt">Orange Belt</SelectItem>
                          <SelectItem value="Green Belt">Green Belt</SelectItem>
                          <SelectItem value="Blue Belt">Blue Belt</SelectItem>
                          <SelectItem value="Brown Belt">Brown Belt</SelectItem>
                          <SelectItem value="Black Belt">Black Belt</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Status</p>
                      <Select value={student.status || 'Active'} onValueChange={handleStatusChange}>
                        <SelectTrigger className="w-40 bg-transparent border-0 focus:ring-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="At Risk">At Risk</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                          <SelectItem value="On Hold">On Hold</SelectItem>
                          <SelectItem value="Trial">Trial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" className="gap-2">
                      <Phone className="w-4 h-4" />
                      Call
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Text
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Info Section */}
          <Card className="bg-white/[0.03] border border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['firstName', 'lastName', 'email', 'phone', 'dateOfBirth'].map((fieldName) => (
                  <div key={fieldName}>
                    <label className="text-xs text-muted-foreground font-medium capitalize">{fieldName}</label>
                    {editingFields[fieldName]?.isEditing ? (
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={editingFields[fieldName].value}
                          onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                          className="bg-white/5 border-white/10"
                        />
                        <Button size="sm" variant="ghost" onClick={() => toggleFieldEdit(fieldName)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between mt-1 p-2 rounded bg-white/[0.02] border border-white/5">
                        <p className="text-sm">{editingFields[fieldName]?.value || '—'}</p>
                        <Button size="sm" variant="ghost" onClick={() => toggleFieldEdit(fieldName)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Address Section */}
          <Card className="bg-white/[0.03] border border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['streetAddress', 'city', 'state', 'zipCode'].map((fieldName) => (
                  <div key={fieldName} className={fieldName === 'streetAddress' ? 'md:col-span-2' : ''}>
                    <label className="text-xs text-muted-foreground font-medium capitalize">{fieldName}</label>
                    {editingFields[fieldName]?.isEditing ? (
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={editingFields[fieldName].value}
                          onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                          className="bg-white/5 border-white/10"
                        />
                        <Button size="sm" variant="ghost" onClick={() => toggleFieldEdit(fieldName)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between mt-1 p-2 rounded bg-white/[0.02] border border-white/5">
                        <p className="text-sm">{editingFields[fieldName]?.value || '—'}</p>
                        <Button size="sm" variant="ghost" onClick={() => toggleFieldEdit(fieldName)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Guardian Info */}
          <Card className="bg-white/[0.03] border border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Parent/Guardian Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['guardianName', 'guardianRelationship', 'guardianPhone', 'guardianEmail'].map((fieldName) => (
                  <div key={fieldName} className={fieldName === 'guardianEmail' ? 'md:col-span-2' : ''}>
                    <label className="text-xs text-muted-foreground font-medium capitalize">{fieldName}</label>
                    {editingFields[fieldName]?.isEditing ? (
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={editingFields[fieldName].value}
                          onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                          className="bg-white/5 border-white/10"
                        />
                        <Button size="sm" variant="ghost" onClick={() => toggleFieldEdit(fieldName)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between mt-1 p-2 rounded bg-white/[0.02] border border-white/5">
                        <p className="text-sm">{editingFields[fieldName]?.value || '—'}</p>
                        <Button size="sm" variant="ghost" onClick={() => toggleFieldEdit(fieldName)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact Section */}
          <Card className="bg-white/[0.03] border border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Emergency Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['emergencyContactName', 'emergencyContactRelationship', 'emergencyContactPhone'].map((fieldName) => (
                  <div key={fieldName} className={fieldName === 'emergencyContactPhone' ? 'md:col-span-2' : ''}>
                    <label className="text-xs text-muted-foreground font-medium capitalize">{fieldName.replace('emergencyContact', '')}</label>
                    {editingFields[fieldName]?.isEditing ? (
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={editingFields[fieldName].value}
                          onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                          className="bg-white/5 border-white/10"
                        />
                        <Button size="sm" variant="ghost" onClick={() => toggleFieldEdit(fieldName)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between mt-1 p-2 rounded bg-white/[0.02] border border-white/5">
                        <p className="text-sm">{editingFields[fieldName]?.value || '—'}</p>
                        <Button size="sm" variant="ghost" onClick={() => toggleFieldEdit(fieldName)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Attendance Section */}
          <Card className="bg-white/[0.03] border border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Recent Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {studentDetail?.attendance && studentDetail.attendance.length > 0 ? (
                <div className="space-y-2">
                  {studentDetail.attendance.map((record: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded bg-white/[0.02] border border-white/5">
                      <div>
                        <p className="text-sm font-medium">{new Date(record.classDate).toLocaleDateString()}</p>
                        <p className="text-xs text-muted-foreground">{record.className || 'Class'}</p>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No attendance records</p>
              )}
            </CardContent>
          </Card>

          {/* Notes Section */}
          <Card className="bg-white/[0.03] border border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Notes & Behavior Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              {notes && notes.length > 0 ? (
                <div className="space-y-3">
                  {notes.map((note: any) => (
                    <div key={note.id} className="p-3 rounded bg-white/[0.02] border border-white/5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm">{note.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(note.createdAt).toLocaleDateString()} • {note.createdByName}
                          </p>
                        </div>
                        {note.priority && (
                          <Badge className="ml-2" variant="outline">
                            {note.priority}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No notes yet</p>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button onClick={() => setShowSaveConfirm(true)} className="gap-2 bg-red-600 hover:bg-red-700 text-white">
              <Save className="w-4 h-4" />
              Save All Changes
            </Button>
          </div>
        </div>

        <Dialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Changes?</DialogTitle>
              <DialogDescription>
                Are you sure you want to save all changes to this student's profile?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSaveConfirm(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveAll} disabled={isSaving} className="bg-red-600 hover:bg-red-700 text-white">
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </BottomNavLayout>
  );
}

export default StudentCommandProfile;

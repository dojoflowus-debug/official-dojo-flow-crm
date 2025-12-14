import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Calendar, 
  Clock, 
  User, 
  Bell, 
  BellOff, 
  CheckCircle2, 
  XCircle,
  MessageSquare,
  Settings,
  GraduationCap,
  Users,
  FileText,
  Download,
  Eye,
  Search,
  File,
  FileImage,
  FileSpreadsheet,
  FileVideo,
  FileAudio,
  Receipt,
  ScrollText,
  Upload
} from "lucide-react";

export default function StudentPortal() {
  const { user } = useAuth();
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [documentFilter, setDocumentFilter] = useState<'all' | 'waiver' | 'invoice' | 'chat_upload' | 'manual_upload'>('all');
  const [documentSearch, setDocumentSearch] = useState('');

  // Fetch all students (for admin/staff to select which student to manage)
  const { data: students } = trpc.students.list.useQuery();
  
  // Fetch available classes
  const { data: availableClasses, isLoading: classesLoading } = trpc.smsReminders.getAvailableClasses.useQuery();
  
  // Fetch enrolled classes for selected student
  const { data: enrolledClasses, refetch: refetchEnrollments } = trpc.smsReminders.getStudentEnrollments.useQuery(
    { studentId: selectedStudentId! },
    { enabled: !!selectedStudentId }
  );
  
  // Fetch documents for selected student
  const { data: documentsData, isLoading: documentsLoading } = trpc.documents.getStudentDocuments.useQuery(
    { studentId: selectedStudentId!, source: documentFilter === 'all' ? 'all' : documentFilter },
    { enabled: !!selectedStudentId }
  );
  
  // Fetch SMS preferences for selected student
  const { data: smsPreferences, refetch: refetchPreferences } = trpc.smsReminders.getPreferences.useQuery(
    { studentId: selectedStudentId! },
    { enabled: !!selectedStudentId }
  );

  // Mutations
  const enrollMutation = trpc.smsReminders.enrollInClass.useMutation({
    onSuccess: (data) => {
      toast.success(data.action === 'created' ? "Enrolled Successfully" : "Enrollment Updated", {
        description: "You have been enrolled in the class.",
      });
      refetchEnrollments();
    },
    onError: (error) => {
      toast.error("Enrollment Failed", {
        description: error.message,
      });
    },
  });

  const unenrollMutation = trpc.smsReminders.unenrollFromClass.useMutation({
    onSuccess: () => {
      toast.success("Unenrolled", {
        description: "You have been removed from the class.",
      });
      refetchEnrollments();
    },
    onError: (error) => {
      toast.error("Unenrollment Failed", {
        description: error.message,
      });
    },
  });

  const updateRemindersMutation = trpc.smsReminders.updateEnrollmentReminders.useMutation({
    onSuccess: () => {
      toast.success("Reminders Updated", {
        description: "SMS reminder settings have been updated.",
      });
      refetchEnrollments();
    },
  });

  const updatePreferencesMutation = trpc.smsReminders.updatePreferences.useMutation({
    onSuccess: () => {
      toast.success("Preferences Saved", {
        description: "Your SMS preferences have been updated.",
      });
      refetchPreferences();
    },
  });

  const enrolledClassIds = new Set(
    enrolledClasses?.filter(e => e.status === 'active').map(e => e.classId) || []
  );

  const handleEnroll = (classId: number) => {
    if (!selectedStudentId) return;
    enrollMutation.mutate({
      studentId: selectedStudentId,
      classId,
      smsRemindersEnabled: smsPreferences?.classReminders ?? true,
    });
  };

  const handleUnenroll = (classId: number) => {
    if (!selectedStudentId) return;
    unenrollMutation.mutate({
      studentId: selectedStudentId,
      classId,
    });
  };

  const handleToggleReminders = (classId: number, enabled: boolean) => {
    if (!selectedStudentId) return;
    updateRemindersMutation.mutate({
      studentId: selectedStudentId,
      classId,
      smsRemindersEnabled: enabled,
    });
  };

  const getDayColor = (day: string | null) => {
    const colors: Record<string, string> = {
      'Monday': 'bg-blue-500/20 text-blue-400',
      'Tuesday': 'bg-purple-500/20 text-purple-400',
      'Wednesday': 'bg-green-500/20 text-green-400',
      'Thursday': 'bg-orange-500/20 text-orange-400',
      'Friday': 'bg-pink-500/20 text-pink-400',
      'Saturday': 'bg-cyan-500/20 text-cyan-400',
      'Sunday': 'bg-red-500/20 text-red-400',
    };
    return colors[day || ''] || 'bg-gray-500/20 text-gray-400';
  };

  return (
    <div className="min-h-screen bg-[#0F1115] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#18181A]">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <GraduationCap className="h-7 w-7 text-red-500" />
                Student Portal
              </h1>
              <p className="text-gray-400 mt-1">Manage class enrollments and notification preferences</p>
            </div>
            
            {/* Student Selector */}
            <div className="flex items-center gap-4">
              <Label className="text-gray-400">Select Student:</Label>
              <Select
                value={selectedStudentId?.toString() || ""}
                onValueChange={(value) => setSelectedStudentId(Number(value))}
              >
                <SelectTrigger className="w-[250px] bg-[#0F1115] border-white/10">
                  <SelectValue placeholder="Choose a student..." />
                </SelectTrigger>
                <SelectContent className="bg-[#18181A] border-white/10">
                  {students?.map((student) => (
                    <SelectItem key={student.id} value={student.id.toString()}>
                      {student.firstName} {student.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {!selectedStudentId ? (
          <Card className="bg-[#18181A] border-white/10">
            <CardContent className="py-16 text-center">
              <Users className="h-16 w-16 mx-auto text-gray-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-300">Select a Student</h3>
              <p className="text-gray-500 mt-2">Choose a student from the dropdown above to manage their class enrollments.</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="classes" className="space-y-6">
            <TabsList className="bg-[#18181A] border border-white/10">
              <TabsTrigger value="classes" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400">
                <Calendar className="h-4 w-4 mr-2" />
                Available Classes
              </TabsTrigger>
              <TabsTrigger value="enrolled" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                My Enrollments
              </TabsTrigger>
              <TabsTrigger value="preferences" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400">
                <Settings className="h-4 w-4 mr-2" />
                SMS Preferences
              </TabsTrigger>
              <TabsTrigger value="documents" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400">
                <FileText className="h-4 w-4 mr-2" />
                Documents
              </TabsTrigger>
            </TabsList>

            {/* Available Classes Tab */}
            <TabsContent value="classes" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Available Classes</h2>
                <Badge variant="outline" className="border-white/20">
                  {availableClasses?.length || 0} classes
                </Badge>
              </div>

              {classesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="bg-[#18181A] border-white/10 animate-pulse">
                      <CardContent className="h-48" />
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableClasses?.map((cls) => {
                    const isEnrolled = enrolledClassIds.has(cls.id);
                    return (
                      <Card 
                        key={cls.id} 
                        className={`bg-[#18181A] border-white/10 transition-all hover:border-white/20 ${
                          isEnrolled ? 'ring-2 ring-green-500/30' : ''
                        }`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{cls.name}</CardTitle>
                              <CardDescription className="flex items-center gap-1 mt-1">
                                <User className="h-3 w-3" />
                                {cls.instructor || 'TBA'}
                              </CardDescription>
                            </div>
                            {isEnrolled && (
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                Enrolled
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center gap-4 text-sm">
                            <Badge className={getDayColor(cls.dayOfWeek)}>
                              {cls.dayOfWeek || 'TBA'}
                            </Badge>
                            <span className="flex items-center gap-1 text-gray-400">
                              <Clock className="h-3 w-3" />
                              {cls.time}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm text-gray-400">
                            <span>{cls.enrolled}/{cls.capacity} enrolled</span>
                            <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-red-500 rounded-full"
                                style={{ width: `${(cls.enrolled / cls.capacity) * 100}%` }}
                              />
                            </div>
                          </div>

                          {isEnrolled ? (
                            <Button 
                              variant="outline" 
                              className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                              onClick={() => handleUnenroll(cls.id)}
                              disabled={unenrollMutation.isPending}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Unenroll
                            </Button>
                          ) : (
                            <Button 
                              className="w-full bg-red-500 hover:bg-red-600"
                              onClick={() => handleEnroll(cls.id)}
                              disabled={enrollMutation.isPending || cls.enrolled >= cls.capacity}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              {cls.enrolled >= cls.capacity ? 'Class Full' : 'Enroll Now'}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {availableClasses?.length === 0 && (
                <Card className="bg-[#18181A] border-white/10">
                  <CardContent className="py-12 text-center">
                    <Calendar className="h-12 w-12 mx-auto text-gray-600 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-300">No Classes Available</h3>
                    <p className="text-gray-500 mt-2">Check back later for new class offerings.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* My Enrollments Tab */}
            <TabsContent value="enrolled" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">My Enrolled Classes</h2>
                <Badge variant="outline" className="border-white/20">
                  {enrolledClasses?.filter(e => e.status === 'active').length || 0} classes
                </Badge>
              </div>

              {enrolledClasses && enrolledClasses.filter(e => e.status === 'active').length > 0 ? (
                <div className="space-y-3">
                  {enrolledClasses
                    .filter(e => e.status === 'active')
                    .map((enrollment) => (
                      <Card key={enrollment.id} className="bg-[#18181A] border-white/10">
                        <CardContent className="py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-lg bg-red-500/20 flex items-center justify-center">
                                <GraduationCap className="h-6 w-6 text-red-400" />
                              </div>
                              <div>
                                <h3 className="font-semibold">{enrollment.className}</h3>
                                <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                                  <Badge className={getDayColor(enrollment.dayOfWeek)}>
                                    {enrollment.dayOfWeek}
                                  </Badge>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {enrollment.classTime}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {enrollment.instructor || 'TBA'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-6">
                              {/* SMS Reminder Toggle */}
                              <div className="flex items-center gap-3">
                                <Label className="text-sm text-gray-400 flex items-center gap-1">
                                  {enrollment.smsRemindersEnabled ? (
                                    <Bell className="h-4 w-4 text-green-400" />
                                  ) : (
                                    <BellOff className="h-4 w-4 text-gray-500" />
                                  )}
                                  SMS Reminders
                                </Label>
                                <Switch
                                  checked={enrollment.smsRemindersEnabled}
                                  onCheckedChange={(checked) => handleToggleReminders(enrollment.classId, checked)}
                                />
                              </div>

                              <Button 
                                variant="outline" 
                                size="sm"
                                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                                onClick={() => handleUnenroll(enrollment.classId)}
                              >
                                Unenroll
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              ) : (
                <Card className="bg-[#18181A] border-white/10">
                  <CardContent className="py-12 text-center">
                    <CheckCircle2 className="h-12 w-12 mx-auto text-gray-600 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-300">No Enrollments Yet</h3>
                    <p className="text-gray-500 mt-2">Browse available classes and enroll to get started.</p>
                    <Button 
                      className="mt-4 bg-red-500 hover:bg-red-600"
                      onClick={() => document.querySelector('[value="classes"]')?.dispatchEvent(new Event('click'))}
                    >
                      Browse Classes
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* SMS Preferences Tab */}
            <TabsContent value="preferences" className="space-y-4">
              <h2 className="text-lg font-semibold">SMS Notification Preferences</h2>

              <Card className="bg-[#18181A] border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-red-500" />
                    Notification Settings
                  </CardTitle>
                  <CardDescription>
                    Control how and when you receive SMS notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Master SMS Toggle */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                    <div>
                      <Label className="text-base font-medium">SMS Notifications</Label>
                      <p className="text-sm text-gray-400 mt-1">
                        Enable or disable all SMS notifications
                      </p>
                    </div>
                    <Switch
                      checked={smsPreferences?.optedIn ?? true}
                      onCheckedChange={(checked) => {
                        if (selectedStudentId) {
                          updatePreferencesMutation.mutate({
                            studentId: selectedStudentId,
                            optedIn: checked,
                          });
                        }
                      }}
                    />
                  </div>

                  {/* Class Reminders */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                    <div>
                      <Label className="text-base font-medium flex items-center gap-2">
                        <Bell className="h-4 w-4 text-blue-400" />
                        Class Reminders
                      </Label>
                      <p className="text-sm text-gray-400 mt-1">
                        Receive reminders before your scheduled classes
                      </p>
                    </div>
                    <Switch
                      checked={smsPreferences?.classReminders ?? true}
                      disabled={!smsPreferences?.optedIn}
                      onCheckedChange={(checked) => {
                        if (selectedStudentId) {
                          updatePreferencesMutation.mutate({
                            studentId: selectedStudentId,
                            classReminders: checked,
                          });
                        }
                      }}
                    />
                  </div>

                  {/* Reminder Timing */}
                  <div className="p-4 rounded-lg bg-white/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-medium flex items-center gap-2">
                          <Clock className="h-4 w-4 text-purple-400" />
                          Reminder Timing
                        </Label>
                        <p className="text-sm text-gray-400 mt-1">
                          How far in advance to send class reminders
                        </p>
                      </div>
                      <Select
                        value={smsPreferences?.reminderHoursBefore?.toString() || "24"}
                        disabled={!smsPreferences?.optedIn || !smsPreferences?.classReminders}
                        onValueChange={(value) => {
                          if (selectedStudentId) {
                            updatePreferencesMutation.mutate({
                              studentId: selectedStudentId,
                              reminderHoursBefore: Number(value),
                            });
                          }
                        }}
                      >
                        <SelectTrigger className="w-[180px] bg-[#0F1115] border-white/10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#18181A] border-white/10">
                          <SelectItem value="12">12 hours before</SelectItem>
                          <SelectItem value="24">24 hours before</SelectItem>
                          <SelectItem value="48">48 hours before</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Billing Reminders */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                    <div>
                      <Label className="text-base font-medium flex items-center gap-2">
                        <Bell className="h-4 w-4 text-green-400" />
                        Billing Reminders
                      </Label>
                      <p className="text-sm text-gray-400 mt-1">
                        Receive notifications about payments and billing
                      </p>
                    </div>
                    <Switch
                      checked={smsPreferences?.billingReminders ?? true}
                      disabled={!smsPreferences?.optedIn}
                      onCheckedChange={(checked) => {
                        if (selectedStudentId) {
                          updatePreferencesMutation.mutate({
                            studentId: selectedStudentId,
                            billingReminders: checked,
                          });
                        }
                      }}
                    />
                  </div>

                  {/* Promotional Messages */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                    <div>
                      <Label className="text-base font-medium flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-orange-400" />
                        Promotional Messages
                      </Label>
                      <p className="text-sm text-gray-400 mt-1">
                        Receive updates about events, promotions, and news
                      </p>
                    </div>
                    <Switch
                      checked={smsPreferences?.promotionalMessages ?? false}
                      disabled={!smsPreferences?.optedIn}
                      onCheckedChange={(checked) => {
                        if (selectedStudentId) {
                          updatePreferencesMutation.mutate({
                            studentId: selectedStudentId,
                            promotionalMessages: checked,
                          });
                        }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">My Documents</h2>
                <Badge variant="outline" className="border-white/20">
                  {documentsData?.documents?.length || 0} documents
                </Badge>
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: 'All', icon: File },
                  { value: 'waiver', label: 'Waivers', icon: ScrollText },
                  { value: 'invoice', label: 'Payments', icon: Receipt },
                  { value: 'chat_upload', label: 'Messages', icon: MessageSquare },
                  { value: 'manual_upload', label: 'Training', icon: GraduationCap },
                ].map(({ value, label, icon: Icon }) => (
                  <Button
                    key={value}
                    variant={documentFilter === value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDocumentFilter(value as any)}
                    className={documentFilter === value ? 'bg-red-500 hover:bg-red-600' : 'border-white/20 hover:bg-white/10'}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {label}
                  </Button>
                ))}
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={documentSearch}
                  onChange={(e) => setDocumentSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#18181A] border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-red-500/50"
                />
              </div>

              {/* Documents List */}
              {documentsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="bg-[#18181A] border-white/10 animate-pulse">
                      <CardContent className="h-20" />
                    </Card>
                  ))}
                </div>
              ) : documentsData?.documents && documentsData.documents.length > 0 ? (
                <div className="space-y-3">
                  {documentsData.documents
                    .filter(doc => 
                      !documentSearch || 
                      doc.filename.toLowerCase().includes(documentSearch.toLowerCase())
                    )
                    .map((doc) => {
                      const getIcon = () => {
                        if (doc.mimeType.startsWith('image/')) return <FileImage className="h-5 w-5 text-blue-400" />;
                        if (doc.mimeType.startsWith('video/')) return <FileVideo className="h-5 w-5 text-purple-400" />;
                        if (doc.mimeType.startsWith('audio/')) return <FileAudio className="h-5 w-5 text-green-400" />;
                        if (doc.mimeType.includes('spreadsheet') || doc.mimeType.includes('excel')) return <FileSpreadsheet className="h-5 w-5 text-green-400" />;
                        if (doc.mimeType === 'application/pdf') return <FileText className="h-5 w-5 text-red-400" />;
                        return <File className="h-5 w-5 text-gray-400" />;
                      };
                      
                      const getSourceBadge = () => {
                        const badges: Record<string, { label: string; color: string }> = {
                          'waiver': { label: 'Waiver', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
                          'invoice': { label: 'Invoice', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
                          'receipt': { label: 'Receipt', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
                          'chat_upload': { label: 'Message', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
                          'manual_upload': { label: 'Training', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
                          'onboarding': { label: 'Onboarding', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
                        };
                        const badge = badges[doc.source] || { label: doc.source, color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' };
                        return <Badge className={badge.color}>{badge.label}</Badge>;
                      };
                      
                      const formatSize = (bytes: number) => {
                        if (bytes < 1024) return `${bytes} B`;
                        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
                        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
                      };
                      
                      return (
                        <Card key={doc.id} className="bg-[#18181A] border-white/10 hover:border-white/20 transition-all">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <div className="p-3 rounded-lg bg-white/5">
                                {getIcon()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-white truncate">{doc.filename}</p>
                                <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                                  <span>{formatSize(doc.sizeBytes)}</span>
                                  <span>•</span>
                                  <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                                  {getSourceBadge()}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {doc.mimeType === 'application/pdf' && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 hover:bg-white/10"
                                    onClick={() => window.open(doc.storageUrl, '_blank')}
                                    title="Preview"
                                  >
                                    <Eye className="h-4 w-4 text-gray-400" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 hover:bg-white/10"
                                  onClick={() => {
                                    const a = document.createElement('a');
                                    a.href = doc.storageUrl;
                                    a.download = doc.filename;
                                    a.click();
                                  }}
                                  title="Download"
                                >
                                  <Download className="h-4 w-4 text-gray-400" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              ) : (
                <Card className="bg-[#18181A] border-white/10">
                  <CardContent className="py-12 text-center">
                    <FileText className="h-12 w-12 mx-auto text-gray-600 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-300">No Documents Yet</h3>
                    <p className="text-gray-500 mt-2">Your waivers, receipts, and training materials will appear here.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

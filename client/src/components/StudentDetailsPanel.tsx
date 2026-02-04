import React, { useState, useEffect } from 'react';
import { X, User, Calendar, DollarSign, Award, FileText, Phone, Mail, MapPin, Clock } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';

export interface StudentDetailsPanelProps {
  studentId: number;
  isOpen: boolean;
  onClose: () => void;
  theme?: 'light' | 'dark' | 'cinematic';
}

export function StudentDetailsPanel({ studentId, isOpen, onClose, theme = 'light' }: StudentDetailsPanelProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const isDark = theme === 'dark';
  const isCinematic = theme === 'cinematic';

  // Fetch student details
  const { data: student, isLoading } = trpc.students.getById.useQuery(
    { id: studentId },
    { enabled: isOpen && !!studentId }
  );

  // Fetch attendance data
  const { data: attendanceData } = trpc.students.getAttendance.useQuery(
    { studentId, days: 30 },
    { enabled: isOpen && !!studentId && activeTab === 'attendance' }
  );

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const bgClass = isCinematic
    ? 'bg-black/95 backdrop-blur-xl border-l border-white/10'
    : isDark
    ? 'bg-slate-900 border-l border-slate-700'
    : 'bg-white border-l border-slate-200';

  const textClass = isCinematic || isDark ? 'text-white' : 'text-slate-900';
  const mutedTextClass = isCinematic ? 'text-white/60' : isDark ? 'text-slate-400' : 'text-slate-600';

  // Return empty div when closed to maintain grid structure
  if (!isOpen || !studentId) {
    return <div className="hidden" />;
  }

  return (
    <div
      className={`
        h-full w-full
        ${bgClass}
        flex flex-col
        border-l
        ${isCinematic ? 'border-white/10' : isDark ? 'border-slate-700' : 'border-slate-200'}
      `}
    >
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          isCinematic ? 'border-white/10' : isDark ? 'border-slate-700' : 'border-slate-200'
        }`}>
          <h2 className={`text-lg font-semibold ${textClass}`}>
            {isLoading ? 'Loading...' : student?.firstName + ' ' + student?.lastName}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className={`${isCinematic || isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className={`w-full justify-start rounded-none border-b ${
            isCinematic ? 'bg-black/50 border-white/10' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}>
            <TabsTrigger value="overview" className="gap-2">
              <User className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="attendance" className="gap-2">
              <Calendar className="w-4 h-4" />
              Attendance
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-2">
              <DollarSign className="w-4 h-4" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="rank" className="gap-2">
              <Award className="w-4 h-4" />
              Rank
            </TabsTrigger>
            <TabsTrigger value="notes" className="gap-2">
              <FileText className="w-4 h-4" />
              Notes
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            {/* Overview Tab */}
            <TabsContent value="overview" className="p-4 space-y-6">
              {isLoading ? (
                <div className={`text-center ${mutedTextClass}`}>Loading student details...</div>
              ) : student ? (
                <>
                  {/* Profile Section */}
                  <div className="flex items-center gap-4">
                    {student.photoUrl ? (
                      <img
                        src={student.photoUrl}
                        alt={`${student.firstName} ${student.lastName}`}
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    ) : (
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold ${
                        isCinematic ? 'bg-white/10 text-white' : isDark ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {student.firstName[0]}{student.lastName[0]}
                      </div>
                    )}
                    <div>
                      <h3 className={`text-xl font-bold ${textClass}`}>
                        {student.firstName} {student.lastName}
                      </h3>
                      <Badge variant={student.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {student.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-3">
                    <h4 className={`font-semibold ${textClass}`}>Contact Information</h4>
                    {student.email && (
                      <div className="flex items-center gap-3">
                        <Mail className={`w-4 h-4 ${mutedTextClass}`} />
                        <span className={mutedTextClass}>{student.email}</span>
                      </div>
                    )}
                    {student.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className={`w-4 h-4 ${mutedTextClass}`} />
                        <span className={mutedTextClass}>{student.phone}</span>
                      </div>
                    )}
                    {student.address && (
                      <div className="flex items-center gap-3">
                        <MapPin className={`w-4 h-4 ${mutedTextClass}`} />
                        <span className={mutedTextClass}>{student.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Program & Rank */}
                  <div className="space-y-3">
                    <h4 className={`font-semibold ${textClass}`}>Program Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className={`text-sm ${mutedTextClass}`}>Program</p>
                        <p className={`font-medium ${textClass}`}>{student.program || 'Not set'}</p>
                      </div>
                      <div>
                        <p className={`text-sm ${mutedTextClass}`}>Belt Rank</p>
                        <p className={`font-medium ${textClass}`}>{student.beltRank || 'Not set'}</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className={`text-center ${mutedTextClass}`}>Student not found</div>
              )}
            </TabsContent>

            {/* Attendance Tab */}
            <TabsContent value="attendance" className="p-4 space-y-4">
              <h4 className={`font-semibold ${textClass}`}>30-Day Attendance History</h4>
              {attendanceData && attendanceData.length > 0 ? (
                <div className="space-y-2">
                  {attendanceData.map((record: any) => (
                    <div
                      key={record.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        isCinematic ? 'bg-white/5' : isDark ? 'bg-slate-800' : 'bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Clock className={`w-4 h-4 ${mutedTextClass}`} />
                        <span className={textClass}>
                          {new Date(record.checkInTime).toLocaleDateString()}
                        </span>
                      </div>
                      <span className={mutedTextClass}>
                        {new Date(record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`text-center py-8 ${mutedTextClass}`}>
                  No attendance records in the last 30 days
                </div>
              )}
            </TabsContent>

            {/* Billing Tab */}
            <TabsContent value="billing" className="p-4 space-y-4">
              <h4 className={`font-semibold ${textClass}`}>Billing Information</h4>
              <div className={`text-center py-8 ${mutedTextClass}`}>
                Billing details coming soon
              </div>
            </TabsContent>

            {/* Rank Tab */}
            <TabsContent value="rank" className="p-4 space-y-4">
              <h4 className={`font-semibold ${textClass}`}>Rank Progress</h4>
              <div className={`text-center py-8 ${mutedTextClass}`}>
                Rank progression details coming soon
              </div>
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes" className="p-4 space-y-4">
              <h4 className={`font-semibold ${textClass}`}>Notes & Activity Log</h4>
              <div className={`text-center py-8 ${mutedTextClass}`}>
                Notes feature coming soon
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
    </div>
  );
}

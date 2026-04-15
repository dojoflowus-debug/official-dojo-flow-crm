import React, { useState, useEffect } from 'react';
import { X, User, Calendar, DollarSign, Award, FileText, Phone, Mail, MapPin, Clock, CheckCircle2, XCircle, AlertTriangle, RefreshCw, CreditCard } from 'lucide-react';
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

  // Fetch billing/payment data
  const { data: billingData, isLoading: isBillingLoading } = trpc.tuitionBilling.getStudentBillingStatus.useQuery(
    { studentId },
    { enabled: isOpen && !!studentId && activeTab === 'payments' }
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
  const cardClass = isCinematic ? 'bg-white/5 border-white/10' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200';

  return (
    <>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 z-40 transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sliding Panel */}
      <div
        className={`
          absolute top-0 right-0 bottom-0 w-full lg:w-[420px] z-50
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          ${bgClass}
          flex flex-col
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
          <TabsList className={`w-full justify-start rounded-none border-b overflow-x-auto ${
            isCinematic ? 'bg-black/50 border-white/10' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}>
            <TabsTrigger value="overview" className="gap-1.5 text-xs">
              <User className="w-3.5 h-3.5" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="attendance" className="gap-1.5 text-xs">
              <Calendar className="w-3.5 h-3.5" />
              Attendance
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-1.5 text-xs">
              <CreditCard className="w-3.5 h-3.5" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="rank" className="gap-1.5 text-xs">
              <Award className="w-3.5 h-3.5" />
              Rank
            </TabsTrigger>
            <TabsTrigger value="notes" className="gap-1.5 text-xs">
              <FileText className="w-3.5 h-3.5" />
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

            {/* Payments Tab */}
            <TabsContent value="payments" className="p-0">
              {isBillingLoading ? (
                <div className={`flex items-center justify-center py-12 ${mutedTextClass}`}>
                  <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                  Loading payment history...
                </div>
              ) : !billingData || (billingData.payments.length === 0 && billingData.enrollments.length === 0) ? (
                <div className={`flex flex-col items-center justify-center py-12 ${mutedTextClass}`}>
                  <CreditCard className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm">No payment records found</p>
                </div>
              ) : (
                <div className="p-4 space-y-5">
                  {/* Enrollment Plans Summary */}
                  {billingData.enrollments.length > 0 && (
                    <div className="space-y-2">
                      <h4 className={`text-xs font-semibold uppercase tracking-wider ${mutedTextClass}`}>Active Plans</h4>
                      {billingData.enrollments.map((enr: any) => (
                        <div key={enr.id} className={`rounded-lg border p-3 ${cardClass}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className={`font-medium text-sm ${textClass}`}>{enr.planName}</p>
                              <p className={`text-xs ${mutedTextClass}`}>${enr.amountDollars.toFixed(2)} / {enr.frequency}</p>
                              {enr.hasCard && (
                                <p className={`text-xs mt-1 flex items-center gap-1 ${mutedTextClass}`}>
                                  <CreditCard className="w-3 h-3" />
                                  {enr.cardBrand} ••••{enr.cardLast4}
                                </p>
                              )}
                              {enr.nextBillingDate && (
                                <p className={`text-xs mt-1 ${mutedTextClass}`}>
                                  Next: {new Date(enr.nextBillingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                              )}
                              {enr.lastDeclinedAt && (
                                <p className="text-xs mt-1 text-red-400">
                                  Last declined: {new Date(enr.lastDeclinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                              <Badge variant={enr.status === 'active' ? 'default' : 'destructive'} className="text-xs">
                                {enr.status}
                              </Badge>
                              {enr.retryCount > 0 && (
                                <span className="text-xs text-orange-400 flex items-center gap-1">
                                  <RefreshCw className="w-3 h-3" />
                                  {enr.retryCount} decline{enr.retryCount !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Transaction History */}
                  {billingData.payments.length > 0 && (
                    <div className="space-y-2">
                      <h4 className={`text-xs font-semibold uppercase tracking-wider ${mutedTextClass}`}>
                        Transaction History ({billingData.payments.length})
                      </h4>
                      <div className="space-y-2">
                        {billingData.payments.map((pmt: any) => {
                          const isSuccess = pmt.status === 'success' || pmt.status === 'paid';
                          const isFailed = pmt.status === 'failed' || pmt.status === 'declined';
                          const isPending = !isSuccess && !isFailed;
                          return (
                            <div key={pmt.id} className={`rounded-lg border p-3 ${isCinematic ? 'bg-white/5 border-white/10' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2 flex-1 min-w-0">
                                  <div className={`mt-0.5 flex-shrink-0 ${isSuccess ? 'text-green-500' : isFailed ? 'text-red-500' : 'text-yellow-500'}`}>
                                    {isSuccess ? (
                                      <CheckCircle2 className="w-4 h-4" />
                                    ) : isFailed ? (
                                      <XCircle className="w-4 h-4" />
                                    ) : (
                                      <AlertTriangle className="w-4 h-4" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium truncate ${textClass}`}>
                                      {pmt.description || 'Tuition Payment'}
                                    </p>
                                    {isSuccess && pmt.paidAt && (
                                      <p className={`text-xs ${mutedTextClass}`}>
                                        Paid: {new Date(pmt.paidAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                      </p>
                                    )}
                                    {isFailed && pmt.declinedAt && (
                                      <p className="text-xs text-red-400">
                                        Declined: {new Date(pmt.declinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                      </p>
                                    )}
                                    {isPending && pmt.createdAt && (
                                      <p className={`text-xs ${mutedTextClass}`}>
                                        Created: {new Date(pmt.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                      </p>
                                    )}
                                    {isFailed && pmt.failureReason && (
                                      <p className="text-xs text-red-400 truncate">{pmt.failureReason}</p>
                                    )}
                                    {pmt.fluidpayTransactionId && (
                                      <p className={`text-xs font-mono truncate ${mutedTextClass} opacity-60`}>
                                        {pmt.fluidpayTransactionId}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className={`text-sm font-semibold ${isSuccess ? 'text-green-500' : isFailed ? 'text-red-500' : textClass}`}>
                                    ${pmt.amountDollars.toFixed(2)}
                                  </p>
                                  <Badge
                                    variant={isSuccess ? 'default' : isFailed ? 'destructive' : 'secondary'}
                                    className="text-xs mt-1"
                                  >
                                    {pmt.status}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
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
    </>
  );
}

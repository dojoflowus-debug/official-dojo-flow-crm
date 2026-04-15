import { useState, useEffect } from 'react'
import { X, Save, Loader2, MessageSquare, TrendingUp, Users, Clock, AlertCircle, Heart, Flag, CheckCircle2, CreditCard, RefreshCw, XCircle, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { trpc } from '@/lib/trpc'
import { cn } from '@/lib/utils'

type NoteType = 'General' | 'Behavior' | 'Attendance' | 'Promotion' | 'Parent' | 'Follow-up' | 'System'

interface StudentNote {
  id?: number
  content: string
  type: NoteType
  author?: string
  createdAt: string | Date
}

interface StudentNotesDrawerProps {
  studentId: number
  studentName: string
  studentData?: {
    firstName?: string
    lastName?: string
    beltRank?: string
    program?: string
    status?: string
    photoUrl?: string
    attendancePercentage?: number
    lastAttended?: string
  }
  isOpen: boolean
  onClose: () => void
}

const NOTE_TYPE_CONFIG: Record<NoteType, { icon: React.ReactNode; color: string; bgColor: string }> = {
  General: { icon: <MessageSquare className="w-4 h-4" />, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  Behavior: { icon: <AlertCircle className="w-4 h-4" />, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  Attendance: { icon: <Clock className="w-4 h-4" />, color: 'text-green-500', bgColor: 'bg-green-500/10' },
  Promotion: { icon: <TrendingUp className="w-4 h-4" />, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  Parent: { icon: <Users className="w-4 h-4" />, color: 'text-pink-500', bgColor: 'bg-pink-500/10' },
  'Follow-up': { icon: <Flag className="w-4 h-4" />, color: 'text-red-500', bgColor: 'bg-red-500/10' },
  System: { icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-gray-500', bgColor: 'bg-gray-500/10' },
}

export function StudentNotesDrawer({
  studentId,
  studentName,
  studentData,
  isOpen,
  onClose,
}: StudentNotesDrawerProps) {
  const [activeTab, setActiveTab] = useState<'notes' | 'payments'>('notes')
  const [notes, setNotes] = useState<StudentNote[]>([])
  const [newNoteContent, setNewNoteContent] = useState('')
  const [selectedNoteType, setSelectedNoteType] = useState<NoteType>('General')
  const [isSaving, setIsSaving] = useState(false)
  const [followUpDate, setFollowUpDate] = useState<string>('')

  // Fetch student notes
  const { data: studentNotes } = trpc.students.getNotes.useQuery(
    { studentId },
    { enabled: isOpen && !!studentId }
  )

  // Fetch billing/payment data
  const { data: billingData, isLoading: isBillingLoading } = trpc.tuitionBilling.getStudentBillingStatus.useQuery(
    { studentId },
    { enabled: isOpen && !!studentId && activeTab === 'payments' }
  )

  // Add/update note mutation
  const addNoteMutation = trpc.students.addNote.useMutation({
    onSuccess: () => {
      setNewNoteContent('')
      setFollowUpDate('')
      setSelectedNoteType('General')
      setIsSaving(false)
    },
    onError: (error) => {
      console.error('Failed to save notes:', error)
      setIsSaving(false)
    },
  })

  // Load notes when drawer opens or student changes
  useEffect(() => {
    if (isOpen && studentNotes) {
      const formattedNotes: StudentNote[] = studentNotes.map(note => ({
        id: note.id,
        content: note.content,
        type: (note.type as NoteType) || 'General',
        author: note.author || 'System',
        createdAt: note.createdAt,
      }))
      setNotes(formattedNotes.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ))
    }
  }, [isOpen, studentNotes])

  const handleSaveNote = async () => {
    if (!newNoteContent.trim()) return
    
    setIsSaving(true)
    try {
      await addNoteMutation.mutateAsync({
        studentId,
        content: newNoteContent,
        type: selectedNoteType,
        followUpDate: followUpDate || undefined,
      })
    } catch (error) {
      console.error('Error saving notes:', error)
      setIsSaving(false)
    }
  }

  const formatDate = (date: string | Date) => {
    const d = new Date(date)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (d.toDateString() === today.toDateString()) {
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    } else if (d.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  const formatFullDate = (date: string | Date | null | undefined) => {
    if (!date) return null
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (!isOpen) return null

  const hasNotes = notes.length > 0
  const attendancePercentage = studentData?.attendancePercentage || 0
  const lastAttended = studentData?.lastAttended || 'Never'

  return (
    <>
      {/* Backdrop - z-index: 40, pointer-events: auto */}
      <div
        className="fixed inset-0 z-40 bg-black/50 dark:bg-black/60 backdrop-blur-sm transition-opacity duration-300 light:bg-black/30 pointer-events-auto"
        onClick={onClose}
        role="presentation"
      />

      {/* Drawer - z-index: 50 (above backdrop), flex column layout, height accounts for bottom nav */}
      <div className="fixed right-0 top-0 z-50 w-full max-w-md bg-background border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 pointer-events-auto" style={{ height: 'calc(100vh - 64px)' }}>
        
        {/* Header - Student Context Block - Fixed, non-scrolling */}
        <div className="flex-shrink-0 border-b border-border p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <Avatar className="w-12 h-12 border-2 border-primary/30 flex-shrink-0">
                <AvatarImage src={studentData?.photoUrl} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {(studentData?.firstName?.[0] || 'S') + (studentData?.lastName?.[0] || '')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-foreground truncate">{studentName}</h2>
                <p className="text-sm text-muted-foreground">{studentData?.program || 'Program'} • {studentData?.beltRank || 'White Belt'}</p>
                <div className="flex gap-2 mt-2">
                  {studentData?.status && (
                    <Badge variant="secondary" className="text-xs">
                      {studentData.status}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors duration-200 flex-shrink-0"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
            </button>
          </div>

          {/* Attendance & Status Info */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Attendance</p>
              <p className="text-lg font-bold text-foreground">{attendancePercentage}%</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Last Attended</p>
              <p className="text-sm font-medium text-foreground truncate">{lastAttended}</p>
            </div>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex-shrink-0 border-b border-border flex">
          <button
            onClick={() => setActiveTab('notes')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors pointer-events-auto',
              activeTab === 'notes'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            <MessageSquare className="w-4 h-4" />
            Notes
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors pointer-events-auto',
              activeTab === 'payments'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            <CreditCard className="w-4 h-4" />
            Payments
          </button>
        </div>

        {/* ── NOTES TAB ── */}
        {activeTab === 'notes' && (
          <>
            {/* Notes Feed - Scrollable content area with min-h-0 for flex shrinking */}
            <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-4">
              {hasNotes ? (
                <div className="space-y-3">
                  {notes.map((note, idx) => {
                    const config = NOTE_TYPE_CONFIG[note.type]
                    return (
                      <div key={idx} className="bg-muted/40 rounded-lg p-4 border border-border/50 hover:border-border transition-colors">
                        <div className="flex items-start gap-3">
                          <div className={cn('p-2 rounded-lg flex-shrink-0', config.bgColor)}>
                            <div className={config.color}>{config.icon}</div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold text-foreground">{note.type}</span>
                              <span className="text-xs text-muted-foreground">{note.author}</span>
                            </div>
                            <p className="text-sm text-foreground leading-relaxed break-words">{note.content}</p>
                            <p className="text-xs text-muted-foreground mt-2">{formatDate(note.createdAt)}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Heart className="w-12 h-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground mb-4">No notes yet</p>
                  <div className="space-y-2 w-full">
                    <button
                      onClick={() => {
                        setSelectedNoteType('Behavior')
                        setNewNoteContent('')
                      }}
                      className="w-full text-xs px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors pointer-events-auto"
                    >
                      Add behavior note
                    </button>
                    <button
                      onClick={() => {
                        setSelectedNoteType('Parent')
                        setNewNoteContent('')
                      }}
                      className="w-full text-xs px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors pointer-events-auto"
                    >
                      Add parent note
                    </button>
                    <button
                      onClick={() => {
                        setSelectedNoteType('Follow-up')
                        setNewNoteContent('')
                      }}
                      className="w-full text-xs px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors pointer-events-auto"
                    >
                      Add follow-up
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Note Composer - Sticky Footer */}
            <div className="flex-shrink-0 border-t border-border bg-background p-6 space-y-4">
              {/* Note Type Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Note Type</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(NOTE_TYPE_CONFIG) as NoteType[]).map(type => (
                    <button
                      key={type}
                      onClick={() => setSelectedNoteType(type)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 pointer-events-auto',
                        selectedNoteType === type
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note Content */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Add Note</label>
                <Textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Write your note here..."
                  className="min-h-24 resize-none bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:bg-muted/70 focus:border-border transition-colors duration-200 pointer-events-auto"
                />
              </div>

              {/* Follow-up Date Toggle */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer pointer-events-auto">
                  <input
                    type="checkbox"
                    checked={!!followUpDate}
                    onChange={(e) => {
                      if (e.target.checked) {
                        const tomorrow = new Date()
                        tomorrow.setDate(tomorrow.getDate() + 1)
                        setFollowUpDate(tomorrow.toISOString().split('T')[0])
                      } else {
                        setFollowUpDate('')
                      }
                    }}
                    className="w-4 h-4 rounded border-border pointer-events-auto"
                  />
                  <span className="text-xs font-medium text-muted-foreground">Set follow-up date</span>
                </label>
                {followUpDate && (
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-muted/50 border border-border text-foreground focus:bg-muted/70 focus:border-border transition-colors duration-200 pointer-events-auto"
                  />
                )}
              </div>

              {/* Action Buttons - Sticky Footer */}
              <div className="flex gap-3 pt-2 sticky bottom-0 z-[51] bg-background border-t border-border p-4 -mx-6 -mb-6" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 pointer-events-auto"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveNote}
                  disabled={!newNoteContent.trim() || isSaving}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground pointer-events-auto"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Note
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* ── PAYMENTS TAB ── */}
        {activeTab === 'payments' && (
          <div className="flex-1 overflow-y-auto min-h-0">
            {isBillingLoading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                Loading payment history...
              </div>
            ) : !billingData || (billingData.payments.length === 0 && billingData.enrollments.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                <CreditCard className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm font-medium">No payment records found</p>
                <p className="text-xs mt-1 opacity-60">This student has no billing enrollments yet.</p>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {/* Enrollment Plans */}
                {billingData.enrollments.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Billing Plans</h3>
                    {billingData.enrollments.map((enr: any) => (
                      <div key={enr.id} className="bg-muted/40 rounded-lg p-4 border border-border/50">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground text-sm">{enr.planName}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              ${enr.amountDollars.toFixed(2)} / {enr.frequency}
                            </p>
                            {enr.hasCard && (
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <CreditCard className="w-3 h-3" />
                                {enr.cardBrand} ••••{enr.cardLast4}
                              </p>
                            )}
                            {enr.nextBillingDate && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Next billing: {formatFullDate(enr.nextBillingDate)}
                              </p>
                            )}
                            {enr.lastDeclinedAt && (
                              <p className="text-xs text-red-500 mt-1">
                                Last declined: {formatFullDate(enr.lastDeclinedAt)}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                            <Badge
                              variant={enr.status === 'active' ? 'default' : 'destructive'}
                              className="text-xs"
                            >
                              {enr.status}
                            </Badge>
                            {enr.retryCount > 0 && (
                              <span className="text-xs text-orange-500 flex items-center gap-1">
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
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Transactions ({billingData.payments.length})
                    </h3>
                    <div className="space-y-2">
                      {billingData.payments.map((pmt: any) => {
                        const isSuccess = pmt.status === 'success' || pmt.status === 'paid'
                        const isFailed = pmt.status === 'failed' || pmt.status === 'declined'
                        const isPending = !isSuccess && !isFailed
                        return (
                          <div
                            key={pmt.id}
                            className="bg-background rounded-lg p-3 border border-border/50 hover:border-border transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                'mt-0.5 flex-shrink-0',
                                isSuccess ? 'text-green-500' : isFailed ? 'text-red-500' : 'text-yellow-500'
                              )}>
                                {isSuccess ? (
                                  <CheckCircle2 className="w-4 h-4" />
                                ) : isFailed ? (
                                  <XCircle className="w-4 h-4" />
                                ) : (
                                  <AlertTriangle className="w-4 h-4" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {pmt.description || 'Tuition Payment'}
                                </p>
                                {isSuccess && pmt.paidAt && (
                                  <p className="text-xs text-muted-foreground">
                                    Paid: {formatFullDate(pmt.paidAt)}
                                  </p>
                                )}
                                {isFailed && pmt.declinedAt && (
                                  <p className="text-xs text-red-500">
                                    Declined: {formatFullDate(pmt.declinedAt)}
                                  </p>
                                )}
                                {isPending && pmt.createdAt && (
                                  <p className="text-xs text-muted-foreground">
                                    Created: {formatFullDate(pmt.createdAt)}
                                  </p>
                                )}
                                {isFailed && pmt.failureReason && (
                                  <p className="text-xs text-red-400 truncate">{pmt.failureReason}</p>
                                )}
                                {pmt.fluidpayTransactionId && (
                                  <p className="text-xs font-mono text-muted-foreground/50 truncate">
                                    {pmt.fluidpayTransactionId}
                                  </p>
                                )}
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className={cn(
                                  'text-sm font-bold',
                                  isSuccess ? 'text-green-500' : isFailed ? 'text-red-500' : 'text-foreground'
                                )}>
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
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { X, Phone, MessageSquare, Mail, FileText, Check, Minus, Sparkles } from 'lucide-react'

interface Student {
  id: number
  first_name: string
  last_name: string
  email: string
  phone: string
  belt_rank: string
  status: string
  membership_status: string
  photo_url?: string
  program?: string
  estimated_value?: number
}

interface StudentDetailPanelProps {
  student: Student
  onClose: () => void
  onCall: () => void
  onText: () => void
  onEmail: () => void
  isDarkMode: boolean
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Active': { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
  'Trial': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  'At Risk': { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
  'Inactive': { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' },
  'On Hold': { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
}

export default function StudentDetailPanel({ student, onClose, onCall, onText, onEmail, isDarkMode }: StudentDetailPanelProps) {
  const statusColor = STATUS_COLORS[student.status] || STATUS_COLORS['Active']
  const attendance = [true, true, false, true, true, false, true]
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className={cn("fixed right-0 top-0 bottom-0 w-[420px] z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300", isDarkMode ? "bg-[#0f0f10] border-l border-white/10" : "bg-white border-l border-gray-200")}>
        <div className={cn("p-4 border-b flex items-center gap-4", isDarkMode ? "border-white/10" : "border-gray-200")}>
          <div className="relative">
            {student.photo_url ? (<img src={student.photo_url} alt={student.first_name} className="w-14 h-14 rounded-xl object-cover" />) : (<div className={cn("w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold", isDarkMode ? "bg-white/10 text-white" : "bg-gray-100 text-gray-600")}>{student.first_name[0]}{student.last_name[0]}</div>)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className={cn("font-bold text-lg truncate", isDarkMode ? "text-white" : "text-gray-900")}>{student.first_name} {student.last_name}</h2>
              <Badge variant="outline" className={cn("text-xs shrink-0", statusColor.bg, statusColor.text, statusColor.border)}>{student.status}</Badge>
            </div>
            <p className={cn("text-sm", isDarkMode ? "text-white/60" : "text-gray-500")}>{student.program || 'General'}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className={cn("shrink-0", isDarkMode ? "text-white/60 hover:text-white hover:bg-white/10" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100")}><X className="h-5 w-5" /></Button>
        </div>
        <div className={cn("p-4 border-b flex items-center gap-2", isDarkMode ? "border-white/10" : "border-gray-200")}>
          <Button size="sm" className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white" onClick={onCall}><Phone className="h-4 w-4" />Call</Button>
          <Button size="sm" className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700 text-white" onClick={onText}><MessageSquare className="h-4 w-4" />SMS</Button>
          <Button size="sm" className="flex-1 gap-2 bg-purple-600 hover:bg-purple-700 text-white" onClick={onEmail}><Mail className="h-4 w-4" />Email</Button>
          <Button size="sm" variant="outline" className={cn("gap-2", isDarkMode ? "border-white/20 text-white hover:bg-white/10" : "border-gray-200")}><FileText className="h-4 w-4" />Note</Button>
        </div>
        <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className={cn("mx-4 mt-4", isDarkMode ? "bg-white/5" : "bg-gray-100")}>
            <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
            <TabsTrigger value="activity" className="flex-1">Activity</TabsTrigger>
            <TabsTrigger value="ai" className="flex-1">AI</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="flex-1 overflow-y-auto p-4 space-y-6 m-0">
            <div>
              <h3 className={cn("text-sm font-semibold mb-3", isDarkMode ? "text-white" : "text-gray-900")}>Last 7 Days Attendance</h3>
              <div className="flex items-center gap-2">
                {attendance.map((attended, i) => (<div key={i} className="flex-1 flex flex-col items-center gap-1"><div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", attended ? "bg-green-500/20 text-green-400" : (isDarkMode ? "bg-white/5 text-white/30" : "bg-gray-100 text-gray-400"))}>{attended ? <Check className="h-4 w-4" /> : <Minus className="h-4 w-4" />}</div><span className={cn("text-xs", isDarkMode ? "text-white/40" : "text-gray-400")}>{dayLabels[i]}</span></div>))}
              </div>
            </div>
            <div>
              <h3 className={cn("text-sm font-semibold mb-3", isDarkMode ? "text-white" : "text-gray-900")}>Contact Information</h3>
              <div className="space-y-2">
                <div className={cn("p-3 rounded-lg", isDarkMode ? "bg-white/5" : "bg-gray-50")}><p className={cn("text-xs mb-1", isDarkMode ? "text-white/40" : "text-gray-400")}>Phone</p><p className={cn("font-medium", isDarkMode ? "text-white" : "text-gray-900")}>{student.phone || 'Not provided'}</p></div>
                <div className={cn("p-3 rounded-lg", isDarkMode ? "bg-white/5" : "bg-gray-50")}><p className={cn("text-xs mb-1", isDarkMode ? "text-white/40" : "text-gray-400")}>Email</p><p className={cn("font-medium", isDarkMode ? "text-white" : "text-gray-900")}>{student.email || 'Not provided'}</p></div>
              </div>
            </div>
            <div>
              <h3 className={cn("text-sm font-semibold mb-3", isDarkMode ? "text-white" : "text-gray-900")}>Quick Stats</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className={cn("p-3 rounded-lg", isDarkMode ? "bg-white/5" : "bg-gray-50")}><p className={cn("text-xs mb-1", isDarkMode ? "text-white/40" : "text-gray-400")}>Current Belt</p><p className={cn("font-semibold", isDarkMode ? "text-white" : "text-gray-900")}>{student.belt_rank}</p></div>
                <div className={cn("p-3 rounded-lg", isDarkMode ? "bg-white/5" : "bg-gray-50")}><p className={cn("text-xs mb-1", isDarkMode ? "text-white/40" : "text-gray-400")}>Monthly Value</p><p className="font-semibold text-emerald-500">${student.estimated_value || 150}</p></div>
                <div className={cn("p-3 rounded-lg", isDarkMode ? "bg-white/5" : "bg-gray-50")}><p className={cn("text-xs mb-1", isDarkMode ? "text-white/40" : "text-gray-400")}>Days Since Class</p><p className={cn("font-semibold", isDarkMode ? "text-white" : "text-gray-900")}>0</p></div>
                <div className={cn("p-3 rounded-lg", isDarkMode ? "bg-white/5" : "bg-gray-50")}><p className={cn("text-xs mb-1", isDarkMode ? "text-white/40" : "text-gray-400")}>Missed Classes</p><p className={cn("font-semibold", isDarkMode ? "text-white" : "text-gray-900")}>0</p></div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="activity" className="flex-1 overflow-y-auto p-4 m-0"><div className={cn("text-center py-8", isDarkMode ? "text-white/40" : "text-gray-400")}><p>Activity timeline coming soon</p></div></TabsContent>
          <TabsContent value="ai" className="flex-1 overflow-y-auto p-4 m-0">
            <div className={cn("p-4 rounded-xl border", isDarkMode ? "bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20" : "bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200")}>
              <div className="flex items-center gap-2 mb-3"><Sparkles className="h-5 w-5 text-purple-500" /><h3 className={cn("font-semibold", isDarkMode ? "text-white" : "text-gray-900")}>AI Suggestions</h3></div>
              <p className={cn("text-sm", isDarkMode ? "text-white/70" : "text-gray-600")}>Based on {student.first_name}'s attendance pattern, consider scheduling a check-in call to maintain engagement.</p>
            </div>
          </TabsContent>
        </Tabs>
        <div className={cn("p-3 text-center text-xs border-t", isDarkMode ? "border-white/10 text-white/30" : "border-gray-200 text-gray-400")}>Press ESC to close</div>
      </div>
    </>
  )
}

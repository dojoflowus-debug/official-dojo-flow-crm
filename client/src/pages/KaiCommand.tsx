import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DojoFlowLayout from '@/components/DojoFlowLayout'
import { trpc } from '@/lib/trpc'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Search,
  Plus,
  Sparkles,
  MessageSquare,
  Clock,
  AlertCircle,
  Lightbulb,
  CheckSquare,
  Send,
  Mic,
  Paperclip,
  User,
  Phone,
  Mail,
  Calendar,
  Award,
  TrendingUp,
  Loader2
} from 'lucide-react'
import { Streamdown } from 'streamdown'

// Types
interface Conversation {
  id: string
  title: string
  timestamp: Date
  status: 'in_progress' | 'completed'
  messages: Message[]
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  studentCard?: StudentCard
  leadData?: LeadData[]
}

interface StudentCard {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  program: string
  beltRank: string
  status: string
  lastAttendance?: string
  category: string
  progressToNextBelt: number
  notes?: string
  parentName?: string
  parentPhone?: string
}

interface LeadData {
  name: string
  phone: string
  email: string
  program: string
  source: string
  notes: string
  stage: string
}

// Smart Collections
const SMART_COLLECTIONS = [
  { id: 'urgent', name: 'Urgent', icon: AlertCircle, count: 3 },
  { id: 'insights', name: 'Kai Insights', icon: Lightbulb, count: 5 },
  { id: 'pending', name: 'Pending Tasks', icon: CheckSquare, count: 8 },
]

// Suggested Prompts
const SUGGESTED_PROMPTS = [
  "Help me grow my kids program to 150 students.",
  "Show me attendance and missed classes this week.",
  "Who is late on payments and how can we fix it?",
  "Pull students who haven't attended in 10 days.",
  "Show me the lead pipeline stats.",
]

export default function KaiCommand() {
  const navigate = useNavigate()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [inputText, setInputText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('active')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch real data
  const studentsQuery = trpc.students.getAll.useQuery()
  const leadsQuery = trpc.leads.getAll.useQuery()

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeConversation?.messages])

  // Create new conversation
  const createNewConversation = () => {
    const newConv: Conversation = {
      id: Date.now().toString(),
      title: 'New Conversation',
      timestamp: new Date(),
      status: 'in_progress',
      messages: []
    }
    setConversations(prev => [newConv, ...prev])
    setActiveConversation(newConv)
  }

  // Process message
  const processMessage = async (query: string) => {
    if (!activeConversation) {
      createNewConversation()
    }
    
    setIsLoading(true)
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date()
    }
    
    const updatedConv = activeConversation || {
      id: Date.now().toString(),
      title: query.slice(0, 50),
      timestamp: new Date(),
      status: 'in_progress' as const,
      messages: []
    }
    
    updatedConv.messages = [...updatedConv.messages, userMessage]
    updatedConv.title = query.slice(0, 50)
    
    setActiveConversation({ ...updatedConv })
    setConversations(prev => {
      const exists = prev.find(c => c.id === updatedConv.id)
      if (exists) {
        return prev.map(c => c.id === updatedConv.id ? { ...updatedConv } : c)
      }
      return [{ ...updatedConv }, ...prev]
    })
    
    setInputText('')
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Generate response based on query
    const response = generateResponse(query)
    
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response.content,
      timestamp: new Date(),
      studentCard: response.studentCard
    }
    
    updatedConv.messages = [...updatedConv.messages, assistantMessage]
    
    setActiveConversation({ ...updatedConv })
    setConversations(prev => prev.map(c => c.id === updatedConv.id ? { ...updatedConv } : c))
    setIsLoading(false)
  }

  // Generate response based on query
  const generateResponse = (query: string): { content: string; studentCard?: StudentCard } => {
    const lowerQuery = query.toLowerCase()
    const students = studentsQuery.data || []
    const leads = leadsQuery.data || []
    
    // Check for student lookup
    const studentNameMatch = lowerQuery.match(/(?:show|pull|open|find|get)\s+(?:me\s+)?(?:student\s+)?([a-z]+(?:\s+[a-z]+)?)/i)
    if (studentNameMatch || lowerQuery.includes('student card')) {
      const searchName = studentNameMatch?.[1] || ''
      const foundStudent = students.find(s => 
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchName.toLowerCase()) ||
        s.firstName.toLowerCase().includes(searchName.toLowerCase()) ||
        s.lastName.toLowerCase().includes(searchName.toLowerCase())
      )
      
      if (foundStudent) {
        const studentCard: StudentCard = {
          id: foundStudent.id,
          firstName: foundStudent.firstName,
          lastName: foundStudent.lastName,
          email: foundStudent.email || '',
          phone: foundStudent.phone || '',
          program: 'Martial Arts',
          beltRank: foundStudent.beltRank || 'White',
          status: foundStudent.status || 'Active',
          category: 'A-Student',
          progressToNextBelt: 75,
          notes: 'Strong kicks, highly focused.',
        }
        
        return {
          content: `Here's ${foundStudent.firstName} ${foundStudent.lastName}'s student card:`,
          studentCard
        }
      } else if (searchName) {
        return {
          content: `I don't see "${searchName}" in the system yet. Want me to help you add them as a new student?`
        }
      }
    }
    
    // Check for student count
    if (lowerQuery.includes('how many students') || lowerQuery.includes('student count') || lowerQuery.includes('total students')) {
      const activeStudents = students.filter(s => s.status === 'active' || s.status === 'Active').length
      const totalStudents = students.length
      
      return {
        content: `Let me check the student database...\n\n📊 **Student Overview:**\n\n| Metric | Count |\n|--------|-------|\n| Active Students | ${activeStudents} |\n| Total Students | ${totalStudents} |\n\nWould you like me to break this down by belt rank or program?`
      }
    }
    
    // Check for attendance
    if (lowerQuery.includes('attendance') || lowerQuery.includes('missed class')) {
      return {
        content: `Let me think...\n\n📅 **Attendance Summary (This Week):**\n\n| Day | Check-ins | Missed |\n|-----|-----------|--------|\n| Monday | 24 | 3 |\n| Tuesday | 18 | 5 |\n| Wednesday | 22 | 2 |\n| Thursday | 20 | 4 |\n| Friday | 26 | 1 |\n\n**Students who missed 2+ classes:**\n- Sarah Johnson (missed 3)\n- Mike Chen (missed 2)\n\n⚠️ **Action Needed:** These students may be at risk of dropping. Want me to draft a re-engagement message?`
      }
    }
    
    // Check for late payments
    if (lowerQuery.includes('late') && (lowerQuery.includes('payment') || lowerQuery.includes('pay'))) {
      return {
        content: `Let me think...\n\n💰 **Late Payment Report:**\n\n| Student | Amount Due | Days Late | Last Contact |\n|---------|------------|-----------|-------------|\n| James Thompson | $150 | 15 days | Dec 1 |\n| Lisa Park | $200 | 8 days | Dec 5 |\n| David Wilson | $75 | 5 days | Never |\n\n**Total Outstanding:** $425\n\n📋 **Recommended Actions:**\n1. Send automated reminder to David Wilson (no prior contact)\n2. Follow up call to James Thompson (15+ days)\n3. Offer payment plan to Lisa Park\n\nWould you like me to initiate any of these actions?`
      }
    }
    
    // Check for leads
    if (lowerQuery.includes('lead') && (lowerQuery.includes('pipeline') || lowerQuery.includes('stats') || lowerQuery.includes('show'))) {
      const leadsByStage = {
        'New Lead': leads.filter(l => l.stage === 'new_lead' || l.stage === 'New Lead').length,
        'Contacted': leads.filter(l => l.stage === 'contacted' || l.stage === 'Contacted').length,
        'Intro Scheduled': leads.filter(l => l.stage === 'intro_scheduled').length,
        'Enrolled': leads.filter(l => l.stage === 'enrolled' || l.stage === 'Enrolled').length,
      }
      
      return {
        content: `Let me think...\n\n🎯 **Lead Pipeline Stats:**\n\n| Stage | Count |\n|-------|-------|\n| New Lead | ${leadsByStage['New Lead']} |\n| Contacted | ${leadsByStage['Contacted']} |\n| Intro Scheduled | ${leadsByStage['Intro Scheduled']} |\n| Enrolled | ${leadsByStage['Enrolled']} |\n\n**Total Leads:** ${leads.length}\n\n💡 **Insight:** You have ${leadsByStage['New Lead']} new leads that haven't been contacted yet. Want me to help you prioritize follow-ups?`
      }
    }
    
    // Check for growing program
    if (lowerQuery.includes('grow') && lowerQuery.includes('program')) {
      return {
        content: `Let me think about your growth strategy...\n\n🚀 **Growth Plan for Kids Program:**\n\nBased on your current data, here's a 3-month action plan:\n\n**Month 1: Foundation**\n- Launch referral program (offer 1 free month for referrals)\n- Partner with 3 local schools for demo classes\n- Optimize your Google Business listing\n\n**Month 2: Acceleration**\n- Run "Bring a Friend" week\n- Start birthday party packages\n- Create social media content featuring student achievements\n\n**Month 3: Retention Focus**\n- Implement attendance tracking alerts\n- Launch parent communication app\n- Create belt testing celebration events\n\n📊 **Projected Growth:** 15-20 new students per month\n\nWant me to help you implement any of these strategies?`
      }
    }
    
    // Default response
    return {
      content: `I understand you're asking about "${query}". Let me help you with that.\n\nI can assist you with:\n- **Student Management:** Pull student cards, check attendance, track belt progress\n- **Lead Pipeline:** View lead stats, process new leads, track conversions\n- **Financial Data:** Late payments, revenue reports, billing status\n- **Retention:** At-risk students, re-engagement strategies\n\nTry asking me something specific like:\n- "Show me John Smith's student card"\n- "Who is late on payments?"\n- "What's our attendance this week?"`
    }
  }

  // Handle send
  const handleSend = () => {
    if (inputText.trim() && !isLoading) {
      processMessage(inputText)
    }
  }

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Render student card - Apple style
  const renderStudentCard = (card: StudentCard) => (
    <Card className="mt-4 bg-white border border-gray-200 shadow-sm rounded-2xl">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 ring-2 ring-gray-100">
            <AvatarFallback className="bg-gradient-to-br from-rose-400 to-rose-500 text-white text-xl font-medium">
              {card.firstName[0]}{card.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">{card.firstName} {card.lastName}</h3>
              <Badge className={`${card.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'} border-0`}>
                {card.status}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <Award className="h-4 w-4" />
                <span>Belt: <strong className="text-slate-700">{card.beltRank}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <User className="h-4 w-4" />
                <span>Program: <strong className="text-slate-700">{card.program}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <Mail className="h-4 w-4" />
                <span className="truncate">{card.email || 'No email'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <Phone className="h-4 w-4" />
                <span>{card.phone || 'No phone'}</span>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-gray-500">Progress to next belt</span>
                <span className="font-medium text-slate-700">{card.progressToNextBelt}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-rose-400 to-rose-500 rounded-full transition-all"
                  style={{ width: `${card.progressToNextBelt}%` }}
                />
              </div>
            </div>
            
            {card.notes && (
              <p className="mt-3 text-sm text-gray-500 italic">"{card.notes}"</p>
            )}
            
            <div className="flex gap-2 mt-4">
              <Button size="sm" variant="outline" className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50">
                <Calendar className="h-4 w-4 mr-1" />
                Attendance
              </Button>
              <Button size="sm" variant="outline" className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50">
                <MessageSquare className="h-4 w-4 mr-1" />
                Message
              </Button>
              <Button size="sm" variant="outline" className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50">
                <TrendingUp className="h-4 w-4 mr-1" />
                Progress
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    if (searchQuery) {
      return conv.title.toLowerCase().includes(searchQuery.toLowerCase())
    }
    if (activeTab === 'active') return conv.status === 'in_progress'
    if (activeTab === 'archived') return conv.status === 'completed'
    return true
  })

  return (
    <DojoFlowLayout>
      {/* Apple-style light background */}
      <div className="flex h-[calc(100vh-8rem)] gap-4 bg-[#F5F7FB] -m-6 p-6">
        
        {/* Left Sidebar - Command Center - Apple Light Style */}
        <div className="w-80 flex-shrink-0 bg-[#F8FAFC] rounded-2xl border border-gray-200/60 flex flex-col shadow-sm">
          
          {/* Search */}
          <div className="p-4 border-b border-gray-200/60">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search history, tags, @mentions..."
                className="pl-9 bg-white border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-200 focus:border-rose-300 text-slate-700 placeholder:text-gray-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {/* Tabs */}
          <div className="px-4 py-3 border-b border-gray-200/60">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full bg-gray-100/80 p-1 rounded-xl">
                <TabsTrigger value="active" className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-gray-600 data-[state=active]:text-slate-900">Active</TabsTrigger>
                <TabsTrigger value="archived" className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-gray-600 data-[state=active]:text-slate-900">Archived</TabsTrigger>
                <TabsTrigger value="all" className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-gray-600 data-[state=active]:text-slate-900">All</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* Smart Collections */}
          <div className="p-4 border-b border-gray-200/60">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Smart Collections</h3>
            <div className="space-y-1">
              {SMART_COLLECTIONS.map(collection => (
                <button
                  key={collection.id}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white hover:shadow-sm transition-all text-sm group"
                >
                  <div className="flex items-center gap-2.5">
                    <collection.icon className="h-4 w-4 text-gray-400 group-hover:text-rose-500 transition-colors" />
                    <span className="text-gray-600 group-hover:text-slate-900">{collection.name}</span>
                  </div>
                  <Badge className="bg-gray-100 text-gray-500 border-0 text-xs font-medium">{collection.count}</Badge>
                </button>
              ))}
            </div>
          </div>
          
          {/* Conversations List */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="px-4 py-3 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Recent Conversations</h3>
              <Button size="sm" variant="ghost" onClick={createNewConversation} className="h-7 w-7 p-0 text-gray-400 hover:text-rose-500 hover:bg-rose-50">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <ScrollArea className="flex-1 px-3">
              {filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-400">
                  No conversations yet
                </div>
              ) : (
                <div className="space-y-2 pb-4">
                  {filteredConversations.map(conv => (
                    <button
                      key={conv.id}
                      onClick={() => setActiveConversation(conv)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                        activeConversation?.id === conv.id
                          ? 'bg-white shadow-sm border border-rose-200'
                          : 'hover:bg-white hover:shadow-sm border border-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-sm truncate ${activeConversation?.id === conv.id ? 'text-slate-900' : 'text-gray-700'}`}>{conv.title}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {conv.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <Badge 
                          className={`text-xs flex-shrink-0 border-0 ${
                            conv.status === 'in_progress' 
                              ? 'bg-emerald-100 text-emerald-600' 
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {conv.status === 'in_progress' ? 'Active' : 'Done'}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
          
          {/* New Chat Button */}
          <div className="p-4 border-t border-gray-200/60">
            <Button 
              className="w-full bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-xl shadow-sm hover:shadow-md transition-all" 
              onClick={createNewConversation}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>
        </div>
        
        {/* Main Conversation Panel - Apple Light Style */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-200/60 flex flex-col shadow-sm overflow-hidden">
          
          {/* Top Banner */}
          <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/50">
            <p className="text-sm text-gray-500">
              <Sparkles className="h-4 w-4 inline mr-2 text-rose-500" />
              Kai Command uses a structured, professional conversation format.
            </p>
          </div>
          
          {/* Messages Area */}
          <ScrollArea className="flex-1 p-6 bg-[#F5F7FB]">
            {!activeConversation || activeConversation.messages.length === 0 ? (
              // Welcome Screen - Apple Style
              <div className="h-full flex flex-col items-center justify-center text-center">
                {/* Central White Card */}
                <div className="bg-white rounded-3xl shadow-[0_18px_40px_rgba(15,23,42,0.08)] p-12 max-w-xl w-full">
                  {/* Kai Logo */}
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-400 to-rose-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-rose-200/50">
                    <Sparkles className="h-10 w-10 text-white" />
                  </div>
                  
                  <h2 className="text-3xl font-semibold text-slate-900 mb-3">Hi, I'm Kai.</h2>
                  <p className="text-gray-500 max-w-md mx-auto mb-10 leading-relaxed">
                    Your AI assistant for managing students, tracking leads, analyzing attendance, 
                    and growing your martial arts school.
                  </p>
                  
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-400 mb-4">Try asking:</h3>
                    {SUGGESTED_PROMPTS.map((prompt, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setInputText(prompt)
                          inputRef.current?.focus()
                        }}
                        className="w-full text-left px-5 py-3.5 rounded-full bg-white border border-gray-200 hover:border-rose-300 hover:shadow-sm transition-all text-sm text-gray-700 hover:text-slate-900"
                      >
                        "{prompt}"
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              // Conversation Messages
              <div className="space-y-6 max-w-3xl mx-auto">
                {activeConversation.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <Avatar className="h-9 w-9 flex-shrink-0 ring-2 ring-gray-100">
                        <AvatarFallback className="bg-gradient-to-br from-rose-400 to-rose-500 text-white">
                          <Sparkles className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                      <div
                        className={`rounded-2xl px-5 py-3.5 ${
                          msg.role === 'user'
                            ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-sm'
                            : 'bg-white border border-gray-200 shadow-sm text-slate-700'
                        }`}
                      >
                        {msg.role === 'assistant' ? (
                          <div className="prose prose-sm prose-slate max-w-none">
                            <Streamdown>{msg.content}</Streamdown>
                          </div>
                        ) : (
                          <p>{msg.content}</p>
                        )}
                      </div>
                      {msg.studentCard && renderStudentCard(msg.studentCard)}
                      <p className="text-xs text-gray-400 mt-1.5 px-2">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {msg.role === 'user' && (
                      <Avatar className="h-9 w-9 flex-shrink-0 ring-2 ring-gray-100">
                        <AvatarFallback className="bg-gray-100 text-gray-600">U</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex gap-3">
                    <Avatar className="h-9 w-9 ring-2 ring-gray-100">
                      <AvatarFallback className="bg-gradient-to-br from-rose-400 to-rose-500 text-white">
                        <Sparkles className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-white border border-gray-200 rounded-2xl px-5 py-3.5 shadow-sm">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-rose-500" />
                        <span className="text-gray-500">Let me think...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>
          
          {/* Message Input Bar - Apple Style Floating */}
          <div className="p-4 bg-white border-t border-gray-100">
            <div className="flex items-center gap-3 bg-gray-50 rounded-full px-4 py-2.5 border border-gray-200 shadow-inner max-w-3xl mx-auto">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-full">
                <Paperclip className="h-5 w-5" />
              </Button>
              <Input
                ref={inputRef}
                placeholder="Message Kai... (Type @ to mention)"
                className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-slate-700 placeholder:text-gray-400"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={isLoading}
              />
              <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-full">
                <Mic className="h-5 w-5" />
              </Button>
              <Button 
                size="icon" 
                className="h-9 w-9 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-full shadow-sm"
                onClick={handleSend}
                disabled={!inputText.trim() || isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DojoFlowLayout>
  )
}

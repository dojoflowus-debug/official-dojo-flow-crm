import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Search, 
  Plus, 
  Clock, 
  Sparkles, 
  CheckSquare,
  Paperclip,
  Mic,
  Send,
  MoreVertical,
  FileText,
  Users,
  Volume2,
  Maximize2,
  GraduationCap,
  BarChart3,
  UserPlus,
  Calendar,
  Monitor,
  Headphones,
  CreditCard,
  TrendingUp,
  Megaphone,
  Settings,
  ChevronDown,
  ChevronUp,
  LogOut,
  Eye,
  Bell,
  Menu,
  GripVertical,
  MessageCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';

// DojoFlow Logo Component - uses actual logo image
const DojoFlowLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <img src="/dojoflow-logo-icon.png" alt="DojoFlow" className={className} />
);

// Kai Logo for center panel - uses actual logo image
const KaiLogo = ({ className = "w-20 h-20" }: { className?: string }) => (
  <img src="/dojoflow-logo-icon.png" alt="Kai" className={className} />
);

// Conversation type
interface Conversation {
  id: string;
  title: string;
  preview: string;
  timestamp: string;
  tags: string[];
  status: 'neutral' | 'attention' | 'urgent';
  category: 'kai' | 'growth' | 'billing';
  date: 'today' | 'yesterday' | 'older';
}

// Message type
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function KaiCommand() {
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [topMenuVisible, setTopMenuVisible] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const [expandedInput, setExpandedInput] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // tRPC mutation for Kai chat
  const kaiChatMutation = trpc.kai.chat.useMutation();
  const statsQuery = trpc.dashboard.stats.useQuery();

  // Sample conversations data matching original
  const [conversations] = useState<Conversation[]>([
    {
      id: '0',
      title: 'New Conversation',
      preview: '',
      timestamp: '02:40 AM',
      tags: ['kai', 'neutral'],
      status: 'neutral',
      category: 'kai',
      date: 'today'
    },
    {
      id: '1',
      title: 'Help me grow my kids program t...',
      preview: 'Hello! I\'m Kai, and that is an excellent, ambitious goal. Growing your Kids Program from 20 students to 150 is a significant undertaking...',
      timestamp: '02:32 AM',
      tags: ['growth', 'neutral'],
      status: 'neutral',
      category: 'growth',
      date: 'today'
    },
    {
      id: '2',
      title: 'Hello how are you?...',
      preview: 'I understand your focus on **Vincent Holmes**. He must be a high-priority student for your dojo...',
      timestamp: '09:57 PM',
      tags: ['growth', 'neutral'],
      status: 'neutral',
      category: 'growth',
      date: 'yesterday'
    },
    {
      id: '3',
      title: 'Who is late on payments and ho...',
      preview: "That's a great question! As your DojoFlow AI assistant, Kai, I handle the aggregate data...",
      timestamp: '07:51 PM',
      tags: ['billing', 'attention'],
      status: 'attention',
      category: 'billing',
      date: 'yesterday'
    },
    {
      id: '4',
      title: 'How many students do i have...',
      preview: 'I understand you are looking for information on a specific student, Vincent Holmes...',
      timestamp: '07:17 PM',
      tags: ['billing', 'neutral'],
      status: 'neutral',
      category: 'billing',
      date: 'yesterday'
    }
  ]);

  // Smart collections counts - matching original
  const smartCollections = [
    { id: 'urgent', label: 'Urgent', count: 1, icon: AlertCircle, color: 'text-[#E85A6B]' },
    { id: 'insights', label: 'Kai Insights', count: 6, icon: Sparkles, color: 'text-[#A855F7]' },
    { id: 'pending', label: 'Pending Tasks', count: 15, icon: CheckSquare, color: 'text-[#14B8A6]' }
  ];

  // Navigation items with drag handles
  const navItems = [
    { id: 'kai-command', label: 'Kai Command', icon: MessageCircle, path: '/kai-command', active: true },
    { id: 'students', label: 'Students', icon: GraduationCap, path: '/students' },
    { id: 'statistics', label: 'Statistics', icon: BarChart3, path: '/dashboard' },
    { id: 'leads', label: 'Leads', icon: UserPlus, path: '/leads' },
    { id: 'classes', label: 'Classes', icon: Calendar, path: '/classes' },
    { id: 'kiosk', label: 'Kiosk', icon: Monitor, path: '/kiosk' },
    { id: 'receptionist', label: 'Receptionist', icon: Headphones, path: '/receptionist' },
    { id: 'staff', label: 'Staff', icon: Users, path: '/staff' },
    { id: 'billing', label: 'Billing', icon: CreditCard, path: '/billing' },
    { id: 'reports', label: 'Reports', icon: TrendingUp, path: '/reports' },
    { id: 'marketing', label: 'Marketing', icon: Megaphone, path: '/marketing' }
  ];

  // Suggested prompts matching original
  const suggestedPrompts = [
    {
      header: 'START WITH YOUR GOALS',
      text: '"Help me grow my kids program to 150 students."'
    },
    {
      header: 'CHECK HEALTH OF YOUR DOJO',
      text: '"Show me attendance and missed classes this week."'
    },
    {
      header: 'FIX BILLING & RENEWALS',
      text: '"Who is late on payments and how can we fix it?"'
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageInput,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = messageInput;
    setMessageInput('');
    setIsLoading(true);

    try {
      const stats = statsQuery.data;
      const response = await kaiChatMutation.mutateAsync({
        message: currentInput,
        context: stats ? {
          totalStudents: stats.totalStudents,
          activeStudents: stats.activeStudents,
          totalLeads: stats.totalLeads,
          totalClasses: stats.totalClasses
        } : undefined
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I can help you with "${currentInput}". Let me analyze your dojo's performance metrics and identify key areas for growth.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handlePromptClick = (text: string) => {
    // Extract the quoted text
    const match = text.match(/"([^"]+)"/);
    if (match) {
      setMessageInput(match[1]);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'kai': return 'bg-[#DBEAFE] text-[#3B82F6]';
      case 'growth': return 'bg-[#D1FAE5] text-[#10B981]';
      case 'billing': return 'bg-[#EDE9FE] text-[#8B5CF6]';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'attention': return 'bg-amber-100 text-amber-700';
      case 'urgent': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const todayConversations = conversations.filter(c => c.date === 'today');
  const yesterdayConversations = conversations.filter(c => c.date === 'yesterday');

  return (
    <div className="flex h-screen bg-[#0F172A] overflow-hidden">
      {/* Left Sidebar - Dark Navigation */}
      {sidebarVisible && (
        <div className="w-56 bg-[#0F172A] border-r border-slate-800/50 flex flex-col">
          {/* Logo */}
          <div className="p-4 flex items-center gap-2">
            <DojoFlowLogo className="w-9 h-9" />
            <span className="text-white font-bold text-lg">DojoFlow</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm font-medium transition-colors group ${
                  item.active 
                    ? 'bg-[#E85A6B] text-white' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {/* Drag Handle */}
                <GripVertical className={`w-4 h-4 ${item.active ? 'text-white/60' : 'text-slate-600 group-hover:text-slate-400'}`} />
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            ))}
            
            {/* Settings with expand */}
            <button
              onClick={() => setSettingsExpanded(!settingsExpanded)}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors group"
            >
              <GripVertical className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
              <Settings className="w-4 h-4" />
              <span className="flex-1 text-left">Settings</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${settingsExpanded ? 'rotate-180' : ''}`} />
            </button>
          </nav>

          {/* User Profile */}
          <div className="p-3 border-t border-slate-800">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 transition-colors">
                  <Avatar className="w-9 h-9">
                    <AvatarImage src="/avatar.jpg" />
                    <AvatarFallback className="bg-slate-700 text-white text-sm">VH</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-white">{user?.name || 'Vincent Holmes'}</div>
                    <div className="text-xs text-slate-400 truncate">{user?.email || 'sensei30002003@gmail.com'}</div>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => logout()}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <h1 className="text-slate-900 font-semibold text-lg">Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Toggle-style Sidebar/Top Menu buttons */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarVisible(!sidebarVisible)}
                className={`text-sm rounded-md px-3 py-1 ${sidebarVisible ? 'bg-[#E85A6B] text-white hover:bg-[#D94A5B]' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`}
              >
                Sidebar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTopMenuVisible(!topMenuVisible)}
                className={`text-sm rounded-md px-3 py-1 ${topMenuVisible ? 'bg-[#E85A6B] text-white hover:bg-[#D94A5B]' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`}
              >
                Top Menu
              </Button>
            </div>
            <div className="text-emerald-500 text-sm font-medium px-2">Credits: 0</div>
            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-700">
              <Menu className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-700">
              <Eye className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-700">
              <Bell className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content Area with Command Center and Main Panel */}
        <div className="flex-1 flex overflow-hidden">
          {/* Command Center - Light Gray */}
          <div className="w-80 bg-[#F5F7FB] border-r border-slate-200 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Menu className="w-5 h-5 text-slate-500" />
                  <h2 className="font-semibold text-slate-800">Command Center</h2>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <CheckSquare className="w-4 h-4 text-slate-500" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Plus className="w-4 h-4 text-slate-500" />
                  </Button>
                  <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white h-8 px-4 rounded-lg">
                    <Plus className="w-4 h-4 mr-1" />
                    Chat
                  </Button>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search history, tags, @mentions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white border-slate-200 h-9"
                />
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-3">
                <TabsList className="w-full bg-[#E8ECF1] h-9">
                  <TabsTrigger value="active" className="flex-1 text-xs data-[state=active]:bg-white">Active</TabsTrigger>
                  <TabsTrigger value="archived" className="flex-1 text-xs data-[state=active]:bg-white">Archived</TabsTrigger>
                  <TabsTrigger value="all" className="flex-1 text-xs data-[state=active]:bg-white">All</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Smart Collections */}
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Smart Collections</h3>
              <div className="space-y-1">
                {smartCollections.map((collection) => (
                  <button
                    key={collection.id}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <collection.icon className={`w-4 h-4 ${collection.color}`} />
                      <span className="text-sm text-slate-700">{collection.label}</span>
                    </div>
                    <span className="text-xs font-medium text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                      {collection.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Conversations */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="p-4 pb-2 flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recent Conversations</h3>
                <span className="text-xs text-slate-400">{conversations.length}</span>
              </div>
              
              <ScrollArea className="flex-1 px-4">
                {/* Today */}
                {todayConversations.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-medium text-slate-400 uppercase mb-2">Today</h4>
                    {todayConversations.map((conv) => (
                      <ConversationCard 
                        key={conv.id} 
                        conversation={conv} 
                        getCategoryColor={getCategoryColor}
                        getStatusColor={getStatusColor}
                      />
                    ))}
                  </div>
                )}

                {/* Yesterday */}
                {yesterdayConversations.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-medium text-slate-400 uppercase mb-2">Yesterday</h4>
                    {yesterdayConversations.map((conv) => (
                      <ConversationCard 
                        key={conv.id} 
                        conversation={conv} 
                        getCategoryColor={getCategoryColor}
                        getStatusColor={getStatusColor}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>

          {/* Swivel/Drag Bar */}
          <div className="w-1.5 bg-slate-200 hover:bg-[#E85A6B] cursor-col-resize flex items-center justify-center group transition-colors">
            <div className="w-1 h-8 bg-slate-400 group-hover:bg-white rounded-full" />
          </div>

          {/* Main Conversation Panel - White */}
          <div className="flex-1 flex flex-col bg-white">
            {/* Top Banner */}
            <div className="px-6 py-3 bg-[#F8FAFC] border-b border-slate-200 flex items-center justify-between">
              <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">
                Kai Command uses a structured, professional conversation format — designed for clarity, accuracy, and operational decision-making.
              </p>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" title="Summarize & Extract">
                  <FileText className="w-4 h-4 text-slate-500" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" title="Invite Team Members">
                  <Users className="w-4 h-4 text-slate-500" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" title="Enable Voice Replies">
                  <Volume2 className="w-4 h-4 text-slate-500" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" title="Enter Focus Mode">
                  <Maximize2 className="w-4 h-4 text-slate-500" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" title="Full Screen">
                  <Eye className="w-4 h-4 text-slate-500" />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-6">
              <div className="max-w-3xl mx-auto">
                {messages.length === 0 ? (
                  /* Empty State - Kai Greeting */
                  <div className="flex flex-col items-center justify-center py-12">
                    <KaiLogo className="w-24 h-24 mb-6" />
                    <h2 className="text-3xl font-semibold text-slate-900 mb-3">Hi, I'm Kai.</h2>
                    <p className="text-slate-600 text-center max-w-md mb-8">
                      Tell me about your dojo and what you want to improve—growth, retention, or operations—and I'll show you the numbers.
                    </p>
                    
                    {/* Suggested Prompts */}
                    <div className="grid grid-cols-3 gap-4 w-full max-w-2xl">
                      {suggestedPrompts.map((prompt, index) => (
                        <button
                          key={index}
                          onClick={() => handlePromptClick(prompt.text)}
                          className="bg-white border border-slate-200 rounded-xl p-4 text-left hover:shadow-md hover:border-[#E85A6B]/30 transition-all group"
                        >
                          <div className="text-xs font-semibold text-[#E85A6B] uppercase tracking-wide mb-2">
                            {prompt.header}
                          </div>
                          <p className="text-sm text-slate-600 group-hover:text-slate-800">
                            {prompt.text}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Messages */
                  <div className="space-y-6">
                    {messages.map((message) => (
                      <div key={message.id} className="flex gap-3">
                        {message.role === 'user' ? (
                          <>
                            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-medium shrink-0">
                              You
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-slate-900 mb-1">You</div>
                              <p className="text-slate-700">{message.content}</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-8 h-8 rounded-full bg-[#E85A6B] flex items-center justify-center shrink-0">
                              <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-slate-900 mb-1">Kai</div>
                              <div className="text-slate-700 whitespace-pre-wrap prose prose-sm max-w-none">
                                {message.content}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#E85A6B] flex items-center justify-center shrink-0">
                          <Sparkles className="w-4 h-4 text-white animate-pulse" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-slate-900 mb-1">Kai</div>
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input Bar */}
            <div className={`p-4 border-t border-slate-200 transition-all ${expandedInput ? 'pb-8' : ''}`}>
              <div className="max-w-3xl mx-auto relative">
                {/* Expand/Collapse Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setExpandedInput(!expandedInput)}
                  className="absolute -top-3 left-1/2 -translate-x-1/2 h-6 w-6 bg-slate-200 hover:bg-slate-300 rounded-full z-10"
                >
                  {expandedInput ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </Button>
                
                <div className="flex items-center gap-2 bg-[#F5F7FB] rounded-2xl border-2 border-[#E85A6B]/30 p-2 focus-within:border-[#E85A6B]/50">
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-slate-600">
                    <Paperclip className="w-5 h-5" />
                  </Button>
                  <Textarea
                    placeholder="Message Kai... (Type @ to mention)"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className={`flex-1 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 ${expandedInput ? 'min-h-[120px]' : 'min-h-[40px] max-h-32'}`}
                    rows={expandedInput ? 5 : 1}
                  />
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-slate-600">
                    <Mic className="w-5 h-5" />
                  </Button>
                  <Button 
                    size="icon" 
                    className="h-9 w-9 bg-[#E85A6B] hover:bg-[#D94A5B] text-white rounded-full"
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || isLoading}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-slate-400 text-center mt-2">
                  Kai can make mistakes. Consider checking important information.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Conversation Card Component
function ConversationCard({ 
  conversation, 
  getCategoryColor,
  getStatusColor
}: { 
  conversation: Conversation; 
  getCategoryColor: (category: string) => string;
  getStatusColor: (status: string) => string;
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3 mb-2 hover:shadow-sm transition-shadow cursor-pointer">
      <div className="flex items-start justify-between mb-1">
        <h5 className="text-sm font-medium text-slate-900 truncate flex-1 pr-2">{conversation.title}</h5>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-xs text-slate-400">{conversation.timestamp}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreVertical className="w-3 h-3 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Archive</DropdownMenuItem>
              <DropdownMenuItem>Delete</DropdownMenuItem>
              <DropdownMenuItem>Rename</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {conversation.preview && (
        <p className="text-xs text-slate-500 line-clamp-2 mb-2">{conversation.preview}</p>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(conversation.category)}`}>
          {conversation.category}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(conversation.status)}`}>
          {conversation.status}
        </span>
        <span className="text-xs text-slate-400 ml-auto flex items-center gap-1">
          <Clock className="w-3 h-3" />
          In Progress
        </span>
      </div>
    </div>
  );
}

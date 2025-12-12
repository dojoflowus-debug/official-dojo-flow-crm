import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import BottomNavLayout from '@/components/BottomNavLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { useFocusMode } from '@/contexts/FocusModeContext';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
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
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Menu,
  AlertCircle,
  Trash2,
  Star
} from 'lucide-react';

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
  
  const [activeTab, setActiveTab] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedInput, setExpandedInput] = useState(false);
  const [commandCenterWidth, setCommandCenterWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  // Use global Focus Mode context
  const { isFocusMode, toggleFocusMode } = useFocusMode();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  // tRPC queries and mutations for Kai
  const kaiChatMutation = trpc.kai.chat.useMutation();
  const statsQuery = trpc.dashboard.stats.useQuery();
  const conversationsQuery = trpc.kai.getConversations.useQuery();
  const messagesQuery = trpc.kai.getMessages.useQuery(
    { conversationId: selectedConversationId ? parseInt(selectedConversationId) : 0 },
    { enabled: !!selectedConversationId && !selectedConversationId.startsWith('new-') }
  );
  const createConversationMutation = trpc.kai.createConversation.useMutation();
  const addMessageMutation = trpc.kai.addMessage.useMutation();
  const deleteConversationMutation = trpc.kai.deleteConversation.useMutation();
  const utils = trpc.useUtils();

  // Handle delete conversation
  const handleDeleteConversation = async (conversationId: string) => {
    try {
      await deleteConversationMutation.mutateAsync({ conversationId: parseInt(conversationId) });
      // Clear selection if deleted conversation was selected
      if (selectedConversationId === conversationId) {
        setSelectedConversationId(null);
        setMessages([]);
      }
      // Refresh conversations list
      utils.kai.getConversations.invalidate();
      toast.success('Conversation deleted');
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      toast.error('Failed to delete conversation');
    }
  };

  // Handle starting a new chat
  const handleNewChat = async () => {
    try {
      const result = await createConversationMutation.mutateAsync({});
      // Refresh conversations list
      utils.kai.getConversations.invalidate();
      // Select the new conversation
      setSelectedConversationId(result.id.toString());
      // Clear messages for fresh start
      setMessages([]);
      // Clear any input
      setMessageInput('');
    } catch (error) {
      console.error('Failed to create conversation:', error);
      // Fallback to local-only conversation
      const newId = `new-${Date.now()}`;
      setSelectedConversationId(newId);
      setMessages([]);
      setMessageInput('');
    }
  };

  // Convert backend conversations to frontend format
  const backendConversations = conversationsQuery.data || [];
  const convertedConversations: Conversation[] = backendConversations.map(c => {
    const date = new Date(c.lastMessageAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let dateCategory: 'today' | 'yesterday' | 'older' = 'older';
    if (date.toDateString() === today.toDateString()) dateCategory = 'today';
    else if (date.toDateString() === yesterday.toDateString()) dateCategory = 'yesterday';
    
    return {
      id: c.id.toString(),
      title: c.title,
      preview: c.preview || '',
      timestamp: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      tags: [c.category, c.priority],
      status: c.priority as 'neutral' | 'attention' | 'urgent',
      category: c.category as 'kai' | 'growth' | 'billing',
      date: dateCategory
    };
  });

  // Use backend conversations, or show empty state if not logged in
  const conversations = convertedConversations;

  // Load messages when conversation changes
  useEffect(() => {
    if (messagesQuery.data) {
      const loadedMessages: Message[] = messagesQuery.data.map(m => ({
        id: m.id.toString(),
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: new Date(m.createdAt)
      }));
      setMessages(loadedMessages);
    }
  }, [messagesQuery.data]);

  // Smart collections counts - matching original
  const smartCollections = [
    { id: 'urgent', label: 'Urgent', count: 1, icon: AlertCircle, color: 'text-[#ED393D]' },
    { id: 'insights', label: 'Kai Insights', count: 6, icon: Sparkles, color: 'text-[#A855F7]' },
    { id: 'pending', label: 'Pending Tasks', count: 15, icon: CheckSquare, color: 'text-[#14B8A6]' }
  ];

  // Quick command prompts - 10 tiles for the carousel
  const quickCommands = [
    {
      id: 'goals',
      header: 'START WITH YOUR GOALS',
      text: '"Help me grow my kids program to 150 students."'
    },
    {
      id: 'health',
      header: 'CHECK HEALTH OF YOUR DOJŌ',
      text: '"Show me attendance and missed classes this week."'
    },
    {
      id: 'billing',
      header: 'FIX BILLING & RENEWALS',
      text: '"Who is late on payments and how can we fix it?"'
    },
    {
      id: 'retention',
      header: 'INCREASE RETENTION',
      text: '"Tell me which students are at high risk of quitting."'
    },
    {
      id: 'enrollments',
      header: 'BOOST NEW ENROLLMENTS',
      text: '"Show me all leads that need follow-up today."'
    },
    {
      id: 'at-risk',
      header: 'SAVE AT-RISK MEMBERS',
      text: '"Who hasn\'t attended in 14+ days?"'
    },
    {
      id: 'class-quality',
      header: 'IMPROVE CLASS QUALITY',
      text: '"Which classes are over capacity or under capacity?"'
    },
    {
      id: 'parent-comms',
      header: 'PARENT COMMUNICATIONS',
      text: '"Draft a message to parents about upcoming events."'
    },
    {
      id: 'staff-perf',
      header: 'STAFF PERFORMANCE',
      text: '"Which instructors have the highest retention this month?"'
    },
    {
      id: 'financial',
      header: 'FINANCIAL SNAPSHOT',
      text: '"Give me revenue, expenses, and projections for this month."'
    }
  ];

  // Favorites state - stored in localStorage for now
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dojoFlowQuickCommandFavorites');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    }
    return new Set();
  });

  // Save favorites to localStorage when they change
  useEffect(() => {
    localStorage.setItem('dojoFlowQuickCommandFavorites', JSON.stringify([...favorites]));
  }, [favorites]);

  // Toggle favorite status
  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the command
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(id)) {
        newFavorites.delete(id);
      } else {
        newFavorites.add(id);
      }
      return newFavorites;
    });
  };

  // Sort commands: favorites first, then non-favorites
  const sortedQuickCommands = [...quickCommands].sort((a, b) => {
    const aFav = favorites.has(a.id) ? 0 : 1;
    const bFav = favorites.has(b.id) ? 0 : 1;
    return aFav - bFav;
  });

  // Carousel scroll state
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Update scroll buttons visibility
  const updateScrollButtons = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  // Scroll carousel
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 300; // Scroll by ~1.5 cards
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Keyboard shortcut: Ctrl/Cmd + K to focus Kai input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      if ((isMac && e.metaKey && e.key === 'k') || (!isMac && e.ctrlKey && e.key === 'k')) {
        e.preventDefault();
        // Focus the Kai message input
        messageInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Resize handlers for swivel bar
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;
      
      // Constrain width between 200px min and 75% of available width max
      const maxWidth = containerRect.width * 0.75;
      const constrainedWidth = Math.min(Math.max(newWidth, 200), maxWidth);
      setCommandCenterWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

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

    // Save user message to database if we have a valid conversation
    const conversationId = selectedConversationId && !selectedConversationId.startsWith('new-') 
      ? parseInt(selectedConversationId) 
      : null;
    
    if (conversationId) {
      try {
        await addMessageMutation.mutateAsync({
          conversationId,
          role: 'user',
          content: currentInput
        });
      } catch (error) {
        console.error('Failed to save user message:', error);
      }
    }

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

      // Save AI response to database
      if (conversationId) {
        try {
          await addMessageMutation.mutateAsync({
            conversationId,
            role: 'assistant',
            content: response.response
          });
          // Refresh conversations to update preview
          utils.kai.getConversations.invalidate();
        } catch (error) {
          console.error('Failed to save AI message:', error);
        }
      }
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

  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <BottomNavLayout hiddenInFocusMode={isFocusMode}>
      <div ref={containerRef} className={`kai-command-page flex ${isFocusMode ? 'h-[calc(100vh-64px)]' : 'h-[calc(100vh-80px-64px)]'} overflow-hidden ${isDark ? 'bg-[#0C0C0D]' : 'bg-[#F7F8FA]'} ${isFocusMode ? 'focus-mode' : ''} transition-all duration-300 ease-in-out`}>
        {/* Command Center - Left Panel - Floating Module Style */}
        <div 
          style={{ 
            width: isFocusMode ? '0px' : `${commandCenterWidth}px`,
            opacity: isFocusMode ? 0 : 1,
            transform: isFocusMode ? 'translateX(-20px)' : 'translateX(0)',
            pointerEvents: isFocusMode ? 'none' : 'auto'
          }}
          className={`conversation-panel ${isDark ? 'bg-[#121214] border-[rgba(255,255,255,0.05)]' : 'bg-white border-[#E5E6E8]'} border rounded-[18px] flex flex-col flex-shrink-0 m-4 mr-0 ${isDark ? 'shadow-[0_4px_24px_rgba(0,0,0,0.55)]' : 'shadow-[0_4px_12px_rgba(0,0,0,0.04)]'} overflow-hidden transition-all duration-300 ease-in-out ${isFocusMode ? 'invisible' : 'visible'}`}
        >
          {/* Header - Clean Layout */}
          <div className={`p-4 border-b ${isDark ? 'border-[rgba(255,255,255,0.05)]' : 'border-slate-200'}`}>
            {/* Search + Chat Button Row */}
            <div className="flex items-center gap-3 mb-3">
              {/* Search - Full Width */}
              <div className="relative flex-1">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-[rgba(255,255,255,0.45)]' : 'text-slate-400'}`} />
                <Input
                  placeholder="Search history, tags, @r"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-9 h-9 w-full ${isDark ? 'bg-[#18181A] border-[rgba(255,255,255,0.10)] text-white placeholder:text-[rgba(255,255,255,0.45)]' : 'bg-white border-slate-200'}`}
                />
              </div>
              
              {/* Apple-style Chat Button */}
              <button
                onClick={handleNewChat}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[18px] border text-[13px] font-medium transition-all duration-150 hover:translate-y-[-1px] hover:scale-[1.03] focus-visible:translate-y-[-1px] focus-visible:scale-[1.03] ${isDark ? 'border-[rgba(255,255,255,0.10)] text-white' : 'border-[#E3E5EB] text-[#25262B]'}`}
                style={{
                  background: isDark ? '#18181A' : 'linear-gradient(to bottom, #F8F8FB, #ECEEF3)',
                  boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 6px rgba(0,0,0,0.08)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDark ? '#1F1F22' : 'linear-gradient(to bottom, #FFFFFF, #ECEEF3)';
                  e.currentTarget.style.boxShadow = isDark ? '0 3px 12px rgba(0,0,0,0.4)' : '0 3px 10px rgba(0,0,0,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isDark ? '#18181A' : 'linear-gradient(to bottom, #F8F8FB, #ECEEF3)';
                  e.currentTarget.style.boxShadow = isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 6px rgba(0,0,0,0.08)';
                }}
              >
                <Plus className={`w-4 h-4 ${isDark ? 'text-[rgba(255,255,255,0.65)]' : 'text-[#555A60]'}`} />
                Chat
              </button>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className={`w-full h-9 ${isDark ? 'bg-[#18181A]' : 'bg-slate-100'}`}>
                <TabsTrigger value="active" className={`flex-1 text-xs ${isDark ? 'data-[state=active]:bg-[rgba(255,255,255,0.08)] data-[state=active]:text-white text-[rgba(255,255,255,0.65)]' : 'data-[state=active]:bg-white'}`}>Active</TabsTrigger>
                <TabsTrigger value="archived" className={`flex-1 text-xs ${isDark ? 'data-[state=active]:bg-[rgba(255,255,255,0.08)] data-[state=active]:text-white text-[rgba(255,255,255,0.65)]' : 'data-[state=active]:bg-white'}`}>Archived</TabsTrigger>
                <TabsTrigger value="all" className={`flex-1 text-xs ${isDark ? 'data-[state=active]:bg-[rgba(255,255,255,0.08)] data-[state=active]:text-white text-[rgba(255,255,255,0.65)]' : 'data-[state=active]:bg-white'}`}>All</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Smart Collections */}
          <div className={`px-4 py-4 border-b ${isDark ? 'border-[rgba(255,255,255,0.05)]' : 'border-slate-100'}`}>
            <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-[rgba(255,255,255,0.55)]' : 'text-slate-500'}`}>Smart Collections</h3>
            <div className="space-y-2">
              {smartCollections.map((collection) => (
                <button
                  key={collection.id}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${isDark ? 'hover:bg-[rgba(255,255,255,0.08)]' : 'hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-2">
                    <collection.icon className={`w-4 h-4 ${collection.color}`} />
                    <span className={`text-sm ${isDark ? 'text-white' : 'text-slate-700'}`}>{collection.label}</span>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isDark ? 'text-[rgba(255,255,255,0.65)] bg-[#18181A]' : 'text-slate-500 bg-slate-200'}`}>
                    {collection.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Conversations with visible scrollbar */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="px-4 pt-4 pb-2 flex items-center justify-between">
              <h3 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-[rgba(255,255,255,0.55)]' : 'text-slate-500'}`}>Recent Conversations</h3>
              <span className={`text-xs ${isDark ? 'text-[rgba(255,255,255,0.45)]' : 'text-slate-400'}`}>{conversations.length}</span>
            </div>
            
            <div className="flex-1 overflow-y-auto px-4 scrollbar-visible">
              {/* Today */}
              {todayConversations.length > 0 && (
                <div className="mb-4">
                  <h4 className={`text-xs font-medium uppercase mb-2 ${isDark ? 'text-[rgba(255,255,255,0.45)]' : 'text-slate-400'}`}>Today</h4>
                  {todayConversations.map((conv) => (
                    <ConversationCard 
                      key={conv.id} 
                      conversation={conv} 
                      getCategoryColor={getCategoryColor}
                      getStatusColor={getStatusColor}
                      isSelected={selectedConversationId === conv.id}
                      onClick={() => {
                        setSelectedConversationId(conv.id);
                        setMessages([]);
                      }}
                      onDelete={handleDeleteConversation}
                      isDark={isDark}
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
                      isSelected={selectedConversationId === conv.id}
                      onClick={() => {
                        setSelectedConversationId(conv.id);
                        setMessages([]);
                      }}
                      onDelete={handleDeleteConversation}
                      isDark={isDark}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Swivel/Drag Bar - Only show when not in Focus Mode */}
        <div 
          onMouseDown={handleMouseDown}
          onDoubleClick={() => setCommandCenterWidth(320)}
          style={{
            opacity: isFocusMode ? 0 : 1,
            width: isFocusMode ? '0px' : '8px',
            pointerEvents: isFocusMode ? 'none' : 'auto'
          }}
          className={`cursor-col-resize flex items-center justify-center group transition-all duration-300 ease-in-out select-none ${
            isResizing ? 'bg-[#ED393D]' : 'bg-slate-200 hover:bg-[#ED393D]'
          }`}
          title="Drag to resize, double-click to reset"
        >
          <div className={`w-1 h-12 rounded-full transition-colors ${
            isResizing ? 'bg-white' : 'bg-slate-400 group-hover:bg-white'
          }`} />
        </div>

        {/* Main Conversation Panel - Right Side */}
        <div className={`flex-1 flex flex-col ${isDark ? 'bg-[#0C0C0D]' : 'bg-white'}`}>
          {/* Top Banner */}
          <div className={`px-6 py-3 border-b flex items-center justify-between ${isDark ? 'bg-[#0C0C0D] border-[rgba(255,255,255,0.05)]' : 'bg-white border-slate-200'}`}>
            <p className={`text-xs uppercase tracking-wide font-medium ${isDark ? 'text-[rgba(255,255,255,0.55)]' : 'text-slate-500'}`}>
              Kai Command uses a structured, professional conversation format — designed for clarity, accuracy, and operational decision-making.
            </p>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className={`h-8 w-8 ${isDark ? 'hover:bg-[rgba(255,255,255,0.08)]' : ''}`} title="Summarize & Extract">
                <FileText className={`w-4 h-4 ${isDark ? 'text-[rgba(255,255,255,0.55)]' : 'text-slate-500'}`} />
              </Button>
              <Button variant="ghost" size="icon" className={`h-8 w-8 ${isDark ? 'hover:bg-[rgba(255,255,255,0.08)]' : ''}`} title="Invite Team Members">
                <Users className={`w-4 h-4 ${isDark ? 'text-[rgba(255,255,255,0.55)]' : 'text-slate-500'}`} />
              </Button>
              <Button variant="ghost" size="icon" className={`h-8 w-8 ${isDark ? 'hover:bg-[rgba(255,255,255,0.08)]' : ''}`} title="Enable Voice Replies">
                <Volume2 className={`w-4 h-4 ${isDark ? 'text-[rgba(255,255,255,0.55)]' : 'text-slate-500'}`} />
              </Button>
              <Button variant="ghost" size="icon" className={`h-8 w-8 ${isDark ? 'hover:bg-[rgba(255,255,255,0.08)]' : ''}`} title="Full Screen">
                <Maximize2 className={`w-4 h-4 ${isDark ? 'text-[rgba(255,255,255,0.55)]' : 'text-slate-500'}`} />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className={`h-8 w-8 ${isFocusMode ? 'bg-[#E53935]/10' : ''}`}
                title={isFocusMode ? 'Turn off Focus Mode' : 'Turn on Focus Mode'}
                onClick={toggleFocusMode}
              >
                {isFocusMode ? (
                  <EyeOff className="w-4 h-4 text-[#E53935]" />
                ) : (
                  <Eye className="w-4 h-4 text-slate-500" />
                )}
              </Button>
            </div>
          </div>

          {/* Messages Area with visible scrollbar - Centered content */}
          <div className="flex-1 overflow-y-auto p-6 pt-6 scrollbar-visible">
            <div className="max-w-[1320px] mx-auto px-4">
              {messages.length === 0 ? (
                /* Empty State - Kai Greeting */
                <div className="flex flex-col items-center justify-center py-8">
                  {/* Kai Logo with glow effect in dark mode */}
                  <div className={`relative mb-4 ${isDark ? 'drop-shadow-[0_0_20px_rgba(255,76,76,0.18)]' : ''}`}>
                    <KaiLogo className="w-[100px] h-[100px]" />
                  </div>
                  <h2 className={`text-3xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Hi, I'm Kai.</h2>
                  <p className={`text-center max-w-md mb-8 ${isDark ? 'text-[rgba(255,255,255,0.65)]' : 'text-slate-600'}`}>
                    Tell me about your dojo and what you want to improve—growth, retention, or operations—and I'll show you the numbers.
                  </p>
                  
                  {/* Quick Commands Carousel */}
                  <div className="relative w-full max-w-4xl">
                    {/* Left Arrow */}
                    {canScrollLeft && (
                      <button
                        onClick={() => scrollCarousel('left')}
                        className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDark ? 'bg-[#18181A] border-[rgba(255,255,255,0.10)] shadow-[0_4px_12px_rgba(0,0,0,0.4)] hover:bg-[#1F1F22]' : 'bg-white shadow-lg border border-slate-200 hover:bg-slate-50'}`}
                      >
                        <ChevronLeft className={`w-5 h-5 ${isDark ? 'text-white' : 'text-slate-600'}`} />
                      </button>
                    )}
                    
                    {/* Right Arrow */}
                    {canScrollRight && (
                      <button
                        onClick={() => scrollCarousel('right')}
                        className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDark ? 'bg-[#18181A] border-[rgba(255,255,255,0.10)] shadow-[0_4px_12px_rgba(0,0,0,0.4)] hover:bg-[#1F1F22]' : 'bg-white shadow-lg border border-slate-200 hover:bg-slate-50'}`}
                      >
                        <ChevronRight className={`w-5 h-5 ${isDark ? 'text-white' : 'text-slate-600'}`} />
                      </button>
                    )}
                    
                    {/* Scrollable Container */}
                    <div
                      ref={carouselRef}
                      onScroll={updateScrollButtons}
                      className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 px-1"
                      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                      {sortedQuickCommands.map((command) => (
                        <button
                          key={command.id}
                          onClick={() => handlePromptClick(command.text)}
                          className={`relative flex-shrink-0 w-[200px] border rounded-[18px] p-5 text-left transition-all duration-200 group snap-start ${
                            isDark 
                              ? `bg-[#18181A] border-[rgba(255,255,255,0.05)] hover:bg-[#1F1F22] hover:border-[rgba(255,255,255,0.10)] shadow-[0_4px_14px_rgba(0,0,0,0.3)] ${favorites.has(command.id) ? 'border-[#FF4C4C]/30' : ''}`
                              : `bg-white shadow-[0_4px_14px_rgba(0,0,0,0.05)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)] hover:border-[#E53935]/20 ${favorites.has(command.id) ? 'border-[#E53935]/30 bg-red-50/30' : 'border-slate-100'}`
                          }`}
                        >
                          {/* Favorite Star */}
                          <div
                            onClick={(e) => toggleFavorite(command.id, e)}
                            className={`absolute top-3 right-3 p-1 rounded-full transition-colors cursor-pointer ${isDark ? 'hover:bg-[rgba(255,255,255,0.08)]' : 'hover:bg-slate-100'}`}
                          >
                            <Star
                              className={`w-4 h-4 transition-colors ${
                                favorites.has(command.id)
                                  ? 'fill-[#FF4C4C] text-[#FF4C4C]'
                                  : isDark ? 'text-[rgba(255,255,255,0.35)] hover:text-[rgba(255,255,255,0.55)]' : 'text-slate-300 hover:text-slate-400'
                              }`}
                            />
                          </div>
                          
                          <div className="text-xs font-semibold text-[#FF4C4C] uppercase tracking-wide mb-2 pr-6">
                            {command.header}
                          </div>
                          <p className={`text-sm leading-relaxed ${isDark ? 'text-[rgba(255,255,255,0.75)] group-hover:text-white' : 'text-slate-600 group-hover:text-slate-800'}`}>
                            {command.text}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Messages */
                <div className="space-y-6">
                  {messages.map((message) => (
                    <div key={message.id} className="flex gap-3">
                      {message.role === 'user' ? (
                        <>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0 ${isDark ? 'bg-[#18181A]' : 'bg-slate-900'}`}>
                            You
                          </div>
                          <div className="flex-1">
                            <div className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>You</div>
                            <p className={isDark ? 'text-[rgba(255,255,255,0.75)]' : 'text-slate-700'}>{message.content}</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-8 h-8 rounded-full bg-[#FF4C4C] flex items-center justify-center shrink-0">
                            <Sparkles className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Kai</div>
                            <div className={`whitespace-pre-wrap prose prose-sm max-w-none ${isDark ? 'text-[rgba(255,255,255,0.75)] prose-invert' : 'text-slate-700'}`}>
                              {message.content}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#FF4C4C] flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4 text-white animate-pulse" />
                      </div>
                      <div className="flex-1">
                        <div className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Kai</div>
                        <div className="flex gap-1">
                          <div className={`w-2 h-2 rounded-full animate-bounce ${isDark ? 'bg-[rgba(255,255,255,0.35)]' : 'bg-slate-300'}`} style={{ animationDelay: '0ms' }} />
                          <div className={`w-2 h-2 rounded-full animate-bounce ${isDark ? 'bg-[rgba(255,255,255,0.35)]' : 'bg-slate-300'}`} style={{ animationDelay: '150ms' }} />
                          <div className={`w-2 h-2 rounded-full animate-bounce ${isDark ? 'bg-[rgba(255,255,255,0.35)]' : 'bg-slate-300'}`} style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* Input Bar - Apple-style floating bar */}
          <div className={`p-4 border-t transition-all ${expandedInput ? 'pb-8' : ''} ${isDark ? 'border-[rgba(255,255,255,0.05)] bg-[#18181A]/80' : 'border-slate-100 bg-white/80'} backdrop-blur-sm`}>
            <div className="max-w-3xl mx-auto relative">
              {/* Expand/Collapse Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setExpandedInput(!expandedInput)}
                className={`absolute -top-3 left-1/2 -translate-x-1/2 h-6 w-6 rounded-full z-10 shadow-sm ${isDark ? 'bg-[#202022] hover:bg-[#2A2A2D] text-white' : 'bg-slate-100 hover:bg-slate-200'}`}
              >
                {expandedInput ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </Button>
              
              <div className={`flex items-center gap-2 rounded-[22px] border p-2 transition-all duration-200 ${isDark ? 'bg-[#18181A] border-[rgba(255,255,255,0.10)] shadow-[0_2px_12px_rgba(0,0,0,0.3)] focus-within:border-[rgba(255,255,255,0.15)]' : 'bg-white border-slate-200 shadow-[0_2px_12px_rgba(0,0,0,0.06)] focus-within:border-slate-300 focus-within:shadow-[0_4px_16px_rgba(0,0,0,0.08)]'}`}>
                <Button variant="ghost" size="icon" className={`h-9 w-9 rounded-full ${isDark ? 'text-[rgba(255,255,255,0.45)] hover:text-white hover:bg-[rgba(255,255,255,0.08)]' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
                  <Paperclip className="w-5 h-5" />
                </Button>
                <Textarea
                  ref={messageInputRef}
                  placeholder="Message Kai... (Type @ to mention)"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className={`flex-1 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 ${isDark ? 'text-white placeholder:text-[rgba(255,255,255,0.45)]' : 'text-slate-800 placeholder:text-slate-400'} ${expandedInput ? 'min-h-[120px]' : 'min-h-[40px] max-h-32'}`}
                  rows={expandedInput ? 5 : 1}
                />
                <Button variant="ghost" size="icon" className={`h-9 w-9 rounded-full ${isDark ? 'text-[rgba(255,255,255,0.45)] hover:text-white hover:bg-[rgba(255,255,255,0.08)]' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
                  <Mic className="w-5 h-5" />
                </Button>
                <Button 
                  size="icon" 
                  className="h-9 w-9 bg-[#FF4C4C] hover:bg-[#FF5E5E] text-white rounded-full shadow-sm"
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || isLoading}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className={`text-xs text-center mt-2 ${isDark ? 'text-[rgba(255,255,255,0.45)]' : 'text-slate-400'}`}>
                Kai can make mistakes. Consider checking important information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </BottomNavLayout>
  );
}

// Conversation Card Component
function ConversationCard({ 
  conversation, 
  getCategoryColor,
  getStatusColor,
  isSelected,
  onClick,
  onDelete,
  isDark
}: { 
  conversation: Conversation; 
  getCategoryColor: (category: string) => string;
  getStatusColor: (status: string) => string;
  isSelected?: boolean;
  onClick?: () => void;
  onDelete?: (id: string) => void;
  isDark?: boolean;
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  return (
    <div 
      onClick={onClick}
      className={`rounded-lg border p-3 mb-2 transition-all cursor-pointer ${
        isSelected 
          ? isDark 
            ? 'bg-[rgba(255,255,255,0.08)] border-l-2 border-l-[#FF4C4C] border-[rgba(255,255,255,0.10)]' 
            : 'bg-slate-100 border-slate-300 shadow-sm'
          : isDark 
            ? 'bg-[#18181A] border-[rgba(255,255,255,0.05)] hover:bg-[#1F1F22]' 
            : 'bg-white border-slate-200 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between mb-1">
        <h5 className={`text-sm font-medium truncate flex-1 pr-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{conversation.title}</h5>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-xs text-slate-400">{conversation.timestamp}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="w-3 h-3 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => toast.info('Archive feature coming soon')}>
                Archive
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info('Rename feature coming soon')}>
                Rename
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{conversation.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                onDelete?.(conversation.id);
                setShowDeleteConfirm(false);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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

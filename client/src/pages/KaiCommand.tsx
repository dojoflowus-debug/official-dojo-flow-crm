import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import BottomNavLayout from '@/components/BottomNavLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { useFocusMode } from '@/contexts/FocusModeContext';
import { useEnvironment } from '@/contexts/EnvironmentContext';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MentionInput } from '@/components/MentionInput';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { SchedulePreviewCard, ExtractedClass } from '@/components/SchedulePreviewCard';
import { ResultsPanel, ResultsPanelData } from '@/components/ResultsPanel';
import { parseKaiMessage, renderParsedMessage } from '@/lib/kaiUIBlocks';
import { UIBlockRenderer } from '@/components/UIBlockRenderer';
import VoicePacedMessage from '@/components/VoicePacedMessage';
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
  Star,
  Archive,
  Pencil,
  Minimize2,
  Focus,
  Play,
  Pause,
  Presentation,
  AtSign,
  X,
  Image,
  File,
  Loader2,
  List,
  Save,
  Upload,
  RefreshCw,
  FileSpreadsheet,
  Download
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
  category: 'kai' | 'growth' | 'billing' | 'operations' | 'general';
  date: 'today' | 'yesterday' | 'older';
  archivedAt?: Date | null;
}

// Message type
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: Attachment[];
  ui_blocks?: Array<{
    type: 'student_card' | 'student_list' | 'lead_card' | 'lead_list';
    studentId?: number;
    studentIds?: number[];
    leadId?: number;
    leadIds?: number[];
    label: string;
  }>;
}

// Attachment type
interface Attachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  storageKey?: string; // Storage key for server-side file reading
  uploading?: boolean;
  error?: string;
  originalFile?: File; // Store original file for retry
}

export default function KaiCommand() {
  const [, navigate] = useLocation();
  
  const [activeTab, setActiveTab] = useState('active');
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Schedule extraction state
  const [schedulePreview, setSchedulePreview] = useState<{
    classes: ExtractedClass[];
    fileName: string;
    confidence: number;
    warnings?: string[];
  } | null>(null);
  const [isExtractingSchedule, setIsExtractingSchedule] = useState(false);
  const [isCreatingClasses, setIsCreatingClasses] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Drag-and-drop state
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);
  const [expandedInput, setExpandedInput] = useState(false);
  const [commandCenterWidth, setCommandCenterWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  // Use global Focus Mode context
  const { isFocusMode, isFullscreen, toggleFocusMode, toggleFullscreen, enterFullscreen } = useFocusMode();
  // Use global Environment context
  const { currentEnvironment, isTransitioning, isPresentationMode, presentationProgress, togglePresentationMode } = useEnvironment();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [parallaxOffset, setParallaxOffset] = useState(0);
  
  // Auto-hide UI state for Focus Mode
  const [isUIHidden, setIsUIHidden] = useState(false);
  
  // Results Panel state
  const [resultsPanelData, setResultsPanelData] = useState<ResultsPanelData>(null);
  
  // Voice state management
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [currentSpeechMessageId, setCurrentSpeechMessageId] = useState<string | null>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isScrollingRef = useRef(false);
  const IDLE_TIMEOUT = 2500; // 2.5 seconds
  const SCROLL_DEBOUNCE = 500; // 500ms after scroll stops
  
  // Theme detection (needed early for parallax)
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === 'dark' || theme === 'cinematic';
  const isCinematic = theme === 'cinematic';

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user?.name) return 'U';
    const names = user.name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return user.name.substring(0, 2).toUpperCase();
  };

  // Staff data for mention rendering
  const { data: staffData } = trpc.staff.getAll.useQuery({ limit: 50 });
  
  // Render message content with styled @mentions
  // Add note to student mutation
  const addStudentNoteMutation = trpc.students.addNote.useMutation();
  
  // Handle saving note to student card
  const handleSaveToStudentCard = async (studentId: number, studentName: string, noteContent: string) => {
    try {
      const result = await addStudentNoteMutation.mutateAsync({
        studentId,
        content: noteContent,
        noteType: 'extraction',
        priority: 'medium',
        sourceConversationId: selectedConversationId ? parseInt(selectedConversationId) : undefined,
      });
      toast.success(`Note saved to ${result.studentName}'s profile`);
    } catch (error: any) {
      console.error('Failed to save note to student card:', error);
      toast.error(`Couldn't save note. ${error?.message || 'Unknown error'}`);
    }
  };
  
  // Helper to extract xlsx/csv attachment links from message content
  const extractScheduleLinks = (content: string): { fileName: string; url: string }[] => {
    const linkRegex = /\[([^\]]+\.(xlsx|xls|csv))\]\(([^)]+)\)/gi;
    const links: { fileName: string; url: string }[] = [];
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      links.push({ fileName: match[1], url: match[3] });
    }
    return links;
  };

  const renderMessageWithMentions = (content: string, isKaiMessage: boolean = false) => {
    // Parse Kai UI blocks if this is a Kai message
    if (isKaiMessage) {
      const parsed = parseKaiMessage(content);
      if (parsed.blocks.length > 0) {
        return renderParsedMessage(
          parsed,
          (studentId) => setResultsPanelData({ type: "student", studentId }),
          (leadId) => setResultsPanelData({ type: "lead", leadId }),
          (studentIds) => setResultsPanelData({ type: "student_list", studentIds }),
          (leadIds) => setResultsPanelData({ type: "lead_list", leadIds }),
          isDark,
          isCinematic
        );
      }
    }
    
    // First check for xlsx/csv attachment links and render them as actionable cards
    const scheduleLinks = extractScheduleLinks(content);
    
    // First, handle [STUDENT_ID:X] markers for Save to Card functionality
    const studentIdRegex = /\*\*([^*]+)\*\*\s*\[STUDENT_ID:(\d+)\]:\s*([^\n]+)/g;
    const hasStudentIds = studentIdRegex.test(content);
    studentIdRegex.lastIndex = 0; // Reset regex
    
    if (hasStudentIds) {
      // Parse content with student IDs and render with Save to Card buttons
      const lines = content.split('\n');
      return (
        <div className="space-y-1">
          {lines.map((line, lineIndex) => {
            const studentMatch = line.match(/\*\*([^*]+)\*\*\s*\[STUDENT_ID:(\d+)\]:\s*(.+)/);
            if (studentMatch) {
              const [, studentName, studentIdStr, context] = studentMatch;
              const studentId = parseInt(studentIdStr);
              return (
                <div key={lineIndex} className="flex items-start gap-2 group">
                  <span className="flex-1">
                    - <strong className={isDark || isCinematic ? 'text-green-400' : 'text-green-700'}>{studentName}</strong>: {context}
                  </span>
                  <button
                    onClick={() => handleSaveToStudentCard(studentId, studentName, context)}
                    className={`opacity-0 group-hover:opacity-100 transition-opacity px-2 py-0.5 text-xs rounded-full flex items-center gap-1 ${
                      isDark || isCinematic
                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30'
                        : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200'
                    }`}
                    title={`Save to ${studentName}'s profile`}
                  >
                    <Save className="w-3 h-3" />
                    Save to Card
                  </button>
                </div>
              );
            }
            // Render other lines normally (handle markdown-like formatting)
            if (line.startsWith('## ') || line.startsWith('### ')) {
              const level = line.startsWith('## ') ? 'text-lg font-bold' : 'text-base font-semibold';
              const text = line.replace(/^#+ /, '');
              return <div key={lineIndex} className={`${level} mt-3 mb-1`}>{text}</div>;
            }
            if (line.startsWith('- ')) {
              // Handle bold text in list items
              const boldMatch = line.match(/- \*\*([^*]+)\*\*(.*)/);
              if (boldMatch) {
                return <div key={lineIndex}>- <strong>{boldMatch[1]}</strong>{boldMatch[2]}</div>;
              }
              return <div key={lineIndex}>{line}</div>;
            }
            return <div key={lineIndex}>{line}</div>;
          })}
        </div>
      );
    }
    
    // Match @mentions (e.g., @Coach Sarah, @Kai, @Mr. Chen)
    const mentionRegex = /@([A-Za-z][A-Za-z0-9.\s]*?)(?=\s|$|,|\.|!|\?)/g;
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;
    
    while ((match = mentionRegex.exec(content)) !== null) {
      // Add text before the mention
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index));
      }
      
      const mentionName = match[1].trim();
      
      // Find matching staff member
      const staffMember = staffData?.staff?.find(
        (s: any) => s.name.toLowerCase() === mentionName.toLowerCase() ||
                    s.fullName?.toLowerCase() === mentionName.toLowerCase()
      );
      
      // Check if it's Kai
      const isKai = mentionName.toLowerCase() === 'kai';
      
      if (staffMember || isKai) {
        // Get initials for avatar
        const getInitials = (name: string) => {
          const names = name.split(' ');
          if (names.length >= 2) {
            return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
          }
          return name.substring(0, 2).toUpperCase();
        };
        
        parts.push(
          <span
            key={`mention-${match.index}`}
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-sm font-medium ${
              isKai 
                ? 'bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-400 border border-red-500/30'
                : isDark || isCinematic
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'bg-blue-100 text-blue-700 border border-blue-200'
            }`}
            title={isKai ? 'Kai - AI Assistant' : `${staffMember?.fullName || mentionName} - ${staffMember?.role || 'Staff'}`}
          >
            {isKai ? (
              <img src="/kai-avatar.png" alt="Kai" className="w-4 h-4 rounded-full" />
            ) : staffMember?.photoUrl ? (
              <img src={staffMember.photoUrl} alt={mentionName} className="w-4 h-4 rounded-full object-cover" />
            ) : (
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                isDark || isCinematic ? 'bg-blue-500/40 text-blue-200' : 'bg-blue-200 text-blue-700'
              }`}>
                {getInitials(staffMember?.fullName || mentionName)}
              </span>
            )}
            <span>{isKai ? 'Kai' : staffMember?.name || mentionName}</span>
          </span>
        );
      } else {
        // Unknown mention - still style it but simpler
        parts.push(
          <span
            key={`mention-${match.index}`}
            className={`inline-flex items-center px-1.5 py-0.5 rounded text-sm font-medium ${
              isDark || isCinematic
                ? 'bg-gray-500/20 text-gray-300'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            @{mentionName}
          </span>
        );
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex));
    }
    
    // If there are schedule links, append actionable cards
    if (scheduleLinks.length > 0) {
      const textContent = parts.length > 0 ? parts : content;
      // Remove the markdown links from the displayed text
      const cleanedContent = typeof textContent === 'string' 
        ? textContent.replace(/Attachments:\s*\[([^\]]+\.(xlsx|xls|csv))\]\([^)]+\)/gi, '')
        : textContent;
      
      return (
        <div>
          <div>{cleanedContent}</div>
          <div className="flex flex-wrap gap-2 mt-3">
            {scheduleLinks.map((link, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isCinematic || isFocusMode ? 'bg-white/10 border border-white/20' : isDark ? 'bg-white/5 border border-white/10' : 'bg-slate-100 border border-slate-200'}`}
              >
                <div className={`w-8 h-8 rounded flex items-center justify-center ${isCinematic || isFocusMode ? 'bg-green-500/20' : isDark ? 'bg-green-500/10' : 'bg-green-100'}`}>
                  <FileSpreadsheet className={`w-4 h-4 ${isCinematic || isFocusMode ? 'text-green-400' : isDark ? 'text-green-400' : 'text-green-600'}`} />
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-medium truncate max-w-[150px] ${isCinematic || isFocusMode ? 'text-white' : isDark ? 'text-white' : 'text-slate-700'}`}>
                    {link.fileName}
                  </p>
                  <p className={`text-[10px] ${isCinematic || isFocusMode ? 'text-white/50' : isDark ? 'text-white/40' : 'text-slate-400'}`}>
                    Schedule file
                  </p>
                </div>
                <button
                  onClick={() => handleScheduleExtraction(link.url, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', link.fileName)}
                  disabled={isExtractingSchedule}
                  className={`ml-2 px-3 py-1.5 text-xs rounded font-medium transition-colors flex items-center gap-1.5 ${isExtractingSchedule ? 'opacity-50 cursor-not-allowed' : ''} bg-[#FF4C4C] hover:bg-[#FF5E5E] text-white`}
                >
                  {isExtractingSchedule ? (
                    <><Loader2 className="w-3 h-3 animate-spin" /> Analyzing...</>
                  ) : (
                    <><Upload className="w-3 h-3" /> Import Schedule</>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return parts.length > 0 ? parts : content;
  };

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
  const archiveConversationMutation = trpc.kai.archiveConversation.useMutation();
  const unarchiveConversationMutation = trpc.kai.unarchiveConversation.useMutation();
  const renameConversationMutation = trpc.kai.renameConversation.useMutation();
  const updateConversationMutation = trpc.kai.updateConversation.useMutation();
  const summarizeConversationMutation = trpc.kai.summarizeConversation.useMutation();
  const extractConversationMutation = trpc.kai.extractConversation.useMutation();
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const utils = trpc.useUtils();

  // Handle delete conversation with optimistic update
  const handleDeleteConversation = async (conversationId: string) => {
    // Store previous data for rollback
    const previousConversations = utils.kai.getConversations.getData();
    
    // Optimistically remove from list
    utils.kai.getConversations.setData(undefined, (old) => 
      old?.filter(conv => conv.id.toString() !== conversationId) ?? []
    );
    
    // Clear selection if deleted conversation was selected
    if (selectedConversationId === conversationId) {
      setSelectedConversationId(null);
      setMessages([]);
    }
    
    try {
      await deleteConversationMutation.mutateAsync({ id: parseInt(conversationId) });
      toast.success('Conversation deleted');
    } catch (error: any) {
      // Rollback on failure
      if (previousConversations) {
        utils.kai.getConversations.setData(undefined, previousConversations);
      }
      console.error('Failed to delete conversation:', error);
      const errorMessage = error?.message || 'Unknown error';
      toast.error(`Couldn't delete chat. ${errorMessage}`);
    }
  };

  // Handle archive conversation with optimistic update
  const handleArchiveConversation = async (conversationId: string) => {
    // Store previous data for rollback
    const previousConversations = utils.kai.getConversations.getData();
    
    // Optimistically update archivedAt timestamp in list
    utils.kai.getConversations.setData(undefined, (old) => 
      old?.map(conv => 
        conv.id.toString() === conversationId 
          ? { ...conv, archivedAt: new Date() }
          : conv
      ) ?? []
    );
    
    try {
      await archiveConversationMutation.mutateAsync({ id: parseInt(conversationId) });
      toast.success('Conversation archived');
    } catch (error: any) {
      // Rollback on failure
      if (previousConversations) {
        utils.kai.getConversations.setData(undefined, previousConversations);
      }
      console.error('Failed to archive conversation:', error);
      const errorMessage = error?.message || 'Unknown error';
      toast.error(`Couldn't archive chat. ${errorMessage}`);
    }
  };

  // Handle unarchive conversation
  const handleUnarchiveConversation = async (conversationId: string) => {
    // Store previous data for rollback
    const previousConversations = utils.kai.getConversations.getData();
    
    // Optimistically clear archivedAt timestamp in list
    utils.kai.getConversations.setData(undefined, (old) => 
      old?.map(conv => 
        conv.id.toString() === conversationId 
          ? { ...conv, archivedAt: null }
          : conv
      ) ?? []
    );
    
    try {
      await unarchiveConversationMutation.mutateAsync({ id: parseInt(conversationId) });
      toast.success('Conversation restored');
    } catch (error: any) {
      // Rollback on failure
      if (previousConversations) {
        utils.kai.getConversations.setData(undefined, previousConversations);
      }
      console.error('Failed to restore conversation:', error);
      const errorMessage = error?.message || 'Unknown error';
      toast.error(`Couldn't restore chat. ${errorMessage}`);
    }
  };

  // Handle rename conversation with optimistic update
  const handleRenameConversation = async (conversationId: string, newTitle: string) => {
    // Store previous data for rollback
    const previousConversations = utils.kai.getConversations.getData();
    
    // Optimistically update title in list
    utils.kai.getConversations.setData(undefined, (old) => 
      old?.map(conv => 
        conv.id.toString() === conversationId 
          ? { ...conv, title: newTitle }
          : conv
      ) ?? []
    );
    
    try {
      await renameConversationMutation.mutateAsync({ id: parseInt(conversationId), title: newTitle });
      toast.success('Conversation renamed');
    } catch (error: any) {
      // Rollback on failure
      if (previousConversations) {
        utils.kai.getConversations.setData(undefined, previousConversations);
      }
      console.error('Failed to rename conversation:', error);
      const errorMessage = error?.message || 'Unknown error';
      toast.error(`Couldn't rename chat. ${errorMessage}`);
    }
  };

  // Handle update conversation priority with optimistic update
  const handleUpdatePriority = async (conversationId: string, priority: 'neutral' | 'attention' | 'urgent') => {
    const previousConversations = utils.kai.getConversations.getData();
    
    // Optimistically update priority in list
    utils.kai.getConversations.setData(undefined, (old) => 
      old?.map(conv => 
        conv.id.toString() === conversationId 
          ? { ...conv, priority }
          : conv
      ) ?? []
    );
    
    try {
      await updateConversationMutation.mutateAsync({ id: parseInt(conversationId), priority });
      const labels = { neutral: 'Normal', attention: 'Needs Attention', urgent: 'Urgent' };
      toast.success(`Priority set to ${labels[priority]}`);
    } catch (error: any) {
      if (previousConversations) {
        utils.kai.getConversations.setData(undefined, previousConversations);
      }
      console.error('Failed to update priority:', error);
      toast.error(`Couldn't update priority. ${error?.message || 'Unknown error'}`);
    }
  };

  // Handle update conversation category with optimistic update
  const handleUpdateCategory = async (conversationId: string, category: 'kai' | 'growth' | 'billing' | 'operations' | 'general') => {
    const previousConversations = utils.kai.getConversations.getData();
    
    // Optimistically update category in list
    utils.kai.getConversations.setData(undefined, (old) => 
      old?.map(conv => 
        conv.id.toString() === conversationId 
          ? { ...conv, category }
          : conv
      ) ?? []
    );
    
    try {
      await updateConversationMutation.mutateAsync({ id: parseInt(conversationId), category });
      const labels = { kai: 'Kai Insights', growth: 'Growth', billing: 'Billing', operations: 'Operations', general: 'General' };
      toast.success(`Category set to ${labels[category]}`);
    } catch (error: any) {
      if (previousConversations) {
        utils.kai.getConversations.setData(undefined, previousConversations);
      }
      console.error('Failed to update category:', error);
      toast.error(`Couldn't update category. ${error?.message || 'Unknown error'}`);
    }
  };

  // Handle summarize conversation
  const handleSummarize = async () => {
    if (!selectedConversationId) {
      toast.error('Please select a conversation to summarize');
      return;
    }
    
    setIsSummarizing(true);
    try {
      const result = await summarizeConversationMutation.mutateAsync({
        conversationId: parseInt(selectedConversationId)
      });
      
      // Add the summary message to the chat UI
      const summaryMessage: Message = {
        id: `summary-${Date.now()}`,
        role: 'assistant',
        content: `## 📋 Conversation Summary\n\n${result.summary}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        avatar: 'Kai'
      };
      setMessages(prev => [...prev, summaryMessage]);
      
      // Invalidate to refresh conversation list
      utils.kai.getConversations.invalidate();
      utils.kai.getMessages.invalidate({ conversationId: parseInt(selectedConversationId) });
      
      toast.success('Conversation summarized');
    } catch (error: any) {
      console.error('Failed to summarize conversation:', error);
      toast.error(`Couldn't summarize. ${error?.message || 'Unknown error'}`);
    } finally {
      setIsSummarizing(false);
    }
  };

  // Handle export conversation
  const handleExport = async (format: 'json' | 'markdown' | 'csv') => {
    if (!selectedConversationId) {
      toast.error('Please select a conversation to export');
      return;
    }
    
    try {
      const result = await trpc.kai.exportConversations.query({
        conversationId: parseInt(selectedConversationId),
        format,
      });
      
      // Create a download link
      const blob = new Blob([result.content], { type: result.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`Exported conversation as ${format.toUpperCase()}`);
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error';
      toast.error(`Export failed: ${errorMessage}`);
    }
  };

  // Handle export all conversations
  const handleExportAll = async (format: 'json' | 'markdown' | 'csv') => {
    try {
      const result = await trpc.kai.exportConversations.query({
        format,
      });
      
      // Create a download link
      const blob = new Blob([result.content], { type: result.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`Exported ${result.count} conversation(s) as ${format.toUpperCase()}`);
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error';
      toast.error(`Export failed: ${errorMessage}`);
    }
  };

  // Handle extract conversation
  const handleExtract = async () => {
    if (!selectedConversationId) {
      toast.error('Please select a conversation to extract from');
      return;
    }
    
    setIsExtracting(true);
    try {
      const result = await extractConversationMutation.mutateAsync({
        conversationId: parseInt(selectedConversationId)
      });
      
      // Add the extraction message to the chat UI
      const extractMessage: Message = {
        id: `extract-${Date.now()}`,
        role: 'assistant',
        content: result.formattedContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        avatar: 'Kai'
      };
      setMessages(prev => [...prev, extractMessage]);
      
      // Invalidate to refresh conversation list
      utils.kai.getConversations.invalidate();
      utils.kai.getMessages.invalidate({ conversationId: parseInt(selectedConversationId) });
      
      toast.success('Data extracted from conversation');
    } catch (error: any) {
      console.error('Failed to extract from conversation:', error);
      toast.error(`Couldn't extract. ${error?.message || 'Unknown error'}`);
    } finally {
      setIsExtracting(false);
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
      date: dateCategory,
      archivedAt: c.archivedAt
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

  // Smart collections with dynamic counts based on actual data
  const urgentCount = conversations.filter(c => !c.archivedAt && c.status === 'urgent').length;
  const insightsCount = conversations.filter(c => !c.archivedAt && c.category === 'kai').length;
  const pendingCount = conversations.filter(c => !c.archivedAt && c.status === 'attention').length;
  
  const smartCollections = [
    { id: 'urgent', label: 'Urgent', count: urgentCount, icon: AlertCircle, color: 'text-[#ED393D]' },
    { id: 'insights', label: 'Kai Insights', count: insightsCount, icon: Sparkles, color: 'text-[#A855F7]' },
    { id: 'pending', label: 'Pending Tasks', count: pendingCount, icon: CheckSquare, color: 'text-[#14B8A6]' }
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

  // Parallax scroll effect for cinematic backgrounds
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || !isCinematic) {
      setParallaxOffset(0);
      return;
    }

    const handleScroll = () => {
      const scrollTop = scrollContainer.scrollTop;
      // Subtle parallax: background moves at 30% of scroll speed
      const offset = scrollTop * 0.3;
      setParallaxOffset(offset);
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [isCinematic]);

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

  // Upload mutation
  const uploadMutation = trpc.upload.uploadAttachment.useMutation();
  
  // Schedule extraction mutations
  const extractScheduleMutation = trpc.classes.extractSchedule.useMutation();
  const createClassesMutation = trpc.classes.createClassesFromSchedule.useMutation();

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
      'application/vnd.ms-excel', // xls
      'text/csv', // csv
      'text/plain'
    ];

    for (const file of Array.from(files)) {
      // Validate file size
      if (file.size > maxSize) {
        toast.error(`File "${file.name}" exceeds 10MB limit`);
        continue;
      }

      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        toast.error(`File type not supported: ${file.name}`);
        continue;
      }

      // Create temporary attachment with uploading state
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const tempAttachment: Attachment = {
        id: tempId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        url: '',
        uploading: true
      };

      setAttachments(prev => [...prev, tempAttachment]);

      // Read file as base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64Data = event.target?.result as string;
          
          const result = await uploadMutation.mutateAsync({
            fileName: file.name,
            fileData: base64Data,
            fileType: file.type,
            fileSize: file.size,
            context: 'kai-command'
          });

          // Update attachment with uploaded URL and storage key
          setAttachments(prev => prev.map(att => 
            att.id === tempId 
              ? { ...att, url: result.url, storageKey: result.key, uploading: false }
              : att
          ));
          
          // Check if this is a schedule file (xlsx, xls, csv)
          const isScheduleFile = 
            file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            file.type === 'application/vnd.ms-excel' ||
            file.type === 'text/csv' ||
            file.name.endsWith('.xlsx') ||
            file.name.endsWith('.xls') ||
            file.name.endsWith('.csv');
          
          if (isScheduleFile) {
            // Auto-extract schedule from the file using storage key for reliable server-side reading
            handleScheduleExtraction(result.url, file.type, file.name, result.key);
          }
        } catch (error: any) {
          console.error('Upload failed:', error);
          // Extract meaningful error message
          const errorMessage = error?.message || error?.data?.message || 'Upload failed';
          // Mark attachment as failed with detailed error
          setAttachments(prev => prev.map(att => 
            att.id === tempId 
              ? { ...att, uploading: false, error: errorMessage, originalFile: file }
              : att
          ));
          toast.error(`Failed to upload ${file.name}: ${errorMessage}`);
        }
      };
      reader.readAsDataURL(file);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove attachment
  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  // Retry failed upload
  const retryUpload = async (attachmentId: string) => {
    const attachment = attachments.find(att => att.id === attachmentId);
    if (!attachment || !attachment.originalFile) {
      toast.error('Cannot retry: original file not available');
      return;
    }

    const file = attachment.originalFile;
    
    // Mark as uploading again
    setAttachments(prev => prev.map(att => 
      att.id === attachmentId 
        ? { ...att, uploading: true, error: undefined }
        : att
    ));

    // Read file as base64
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const base64Data = event.target?.result as string;
        
        const result = await uploadMutation.mutateAsync({
          fileName: file.name,
          fileData: base64Data,
          fileType: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          fileSize: file.size,
          context: 'kai-command'
        });

        // Update attachment with uploaded URL and storage key
        setAttachments(prev => prev.map(att => 
          att.id === attachmentId 
            ? { ...att, url: result.url, storageKey: result.key, uploading: false, error: undefined }
            : att
        ));
        
        toast.success(`Successfully uploaded ${file.name}`);
        
        // Check if this is a schedule file
        const isScheduleFile = 
          file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          file.type === 'application/vnd.ms-excel' ||
          file.type === 'text/csv' ||
          file.name.endsWith('.xlsx') ||
          file.name.endsWith('.xls') ||
          file.name.endsWith('.csv');
        
        if (isScheduleFile) {
          handleScheduleExtraction(result.url, file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', file.name, result.key);
        }
      } catch (error: any) {
        console.error('Retry upload failed:', error);
        const errorMessage = error?.message || error?.data?.message || 'Upload failed';
        setAttachments(prev => prev.map(att => 
          att.id === attachmentId 
            ? { ...att, uploading: false, error: errorMessage }
            : att
        ));
        toast.error(`Retry failed: ${errorMessage}`);
      }
    };
    reader.readAsDataURL(file);
  };

  // Drag-and-drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
      'application/vnd.ms-excel', // xls
      'text/csv', // csv
      'text/plain'
    ];

    for (const file of Array.from(files)) {
      // Validate file size
      if (file.size > maxSize) {
        toast.error(`File "${file.name}" exceeds 10MB limit`);
        continue;
      }

      // Validate file type - also check by extension for xlsx files
      const isAllowedType = allowedTypes.includes(file.type) ||
        file.name.endsWith('.xlsx') ||
        file.name.endsWith('.xls') ||
        file.name.endsWith('.csv');
      
      if (!isAllowedType) {
        toast.error(`File type not supported: ${file.name}`);
        continue;
      }

      // Create temporary attachment with uploading state
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const tempAttachment: Attachment = {
        id: tempId,
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
        url: '',
        uploading: true
      };

      setAttachments(prev => [...prev, tempAttachment]);

      // Read file as base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64Data = event.target?.result as string;
          
          const result = await uploadMutation.mutateAsync({
            fileName: file.name,
            fileData: base64Data,
            fileType: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            fileSize: file.size,
            context: 'kai-command'
          });

          // Update attachment with uploaded URL and storage key
          setAttachments(prev => prev.map(att => 
            att.id === tempId 
              ? { ...att, url: result.url, storageKey: result.key, uploading: false }
              : att
          ));
          
          // Check if this is a schedule file (xlsx, xls, csv)
          const isScheduleFile = 
            file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            file.type === 'application/vnd.ms-excel' ||
            file.type === 'text/csv' ||
            file.name.endsWith('.xlsx') ||
            file.name.endsWith('.xls') ||
            file.name.endsWith('.csv');
          
          if (isScheduleFile) {
            // Auto-extract schedule from the file using storage key for reliable server-side reading
            handleScheduleExtraction(result.url, file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', file.name, result.key);
          }
        } catch (error: any) {
          console.error('Upload failed:', error);
          // Extract meaningful error message
          const errorMessage = error?.message || error?.data?.message || 'Upload failed';
          // Mark attachment as failed with detailed error
          setAttachments(prev => prev.map(att => 
            att.id === tempId 
              ? { ...att, uploading: false, error: errorMessage, originalFile: file }
              : att
          ));
          toast.error(`Failed to upload ${file.name}: ${errorMessage}`);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Check if file is an image
  const isImageFile = (type: string): boolean => {
    return type.startsWith('image/');
  };

  // Handle schedule extraction from uploaded file
  const handleScheduleExtraction = async (fileUrl: string, fileType: string, fileName: string, storageKey?: string) => {
    setIsExtractingSchedule(true);
    
    // Add Kai message about analyzing
    const analyzingMessage: Message = {
      id: `analyzing-${Date.now()}`,
      role: 'assistant',
      content: `I'm analyzing **${fileName}** to extract class schedule information...`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, analyzingMessage]);
    
    try {
      console.log('[KaiCommand] Extracting schedule from:', { fileUrl, storageKey, fileType, fileName });
      
      const result = await extractScheduleMutation.mutateAsync({
        fileUrl,
        storageKey,
        fileType,
        fileName
      });
      
      console.log('[KaiCommand] Extraction result:', result);
      
      if (result.success && result.classes.length > 0) {
        // Show preview card
        setSchedulePreview({
          classes: result.classes,
          fileName,
          confidence: result.confidence,
          warnings: result.warnings
        });
        
        // Update Kai message with details
        let successContent = `I found **${result.classes.length} classes** in your schedule!`;
        
        // Show detected columns
        if (result.detectedMapping) {
          const mappedCols = Object.entries(result.detectedMapping)
            .filter(([_, idx]) => idx !== undefined)
            .map(([field]) => field);
          if (mappedCols.length > 0) {
            successContent += `\n\n**Detected fields:** ${mappedCols.join(', ')}`;
          }
        }
        
        // Show any warnings
        if (result.warnings && result.warnings.length > 0) {
          successContent += `\n\n⚠️ **Warnings:**\n${result.warnings.map(w => `- ${w}`).join('\n')}`;
        }
        
        // Show row errors if any
        if (result.rowErrors && result.rowErrors.length > 0) {
          successContent += `\n\n**Skipped rows:**\n${result.rowErrors.slice(0, 5).map((e: any) => `- Row ${e.row}: ${e.error}`).join('\n')}`;
          if (result.rowErrors.length > 5) {
            successContent += `\n- ...and ${result.rowErrors.length - 5} more`;
          }
        }
        
        successContent += `\n\nPlease review the classes below and click "Create Classes" to add them to your dojo.`;
        
        const successMessage: Message = {
          id: `extracted-${Date.now()}`,
          role: 'assistant',
          content: successContent,
          timestamp: new Date()
        };
        setMessages(prev => [...prev.filter(m => m.id !== analyzingMessage.id), successMessage]);
      } else {
        // Show detailed error message
        let errorContent = `I couldn't extract classes from **${fileName}**.`;
        
        // Add specific error reason
        if (result.error) {
          errorContent += `\n\n**Reason:** ${result.error}`;
        }
        
        // Show detected headers to help user understand what was found
        if (result.rawHeaders && result.rawHeaders.length > 0) {
          errorContent += `\n\n**Columns found in your file:** ${result.rawHeaders.join(', ')}`;
        }
        
        // Show what columns are needed
        errorContent += `\n\n**Required columns:** Class Name, Day, Start Time, End Time`;
        errorContent += `\n**Optional columns:** Instructor, Room, Level, Capacity`;
        
        // Show row-level errors if available
        if (result.rowErrors && result.rowErrors.length > 0) {
          errorContent += `\n\n**Row errors:**\n${result.rowErrors.slice(0, 5).map((e: any) => `- Row ${e.row}: ${e.error}`).join('\n')}`;
        }
        
        // Don't always suggest template - only if truly needed
        if (result.errorType === 'mapping_required' || result.errorType === 'empty_file') {
          errorContent += `\n\nTip: Make sure your file has a header row with column names.`;
        }
        
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: errorContent,
          timestamp: new Date()
        };
        setMessages(prev => [...prev.filter(m => m.id !== analyzingMessage.id), errorMessage]);
      }
    } catch (error: any) {
      console.error('[KaiCommand] Schedule extraction failed:', error);
      
      // Extract meaningful error message
      const errorMsg = error?.message || error?.data?.message || 'Unknown error';
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Sorry, I encountered an error while analyzing the schedule:\n\n**Error:** ${errorMsg}\n\nPlease make sure the file is a valid Excel (.xlsx) or CSV file and try again.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev.filter(m => m.id !== analyzingMessage.id), errorMessage]);
    } finally {
      setIsExtractingSchedule(false);
    }
  };

  // Handle creating classes from extracted schedule
  const handleCreateClasses = async (selectedClasses: ExtractedClass[]) => {
    console.log('[KaiCommand] handleCreateClasses CALLED with', selectedClasses.length, 'classes');
    setIsCreatingClasses(true);
    
    try {
      console.log('[KaiCommand] Creating', selectedClasses.length, 'classes');
      console.log('[KaiCommand] Payload:', JSON.stringify(selectedClasses.slice(0, 2), null, 2));
      console.log('[KaiCommand] Calling createClassesMutation.mutateAsync...');
      
      const result = await createClassesMutation.mutateAsync({
        classes: selectedClasses
      });
      
      console.log('[KaiCommand] Create result:', result);
      
      if (result.success) {
        toast.success(`Successfully created ${result.createdCount} classes!`);
        setSchedulePreview(null);
        
        // Note: Classes page uses REST API (/api/classes), not tRPC
        // The page will refresh when user navigates to it
        console.log('[KaiCommand] Classes created successfully, IDs:', result.createdIds);
        
        // Build success message
        let successContent = `✅ **Created ${result.createdCount} classes** successfully!`;
        
        // Show any errors for classes that failed
        if (result.errors && result.errors.length > 0) {
          successContent += `\n\n⚠️ **${result.errors.length} classes failed:**\n${result.errors.slice(0, 5).map(e => `- ${e}`).join('\n')}`;
          if (result.errors.length > 5) {
            successContent += `\n- ...and ${result.errors.length - 5} more`;
          }
        }
        
        successContent += `\n\nYou can view and manage them in the [Classes](/classes) section.`;
        
        const successMessage: Message = {
          id: `created-${Date.now()}`,
          role: 'assistant',
          content: successContent,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, successMessage]);
      } else {
        toast.error('Failed to create classes: ' + (result.error || 'Unknown error'));
        
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `Failed to create classes: ${result.error || 'Unknown error'}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error: any) {
      console.error('[KaiCommand] Failed to create classes:', error);
      const errorMsg = error?.message || error?.data?.message || 'Unknown error';
      toast.error('Failed to create classes: ' + errorMsg);
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Failed to create classes: ${errorMsg}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsCreatingClasses(false);
    }
  };

  // Cancel schedule preview
  const handleCancelSchedulePreview = () => {
    setSchedulePreview(null);
    const cancelMessage: Message = {
      id: `cancelled-${Date.now()}`,
      role: 'assistant',
      content: `Schedule import cancelled. You can upload another file or add classes manually in the [Classes](/classes) section.`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, cancelMessage]);
  };

  // Mutation for sending directed messages
  const sendDirectedMessageMutation = trpc.messaging.sendDirectedMessage.useMutation();
  
  // Parse @mentions from message content
  const parseMentions = (content: string) => {
    const mentionRegex = /@([A-Za-z][A-Za-z0-9.\s]*?)(?=\s|$|,|\.|!|\?)/g;
    const mentions: { type: 'student' | 'staff' | 'kai'; name: string; id?: number }[] = [];
    let match;
    
    while ((match = mentionRegex.exec(content)) !== null) {
      const mentionName = match[1].trim();
      
      // Check if it's Kai
      if (mentionName.toLowerCase() === 'kai') {
        mentions.push({ type: 'kai', name: 'Kai' });
        continue;
      }
      
      // Check if it's a staff member
      const staffMember = staffData?.staff?.find(
        (s: any) => s.name.toLowerCase() === mentionName.toLowerCase() ||
                    s.fullName?.toLowerCase() === mentionName.toLowerCase()
      );
      
      if (staffMember) {
        mentions.push({ type: 'staff', name: staffMember.name, id: staffMember.id });
      }
    }
    
    return mentions;
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() && attachments.length === 0) return;
    
    // Check if any attachments are still uploading
    if (attachments.some(att => att.uploading)) {
      toast.error('Please wait for attachments to finish uploading');
      return;
    }
    
    // Stop current speech when user sends new message
    if (voiceEnabled && currentSpeechMessageId) {
      setCurrentSpeechMessageId(null);
    }

    // Build message content - attachments are stored separately, not as markdown links
    let messageContent = messageInput;
    // Don't append attachment URLs to message content - they'll be rendered as attachment cards
    
    // Parse mentions from the message
    const mentions = parseMentions(messageContent);
    const kaiMentioned = mentions.some(m => m.type === 'kai');
    const staffMentions = mentions.filter(m => m.type === 'staff' && m.id);
    
    // Route messages to staff inboxes
    for (const staffMention of staffMentions) {
      if (staffMention.id) {
        try {
          await sendDirectedMessageMutation.mutateAsync({
            recipientType: 'staff',
            recipientId: staffMention.id,
            content: messageContent,
            kaiMentioned,
            attachments: attachments.map(att => ({
              url: att.url || '',
              name: att.fileName,
              type: att.fileType,
              size: att.fileSize,
            })),
          });
          toast.success(`Message sent to ${staffMention.name}'s inbox`);
        } catch (error) {
          console.error('Failed to send directed message:', error);
        }
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
      attachments: [...attachments]
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = messageContent;
    setMessageInput('');
    setAttachments([]); // Clear attachments after sending
    setIsLoading(true);

    // Auto-create conversation if we're in a new conversation
    let conversationId = selectedConversationId && !selectedConversationId.startsWith('new-') 
      ? parseInt(selectedConversationId) 
      : null;
    
    if (!conversationId && selectedConversationId?.startsWith('new-')) {
      try {
        const result = await createConversationMutation.mutateAsync({
          title: currentInput.slice(0, 50) // Use first 50 chars as title
        });
        conversationId = result.id;
        // Update selected conversation to the real ID
        setSelectedConversationId(conversationId.toString());
        // Refresh conversations list
        utils.kai.getConversations.invalidate();
      } catch (error) {
        console.error('Failed to create conversation:', error);
      }
    }
    
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

    // Determine if this is a solo conversation (1 human + Kai)
    // Get conversation data to check participant count
    const currentConversation = conversationsQuery.data?.find(
      c => c.id.toString() === selectedConversationId
    );
    
    let isSoloConversation = true; // Default to solo for new conversations
    if (currentConversation && currentConversation.participantIds) {
      try {
        const participantIds = JSON.parse(currentConversation.participantIds);
        // Solo = 1 human participant (Kai is implicit)
        isSoloConversation = participantIds.length === 1;
      } catch (e) {
        console.error('Failed to parse participantIds:', e);
      }
    }
    
    // Get Kai response if:
    // 1. @Kai was mentioned explicitly, OR
    // 2. This is a solo conversation (auto-respond)
    const shouldKaiRespond = kaiMentioned || isSoloConversation;
    
    if (shouldKaiRespond) {
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
          timestamp: new Date(),
          ui_blocks: response.ui_blocks || []
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
    } else {
      // No Kai response in group conversation without @Kai mention
      setIsLoading(false);
      if (staffMentions.length === 0) {
        // No mentions at all in group conversation - show hint
        toast.info('In group conversations, use @Kai to get AI assistance or @Staff to message team members');
      }
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

  // Filter conversations based on active tab and smart collection
  const filteredConversations = conversations.filter(c => {
    // First filter by archive status
    let passesTabFilter = true;
    if (activeTab === 'active') {
      passesTabFilter = !c.archivedAt; // Show only non-archived
    } else if (activeTab === 'archived') {
      passesTabFilter = c.archivedAt; // Show only archived
    }
    
    if (!passesTabFilter) return false;
    
    // Then filter by smart collection
    if (activeCollection === 'urgent') {
      return c.status === 'urgent';
    } else if (activeCollection === 'insights') {
      return c.category === 'kai'; // Kai Insights = conversations with Kai category
    } else if (activeCollection === 'pending') {
      return c.status === 'attention'; // Pending tasks = attention status
    }
    
    return true; // No collection filter active
  });

  const todayConversations = filteredConversations.filter(c => c.date === 'today');
  const yesterdayConversations = filteredConversations.filter(c => c.date === 'yesterday');
  const olderConversations = filteredConversations.filter(c => c.date === 'older');

  // Cinematic mode taglines that rotate
  const cinematicTaglines = [
    "Growth begins with clarity.",
    "What would you like to optimize today?",
    "I'll show you the path forward.",
    "Your dojo's potential, unlocked.",
    "Let's build something great together."
  ];
  const [currentTaglineIndex, setCurrentTaglineIndex] = useState(0);
  const [taglineVisible, setTaglineVisible] = useState(true);
  
  // Rotate taglines every 8 seconds in cinematic mode
  useEffect(() => {
    if (!isCinematic) return;
    
    const interval = setInterval(() => {
      setTaglineVisible(false);
      setTimeout(() => {
        setCurrentTaglineIndex(prev => (prev + 1) % cinematicTaglines.length);
        setTaglineVisible(true);
      }, 500);
    }, 8000);
    
    return () => clearInterval(interval);
  }, [isCinematic, cinematicTaglines.length]);

  // Auto-hide UI system for Focus Mode
  const resetIdleTimer = useCallback(() => {
    // Show UI immediately on interaction
    setIsUIHidden(false);
    
    // Clear existing timer
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    
    // Only start idle timer in Focus Mode
    if (isFocusMode) {
      idleTimerRef.current = setTimeout(() => {
        // Don't hide if user is actively scrolling
        if (!isScrollingRef.current) {
          setIsUIHidden(true);
        }
      }, IDLE_TIMEOUT);
    }
  }, [isFocusMode]);

  // Handle scroll events for reading mode
  const handleScroll = useCallback(() => {
    if (!isFocusMode) return;
    
    isScrollingRef.current = true;
    setIsUIHidden(true); // Hide while scrolling
    
    // Clear existing scroll timer
    if (scrollTimerRef.current) {
      clearTimeout(scrollTimerRef.current);
    }
    
    // Show UI after scrolling stops
    scrollTimerRef.current = setTimeout(() => {
      isScrollingRef.current = false;
      setIsUIHidden(false);
      // Restart idle timer
      resetIdleTimer();
    }, SCROLL_DEBOUNCE);
  }, [isFocusMode, resetIdleTimer]);

  // Set up auto-hide listeners
  useEffect(() => {
    if (!isFocusMode) {
      setIsUIHidden(false);
      return;
    }

    const container = containerRef.current;
    const scrollContainer = scrollContainerRef.current;
    
    // Interaction events that show UI
    const showUI = () => resetIdleTimer();
    
    // Add listeners
    document.addEventListener('mousemove', showUI);
    document.addEventListener('keydown', showUI);
    document.addEventListener('click', showUI);
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
    }
    
    // Start initial idle timer
    resetIdleTimer();
    
    return () => {
      document.removeEventListener('mousemove', showUI);
      document.removeEventListener('keydown', showUI);
      document.removeEventListener('click', showUI);
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }
    };
  }, [isFocusMode, resetIdleTimer, handleScroll]);

  // CSS classes for auto-hide transitions
  const autoHideClass = isFocusMode && isUIHidden 
    ? 'opacity-0 translate-y-[-4px] pointer-events-none' 
    : 'opacity-100 translate-y-0';
  const autoHideTransition = 'transition-all duration-300 ease-out';

  return (
    <BottomNavLayout hiddenInFocusMode={isFocusMode} isUIHidden={isUIHidden}>
      {/* Cinematic Mode Vignette Overlay - Now rendered inside main content area, not here */}
      
      <div ref={containerRef} className={`kai-command-page flex ${isFocusMode ? 'h-screen' : 'h-[calc(100vh-80px-64px)]'} overflow-hidden ${isDark ? 'bg-[#0C0C0D]' : 'bg-[#F7F8FA]'} ${isCinematic ? 'brightness-[0.85]' : ''} ${isFocusMode ? 'focus-mode fixed inset-0 z-50' : ''} transition-all duration-500 ease-in-out`}>
        {/* Command Center - Left Panel - Floating Module Style */}
        {/* Sidebar: fixed width, z-index 20 to stay above main content but below modals */}
        <div 
          style={{ 
            width: isFocusMode ? '0px' : `${commandCenterWidth}px`,
            opacity: isFocusMode ? 0 : 1,
            transform: isFocusMode ? 'translateX(-20px)' : 'translateX(0)',
            pointerEvents: isFocusMode ? 'none' : 'auto',
            zIndex: 20
          }}
          className={`conversation-panel ${isDark ? 'bg-[#121214] border-[rgba(255,255,255,0.05)]' : 'bg-white border-[#E5E6E8]'} border rounded-[18px] flex flex-col flex-shrink-0 m-4 mr-0 ${isDark ? 'shadow-[0_4px_24px_rgba(0,0,0,0.55)]' : 'shadow-[0_4px_12px_rgba(0,0,0,0.04)]'} overflow-hidden transition-all duration-300 ease-in-out ${isFocusMode ? 'invisible' : 'visible'} relative`}
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
              {smartCollections.map((collection) => {
                const isActive = activeCollection === collection.id;
                return (
                <button
                  key={collection.id}
                  onClick={() => {
                    // Toggle collection filter: if already active, clear it; otherwise set it
                    setActiveCollection(isActive ? null : collection.id);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? isDark
                        ? 'bg-[rgba(255,255,255,0.12)] border border-[rgba(255,255,255,0.15)]'
                        : 'bg-slate-100 border border-slate-200'
                      : isDark
                        ? 'hover:bg-[rgba(255,255,255,0.08)]'
                        : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {collection.id === 'insights' ? (
                      <img src="/kai-avatar.png" alt="Kai" className="w-4 h-4 rounded-full" />
                    ) : (
                      <collection.icon className={`w-4 h-4 ${collection.color}`} />
                    )}
                    <span className={`text-sm ${isDark ? 'text-white' : 'text-slate-700'}`}>{collection.label}</span>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isDark ? 'text-[rgba(255,255,255,0.65)] bg-[#18181A]' : 'text-slate-500 bg-slate-200'}`}>
                    {collection.count}
                  </span>
                </button>
                );
              })}
            </div>
          </div>

          {/* Recent Conversations with visible scrollbar */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-[rgba(255,255,255,0.55)]' : 'text-slate-500'}`}>Recent Conversations</h3>
                <span className={`text-xs ${isDark ? 'text-[rgba(255,255,255,0.45)]' : 'text-slate-400'}`}>{filteredConversations.length}</span>
              </div>
              {activeCollection && (
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${isDark ? 'text-[rgba(255,255,255,0.45)]' : 'text-slate-400'}`}>
                    Filtered by: {smartCollections.find(c => c.id === activeCollection)?.label}
                  </span>
                  <button
                    onClick={() => setActiveCollection(null)}
                    className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                      isDark
                        ? 'text-[rgba(255,255,255,0.65)] hover:bg-[rgba(255,255,255,0.08)]'
                        : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    Clear
                  </button>
                </div>
              )}
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
                      onArchive={handleArchiveConversation}
                      onUnarchive={handleUnarchiveConversation}
                      onRename={handleRenameConversation}
                      onUpdatePriority={handleUpdatePriority}
                      onUpdateCategory={handleUpdateCategory}
                      isDark={isDark}
                    />
                  ))}
                </div>
              )}

              {/* Yesterday */}
              {yesterdayConversations.length > 0 && (
                <div className="mb-4">
                  <h4 className={`text-xs font-medium uppercase mb-2 ${isDark ? 'text-[rgba(255,255,255,0.45)]' : 'text-slate-400'}`}>Yesterday</h4>
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
                      onArchive={handleArchiveConversation}
                      onUnarchive={handleUnarchiveConversation}
                      onRename={handleRenameConversation}
                      onUpdatePriority={handleUpdatePriority}
                      onUpdateCategory={handleUpdateCategory}
                      isDark={isDark}
                    />
                  ))}
                </div>
              )}

              {/* Older */}
              {olderConversations.length > 0 && (
                <div className="mb-4">
                  <h4 className={`text-xs font-medium uppercase mb-2 ${isDark ? 'text-[rgba(255,255,255,0.45)]' : 'text-slate-400'}`}>Older</h4>
                  {olderConversations.map((conv) => (
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
                      onArchive={handleArchiveConversation}
                      onUnarchive={handleUnarchiveConversation}
                      onRename={handleRenameConversation}
                      onUpdatePriority={handleUpdatePriority}
                      onUpdateCategory={handleUpdateCategory}
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
        {/* Main content: flex-1 with min-w-0 to prevent overflow, z-index lower than sidebar */}
        {/* MAIN CONTENT PANEL - True 3-row flex layout */}
        {/* Row 1: Top banner (auto height) */}
        {/* Row 2: Scrollable content (flex-1) */}
        {/* Row 3: Composer dock (flex-shrink-0, reserved height) */}
        <div 
          className={`flex-1 flex flex-col relative min-w-0 overflow-hidden ${isDark ? 'bg-[#0C0C0D]' : 'bg-white'}`}
          style={{ zIndex: 10 }}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Drag-and-drop overlay */}
          {isDragging && (
            <div 
              className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
              style={{ background: isDark ? 'rgba(12,12,13,0.95)' : 'rgba(255,255,255,0.95)' }}
            >
              <div className={`flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-dashed ${
                isDark ? 'border-red-500/50 bg-red-500/10' : 'border-red-400/50 bg-red-50'
              }`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  isDark ? 'bg-red-500/20' : 'bg-red-100'
                }`}>
                  <Upload className={`w-8 h-8 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
                </div>
                <div className="text-center">
                  <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Drop files here
                  </p>
                  <p className={`text-sm mt-1 ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
                    Spreadsheets, images, PDFs, and documents
                  </p>
                </div>
              </div>
            </div>
          )}
          {/* ENVIRONMENT LAYER - All background elements with z-index: 0 */}
          {/* Constrained to main content column only, not full page */}
          {isCinematic && (
            <div 
              className="environment-layer absolute inset-0 pointer-events-none overflow-hidden"
              style={{ zIndex: 0 }}
            >
              {/* Vignette Overlay - now inside main content area */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)',
                  animation: 'cinematicFadeIn 0.8s ease-out'
                }}
              />
              {/* Background Image Layer with Parallax */}
              <div 
                className="absolute inset-0 will-change-transform"
                style={{
                  backgroundImage: `url(${currentEnvironment.backgroundImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  filter: 'blur(2px)',
                  transform: `scale(1.1) translateY(${-parallaxOffset}px)`,
                  transition: 'opacity 0.4s ease-out',
                  opacity: isTransitioning ? 0 : 1,
                  // Extend background to allow parallax movement
                  top: '-5%',
                  left: '-5%',
                  right: '-5%',
                  bottom: '-5%',
                  width: '110%',
                  height: '110%'
                }}
              />
              {/* Dark Overlay for readability */}
              <div 
                className="absolute inset-0"
                style={{
                  background: currentEnvironment.overlayColor,
                  transition: 'background 0.4s ease-out'
                }}
              />
              {/* Soft Gradient Overlay for UI Contrast (20-30% darkening) */}
              <div 
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.20) 70%, rgba(0,0,0,0.35) 100%)'
                }}
              />
              {/* Vignette Effect */}
              <div 
                className="absolute inset-0"
                style={{
                  background: 'radial-gradient(ellipse at 50% 50%, transparent 0%, rgba(0,0,0,0.4) 100%)'
                }}
              />
              {/* Spotlight behind Kai */}
              <div 
                className="absolute inset-0"
                style={{
                  background: 'radial-gradient(ellipse at 50% 35%, rgba(255,76,76,0.15) 0%, transparent 40%)'
                }}
              />
            </div>
          )}
          {/* CONTENT LAYER - Top Banner - Hidden in Focus Mode for full-screen experience */}
          {!isFocusMode && (
          <div 
            className={`relative px-6 py-3 border-b flex items-center justify-between ${
              isCinematic 
                ? 'border-white/15' 
                : isDark 
                  ? 'bg-[#0C0C0D] border-[rgba(255,255,255,0.05)]' 
                  : 'bg-white border-slate-200'
            }`}
            style={isCinematic ? {
              background: 'rgba(0, 0, 0, 0.40)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              animation: 'cinematicBannerSlideDown 0.5s ease-out forwards'
            } : {}}
          >
            <p 
              className={`text-xs uppercase tracking-wide font-medium ${isCinematic ? 'text-white/90' : isDark ? 'text-[rgba(255,255,255,0.55)]' : 'text-slate-500'}`}
              style={isCinematic ? { textShadow: '0 2px 4px rgba(0,0,0,0.75)' } : {}}
            >
              Kai Command uses a structured, professional conversation format — designed for clarity, accuracy, and operational decision-making.
            </p>
            <div className="flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`h-8 w-8 ${isCinematic ? 'hover:bg-[rgba(255,255,255,0.15)]' : isDark ? 'hover:bg-[rgba(255,255,255,0.08)]' : ''}`} 
                    title="Summarize & Extract"
                    disabled={isSummarizing || isExtracting}
                  >
                    {(isSummarizing || isExtracting) ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#E53935]" />
                    ) : (
                      <FileText className={`w-4 h-4 ${isCinematic ? 'text-white' : isDark ? 'text-[rgba(255,255,255,0.55)]' : 'text-slate-500'}`} />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={handleSummarize}
                    disabled={isSummarizing || !selectedConversationId}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {isSummarizing ? 'Summarizing...' : 'Summarize Conversation'}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleExtract}
                    disabled={isExtracting || !selectedConversationId}
                  >
                    <List className="w-4 h-4 mr-2" />
                    {isExtracting ? 'Extracting...' : 'Extract Data'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`h-8 w-8 ${isCinematic ? 'hover:bg-[rgba(255,255,255,0.15)]' : isDark ? 'hover:bg-[rgba(255,255,255,0.08)]' : ''}`} 
                    title="Export Conversations"
                  >
                    <Download className={`w-4 h-4 ${isCinematic ? 'text-white' : isDark ? 'text-[rgba(255,255,255,0.55)]' : 'text-slate-500'}`} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={() => handleExport('json')}
                    disabled={!selectedConversationId}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Export as JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleExport('markdown')}
                    disabled={!selectedConversationId}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Export as Markdown
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleExport('csv')}
                    disabled={!selectedConversationId}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleExportAll('json')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export All (JSON)
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleExportAll('markdown')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export All (Markdown)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="icon" className={`h-8 w-8 ${isCinematic ? 'hover:bg-[rgba(255,255,255,0.15)]' : isDark ? 'hover:bg-[rgba(255,255,255,0.08)]' : ''}`} title="Invite Team Members">
                <Users className={`w-4 h-4 ${isCinematic ? 'text-white' : isDark ? 'text-[rgba(255,255,255,0.55)]' : 'text-slate-500'}`} />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className={`h-8 w-8 ${isCinematic ? 'hover:bg-[rgba(255,255,255,0.15)]' : isDark ? 'hover:bg-[rgba(255,255,255,0.08)]' : ''} ${voiceEnabled ? (isCinematic ? 'bg-[rgba(255,255,255,0.2)]' : isDark ? 'bg-[rgba(255,255,255,0.15)]' : 'bg-slate-200') : ''}`}
                title={voiceEnabled ? "Disable Voice Replies" : "Enable Voice Replies"}
                onClick={() => {
                  setVoiceEnabled(!voiceEnabled);
                  if (voiceEnabled) {
                    // Stop current speech when disabling
                    setCurrentSpeechMessageId(null);
                  }
                }}
              >
                <Volume2 className={`w-4 h-4 ${voiceEnabled ? (isCinematic ? 'text-white' : isDark ? 'text-white' : 'text-slate-900') : (isCinematic ? 'text-white' : isDark ? 'text-[rgba(255,255,255,0.55)]' : 'text-slate-500')}`} />
              </Button>
              <Button variant="ghost" size="icon" className={`h-8 w-8 ${isCinematic ? 'hover:bg-[rgba(255,255,255,0.15)]' : isDark ? 'hover:bg-[rgba(255,255,255,0.08)]' : ''}`} title="Full Screen">
                <Maximize2 className={`w-4 h-4 ${isCinematic ? 'text-white' : isDark ? 'text-[rgba(255,255,255,0.55)]' : 'text-slate-500'}`} />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className={`h-8 w-8 ${isFocusMode ? 'bg-[#E53935]/10' : ''} ${isCinematic ? 'hover:bg-[rgba(255,255,255,0.15)]' : ''}`}
                title={isFocusMode ? 'Turn off Focus Mode' : 'Turn on Focus Mode'}
                onClick={toggleFocusMode}
              >
                {isFocusMode ? (
                  <EyeOff className="w-4 h-4 text-[#E53935]" />
                ) : (
                  <Eye className={`w-4 h-4 ${isCinematic ? 'text-white' : 'text-slate-500'}`} />
                )}
              </Button>
            </div>
          </div>
          )}

          {/* CONTENT LAYER - Messages Area (Row 2 of 3-row layout) */}
          {/* This is the scrollable middle zone - flex-1 takes remaining space */}
          {/* Composer is now a separate flex item below, so we don't need excessive bottom padding */}
          {/* Small pb-4 just for visual breathing room above the composer */}
          <div 
            ref={scrollContainerRef}
            className={`content-layer flex-1 relative ${isFocusMode && messages.length === 0 ? 'overflow-hidden flex items-center justify-center' : 'overflow-y-auto scrollbar-visible'} ${isFocusMode ? 'pt-16 pb-4 px-6' : isCinematic ? 'pt-6 pb-4 px-6' : 'p-6 pt-6 pb-4'}`}
            style={{ zIndex: 10 }}
          >
            {/* Shared content column wrapper - max-w-4xl to match composer width */}
            <div className={`${isFocusMode ? 'max-w-4xl mx-auto px-4' : isFocusMode && messages.length === 0 ? 'w-full max-w-[1320px]' : 'max-w-[1320px] mx-auto px-4'}`}>
              {messages.length === 0 ? (
                /* Empty State - Kai Greeting - Added top padding to ensure content doesn't touch the top */
                <div className={`flex flex-col items-center ${isFocusMode ? 'justify-center' : 'justify-center'} ${isCinematic ? 'pt-4' : 'py-8'} transition-all duration-500`}>
                  {/* Frosted Glass Panel for Cinematic/Focus Mode - 70% opacity for maximum readability */}
                  <div className={`flex flex-col items-center ${(isCinematic || isFocusMode) ? 'relative rounded-[32px] px-16 py-12 shadow-[0_8px_32px_rgba(0,0,0,0.8)] border border-white/30' : ''}`}
                    style={(isCinematic || isFocusMode) ? {
                      background: 'rgba(0, 0, 0, 0.70)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      animation: 'cinematicGlassFadeIn 0.6s ease-out forwards'
                    } : {}}
                  >
                  {/* Kai Logo with spotlight and animation in cinematic mode */}
                  <div className={`relative mb-6 ${isCinematic ? 'mb-8' : 'mb-4'}`}>
                    {/* Spotlight glow behind Kai in cinematic mode */}
                    {isCinematic && (
                      <div 
                        className="absolute inset-0 -inset-x-16 -inset-y-16 rounded-full opacity-60"
                        style={{
                          background: 'radial-gradient(circle, rgba(255,76,76,0.25) 0%, rgba(255,76,76,0.1) 40%, transparent 70%)',
                          animation: 'cinematicSpotlight 3s ease-in-out infinite'
                        }}
                      />
                    )}
                    <div className={`relative ${isDark ? 'drop-shadow-[0_0_20px_rgba(255,76,76,0.18)]' : ''} ${isCinematic ? 'drop-shadow-[0_0_40px_rgba(255,76,76,0.35)]' : ''}`}>
                      <KaiLogo className={`${isCinematic ? 'w-[140px] h-[140px]' : 'w-[100px] h-[100px]'} transition-all duration-500 ${isCinematic ? 'animate-[cinematicPulse_4s_ease-in-out_infinite]' : ''}`} />
                    </div>
                  </div>
                  <h2 
                    className={`${(isCinematic || isFocusMode) ? 'text-4xl' : 'text-3xl'} font-semibold mb-2 transition-all duration-500 ${isCinematic ? 'animate-[cinematicBreathing_4s_ease-in-out_infinite]' : ''}`}
                    style={(isCinematic || isFocusMode) ? { 
                      animation: isCinematic ? 'cinematicTextSlideUp 0.5s ease-out 0.2s both, cinematicBreathing 4s ease-in-out 0.7s infinite' : 'none',
                      textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                      color: '#FFFFFF',
                      opacity: 1
                    } : isDark ? { color: 'white' } : { color: '#0f172a' }}
                  >
                    Hi, I'm Kai.
                  </h2>
                  {/* Rotating taglines in cinematic mode, static text otherwise */}
                  {(isCinematic || isFocusMode) ? (
                    <p 
                      className={`text-center max-w-md mb-10 text-lg transition-opacity duration-500 ${taglineVisible ? '' : 'invisible'}`}
                      style={{ 
                        textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                        animation: isCinematic ? 'cinematicTextSlideUp 0.5s ease-out 0.35s both' : 'none',
                        color: '#FFFFFF',
                        opacity: 1
                      }}
                    >
                      {isCinematic ? cinematicTaglines[currentTaglineIndex] : 'Tell me about your dojo and what you want to improve—growth, retention, or operations—and I\'ll show you the numbers.'}
                    </p>
                  ) : (
                    <p className={`text-center max-w-md mb-8 ${isDark ? 'text-[rgba(255,255,255,0.65)]' : 'text-slate-600'}`}>
                      Tell me about your dojo and what you want to improve—growth, retention, or operations—and I'll show you the numbers.
                    </p>
                  )}
                  
                  {/* Quick Commands Carousel */}
                  <div className={`relative w-full ${isCinematic ? 'max-w-3xl mt-4' : 'max-w-4xl'} transition-all duration-500`}
                    style={isCinematic ? { animation: 'cinematicTextSlideUp 0.6s ease-out 0.5s both' } : {}}
                  >
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
                      {sortedQuickCommands.map((command, index) => (
                        <button
                          key={command.id}
                          onClick={() => handlePromptClick(command.text)}
                          className={`relative flex-shrink-0 ${(isCinematic || isFocusMode) ? 'w-[160px]' : 'w-[200px]'} border ${(isCinematic || isFocusMode) ? 'rounded-[14px] p-4' : 'rounded-[18px] p-5'} text-left transition-all duration-300 group snap-start ${
                            (isCinematic || isFocusMode)
                              ? `border-white/30 hover:border-[rgba(255,76,76,0.5)] shadow-[0_8px_32px_rgba(0,0,0,0.6)] hover:shadow-[0_12px_40px_rgba(255,76,76,0.3)] ${favorites.has(command.id) ? 'border-[#FF4C4C]/50' : ''}`
                              : isDark 
                                ? `bg-[#18181A] border-[rgba(255,255,255,0.05)] hover:bg-[#1F1F22] hover:border-[rgba(255,255,255,0.10)] shadow-[0_4px_14px_rgba(0,0,0,0.3)] ${favorites.has(command.id) ? 'border-[#FF4C4C]/30' : ''}`
                                : `bg-white shadow-[0_4px_14px_rgba(0,0,0,0.05)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)] hover:border-[#E53935]/20 ${favorites.has(command.id) ? 'border-[#E53935]/30 bg-red-50/30' : 'border-slate-100'}`
                          }`}
                          style={(isCinematic || isFocusMode) ? { 
                            animation: isCinematic ? `cinematicCardSlide 0.6s ease-out ${0.4 + index * 0.08}s both` : 'none',
                            background: 'rgba(0, 0, 0, 0.70)'
                            /* NO blur on cards - text must be crisp */
                          } : {}}
                        >
                          {/* Favorite Star */}
                          <div
                            onClick={(e) => toggleFavorite(command.id, e)}
                            className={`absolute top-3 right-3 p-1 rounded-full transition-colors cursor-pointer ${(isCinematic || isFocusMode) ? 'hover:bg-white/20' : isDark ? 'hover:bg-[rgba(255,255,255,0.08)]' : 'hover:bg-slate-100'}`}
                          >
                            <Star
                              className={`w-4 h-4 transition-colors ${
                                favorites.has(command.id)
                                  ? 'fill-[#FF4C4C] text-[#FF4C4C]'
                                  : (isCinematic || isFocusMode) ? 'text-white/50 hover:text-white/80' : isDark ? 'text-[rgba(255,255,255,0.35)] hover:text-[rgba(255,255,255,0.55)]' : 'text-slate-300 hover:text-slate-400'
                              }`}
                            />
                          </div>
                          
                          <div 
                            className="text-xs font-semibold text-[#FF4C4C] uppercase tracking-wide mb-2 pr-6"
                            style={(isCinematic || isFocusMode) ? { textShadow: '0 1px 3px rgba(0,0,0,0.9)' } : {}}
                          >
                            {command.header}
                          </div>
                          <p 
                            className={`text-sm leading-relaxed`}
                            style={(isCinematic || isFocusMode) ? { 
                              textShadow: '0 1px 3px rgba(0,0,0,0.9)', 
                              color: '#FFFFFF',
                              opacity: 1
                            } : isDark ? { color: 'rgba(255,255,255,0.75)' } : { color: '#475569' }}
                          >
                            {command.text}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                  </div>{/* End Frosted Glass Panel */}
                </div>
              ) : (
                /* Messages - z-index: 30 to ensure above environment */
                <div className="space-y-6 relative" style={{ zIndex: 30 }}>
                  {messages.map((message) => (
                    <div key={message.id} className="flex gap-3 relative" style={{ zIndex: 30 }}>
                      {message.role === 'user' ? (
                        <>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0 ${(isCinematic || isFocusMode) ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30' : isDark ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-blue-500 to-blue-600'}`}>
                            {getUserInitials()}
                          </div>
                          <div className="flex-1">
                            <div 
                              className={`font-medium mb-1`}
                              style={(isCinematic || isFocusMode) ? { color: '#FFFFFF', textShadow: '0 1px 3px rgba(0,0,0,0.9)' } : isDark ? { color: 'white' } : { color: '#0f172a' }}
                            >{user?.name || 'You'}</div>
                            {message.content && (
                              <p 
                                className="relative"
                                style={(isCinematic || isFocusMode) ? { 
                                  color: 'rgba(255,255,255,0.92)', 
                                  textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                                  zIndex: 30
                                } : isDark ? { color: 'rgba(255,255,255,0.75)' } : { color: '#334155' }}
                              >{renderMessageWithMentions(message.content)}</p>
                            )}
                            {/* Render attachment cards for user messages */}
                            {message.attachments && message.attachments.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {message.attachments.map((att) => {
                                  const isScheduleFile = att.fileName?.endsWith('.xlsx') || att.fileName?.endsWith('.xls') || att.fileName?.endsWith('.csv');
                                  return (
                                    <div
                                      key={att.id}
                                      className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isCinematic || isFocusMode ? 'bg-white/10 border border-white/20' : isDark ? 'bg-white/5 border border-white/10' : 'bg-slate-100 border border-slate-200'}`}
                                    >
                                      <div className={`w-8 h-8 rounded flex items-center justify-center ${isCinematic || isFocusMode ? 'bg-white/10' : isDark ? 'bg-white/5' : 'bg-white'}`}>
                                        <File className={`w-4 h-4 ${isCinematic || isFocusMode ? 'text-white/70' : isDark ? 'text-white/50' : 'text-slate-400'}`} />
                                      </div>
                                      <div className="min-w-0">
                                        <p className={`text-xs font-medium truncate max-w-[150px] ${isCinematic || isFocusMode ? 'text-white' : isDark ? 'text-white' : 'text-slate-700'}`}>
                                          {att.fileName}
                                        </p>
                                        <p className={`text-[10px] ${isCinematic || isFocusMode ? 'text-white/50' : isDark ? 'text-white/40' : 'text-slate-400'}`}>
                                          {formatFileSize(att.fileSize)}
                                        </p>
                                      </div>
                                      {isScheduleFile && att.url && (
                                        <button
                                          onClick={() => handleScheduleExtraction(att.url!, att.fileType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', att.fileName, att.storageKey)}
                                          disabled={isExtractingSchedule}
                                          className={`ml-2 px-2 py-1 text-xs rounded font-medium transition-colors ${isExtractingSchedule ? 'opacity-50 cursor-not-allowed' : ''} ${isCinematic || isFocusMode ? 'bg-[#FF4C4C] hover:bg-[#FF5E5E] text-white' : isDark ? 'bg-[#FF4C4C] hover:bg-[#FF5E5E] text-white' : 'bg-[#FF4C4C] hover:bg-[#FF5E5E] text-white'}`}
                                        >
                                          {isExtractingSchedule ? 'Analyzing...' : 'Import Schedule'}
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-8 h-8 rounded-full shrink-0 shadow-lg shadow-red-500/30 overflow-hidden">
                            <img src="/kai-avatar.png" alt="Kai" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1">
                            <div 
                              className={`font-medium mb-1`}
                              style={(isCinematic || isFocusMode) ? { color: '#FFFFFF', textShadow: '0 1px 3px rgba(0,0,0,0.9)' } : isDark ? { color: 'white' } : { color: '#0f172a' }}
                            >Kai</div>
                            <div 
                              className={`whitespace-pre-wrap prose prose-sm max-w-none relative ${(isCinematic || isFocusMode) ? '' : isDark ? 'prose-invert' : ''}`}
                              style={(isCinematic || isFocusMode) ? { 
                                color: 'rgba(255,255,255,0.92)', 
                                textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                                zIndex: 30
                              } : isDark ? { color: 'rgba(255,255,255,0.75)' } : { color: '#334155' }}
                            >
                              {voiceEnabled ? (
                                <VoicePacedMessage
                                  content={message.content}
                                  voiceEnabled={voiceEnabled}
                                  theme={isCinematic ? 'cinematic' : isDark ? 'dark' : 'light'}
                                  onSpeechEnd={() => {
                                    setCurrentSpeechMessageId(null);
                                  }}
                                  onSpeechInterrupt={() => {
                                    setCurrentSpeechMessageId(null);
                                  }}
                                />
                              ) : (
                                renderMessageWithMentions(message.content, true)
                              )}
                            </div>
                            {/* Render UI blocks (student cards, lists, etc.) */}
                            {message.ui_blocks && message.ui_blocks.length > 0 && (
                              <UIBlockRenderer 
                                blocks={message.ui_blocks} 
                                onBlockClick={(block) => {
                                  // Open Results Panel with student/lead data
                                  if (block.type === 'student_card' && block.studentId) {
                                    setResultsPanelData({
                                      type: 'student_card',
                                      studentId: block.studentId,
                                    });
                                    setIsResultsPanelOpen(true);
                                  } else if (block.type === 'student_list' && block.studentIds) {
                                    setResultsPanelData({
                                      type: 'student_list',
                                      studentIds: block.studentIds,
                                    });
                                    setIsResultsPanelOpen(true);
                                  } else if (block.type === 'lead_card' && block.leadId) {
                                    setResultsPanelData({
                                      type: 'lead_list',
                                      leadIds: [block.leadId],
                                    });
                                    setIsResultsPanelOpen(true);
                                  } else if (block.type === 'lead_list' && block.leadIds) {
                                    setResultsPanelData({
                                      type: 'lead_list',
                                      leadIds: block.leadIds,
                                    });
                                    setIsResultsPanelOpen(true);
                                  }
                                }}
                                theme={isCinematic ? 'cinematic' : isDark ? 'dark' : 'light'}
                              />
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3 relative" style={{ zIndex: 30 }}>
                      <div className="w-8 h-8 rounded-full shrink-0 shadow-lg shadow-red-500/30 overflow-hidden">
                        <img src="/kai-avatar.png" alt="Kai" className="w-full h-full object-cover animate-pulse" />
                      </div>
                      <div className="flex-1">
                        <div 
                          className={`font-medium mb-1`}
                          style={(isCinematic || isFocusMode) ? { color: '#FFFFFF', textShadow: '0 1px 3px rgba(0,0,0,0.9)' } : isDark ? { color: 'white' } : { color: '#0f172a' }}
                        >Kai</div>
                        <div className="flex gap-1">
                          <div className={`w-2 h-2 rounded-full animate-bounce ${(isCinematic || isFocusMode) ? 'bg-white/50' : isDark ? 'bg-[rgba(255,255,255,0.35)]' : 'bg-slate-300'}`} style={{ animationDelay: '0ms' }} />
                          <div className={`w-2 h-2 rounded-full animate-bounce ${(isCinematic || isFocusMode) ? 'bg-white/50' : isDark ? 'bg-[rgba(255,255,255,0.35)]' : 'bg-slate-300'}`} style={{ animationDelay: '150ms' }} />
                          <div className={`w-2 h-2 rounded-full animate-bounce ${(isCinematic || isFocusMode) ? 'bg-white/50' : isDark ? 'bg-[rgba(255,255,255,0.35)]' : 'bg-slate-300'}`} style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Schedule Preview Card */}
                  {schedulePreview && (
                    <div className="mt-4" style={{ zIndex: 30 }}>
                      <SchedulePreviewCard
                        classes={schedulePreview.classes}
                        fileName={schedulePreview.fileName}
                        confidence={schedulePreview.confidence}
                        warnings={schedulePreview.warnings}
                        onConfirm={handleCreateClasses}
                        onCancel={handleCancelSchedulePreview}
                        isProcessing={isCreatingClasses}
                        isDark={isDark}
                        isCinematic={isCinematic}
                        isFocusMode={isFocusMode}
                      />
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* COMPOSER DOCK (Row 3 of 3-row layout) */}
          {/* flex-shrink-0 ensures this element reserves its height and doesn't get compressed */}
          {/* This is NOT an overlay - it's a proper flex child that pushes content above it */}
          <div 
            className={`transition-all duration-500 flex-shrink-0 relative z-20 ${isFocusMode ? 'px-6 py-4' : isCinematic ? 'px-6 py-4' : 'p-4 border-t'} ${expandedInput && !isFocusMode && !isCinematic ? 'pb-8' : ''} ${(isCinematic || isFocusMode) ? 'border-transparent' : isDark ? 'border-[rgba(255,255,255,0.05)] bg-[#18181A]/80' : 'border-slate-100 bg-white/80'} ${!isFocusMode && !isCinematic ? 'backdrop-blur-sm' : ''}`}
            style={(isCinematic && !isFocusMode) ? { 
              animation: 'cinematicInputSlideUp 0.6s ease-out 0.7s both'
            } : {}}>
            {/* No extra background blur layer - removed to eliminate double box */}
            {/* Shared content width wrapper - max-w-4xl to match messages area */}
            <div className={`max-w-4xl mx-auto relative transition-all duration-500`}>
              {/* Expand/Collapse Button - Hidden in Focus Mode for cleaner look */}
              {!isFocusMode && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setExpandedInput(!expandedInput)}
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 h-6 w-6 rounded-full z-10 shadow-sm ${isCinematic ? 'bg-black/80 hover:bg-black/90 text-white' : isDark ? 'bg-[#202022] hover:bg-[#2A2A2D] text-white' : 'bg-slate-100 hover:bg-slate-200'}`}
                >
                  {expandedInput ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </Button>
              )}
              
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,text/plain,.xlsx,.xls,.csv"
                multiple
                className="hidden"
              />

              {/* Attachment Preview Area */}
              {attachments.length > 0 && (
                <div className={`flex flex-wrap gap-2 mb-3 p-3 rounded-xl ${isCinematic || isFocusMode ? 'bg-black/60 border border-white/20' : isDark ? 'bg-[#1A1A1C] border border-white/5' : 'bg-slate-50 border border-slate-200'}`}>
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className={`relative group flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${attachment.error ? 'bg-red-500/20 border border-red-500/50' : isCinematic || isFocusMode ? 'bg-white/10 border border-white/20' : isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-slate-200 shadow-sm'}`}
                    >
                      {/* File icon or thumbnail */}
                      {isImageFile(attachment.fileType) && attachment.url ? (
                        <img
                          src={attachment.url}
                          alt={attachment.fileName}
                          className="w-10 h-10 rounded object-cover"
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded flex items-center justify-center ${isCinematic || isFocusMode ? 'bg-white/10' : isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                          {isImageFile(attachment.fileType) ? (
                            <Image className={`w-5 h-5 ${isCinematic || isFocusMode ? 'text-white/70' : isDark ? 'text-white/50' : 'text-slate-400'}`} />
                          ) : (
                            <File className={`w-5 h-5 ${isCinematic || isFocusMode ? 'text-white/70' : isDark ? 'text-white/50' : 'text-slate-400'}`} />
                          )}
                        </div>
                      )}
                      
                      {/* File info */}
                      <div className="flex-1 min-w-0 max-w-[120px]">
                        <p className={`text-xs font-medium truncate ${isCinematic || isFocusMode ? 'text-white' : isDark ? 'text-white' : 'text-slate-700'}`}>
                          {attachment.fileName}
                        </p>
                        <p className={`text-[10px] ${isCinematic || isFocusMode ? 'text-white/50' : isDark ? 'text-white/40' : 'text-slate-400'}`}>
                          {formatFileSize(attachment.fileSize)}
                        </p>
                      </div>
                      
                      {/* Upload status or remove button */}
                      {attachment.uploading ? (
                        <Loader2 className={`w-4 h-4 animate-spin ${isCinematic || isFocusMode ? 'text-white/70' : isDark ? 'text-white/50' : 'text-slate-400'}`} />
                      ) : attachment.error ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => retryUpload(attachment.id)}
                            className="flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
                            title={attachment.error}
                          >
                            <RefreshCw className="w-3 h-3" />
                            Retry
                          </button>
                          <button
                            onClick={() => removeAttachment(attachment.id)}
                            className="p-0.5 rounded hover:bg-red-500/20 text-red-400"
                            title="Remove"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => removeAttachment(attachment.id)}
                          className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${isCinematic || isFocusMode ? 'bg-white/20 hover:bg-white/30 text-white' : isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-600'}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Input container - Single clean glass pill for Cinematic/Focus Mode */}
              <div className={`flex items-center gap-2 transition-all duration-300 ${
                isFocusMode 
                  ? 'rounded-full p-3 relative z-10 border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.6)] focus-within:border-[rgba(255,76,76,0.6)]'
                  : isCinematic
                    ? 'rounded-full p-3 relative z-10 border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.8)] focus-within:border-[rgba(255,76,76,0.6)]'
                    : isDark 
                      ? 'rounded-[22px] p-2 bg-[#18181A] border border-[rgba(255,255,255,0.10)] shadow-[0_2px_12px_rgba(0,0,0,0.3)] focus-within:border-[rgba(255,255,255,0.15)]' 
                      : 'rounded-[22px] p-2 bg-white border border-slate-200 shadow-[0_2px_12px_rgba(0,0,0,0.06)] focus-within:border-slate-300 focus-within:shadow-[0_4px_16px_rgba(0,0,0,0.08)]'
              }`}
              style={(isCinematic || isFocusMode) ? { 
                animation: isCinematic && !isFocusMode ? 'cinematicInputGlow 3s ease-in-out infinite' : 'none',
                background: 'rgba(0, 0, 0, 0.85)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)'
              } : {}}
              >
                {/* Attachment Button */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`h-9 w-9 rounded-full ${(isCinematic || isFocusMode) ? '[&_svg]:fill-white text-white hover:text-white hover:bg-white/20' : isDark ? 'text-[rgba(255,255,255,0.45)] hover:text-white hover:bg-[rgba(255,255,255,0.08)]' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`} 
                  title="Attach file (images, PDFs, documents)"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="w-5 h-5" style={(isCinematic || isFocusMode) ? { color: '#FFFFFF' } : {}} />
                </Button>
                {/* @ Mention Button */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`h-9 w-9 rounded-full ${(isCinematic || isFocusMode) ? '[&_svg]:fill-white text-white hover:text-white hover:bg-white/20' : isDark ? 'text-[rgba(255,255,255,0.45)] hover:text-white hover:bg-[rgba(255,255,255,0.08)]' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                  title="Mention someone"
                  onClick={() => {
                    // Insert @ at cursor position and focus the input
                    setMessageInput(prev => prev + '@');
                    messageInputRef.current?.focus();
                  }}
                >
                  <AtSign className="w-5 h-5" style={(isCinematic || isFocusMode) ? { color: '#FFFFFF' } : {}} />
                </Button>
                <MentionInput
                  value={messageInput}
                  onChange={setMessageInput}
                  onSubmit={(value, mentions) => {
                    console.log('Mentions:', mentions);
                    handleSendMessage();
                  }}
                  placeholder="Message Kai… Type @ to mention"
                  theme={isCinematic ? 'cinematic' : isDark ? 'dark' : 'light'}
                  variant="apple"
                />
                <Button variant="ghost" size="icon" className={`h-9 w-9 rounded-full ${(isCinematic || isFocusMode) ? '[&_svg]:fill-white text-white hover:text-white hover:bg-white/20' : isDark ? 'text-[rgba(255,255,255,0.45)] hover:text-white hover:bg-[rgba(255,255,255,0.08)]' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
                  <Mic className="w-5 h-5" style={(isCinematic || isFocusMode) ? { color: '#FFFFFF' } : {}} />
                </Button>
                <Button 
                  size="icon" 
                  className="h-9 w-9 bg-[#FF4C4C] hover:bg-[#FF5E5E] text-white rounded-full shadow-sm"
                  onClick={handleSendMessage}
                  disabled={(!messageInput.trim() && attachments.length === 0) || isLoading || attachments.some(att => att.uploading)}
                >
                  <Send className="w-4 h-4" style={{ color: '#FFFFFF' }} />
                </Button>
              </div>
              <p 
                className={`text-xs text-center mt-2 relative z-10`}
                style={(isCinematic || isFocusMode) ? { 
                  textShadow: '0 1px 3px rgba(0,0,0,0.9)', 
                  color: '#FFFFFF',
                  opacity: 1
                } : isDark ? { color: 'rgba(255,255,255,0.45)' } : { color: '#94a3b8' }}
              >
                Kai can make mistakes. Consider checking important information.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating Focus Mode Toggle Button - Auto-hides when idle */}
      <div className={`fixed z-[60] flex flex-col gap-3 ${autoHideTransition} ${
        isFocusMode 
          ? 'bottom-6 right-6' 
          : 'bottom-24 right-6'
      } ${
        isFocusMode && isUIHidden ? 'opacity-0 translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'
      }`}>
        {/* Presentation Mode Button (only shown in Focus Mode with Cinematic) */}
        {isFocusMode && isCinematic && (
          <button
            onClick={togglePresentationMode}
            className="group"
            title={isPresentationMode ? 'Stop Presentation' : 'Start Presentation'}
          >
            <div className={`relative flex items-center justify-center w-10 h-10 rounded-full shadow-lg transition-all duration-300 backdrop-blur-md border border-white/30 hover:scale-105 ${
              isPresentationMode 
                ? 'bg-green-500/80 hover:bg-green-500' 
                : 'bg-purple-500/80 hover:bg-purple-500'
            }`}>
              {isPresentationMode ? (
                <Pause className="w-4 h-4 text-white transition-transform group-hover:scale-110" />
              ) : (
                <Presentation className="w-4 h-4 text-white transition-transform group-hover:scale-110" />
              )}
              {/* Progress ring when presentation is active */}
              {isPresentationMode && (
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 40 40">
                  <circle
                    cx="20"
                    cy="20"
                    r="18"
                    fill="none"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="2"
                  />
                  <circle
                    cx="20"
                    cy="20"
                    r="18"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray={`${presentationProgress * 1.13} 113`}
                    className="transition-all duration-100"
                  />
                </svg>
              )}
            </div>
            {/* Tooltip */}
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none bg-black/60 text-white backdrop-blur-sm">
              {isPresentationMode ? 'Stop Presentation' : 'Presentation Mode'}
            </div>
          </button>
        )}
        
        {/* Full Focus Button (only shown in Focus Mode) */}
        {isFocusMode && !isFullscreen && (
          <button
            onClick={enterFullscreen}
            className="group"
            title="Enter Full Focus (F)"
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-full shadow-lg transition-all duration-300 bg-[#E53935]/80 backdrop-blur-md border border-white/30 hover:bg-[#E53935] hover:scale-105">
              <Focus className="w-4 h-4 text-white transition-transform group-hover:scale-110" />
            </div>
            {/* Tooltip */}
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none bg-black/60 text-white backdrop-blur-sm">
              Full Focus (F)
            </div>
          </button>
        )}
        
        {/* Main Focus Mode Toggle */}
        <button
          onClick={toggleFocusMode}
          className="group"
          title={isFocusMode ? 'Exit Focus Mode (Esc)' : 'Enter Focus Mode'}
        >
          <div className={`relative flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-all duration-300 ${
            isFocusMode
              ? 'bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30'
              : isDark
                ? 'bg-[#1F1F22] border border-[rgba(255,255,255,0.10)] hover:bg-[#2A2A2E] hover:border-[rgba(255,255,255,0.15)]'
                : 'bg-white border border-slate-200 hover:bg-slate-50 hover:shadow-xl'
          }`}>
            {isFocusMode ? (
              <Minimize2 className="w-5 h-5 text-white transition-transform group-hover:scale-110" />
            ) : (
              <Maximize2 className={`w-5 h-5 transition-transform group-hover:scale-110 ${isDark ? 'text-white' : 'text-slate-700'}`} />
            )}
            
            {/* Pulse animation when not in focus mode */}
            {!isFocusMode && (
              <span className="absolute inset-0 rounded-full animate-ping opacity-20 bg-[#FF4C4C]" style={{ animationDuration: '2s' }} />
            )}
          </div>
          
          {/* Tooltip */}
          <div className={`absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none ${
            isFocusMode
              ? 'bg-black/60 text-white backdrop-blur-sm'
              : isDark
                ? 'bg-[#1F1F22] text-white border border-[rgba(255,255,255,0.10)]'
                : 'bg-slate-900 text-white'
          }`}>
            {isFocusMode ? 'Exit Focus Mode (Esc)' : 'Focus Mode'}
          </div>
        </button>
      </div>
      
      {/* Results Panel - Right Side Drawer */}
      <ResultsPanel 
        data={resultsPanelData} 
        onClose={() => setResultsPanelData(null)} 
      />
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
  onArchive,
  onUnarchive,
  onRename,
  onUpdatePriority,
  onUpdateCategory,
  isDark
}: { 
  conversation: Conversation; 
  getCategoryColor: (category: string) => string;
  getStatusColor: (status: string) => string;
  isSelected?: boolean;
  onClick?: () => void;
  onDelete?: (id: string) => void;
  onArchive?: (id: string) => void;
  onUnarchive?: (id: string) => void;
  onRename?: (id: string, newTitle: string) => void;
  onUpdatePriority?: (id: string, priority: 'neutral' | 'attention' | 'urgent') => void;
  onUpdateCategory?: (id: string, category: 'kai' | 'growth' | 'billing' | 'operations' | 'general') => void;
  isDark?: boolean;
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renameValue, setRenameValue] = useState(conversation.title);
  const isArchived = !!conversation.archivedAt;
  
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
              <DropdownMenuItem onClick={() => {
                setRenameValue(conversation.title);
                setShowRenameDialog(true);
              }}>
                <Pencil className="w-4 h-4 mr-2" />
                Rename
              </DropdownMenuItem>
              
              {/* Priority submenu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Priority
                    <ChevronRight className="w-3 h-3 ml-auto" />
                  </DropdownMenuItem>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start">
                  <DropdownMenuItem onClick={() => onUpdatePriority?.(conversation.id, 'neutral')}>
                    {conversation.status === 'neutral' && '✓ '}
                    Normal
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onUpdatePriority?.(conversation.id, 'attention')}>
                    {conversation.status === 'attention' && '✓ '}
                    Needs Attention
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onUpdatePriority?.(conversation.id, 'urgent')}>
                    {conversation.status === 'urgent' && '✓ '}
                    Urgent
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Category submenu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <FileText className="w-4 h-4 mr-2" />
                    Category
                    <ChevronRight className="w-3 h-3 ml-auto" />
                  </DropdownMenuItem>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start">
                  <DropdownMenuItem onClick={() => onUpdateCategory?.(conversation.id, 'kai')}>
                    {conversation.category === 'kai' && '✓ '}
                    Kai Insights
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onUpdateCategory?.(conversation.id, 'growth')}>
                    {conversation.category === 'growth' && '✓ '}
                    Growth
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onUpdateCategory?.(conversation.id, 'billing')}>
                    {conversation.category === 'billing' && '✓ '}
                    Billing
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onUpdateCategory?.(conversation.id, 'operations')}>
                    {conversation.category === 'operations' && '✓ '}
                    Operations
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onUpdateCategory?.(conversation.id, 'general')}>
                    {conversation.category === 'general' && '✓ '}
                    General
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {isArchived ? (
                <DropdownMenuItem onClick={() => onUnarchive?.(conversation.id)}>
                  <Archive className="w-4 h-4 mr-2" />
                  Restore
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onArchive?.(conversation.id)}>
                  <Archive className="w-4 h-4 mr-2" />
                  Archive
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Rename Dialog */}
      <AlertDialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Rename Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a new name for this conversation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="Conversation name"
              className="w-full"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && renameValue.trim()) {
                  onRename?.(conversation.id, renameValue.trim());
                  setShowRenameDialog(false);
                }
              }}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={!renameValue.trim()}
              onClick={() => {
                if (renameValue.trim()) {
                  onRename?.(conversation.id, renameValue.trim());
                  setShowRenameDialog(false);
                }
              }}
            >
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

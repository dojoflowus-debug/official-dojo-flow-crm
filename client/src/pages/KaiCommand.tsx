import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import ManagementLayout from '@/components/ManagementLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { useFocusMode } from '@/contexts/FocusModeContext';
import { useEnvironment } from '@/contexts/EnvironmentContext';
import { useKaiBar } from '@/contexts/KaiBarContext';
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
import { InfoPanel, InfoPanelData } from '@/components/InfoPanel';
import { parseKaiMessage, renderParsedMessage } from '@/lib/kaiUIBlocks';
import { useKaiResponseParser } from '@/hooks/useKaiResponseParser';
import { UIBlockRenderer } from '@/components/UIBlockRenderer';
import VoicePacedMessage from '@/components/VoicePacedMessage';
import { KaiErrorAlert } from '@/components/KaiErrorAlert';
import { BetaNoticeModal } from '@/components/BetaNoticeModal';
import { KaiLoadingAnimation } from '@/components/KaiLoadingAnimation';
import { PaywallModal } from '@/components/PaywallModal';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import '@/styles/kai-light-command-center.css';
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
  audioUrl?: string; // TTS audio URL
  audioDuration?: number; // Audio duration in milliseconds
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
  const { setOnSendMessage: setKaiBarSendHandler, setIsLoading: setKaiBarLoading } = useKaiBar();
  
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
  
  // Error handling state
  interface ApiError {
    message: string;
    type: 'timeout' | 'network' | 'validation' | 'server' | 'unknown';
    timestamp: Date;
    retryable: boolean;
  }
  const [apiError, setApiError] = useState<ApiError | null>(null);
  const [errorDismissed, setErrorDismissed] = useState(false);
  
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
  
  // Get subscription status
  const { canAccessFeature, shouldShowPaywall, getTrialDaysRemaining } = useSubscriptionStatus(user?.organizationId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const centerPanelRef = useRef<HTMLDivElement>(null);
  const [parallaxOffset, setParallaxOffset] = useState(0);
  
  // Track center panel position and size for fixed chat bar
  const [centerPanelPosition, setCenterPanelPosition] = useState({ left: 0, width: 0 });
  
  // Auto-hide UI state for Focus Mode
  const [isUIHidden, setIsUIHidden] = useState(false);
  
  // Beta Notice modal state
  const [showBetaNotice, setShowBetaNotice] = useState(false);
  
  // Paywall modal state
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallFeatureName, setPaywallFeatureName] = useState('this feature');
  
  // Results Panel state
  const [resultsPanelData, setResultsPanelData] = useState<ResultsPanelData>(null);
  
  // Info Panel state
  const [infoPanelOpen, setInfoPanelOpen] = useState(false);
  const [infoPanelData, setInfoPanelData] = useState<InfoPanelData | undefined>(undefined);
  
  // Initialize response parser
  const { parseResponse } = useKaiResponseParser();
  
  // Auto-close panel when data is empty
  useEffect(() => {
    if (!infoPanelData || (!infoPanelData.studentCard && !infoPanelData.summaryCards?.length && !infoPanelData.reportCards?.length)) {
      setInfoPanelOpen(false);
    }
  }, [infoPanelData]);

  // Check if beta notice should be shown on mount
  useEffect(() => {
    const hasSeenNotice = localStorage.getItem('kai_beta_notice_v0.9.0');
    if (!hasSeenNotice) {
      setShowBetaNotice(true);
    }
  }, []);

  // Connect KaiBar send handler to handleSendMessage
  useEffect(() => {
    setKaiBarSendHandler(async (input: string, kaiBarAttachments: any[]) => {
      console.log('[KaiBar] Send button clicked, input:', input, 'attachments:', kaiBarAttachments);
      try {
        setKaiBarLoading(true);
        // Pass input and attachments directly to handleSendMessage instead of relying on state
        await handleSendMessage('click', input, kaiBarAttachments);
        // Clear state after successful send
        setMessageInput('');
        setAttachments([]);
      } catch (error) {
        console.error('[KaiBar] Send error:', error);
      } finally {
        setKaiBarLoading(false);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setKaiBarSendHandler, setKaiBarLoading]);
  
  // Voice state management
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [currentSpeechMessageId, setCurrentSpeechMessageId] = useState<string | null>(null);
  
  // Fullscreen and Add Staff state
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Unique ID generator for messages to prevent duplicate key warnings
  const messageIdCounterRef = useRef(Date.now());
  const scrollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // In-flight lock to prevent duplicate sends
  const sendingRef = useRef(false);
  const pendingMessageIdsRef = useRef(new Set<string>());
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
    const displayName = user?.name || user?.email?.split('@')[0];
    if (!displayName) return 'U';
    const names = displayName.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return displayName.substring(0, 2).toUpperCase();
  };

  // Staff data for mention rendering
  const { data: staffData } = trpc.staff.getAll.useQuery({ limit: 50 });
  
  // Render message content with styled @mentions
  // Add note to student mutation
  const addStudentNoteMutation = trpc.students.addNote.useMutation();
  
  // TTS generation mutation
  const generateSpeechMutation = trpc.kai.generateSpeech.useMutation({
    onError: (error) => {
      console.error('[generateSpeech] Mutation error:', error);
    }
  });
  
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

  const conversationsQuery = trpc.kai.getConversations.useQuery(undefined, {
    onSuccess: (data) => {
      console.log('[Convos] loading for user:', user?.id);
      console.log('[Convos] Total conversations returned:', data?.length);
    },
    onError: (error) => {
      console.error('[Convos] Failed to load conversations:', error);
      toast.error('Failed to load conversations');
    }
  });
  const statsQuery = trpc.dashboard.stats.useQuery({});
  
  const messagesQuery = trpc.kai.getMessages.useQuery(
    { conversationId: selectedConversationId && !selectedConversationId.startsWith('new-') ? parseInt(selectedConversationId) : 0 },
    { enabled: !!selectedConversationId && !selectedConversationId.startsWith('new-') }
  );
  const createConversationMutation = trpc.kai.createConversation.useMutation({
    onError: (error) => {
      console.error('[createConversation] Mutation error:', error);
    }
  });
  
  const addMessageMutation = trpc.kai.addMessage.useMutation({
    onSuccess: (data) => {
      console.log('[handleSendMessage] Message saved with ID:', data.id);
    },
    onError: (error) => {
      console.error('[handleSendMessage] Failed to save message:', error);
      toast.error('Failed to save message');
    }
  });
  const deleteConversationMutation = trpc.kai.deleteConversation.useMutation({
    onError: (error) => {
      console.error('[deleteConversation] Mutation error:', error);
    }
  });
  const archiveConversationMutation = trpc.kai.archiveConversation.useMutation({
    onError: (error) => {
      console.error('[archiveConversation] Mutation error:', error);
    }
  });
  const unarchiveConversationMutation = trpc.kai.unarchiveConversation.useMutation({
    onError: (error) => {
      console.error('[unarchiveConversation] Mutation error:', error);
    }
  });
  const renameConversationMutation = trpc.kai.renameConversation.useMutation({
    onError: (error) => {
      console.error('[renameConversation] Mutation error:', error);
    }
  });
  const updateConversationMutation = trpc.kai.updateConversation.useMutation({
    onError: (error) => {
      console.error('[updateConversation] Mutation error:', error);
    }
  });
  const summarizeConversationMutation = trpc.kai.summarizeConversation.useMutation({
    onError: (error) => {
      console.error('[summarizeConversation] Mutation error:', error);
    }
  });
  const extractConversationMutation = trpc.kai.extractConversation.useMutation({
    onError: (error) => {
      console.error('[extractConversation] Mutation error:', error);
    }
  });
  const deleteAllMessagesMutation = trpc.kai.deleteAllMessages.useMutation({
    onError: (error) => {
      console.error('[deleteAllMessages] Mutation error:', error);
      toast.error('Failed to delete messages');
    }
  });
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false);
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
    
    // Check if there are messages to summarize
    if (!messages || messages.length === 0) {
      toast.error('No messages to summarize. Start a conversation first.');
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
    console.log('[KaiCommand] Export button clicked, format:', format, 'conversationId:', selectedConversationId);
    if (!selectedConversationId) {
      console.warn('[KaiCommand] Export failed: no conversation selected');
      toast.error('Please select a conversation to export');
      return;
    }
    
    try {
      console.log('[KaiCommand] Exporting conversation...');
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
      
      console.log('[KaiCommand] Export successful:', result.filename);
      toast.success(`Exported conversation as ${format.toUpperCase()}`);
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error';
      console.error('[KaiCommand] Export failed:', errorMessage);
      toast.error(`Export failed: ${errorMessage}`);
    }
  };

  // Handle export all conversations
  const handleExportAll = async (format: 'json' | 'markdown' | 'csv') => {
    console.log('[KaiCommand] Export All button clicked, format:', format);
    try {
      console.log('[KaiCommand] Exporting all conversations...');
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
      
      console.log('[KaiCommand] Export all successful, count:', result.count);
      toast.success(`Exported ${result.count} conversation(s) as ${format.toUpperCase()}`);
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error';
      console.error('[KaiCommand] Export all failed:', errorMessage);
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

  // Handle delete all messages from conversation
  const handleDeleteAllMessages = async () => {
    if (!selectedConversationId) {
      toast.error('Please select a conversation');
      return;
    }
    
    setIsDeleteAllDialogOpen(true);
  };

  // Confirm and execute delete all messages
  const confirmDeleteAllMessages = async () => {
    if (!selectedConversationId) return;
    
    try {
      await deleteAllMessagesMutation.mutateAsync({
        conversationId: parseInt(selectedConversationId)
      });
      
      // Clear messages from UI
      setMessages([]);
      
      // Refresh conversations to update preview
      utils.kai.getConversations.invalidate();
      utils.kai.getMessages.invalidate({ conversationId: parseInt(selectedConversationId) });
      
      toast.success('All messages deleted from conversation');
      setIsDeleteAllDialogOpen(false);
    } catch (error: any) {
      console.error('Failed to delete all messages:', error);
      toast.error(`Failed to delete messages. ${error?.message || 'Unknown error'}`);
    }
  };

  // Handle starting a new chat
  const handleNewChat = async () => {
    console.log('[NewChat] clicked');
    console.log('[NewChat] userId:', user?.id);
    console.log('[NewChat] organizationId:', user?.organizationId);
    console.log('[NewChat] mutation pending:', createConversationMutation.isPending);
    try {
      console.log('[NewChat] Creating new conversation...');
      const result = await createConversationMutation.mutateAsync({});
      console.log('[NewChat] API response:', result);
      console.log('[NewChat] New conversation created with ID:', result.id);
      
      // Wait a moment for the mutation to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Refresh conversations list and wait for it to complete
      await utils.kai.getConversations.invalidate();
      console.log('[NewChat] Conversations list invalidated');
      const allConversations = await utils.kai.getConversations.getData();
      console.log('[NewChat] Total conversations after creation:', allConversations?.length);
      
      // Select the new conversation
      const conversationId = result.id.toString();
      setSelectedConversationId(conversationId);
      console.log('[KaiCommand] Selected conversation:', conversationId);
      
      // Clear messages for fresh start
      setMessages([]);
      // Clear any input
      setMessageInput('');
      
      // Show success toast
      toast.success('New conversation created');
      console.log('[NewChat] SUCCESS: New conversation setup complete');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[NewChat] FAILED:', errorMessage, error);
      console.error('[NewChat] Full error object:', error);
      toast.error(`Failed to create conversation: ${errorMessage}`);
      
      // Fallback to local-only conversation
      const newId = `new-${Date.now()}`;
      setSelectedConversationId(newId);
      setMessages([]);
      setMessageInput('');
      console.log('[KaiCommand] Fallback conversation created:', newId);
    }
  };

  // Handle fullscreen toggle
  const handleFullScreen = () => {
    console.log('[KaiCommand] Full Screen button clicked, current state:', isFullScreen);
    setIsFullScreen(!isFullScreen);
    toast.success(isFullScreen ? 'Exited full screen' : 'Entered full screen mode');
  };

  // Handle add staff to conversation
  const handleAddStaff = () => {
    console.log('[KaiCommand] Add Staff button clicked, conversationId:', selectedConversationId);
    if (!selectedConversationId) {
      toast.error('Please select a conversation first');
      return;
    }
    setShowAddStaffModal(true);
    console.log('[KaiCommand] Opening Add Staff modal');
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

  // Clear messages when switching to new conversation
  useEffect(() => {
    if (selectedConversationId?.startsWith('new-')) {
      console.log('[KaiCommand] Switching to new conversation, clearing messages');
      setMessages([]);
    }
  }, [selectedConversationId]);

  // Load messages when conversation changes
  useEffect(() => {
    console.log('[KaiCommand] messagesQuery.data changed:', messagesQuery.data);
    if (messagesQuery.data && messagesQuery.data.length > 0) {
      const loadedMessages: Message[] = messagesQuery.data.map(m => ({
        id: m.id.toString(),
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: new Date(m.createdAt)
      }));
      console.log('[KaiCommand] Loaded messages:', loadedMessages);
      setMessages(loadedMessages);
    } else if (messagesQuery.data && messagesQuery.data.length === 0) {
      console.log('[KaiCommand] No messages for this conversation');
      setMessages([]);
    }
  }, [messagesQuery.data]);

  // Log conversations query changes
  useEffect(() => {
    console.log('[KaiCommand] conversationsQuery state:', {
      isLoading: conversationsQuery.isLoading,
      isError: conversationsQuery.isError,
      data: conversationsQuery.data,
      error: conversationsQuery.error
    });
  }, [conversationsQuery.data, conversationsQuery.isLoading, conversationsQuery.isError]);

  // Smart collections with dynamic counts based on actual data
  console.log('[KaiCommand] conversations array:', conversations);
  const urgentCount = conversations.filter(c => !c.archivedAt && c.status === 'urgent').length;
  const insightsCount = conversations.filter(c => !c.archivedAt && c.category === 'kai').length;
  const pendingCount = conversations.filter(c => !c.archivedAt && c.status === 'attention').length;
  console.log('[KaiCommand] collection counts:', { urgentCount, insightsCount, pendingCount });
  
  // Tactical status filters
  const smartCollections = [
    { id: 'urgent', label: 'CRITICAL', count: urgentCount, icon: AlertCircle, color: 'text-red-500' },
    { id: 'insights', label: 'INTEL', count: insightsCount, icon: Sparkles, color: 'text-white/70' },
    { id: 'pending', label: 'PENDING', count: pendingCount, icon: CheckSquare, color: 'text-amber-500' }
  ];

  // Mission tiles - tactical command prompts with severity levels
  const quickCommands = [
    {
      id: 'at-risk',
      header: 'ALERT: INACTIVE MEMBERS',
      text: '"Flag students with 14+ days absence. Execute recovery protocol."',
      severity: 'critical' // red left bar
    },
    {
      id: 'retention',
      header: 'THREAT: CHURN RISK',
      text: '"Identify high-risk students. Recommend intervention."',
      severity: 'critical'
    },
    {
      id: 'billing',
      header: 'ALERT: REVENUE LEAK',
      text: '"Surface overdue accounts. Generate collection sequence."',
      severity: 'warning' // amber left bar
    },
    {
      id: 'enrollments',
      header: 'DIRECTIVE: LEAD PURSUIT',
      text: '"Queue leads requiring follow-up. Prioritize by conversion probability."',
      severity: 'warning'
    },
    {
      id: 'health',
      header: 'INTEL: ATTENDANCE SCAN',
      text: '"Report attendance anomalies. Flag no-shows."',
      severity: 'info' // white/neutral left bar
    },
    {
      id: 'class-quality',
      header: 'INTEL: CAPACITY ANALYSIS',
      text: '"Audit class utilization. Identify bottlenecks."',
      severity: 'info'
    },
    {
      id: 'goals',
      header: 'OBJECTIVE: GROWTH TARGET',
      text: '"Model pathway to 150 students. Define milestones."',
      severity: 'info'
    },
    {
      id: 'staff-perf',
      header: 'INTEL: INSTRUCTOR METRICS',
      text: '"Rank instructors by retention. Surface top performers."',
      severity: 'info'
    },
    {
      id: 'financial',
      header: 'SITREP: FINANCIAL STATUS',
      text: '"Compile revenue, burn rate, and 30-day projection."',
      severity: 'info'
    },
    {
      id: 'parent-comms',
      header: 'COMMS: PARENT BROADCAST',
      text: '"Draft parent notification. Specify event parameters."',
      severity: 'info'
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

  // Carousel paging state
  const PAGE_SIZE = 3;
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(sortedQuickCommands.length / PAGE_SIZE);
  const pageItems = sortedQuickCommands.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-select first conversation on initial load
  useEffect(() => {
    if (!selectedConversationId && conversations.length > 0) {
      console.log('[KaiCommand] Auto-selecting first conversation:', conversations[0].id);
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId]);

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

  // Update center panel position and size for fixed chat bar
  useEffect(() => {
    const updateCenterPanelPosition = () => {
      if (centerPanelRef.current) {
        const rect = centerPanelRef.current.getBoundingClientRect();
        setCenterPanelPosition({
          left: rect.left,
          width: rect.width
        });
      }
    };

    updateCenterPanelPosition();
    
    // Update on resize and when commandCenterWidth changes
    window.addEventListener('resize', updateCenterPanelPosition);
    const resizeObserver = new ResizeObserver(updateCenterPanelPosition);
    if (centerPanelRef.current) {
      resizeObserver.observe(centerPanelRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateCenterPanelPosition);
      resizeObserver.disconnect();
    };
  }, [commandCenterWidth]);

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

  const handleSendMessage = async (
    source: 'submit' | 'click' | 'keydown' = 'click',
    overrideInput?: string,
    overrideAttachments?: typeof attachments
  ) => {
    // Use override values if provided, otherwise fall back to state
    const inputText = overrideInput !== undefined ? overrideInput : messageInput;
    const inputAttachments = overrideAttachments !== undefined ? overrideAttachments : attachments;
    
    console.log('HANDLE_SEND_START', { 
      text: inputText, 
      len: inputText?.length, 
      convoId: selectedConversationId, 
      isSending: sendingRef.current, 
      isLoading,
      attachmentsCount: inputAttachments.length,
      source,
      usingOverride: overrideInput !== undefined
    });
    
    // Check subscription status before sending message
    if (shouldShowPaywall()) {
      setPaywallFeatureName('chat messages');
      setShowPaywall(true);
      return;
    }
    
    // CRITICAL: Prevent duplicate sends with in-flight lock
    if (sendingRef.current) {
      console.log('HANDLE_SEND_BLOCKED_REASON', 'Send already in progress');
      console.warn('[KaiSend] Send already in progress, ignoring duplicate call', { source });
      return;
    }
    if (!inputText.trim() && inputAttachments.length === 0) {
      console.log('HANDLE_SEND_BLOCKED_REASON', 'Empty message and no attachments');
      return;
    }
    
    // Check if any attachments are still uploading
    if (inputAttachments.some(att => att.uploading)) {
      console.log('HANDLE_SEND_BLOCKED_REASON', 'Attachments still uploading');
      toast.error('Please wait for attachments to finish uploading');
      return;
    }
    
    // Close ResultsPanel when sending new message (auto-close on context change)
    if (resultsPanelData) {
      setResultsPanelData(null);
    }
    
    // Stop current speech when user sends new message
    if (voiceEnabled && currentSpeechMessageId) {
      setCurrentSpeechMessageId(null);
    }

    // Build message content - attachments are stored separately, not as markdown links
    let messageContent = inputText;
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
            attachments: inputAttachments.map(att => ({
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
      id: (messageIdCounterRef.current++).toString(),
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
      attachments: [...inputAttachments]
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
        const errorMessage = error instanceof Error ? error.message : 'Failed to create conversation';
        console.error('[handleSendMessage] Auto-create failed:', errorMessage, error);
        toast.error(`Failed to create conversation: ${errorMessage}`);
        setIsLoading(false);
        return;
      }
    }
    
    // Optimistic UI update: Add user message to local state immediately
    const optimisticUserMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: currentInput,
      timestamp: new Date(),
      ui_blocks: []
    };
    setMessages(prev => [...prev, optimisticUserMessage]);
    
    if (conversationId) {
      try {
        console.log('[handleSendMessage] Saving user message to conversation:', conversationId);
        const messageResult = await addMessageMutation.mutateAsync({
          conversationId,
          role: 'user',
          content: currentInput
        });
        console.log('[handleSendMessage] User message saved:', messageResult);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to save message';
        console.error('[handleSendMessage] Failed to save message:', errorMessage, error);
        toast.error(`Failed to save message: ${errorMessage}`);
        // Remove the optimistic message on error
        setMessages(prev => prev.filter(m => m.id !== optimisticUserMessage.id));
        setIsLoading(false);
        return;
      }
    } else {
      console.warn('[handleSendMessage] No conversation ID available to save message');
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
        const payload = {
          message: currentInput,
          organizationId: 1, // TODO: Get from user context when multi-org is implemented
          context: stats ? {
            totalStudents: stats.totalStudents,
            activeStudents: stats.activeStudents,
            totalLeads: stats.totalLeads,
            totalClasses: stats.totalClasses
          } : undefined
        };
        console.log('SEND_REQUEST_PAYLOAD', payload);
        const response = await kaiChatMutation.mutateAsync(payload);

        // Generate TTS audio if voice is enabled
        let audioUrl: string | undefined;
        let audioDuration: number | undefined;
        
        if (voiceEnabled) {
          try {
            const ttsResult = await generateSpeechMutation.mutateAsync({
              text: response.response
            });
            
            if (ttsResult.success) {
              audioUrl = ttsResult.audioUrl;
              audioDuration = ttsResult.audioDuration;
              console.log('[KaiCommand] TTS generated:', { audioUrl, audioDuration });
            } else {
              console.error('[KaiCommand] TTS generation failed:', ttsResult.error);
            }
          } catch (error) {
            console.error('[KaiCommand] TTS error:', error);
          }
        }

        const aiMessage: Message = {
          id: (messageIdCounterRef.current++).toString(),
          role: 'assistant',
          content: response.response,
          timestamp: new Date(),
          attachments: response.attachments || [],
          audioUrl,
          audioDuration
        };
        setMessages(prev => [...prev, aiMessage]);
        
        // Parse response for structured data to populate InfoPanel
        const infoPanelContent = parseResponse(response.response);
        if (infoPanelContent) {
          setInfoPanelData(infoPanelContent);
          setInfoPanelOpen(true);
          console.log('[KaiCommand] InfoPanel populated:', infoPanelContent);
        }
        
        // Set current speech message ID for voice controls
        if (voiceEnabled && audioUrl) {
          setCurrentSpeechMessageId(aiMessage.id);
        }

        // Save AI response to database
        if (conversationId) {
          try {
            console.log('[handleSendMessage] Saving AI message to conversation:', conversationId);
            const aiMessageResult = await addMessageMutation.mutateAsync({
              conversationId,
              role: 'assistant',
              content: response.response
            });
            console.log('[handleSendMessage] AI message saved:', aiMessageResult);
            // Refresh conversations to update preview
            await utils.kai.getConversations.invalidate();
            console.log('[handleSendMessage] Conversations list refreshed');
          } catch (error) {
            console.error('[handleSendMessage] Failed to save AI message:', error);
            toast.error('Failed to save AI response to database');
          }
        } else {
          console.warn('[handleSendMessage] No conversation ID available to save AI message');
        }
      } catch (error) {
        console.error('SEND_FAILED', error);
        // Classify error type
        let errorType: 'timeout' | 'network' | 'validation' | 'server' | 'unknown' = 'unknown';
        let errorMessage = 'Failed to get AI response';
        let retryable = true;
        
        if (error instanceof Error) {
          errorMessage = error.message;
          if (error.message.includes('timeout') || error.message.includes('timed out')) {
            errorType = 'timeout';
          } else if (error.message.includes('network') || error.message.includes('fetch')) {
            errorType = 'network';
          } else if (error.message.includes('validation')) {
            errorType = 'validation';
            retryable = false;
          } else if (error.message.includes('500') || error.message.includes('server')) {
            errorType = 'server';
          }
        }
        
        // Enhanced error logging with full details
        const errorDetails = {
          errorType,
          errorMessage,
          errorStack: error instanceof Error ? error.stack : 'No stack trace',
          errorName: error instanceof Error ? error.name : 'Unknown',
          timestamp: new Date().toISOString(),
          userMessage: currentInput
        };
        
        console.error('[handleSendMessage] AI call failed:', errorDetails);
        console.error('[handleSendMessage] Full error object:', error);
        
        // Toast notification for user
        toast.error(`AI Error: ${errorMessage}`);
        
        // Set error state for UI display
        setApiError({
          message: errorMessage || 'An unexpected error occurred. Please try again.',
          type: errorType,
          timestamp: new Date(),
          retryable
        });
        
        // Reset error dismissed flag so error shows
        setErrorDismissed(false);
        
        // Remove from pending set on error
        pendingMessageIdsRef.current.delete(messageId);
        // Release lock on error
        sendingRef.current = false;
      } finally {
        setIsLoading(false);
      }
    } else {
      // No Kai response in group conversation without @Kai mention
      setIsLoading(false);
      // Remove from pending set
      pendingMessageIdsRef.current.delete(messageId);
      // Release lock
      sendingRef.current = false;
      if (staffMentions.length === 0) {
        // No mentions at all in group conversation - show hint
        toast.info('In group conversations, use @Kai to get AI assistance or @Staff to message team members');
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage('keydown');
    }
  };

  const handlePromptClick = (text: string) => {
    const match = text.match(/"([^"]+)"/);
    if (match) {
      setMessageInput(match[1]);
    }
  };

  // Tactical category colors - dark base with accent text
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'kai': return 'bg-white/5 text-white/70 border border-white/10';
      case 'growth': return 'bg-white/5 text-white/70 border border-white/10';
      case 'billing': return 'bg-white/5 text-white/70 border border-white/10';
      case 'operations': return 'bg-white/5 text-white/70 border border-white/10';
      default: return 'bg-white/5 text-white/50 border border-white/10';
    }
  };

  // Tactical status colors - severity-based
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'attention': return 'bg-amber-500/10 text-amber-500 border border-amber-500/30';
      case 'urgent': return 'bg-red-500/10 text-red-500 border border-red-500/30';
      default: return 'bg-white/5 text-white/50 border border-white/10';
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

  // Tactical command center taglines
  const cinematicTaglines = [
    "Standing by for your directive.",
    "All systems operational. Awaiting orders.",
    "Intel ready. What's the mission?",
    "Command center active. Status: green.",
    "Ready to execute. Define your objective."
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

  // Get theme-aware background class for Kai Command
  const getKaiCommandBgClass = () => {
    if (isCinematic) return 'bg-[#0A0A0B]';
    if (isDark) return 'bg-[#0A0A0B]';
    return 'bg-[#FAFBFC]'; // Light mode: clean white-ish background
  };

  // Get theme-aware sidebar background
  const getSidebarBgClass = () => {
    if (isCinematic) return 'bg-[#0A0A0B] border-white/5';
    if (isDark) return 'bg-[#0A0A0B] border-white/5';
    return 'bg-white border-slate-200 shadow-sm'; // Light mode: white sidebar with subtle shadow
  };

  // Get theme-aware text colors
  const getTextClass = (variant: 'primary' | 'secondary' | 'muted') => {
    if (isCinematic || isDark) {
      switch (variant) {
        case 'primary': return 'text-white';
        case 'secondary': return 'text-white/70';
        case 'muted': return 'text-white/40';
      }
    }
    // Light mode
    switch (variant) {
      case 'primary': return 'text-slate-900';
      case 'secondary': return 'text-slate-600';
      case 'muted': return 'text-slate-400';
    }
  };

  // Get theme-aware border class
  const getBorderClass = () => {
    if (isCinematic || isDark) return 'border-white/5';
    return 'border-slate-200';
  };

  // Get theme-aware input styling
  const getInputClass = () => {
    if (isCinematic || isDark) return 'bg-white/5 border-white/10 text-white placeholder:text-white/30';
    return 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400';
  };

  // Get theme-aware hover class
  const getHoverClass = () => {
    if (isCinematic || isDark) return 'hover:bg-white/5';
    return 'hover:bg-slate-50';
  };

  // Handle beta notice actions
  const handleReadNotes = () => {
    localStorage.setItem('kai_beta_notice_v0.9.0', 'true');
    setShowBetaNotice(false);
    navigate('/kai/release-notes/v0-9-0-beta');
  };

  const handleSkipNotice = () => {
    localStorage.setItem('kai_beta_notice_v0.9.0', 'true');
    setShowBetaNotice(false);
    // Note: Notification creation would go here if we had a notifications table
  };

  return (
    <ManagementLayout>
      {/* Error Alert for API failures */}
      <KaiErrorAlert
        error={apiError}
        onDismiss={() => {
          setApiError(null);
          setErrorDismissed(true);
        }}
        onRetry={handleSendMessage}
        isDark={isDark}
        isCinematic={isCinematic}
      />
      
      {/* Cinematic Mode Vignette Overlay - Now rendered inside main content area, not here */}
      
      <div ref={containerRef} className={`kai-command-page w-full flex h-screen max-h-screen overflow-hidden ${getKaiCommandBgClass()} ${!isDark && !isCinematic && !isFocusMode ? 'kaiLightCommandCenter' : ''} ${isCinematic ? 'brightness-[0.85]' : ''} ${isFocusMode ? 'focus-mode fixed inset-0 z-50' : ''} transition-all duration-500 ease-in-out`}>
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
          className={`conversation-panel ${getSidebarBgClass()} border rounded-sm flex flex-col flex-shrink-0 m-4 mr-0 ${isDark || isCinematic ? 'shadow-[0_4px_24px_rgba(0,0,0,0.7)]' : 'shadow-lg'} overflow-hidden transition-all duration-300 ease-in-out ${isFocusMode ? 'invisible' : 'visible'} relative`}
        >
          {/* Header - Tactical Command Style */}
          <div className={`p-4 border-b ${getBorderClass()}`}>
            {/* Search + New Op Button Row */}
            <div className="flex items-center gap-3 mb-3">
              {/* Search - Full Width */}
              <div className="relative flex-1">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${getTextClass('muted')}`} />
                <Input
                  placeholder="Search ops..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-9 h-9 w-full ${getInputClass()} rounded-sm focus:border-primary/50`}
                />
              </div>
              
              {/* New Operation Button */}
              <button
                onClick={handleNewChat}
                disabled={createConversationMutation.isPending}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border ${isDark || isCinematic ? 'border-white/10 text-white/70 bg-white/5 hover:bg-white/10 hover:border-white/20' : 'border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'} text-[11px] font-medium uppercase tracking-wider transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {createConversationMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className={`w-3.5 h-3.5 ${getTextClass('muted')}`} />
                )}
                {createConversationMutation.isPending ? 'CREATING...' : 'NEW OP'}
              </button>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className={`w-full h-8 ${isDark || isCinematic ? 'bg-white/5' : 'bg-slate-100'} rounded-sm p-0.5`}>
                <TabsTrigger value="active" className={`flex-1 text-[10px] uppercase tracking-wider font-medium rounded-sm ${isDark || isCinematic ? 'data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50' : 'data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-500'}`}>ACTIVE</TabsTrigger>
                <TabsTrigger value="archived" className={`flex-1 text-[10px] uppercase tracking-wider font-medium rounded-sm ${isDark || isCinematic ? 'data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50' : 'data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-500'}`}>ARCHIVED</TabsTrigger>
                <TabsTrigger value="all" className={`flex-1 text-[10px] uppercase tracking-wider font-medium rounded-sm ${isDark || isCinematic ? 'data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50' : 'data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-500'}`}>ALL</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Status Filters */}
          <div className={`px-4 py-4 border-b ${getBorderClass()}`}>
            <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${getTextClass('muted')}`}>STATUS FILTERS</h3>
            <div className="space-y-1">
              {smartCollections.map((collection) => {
                const isActive = activeCollection === collection.id;
                return (
                <button
                  key={collection.id}
                  onClick={() => {
                    setActiveCollection(isActive ? null : collection.id);
                  }}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-sm transition-colors ${
                    isActive
                      ? `${isDark || isCinematic ? 'bg-white/10' : 'bg-red-50'} border-l-2 border-l-red-500`
                      : `${getHoverClass()} border-l-2 border-l-transparent`
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <collection.icon className={`w-3.5 h-3.5 ${collection.color}`} />
                    <span className={`text-[11px] font-medium uppercase tracking-wider ${getTextClass('secondary')}`}>{collection.label}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${collection.id === 'urgent' ? 'bg-red-500/20 text-red-500' : collection.id === 'pending' ? 'bg-amber-500/20 text-amber-500' : isDark || isCinematic ? 'bg-white/10 text-white/50' : 'bg-slate-100 text-slate-500'}`}>
                    {collection.count}
                  </span>
                </button>
                );
              })}
            </div>
          </div>

          {/* Operations Log */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className={`text-[10px] font-bold uppercase tracking-widest ${getTextClass('muted')}`}>OPERATIONS LOG</h3>
                <span className={`text-[10px] font-mono ${getTextClass('muted')}`}>{filteredConversations.length}</span>
              </div>
              {activeCollection && (
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] ${getTextClass('muted')}`}>
                    Filter: {smartCollections.find(c => c.id === activeCollection)?.label}
                  </span>
                  <button
                    onClick={() => setActiveCollection(null)}
                    className={`text-[10px] px-1.5 py-0.5 rounded-sm transition-colors ${isDark || isCinematic ? 'text-white/50 hover:bg-white/10' : 'text-slate-500 hover:bg-slate-100'}`}
                  >
                    CLEAR
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto px-4 scrollbar-visible">
              {/* Today */}
              {todayConversations.length > 0 && (
                <div className="mb-4">
                  <h4 className={`text-[9px] font-bold uppercase tracking-widest mb-2 ${getTextClass('muted')}`}>TODAY</h4>
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
                  <h4 className={`text-[9px] font-bold uppercase tracking-widest mb-2 ${getTextClass('muted')}`}>YESTERDAY</h4>
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
                  <h4 className={`text-[9px] font-bold uppercase tracking-widest mb-2 ${getTextClass('muted')}`}>ARCHIVE</h4>
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
            pointerEvents: isFocusMode ? 'none' : 'auto',
            zIndex: 100,
            position: 'relative'
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
          ref={centerPanelRef}
          className={`flex-1 flex flex-col relative min-w-0 min-h-0 h-full overflow-hidden ${isDark || isCinematic ? 'bg-[#0A0A0B]' : 'bg-[#FAFBFC]'}`}
          style={{ zIndex: 10, position: 'relative' }}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Drag-and-drop overlay */}
          {isDragging && (
            <div 
              className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
              style={{ background: isDark || isCinematic ? 'rgba(10,10,11,0.95)' : 'rgba(250,251,252,0.95)' }}
            >
              <div className={`flex flex-col items-center gap-4 p-8 rounded-sm border border-dashed ${isDark || isCinematic ? 'border-white/30 bg-white/5' : 'border-slate-300 bg-white'}`}>
                <div className={`w-16 h-16 rounded-sm flex items-center justify-center ${isDark || isCinematic ? 'bg-white/10' : 'bg-slate-100'}`}>
                  <Upload className={`w-8 h-8 ${getTextClass('secondary')}`} />
                </div>
                <div className="text-center">
                  <p className={`text-sm font-bold uppercase tracking-wider ${getTextClass('primary')}`}>
                    DROP FILES TO UPLOAD
                  </p>
                  <p className={`text-[10px] mt-1 ${getTextClass('muted')} uppercase tracking-wider`}>
                    Spreadsheets, images, PDFs, documents
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
                className="absolute inset-0 will-change-transform pointer-events-none"
                style={{
                  backgroundImage: `url(${currentEnvironment.backgroundImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
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
              {/* Dark Overlay for readability - with backdrop blur for focus mode */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: currentEnvironment.overlayColor,
                  transition: 'background 0.4s ease-out',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)'
                }}
              />
              {/* Soft Gradient Overlay for UI Contrast (20-30% darkening) */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.20) 70%, rgba(0,0,0,0.35) 100%)'
                }}
              />
              {/* Vignette Effect */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse at 50% 50%, transparent 0%, rgba(0,0,0,0.4) 100%)'
                }}
              />
              {/* Spotlight behind Kai */}
              <div 
                className="absolute inset-0 pointer-events-none"
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
              className={`text-[10px] uppercase tracking-widest font-medium ${isCinematic ? 'text-white/70' : isDark ? 'text-white/40' : 'text-slate-400'}`}
              style={isCinematic ? { textShadow: '0 2px 4px rgba(0,0,0,0.75)' } : {}}
            >
              COMMAND CENTER • OPERATIONAL STATUS: ACTIVE • ALL SYSTEMS NOMINAL
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
                    disabled={isSummarizing || !selectedConversationId || messages.length === 0}
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
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleDeleteAllMessages}
                className={`h-8 w-8 ${isCinematic ? 'hover:bg-[rgba(255,255,255,0.15)]' : isDark ? 'hover:bg-[rgba(255,255,255,0.08)]' : ''}`} 
                title="Delete All Messages"
                disabled={!selectedConversationId || messages.length === 0}
              >
                <Trash2 className={`w-4 h-4 ${isCinematic ? 'text-white' : isDark ? 'text-[rgba(255,255,255,0.55)]' : 'text-slate-500'}`} />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleAddStaff}
                className={`h-8 w-8 ${isCinematic ? 'hover:bg-[rgba(255,255,255,0.15)]' : isDark ? 'hover:bg-[rgba(255,255,255,0.08)]' : ''}`} 
                title="Add Staff to Conversation"
              >
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
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleFullScreen}
                className={`h-8 w-8 ${isFullScreen ? (isCinematic ? 'bg-[rgba(255,255,255,0.2)]' : isDark ? 'bg-[rgba(255,255,255,0.15)]' : 'bg-slate-200') : ''} ${isCinematic ? 'hover:bg-[rgba(255,255,255,0.15)]' : isDark ? 'hover:bg-[rgba(255,255,255,0.08)]' : ''}`}
                title={isFullScreen ? 'Exit Full Screen' : 'Enter Full Screen'}
              >
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
            className={`content-layer flex-1 relative min-h-0 w-full ${isFocusMode && messages.length === 0 ? 'overflow-hidden flex items-center justify-center' : 'overflow-y-auto scrollbar-visible'} ${isFocusMode ? 'pt-16' : isCinematic ? 'pt-6' : 'pt-6'} pb-48`}
            style={{ zIndex: 10, paddingBottom: '192px' }}
          >
            {/* Shared content column wrapper - constrained to chat bar width */}
            <div className="w-full" style={{
              maxWidth: '664px',
              marginLeft: 'auto',
              marginRight: 'auto',
              paddingLeft: '16px',
              paddingRight: '16px',
              boxSizing: 'border-box'
            }}>
              {messages.length === 0 ? (
                /* Empty State - Kai Greeting - Added top padding to ensure content doesn't touch the top */
                <div className={`flex flex-col items-center ${isFocusMode ? 'justify-center' : 'justify-center'} ${isCinematic ? 'pt-4' : 'py-8'} transition-all duration-500`}>
                  {/* Shared centered container for header + prompt rail */}
                  {/* Frosted Glass Panel for Focus Mode only - removed from Cinematic */}
                  <div className={`flex flex-col items-center ${isFocusMode && !isCinematic ? 'relative rounded-[32px] py-12 shadow-[0_8px_32px_rgba(0,0,0,0.8)] border border-white/30' : ''}`}
                    style={isFocusMode && !isCinematic ? {
                      background: 'rgba(0, 0, 0, 0.70)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      animation: 'cinematicGlassFadeIn 0.6s ease-out forwards',
                      overflow: 'visible'
                    } : { overflow: 'visible' }}
                  >
                  {/* Shared Command Stage Wrapper - centers logo, title, subtitle, and carousel together */}
                  <div 
                    data-kai-command-wrapper
                    className="w-full mx-auto"
                    style={{ maxWidth: 'min(100%, 900px)', margin: '0 auto', transform: 'translateX(0px)' }}
                  >
                  {/* Header Block - Logo, Title, Subtitle */}
                  <div data-kai-header className="w-full flex flex-col items-center text-center">
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
                    className={`${(isCinematic || isFocusMode) ? 'text-4xl' : 'text-2xl'} font-bold mb-2 transition-all duration-500 tracking-tight ${isCinematic ? 'animate-[cinematicBreathing_4s_ease-in-out_infinite]' : ''}`}
                    style={(isCinematic || isFocusMode) ? { 
                      animation: isCinematic ? 'cinematicTextSlideUp 0.5s ease-out 0.2s both, cinematicBreathing 4s ease-in-out 0.7s infinite' : 'none',
                      textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                      color: '#FFFFFF',
                      opacity: 1
                    } : { color: isDark ? 'white' : '#1e293b', letterSpacing: '0.1em' }}
                  >
                    KAI COMMAND
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
                      {isCinematic ? cinematicTaglines[currentTaglineIndex] : 'Select a directive below or issue a custom command.'}
                    </p>
                  ) : (
                    <p className={`text-center max-w-md mb-6 text-[11px] uppercase tracking-widest ${getTextClass('muted')}`}>
                      Select a directive below or issue a custom command.
                    </p>
                  )}
                  </div>{/* End Header Block */}

                  {/* Mission Directives Carousel */}
                  <div className={`w-full ${isCinematic ? 'mt-4' : ''} transition-all duration-500`}
                    style={Object.assign(
                      { position: 'relative', paddingLeft: '48px', paddingRight: '48px', overflow: 'visible', isolation: 'isolate', zIndex: 10 },
                      isCinematic ? { animation: 'cinematicTextSlideUp 0.6s ease-out 0.5s both' } : {}
                    )}
                  >
                      {/* Left Arrow - Always Visible */}
                      <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className={`w-8 h-8 rounded-sm flex items-center justify-center transition-colors ${page === 0 ? 'opacity-30 cursor-not-allowed' : ''} ${isDark || isCinematic ? 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20' : 'bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm'}`}
                        style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', zIndex: 9999 }}
                      >
                        <ChevronLeft className={`w-4 h-4 ${isDark || isCinematic ? 'text-white/70' : 'text-slate-500'}`} />
                      </button>
                      
                      {/* Mission Tiles - 3 Column Grid */}
                      <div className="grid grid-cols-3 gap-3 w-full">
                        {pageItems.map((command, index) => {
                        // Severity-based styling for tactical look
                        const getSeverityStyles = (severity: string) => {
                          switch (severity) {
                            case 'critical':
                              return {
                                bar: 'bg-red-500',
                                header: 'text-red-500',
                                border: 'border-red-500/30',
                                hoverBorder: 'hover:border-red-500/60'
                              };
                            case 'warning':
                              return {
                                bar: 'bg-amber-500',
                                header: 'text-amber-500',
                                border: 'border-amber-500/30',
                                hoverBorder: 'hover:border-amber-500/60'
                              };
                            default: // info
                              return {
                                bar: 'bg-white/40',
                                header: 'text-white/90',
                                border: 'border-white/10',
                                hoverBorder: 'hover:border-white/30'
                              };
                          }
                        };
                        
                        const severity = (command as any).severity || 'info';
                        const styles = getSeverityStyles(severity);
                        
                        return (
                        <button
                          key={command.id}
                          onClick={() => handlePromptClick(command.text)}
                          className={`w-full relative text-left transition-all duration-200 group overflow-hidden
                            ${(isCinematic || isFocusMode)
                              ? `rounded-sm border ${styles.border} ${styles.hoverBorder} hover:bg-white/5`
                              : isDark 
                                ? `bg-[#0A0A0B] rounded-sm border ${styles.border} ${styles.hoverBorder} hover:bg-[#111113]`
                                : `bg-white rounded-sm border ${severity === 'info' ? 'border-slate-200 hover:border-slate-300' : styles.border + ' ' + styles.hoverBorder} hover:bg-slate-50 shadow-sm`
                            }`}
                          style={(isCinematic || isFocusMode) ? { 
                            animation: isCinematic ? `cinematicCardSlide 0.6s ease-out ${0.4 + index * 0.08}s both` : 'none',
                            background: 'rgba(10, 10, 11, 0.95)'
                          } : {}}
                        >
                          {/* Severity Indicator Bar - Left Edge */}
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${styles.bar}`} />
                          
                          {/* Content */}
                          <div className="pl-4 pr-3 py-3">
                            {/* Header with severity icon */}
                            <div className="flex items-start justify-between mb-2">
                              <div 
                                className={`text-[10px] font-bold uppercase tracking-wider ${styles.header}`}
                                style={(isCinematic || isFocusMode) ? { textShadow: '0 1px 2px rgba(0,0,0,0.9)' } : {}}
                              >
                                {command.header}
                              </div>
                              {/* Favorite/Pin indicator */}
                              <div
                                onClick={(e) => toggleFavorite(command.id, e)}
                                className="p-0.5 rounded transition-colors cursor-pointer hover:bg-white/10"
                              >
                                <Star
                                  className={`w-3 h-3 transition-colors ${
                                    favorites.has(command.id)
                                      ? 'fill-red-500 text-red-500'
                                      : 'text-white/20 hover:text-white/40'
                                  }`}
                                />
                              </div>
                            </div>
                            
                            {/* Command text */}
                            <p 
                              className={`text-xs leading-relaxed ${isDark || isCinematic ? 'text-white/70 group-hover:text-white/90' : 'text-slate-500 group-hover:text-slate-700'} transition-colors`}
                              style={(isCinematic || isFocusMode) ? { 
                                textShadow: '0 1px 2px rgba(0,0,0,0.9)'
                              } : {}}
                            >
                              {command.text}
                            </p>
                          </div>
                        </button>
                        );
                      })}
                      </div>
                      
                      {/* Right Arrow - Always Visible */}
                      <button
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                        className={`w-8 h-8 rounded-sm flex items-center justify-center transition-colors ${page >= totalPages - 1 ? 'opacity-30 cursor-not-allowed' : ''} ${isDark || isCinematic ? 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20' : 'bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm'}`}
                        style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', zIndex: 50 }}
                      >
                        <ChevronRight className={`w-4 h-4 ${isDark || isCinematic ? 'text-white/70' : 'text-slate-500'}`} />
                      </button>
                  </div>
                  </div>{/* End Command Stage Wrapper */}
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
                                  audioUrl={message.audioUrl}
                                  audioDuration={message.audioDuration}
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

          {/* COMPOSER DOCK - Fixed to viewport but positioned with center panel - Rounded pill design */}
          {!isFocusMode && (
            <div 
              className="fixed flex justify-center" 
              style={{ 
                zIndex: 1899,
                bottom: '120px',
                left: `${centerPanelPosition.left + 132}px`,
                width: `${centerPanelPosition.width - 264}px`,
                transition: 'left 0.1s ease-out, width 0.1s ease-out',
                padding: '0 16px',
                boxSizing: 'border-box',
                overflow: 'hidden'
              }}
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  console.log('SEND_SUBMIT');
                  handleSendMessage('submit');
                }}
                className="kaiBar flex items-center gap-2 transition-all duration-300 relative z-10 border focus-within:kai-command-bar-focus"
                style={{
                  background: isDark || isCinematic ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  width: `${centerPanelPosition.width - 32}px`,
                  minHeight: '56px',
                  borderRadius: '999px',
                  padding: '12px 16px',
                  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  borderColor: isDark || isCinematic ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.1)',
                  borderWidth: '1px',
                  boxSizing: 'border-box',
                  position: 'relative'
                }}
              >
                {/* Attachment Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={`h-9 w-9 rounded-full flex-shrink-0 ${
                    isCinematic
                      ? 'text-white hover:text-white hover:bg-white/20'
                      : isDark
                      ? 'text-[rgba(255,255,255,0.45)] hover:text-white hover:bg-[rgba(255,255,255,0.08)]'
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                  }`}
                  title="Attach file"
                >
                  <Paperclip className="w-5 h-5" />
                </Button>

                {/* @ Mention Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={`h-9 w-9 rounded-full flex-shrink-0 ${
                    isCinematic
                      ? 'text-white hover:text-white hover:bg-white/20'
                      : isDark
                      ? 'text-[rgba(255,255,255,0.45)] hover:text-white hover:bg-[rgba(255,255,255,0.08)]'
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                  }`}
                  title="Mention someone"
                  onClick={() => {
                    setMessageInput(prev => prev + '@');
                  }}
                >
                  <AtSign className="w-5 h-5" />
                </Button>
                {/* Message Input */}
                <MentionInput
                  value={messageInput}
                  onChange={setMessageInput}
                  onSubmit={(value, mentions) => {
                    handleSendMessage('submit');
                  }}
                  placeholder="Issue directive... Type @ to assign"
                  theme={isCinematic ? 'cinematic' : isDark ? 'dark' : 'light'}
                  variant="apple"
                />

                {/* Send Button */}
                <Button
                  type="submit"
                  size="icon"
                  className="h-9 w-9 bg-[#FF4C4C] hover:bg-[#FF5E5E] text-white rounded-full shadow-sm flex-shrink-0"
                  disabled={(!messageInput.trim() && attachments.length === 0) || isLoading}
                  onClick={() => console.log('SEND_CLICK')}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#FFFFFF' }} />
                  ) : (
                    <Send className="w-4 h-4" style={{ color: '#FFFFFF' }} />
                  )}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* INFO PANEL - Third Column */}
      <InfoPanel 
        open={infoPanelOpen}
        data={infoPanelData}
        isDark={isDark}
        isCinematic={isCinematic}
        onClose={() => setInfoPanelOpen(false)}
      />
      
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
      
      {/* Add Staff to Conversation Modal */}
      <AlertDialog open={showAddStaffModal} onOpenChange={setShowAddStaffModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add Staff to Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Select staff members to add to this conversation. They will be able to see all messages and participate.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-slate-600">Feature coming soon - Staff management will be available in the next update.</p>
            <p className="text-xs text-slate-500">For now, you can mention staff members using @mention in your messages.</p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Delete All Messages Confirmation Dialog */}
      <AlertDialog open={isDeleteAllDialogOpen} onOpenChange={setIsDeleteAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Messages</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all messages from this conversation? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={confirmDeleteAllMessages}
            >
              Delete All Messages
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Beta Notice Modal */}
      {showBetaNotice && (
        <BetaNoticeModal
          onReadNotes={handleReadNotes}
          onSkip={handleSkipNotice}
        />
      )}
      
      {/* Paywall Modal */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        onStartTrial={async () => {
          try {
            if (!user?.organizationId) {
              toast.error('Organization not found');
              return;
            }
            
            // Call the createTrialCheckout mutation
            const result = await trpc.subscription.createTrialCheckout.mutate({
              organizationId: user.organizationId,
              customerEmail: user.email
            });
            
            if (result.url) {
              // Redirect to Stripe checkout
              window.location.href = result.url;
            } else {
              toast.error('Failed to create checkout session');
            }
          } catch (error: any) {
            console.error('Trial checkout error:', error);
            toast.error(error.message || 'Failed to start trial');
          }
        }}
        onManageBilling={async () => {
          try {
            if (!user?.organizationId) {
              toast.error('Organization not found');
              return;
            }
            
            // Open customer portal
            const result = await trpc.subscription.getCustomerPortalUrl.mutate({
              organizationId: user.organizationId
            });
            
            if (result.url) {
              window.location.href = result.url;
            } else {
              toast.error('Failed to open billing portal');
            }
          } catch (error: any) {
            console.error('Billing portal error:', error);
            toast.error(error.message || 'Failed to open billing portal');
          }
        }}
        subscriptionStatus="no_subscription"
        featureName={paywallFeatureName}
      />
    </ManagementLayout>
  );
}

// Conversation Card Component - Tactical Mission Tile
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
  
  // Severity bar color based on status
  const getSeverityBarColor = () => {
    if (conversation.status === 'urgent') return 'bg-red-500';
    if (conversation.status === 'attention') return 'bg-amber-500';
    return 'bg-white/20';
  };
  
  return (
    <div 
      onClick={onClick}
      className={`relative rounded-sm border p-3 pl-4 mb-2 transition-all cursor-pointer overflow-hidden ${
        isSelected 
          ? isDark ? 'bg-white/10 border-white/20' : 'bg-red-50 border-red-200'
          : isDark ? 'bg-[#0A0A0B] border-white/5 hover:bg-white/5 hover:border-white/10' : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm'
      }`}
    >
      {/* Severity Indicator Bar - Left Edge */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${getSeverityBarColor()}`} />
      <div className="flex items-start justify-between mb-1">
        <h5 className={`text-xs font-medium truncate flex-1 pr-2 ${isDark ? 'text-white/90' : 'text-slate-800'}`}>{conversation.title}</h5>
        <div className="flex items-center gap-1 shrink-0">
          <span className={`text-[10px] font-mono ${isDark ? 'text-white/30' : 'text-slate-400'}`}>{conversation.timestamp}</span>
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
        <p className="text-[10px] text-white/40 line-clamp-2 mb-2">{conversation.preview}</p>
      )}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${getCategoryColor(conversation.category)}`}>
          {conversation.category}
        </span>
        <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${getStatusColor(conversation.status)}`}>
          {conversation.status === 'neutral' ? 'NORMAL' : conversation.status === 'attention' ? 'ATTENTION' : conversation.status === 'urgent' ? 'URGENT' : conversation.status}
        </span>
        <span className="text-[9px] text-white/30 ml-auto flex items-center gap-1 uppercase tracking-wider">
          <Clock className="w-2.5 h-2.5" />
          ACTIVE
        </span>
      </div>
    </div>
  );
}

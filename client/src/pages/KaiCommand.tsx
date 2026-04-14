import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
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
import { ScheduleApprovalModal } from '@/components/ScheduleApprovalModal';
import { ScheduleReviewScreen } from '@/components/ScheduleReviewScreen';
import { ResultsPanel, ResultsPanelData } from '@/components/ResultsPanel';
import { InfoPanel, InfoPanelData } from '@/components/InfoPanel';
import { parseKaiMessage, renderParsedMessage } from '@/lib/kaiUIBlocks';
import { stripScheduleJson } from '@/lib/stripScheduleJson';
import { useKaiResponseParser } from '@/hooks/useKaiResponseParser';
import { UIBlockRenderer } from '@/components/UIBlockRenderer';
import { StudentDetailsPanel } from '@/components/StudentDetailsPanel';
import { ManagementPanel } from '@/components/kai/ManagementPanel';
import VoicePacedMessage from '@/components/VoicePacedMessage';
import { KaiErrorAlert } from '@/components/KaiErrorAlert';
import { KaiReviewCard } from '@/components/KaiReviewCard';
import { BetaNoticeModal } from '@/components/BetaNoticeModal';
import { KaiLoadingAnimation } from '@/components/KaiLoadingAnimation';
import { KaiThinkingIndicator } from '@/components/KaiThinkingIndicator';
import { CreativePreviewCard, type CreativePreviewCardData } from '@/components/CreativePreviewCard';
import { PaywallModal } from '@/components/PaywallModal';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { useKaiOnboarding } from '@/hooks/useKaiOnboarding';
// KaiOnboardingOverlay removed — onboarding is handled in-chat via useKaiOnboarding
import { useKaiTutorial } from '@/contexts/KaiTutorialContext';
import { UserAvatar } from '@/components/UserAvatar';
import { useMobileLayout } from '@/hooks/useMobileLayout';
import '@/styles/kai-light-command-center.css';

// Global layout constants for unified chat layout
const LAYOUT_CONSTANTS = {
  bottomNavHeight: '88px',
  composerHeight: '84px',
  chatZIndex: 20,
  composerZIndex: 60,
  backdropZIndex: 0,
  bottomNavZIndex: 50
};
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
  Download,
  ExternalLink
} from 'lucide-react';

// Kai Logo for center panel - uses actual logo image
const KaiLogo = ({ className = "w-20 h-20" }: { className?: string }) => (
  <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/tqunsEQSWfyTetQA.png" alt="Kai" className={className} />
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
  clientMessageId?: string; // For deduplication of optimistic messages
  attachments?: Attachment[];
  audioUrl?: string; // TTS audio URL
  audioDuration?: number; // Audio duration in milliseconds
  /** Onboarding flow metadata */
  isOnboarding?: boolean;
  onboardingStep?: string;
  expectsFileUpload?: boolean;
  showSkip?: boolean;
  showBack?: boolean;
  showLogoUpload?: boolean;
  logoUploadType?: 'light' | 'dark' | 'icon-light' | 'icon-dark';
  showPhotoUpload?: boolean;
  ui_blocks?: Array<{
    type: 'student_card' | 'student_list' | 'lead_card' | 'lead_list';
    studentId?: number;
    studentIds?: number[];
    leadId?: number;
    leadIds?: number[];
    student?: any; // Full student data for inline rendering
    label: string;
  }>;
  /** Creative image card — rendered when Kai generates an image from chat */
  creativeImage?: CreativePreviewCardData;
  /** Quick-reply action buttons shown below the message */
  quickReplies?: Array<{
    label: string;
    action: string; // identifier for the action to trigger
  }>;
  /** Pending destructive action awaiting user confirmation */
  pendingAction?: {
    toolName: string;
    toolArgs: Record<string, any>;
  };
  /** Schedule import data extracted from vision analysis */
  scheduleImportData?: {
    classes: Array<{
      name: string;
      dayOfWeek: string;
      startTime: string;
      endTime: string;
      instructor?: string;
      location?: string;
    }>;
  };
  /** Post-task review request — shown after Kai completes a significant task */
  reviewRequest?: {
    taskSummary: string;
    taskType?: string;
    creditsUsed?: number;
    conversationId?: string;
  };
  /** Show a 'View in Classes' navigation button after a successful schedule import */
  viewClassesLink?: boolean;
  /** Number of classes imported in the last auto-import */
  importedClassCount?: number;
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
    classes: any[];
    fileName?: string;
    confidence?: number;
    warnings?: string[];
  } | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
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
  const { isMobile, isTablet } = useMobileLayout();
  // On mobile, collapse the left panel entirely; on tablet, use narrower width
  const effectiveCommandWidth = isMobile ? 0 : isTablet ? Math.min(commandCenterWidth, 240) : commandCenterWidth;
  const [mobileOpsOpen, setMobileOpsOpen] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  // Use global Focus Mode context
  const { isFocusMode, isFullscreen, toggleFocusMode, toggleFullscreen, enterFullscreen } = useFocusMode();
  // Use global Environment context
  const { currentEnvironment, isTransitioning, isPresentationMode, presentationProgress, togglePresentationMode } = useEnvironment();
  
  // Get auth first (before using user in other hooks)
  const { user, refresh: refreshAuth } = useAuth();
  
  // Get subscription status - use 0 as fallback to ensure hook is always called with a number
  const { canAccessFeature, shouldShowPaywall, getTrialDaysRemaining, isLoading: subscriptionStatusLoading } = useSubscriptionStatus(user?.activeOrgId || 0);
  // Memoize the organizationId to prevent unnecessary re-renders
  const memoizedOrgId = user?.activeOrgId || 0;

  // KAI onboarding file input ref (for logo upload during onboarding)
  const onboardingFileInputRef = useRef<HTMLInputElement>(null);

  // KAI onboarding hook - guides first-time users through profile setup
  // Onboarding happens inside the KAI chat — no overlay, no side panel.
  const onboardingPhotoInputRef = useRef<HTMLInputElement>(null);

  const {
    isActive: isOnboardingActive,
    currentStep: onboardingCurrentStep,
    stepNumber: onboardingStepNumber,
    totalSteps: onboardingTotalSteps,
    handleUserReply: handleOnboardingReply,
    handleLogoUpload: handleOnboardingLogoUpload,
    handleProfilePhotoUpload: handleOnboardingPhotoUpload,
    skipProfilePhoto: skipOnboardingPhoto,
    skipOnboarding,
    restartOnboarding: restartKaiOnboarding,
    handleGoBack: handleOnboardingGoBack,
  } = useKaiOnboarding({
    organizationId: memoizedOrgId,
    onInjectMessages: (onboardingMsgs) => {
      setMessages(prev => {
        // Keep only existing onboarding messages (not regular conversation messages)
        const existingOnboarding = prev.filter(m => (m as any).isOnboarding);
        const newMsgs = onboardingMsgs.map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: new Date(),
          isOnboarding: true,
          onboardingStep: m.step,
          expectsFileUpload: m.showLogoUpload,
          showSkip: m.showSkip,
          showBack: m.showBack,
          showLogoUpload: m.showLogoUpload,
          logoUploadType: m.logoUploadType,
          showPhotoUpload: m.showPhotoUpload,
        } as Message));
        // If this is the first injection (greeting), start fresh with only onboarding messages
        if (newMsgs.some(m => (m as any).onboardingStep === 'idle')) {
          return newMsgs;
        }
        return [...existingOnboarding, ...newMsgs];
      });
    },
    onComplete: () => {
       // Onboarding done — auto-select first conversation if available
      // The isOnboardingActive will become false, triggering the auto-select useEffect
    },
  });

  // ── Kai Tutorial System ──────────────────────────────────────────────────────
  const {
    pendingKaiMessage: tutorialPendingMessage,
    consumeKaiMessage: consumeTutorialMessage,
    handleToolbarCommand: handleTutorialCommand,
  } = useKaiTutorial();

  // Inject tutorial messages into the chat when they arrive
  useEffect(() => {
    if (!tutorialPendingMessage) return;
    const tutMsg: Message = {
      id: `tutorial-kai-${Date.now()}`,
      role: 'assistant',
      content: tutorialPendingMessage,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, tutMsg]);
    consumeTutorialMessage();
  }, [tutorialPendingMessage, consumeTutorialMessage]);

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
  // Onboarding is handled in-chat (no overlay state needed)
  
  // Paywall modal state
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallFeatureName, setPaywallFeatureName] = useState('this feature');
  
  // Results Panel state
  const [resultsPanelData, setResultsPanelData] = useState<ResultsPanelData>(null);
  
  // Info Panel state
  const [infoPanelOpen, setInfoPanelOpen] = useState(false);
  const [infoPanelData, setInfoPanelData] = useState<InfoPanelData | undefined>(undefined);
  
  // Student Details Panel state
  const [studentDetailsPanelOpen, setStudentDetailsPanelOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  
  // Management Panel state (right column)
  const [managementPanelOpen, setManagementPanelOpen] = useState(false);
  
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
    const hasSeenNotice = localStorage.getItem('kai_beta_notice_v0.9.6');
    if (!hasSeenNotice) {
      setShowBetaNotice(true);
    }
  }, []);

  // Connect KaiBar send handler to handleSendMessage
  useEffect(() => {
    setKaiBarSendHandler(async (input: string, kaiBarAttachments: any[]) => {
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
      toast.error(`Note didn't save — please try again.`);
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
    // Safety net: strip any [SCHEDULE_JSON:{...}] block that the server may have missed
    // This prevents raw JSON from being visible in the chat
    if (content && content.includes('[SCHEDULE_JSON:')) {
      const tagIdx = content.indexOf('[SCHEDULE_JSON:');
      const jsonStart = tagIdx + '[SCHEDULE_JSON:'.length;
      let depth = 0;
      let jsonEnd = -1;
      for (let i = jsonStart; i < content.length; i++) {
        if (content[i] === '{') depth++;
        else if (content[i] === '}') { depth--; if (depth === 0) { jsonEnd = i + 1; break; } }
      }
      const blockEnd = jsonEnd !== -1 ? content.indexOf(']', jsonEnd) : -1;
      const removeUntil = blockEnd !== -1 ? blockEnd + 1 : (jsonEnd !== -1 ? jsonEnd : content.length);
      content = (content.slice(0, tagIdx) + content.slice(removeUntil)).trim();
    }

    // Parse Kai UI blocks if this is a Kai message
    if (isKaiMessage) {
      const parsed = parseKaiMessage(content);
      if (parsed.blocks.length > 0) {
        return renderParsedMessage(
          parsed,
          (studentId) => setResultsPanelData({ type: "student_card", studentId }),
          (leadId) => setResultsPanelData({ type: "lead_card", leadId }),
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
              <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/RWtkCgdJjxxOQJjI.png" alt="Kai" className="w-4 h-4 rounded-full" />
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
  
  // Trial checkout mutation
  const createTrialCheckoutMutation = trpc.subscription.createTrialCheckout.useMutation({
    onError: (error: any) => {
      console.error('[createTrialCheckout] Mutation error:', error);
      toast.error(error?.message || 'Failed to start trial');
    }
  });
  
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isParsingStudents, setIsParsingStudents] = useState(false);
  const [studentThinkingMessages, setStudentThinkingMessages] = useState<string[]>([]);
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
      toast.error(`Chat couldn't be deleted right now — try again.`);
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
      toast.error(`Chat couldn't be archived right now — try again.`);
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
      toast.error(`Chat couldn't be restored right now — try again.`);
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
      toast.error(`Rename didn't go through — try again.`);
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
      toast.error(`Priority update didn't save — try again.`);
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
      toast.error(`Category update didn't save — try again.`);
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
      toast.error(`Summary not available right now — try again.`);
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
      console.error('[KaiCommand] Export failed:', errorMessage);
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
      toast.error(`Extraction didn't complete — try again.`);
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
    try {
      const result = await createConversationMutation.mutateAsync({});
      
      // Wait a moment for the mutation to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Refresh conversations list and wait for it to complete
      await utils.kai.getConversations.invalidate();
      const allConversations = await utils.kai.getConversations.getData();
      
      // Select the new conversation
      const conversationId = result.id.toString();
      setSelectedConversationId(conversationId);
      
      // Clear messages for fresh start
      setMessages([]);
      // Clear any input
      setMessageInput('');
      
      // Show success toast
      toast.success('New conversation created');
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
    }
  };

  // Handle fullscreen toggle
  const handleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
    toast.success(isFullScreen ? 'Exited full screen' : 'Entered full screen mode');
  };

  // Handle add staff to conversation
  const handleAddStaff = () => {
    if (!selectedConversationId) {
      toast.error('Please select a conversation first');
      return;
    }
    setShowAddStaffModal(true);
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
      // Preserve onboarding messages if onboarding is active
      setMessages(prev => {
        const hasOnboardingMessages = prev.some(m => (m as any).isOnboarding);
        if (hasOnboardingMessages) return prev;
        return [];
      });
    }
  }, [selectedConversationId]);

  // Load messages when conversation changes
  useEffect(() => {
    if (messagesQuery.data && messagesQuery.data.length > 0) {
      const loadedMessages: Message[] = messagesQuery.data.map(m => {
        // Parse metadata to extract ui_blocks
        let ui_blocks: any[] = [];
        if (m.metadata) {
          try {
            const metadata = typeof m.metadata === 'string' ? JSON.parse(m.metadata) : m.metadata;
            ui_blocks = metadata.ui_blocks || [];
          } catch (e) {
            console.error('[KaiCommand] Failed to parse metadata for message', m.id, e);
          }
        }
        
        return {
          id: m.id.toString(),
          role: m.role as 'user' | 'assistant',
          content: m.content,
          timestamp: new Date(m.createdAt),
          clientMessageId: m.metadata?.clientMessageId as string | undefined,
          ui_blocks
        };
      });
      
      // Deduplicate messages: merge loaded messages with existing optimistic messages
      // Use clientMessageId to match optimistic messages with server messages
      setMessages(prev => {
        const messageMap = new Map<string, Message>();
        const clientIdMap = new Map<string, string>(); // clientMessageId -> final id
        
        // First pass: index loaded messages by both id and clientMessageId
        loadedMessages.forEach(msg => {
          messageMap.set(msg.id, msg);
          if (msg.clientMessageId) {
            clientIdMap.set(msg.clientMessageId, msg.id);
          }
        });
        
        // Second pass: merge existing messages, replacing optimistic ones that match clientMessageId
        prev.forEach(msg => {
          // Check if this is an optimistic message that has been saved to server
          if (msg.id.startsWith('client-') && clientIdMap.has(msg.id)) {
            // Skip this optimistic message - it's already in messageMap with server ID
            return;
          }
          // Check if this message already exists (by server ID)
          if (!messageMap.has(msg.id)) {
            messageMap.set(msg.id, msg);
          }
        });
        
        // Convert back to array, sorted by timestamp
        const finalMessages = Array.from(messageMap.values()).sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        const testCard = finalMessages.find(m => m.id === 'hardcoded-test-card');
        if (testCard) {
        }
        return finalMessages;
      });
    } else if (messagesQuery.data && messagesQuery.data.length === 0) {
      // Don't clear messages if onboarding is active — onboarding messages live in local state only
      setMessages(prev => {
        const hasOnboardingMessages = prev.some(m => (m as any).isOnboarding);
        if (hasOnboardingMessages) return prev;
        return [];
      });
    }
  }, [messagesQuery.data]);

  // (debug logging removed)

  // Smart collections with dynamic counts based on actual data
  const urgentCount = conversations.filter(c => !c.archivedAt && c.status === 'urgent').length;
  const insightsCount = conversations.filter(c => !c.archivedAt && c.category === 'kai').length;
  const pendingCount = conversations.filter(c => !c.archivedAt && c.status === 'attention').length;
  
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
  // Don't auto-select if onboarding is active — onboarding runs in a clean state without existing messages
  useEffect(() => {
    if (!selectedConversationId && conversations.length > 0 && !isOnboardingActive) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId, isOnboardingActive]);

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
  }, []); // Empty deps - ResizeObserver handles all updates

  // Upload mutation
  const uploadMutation = trpc.upload.uploadAttachment.useMutation();

  // Kai Creative — generate image from chat
  const generateFromChatMutation = trpc.kaiCreative.generateFromChat.useMutation();
  
  // Schedule extraction mutations
  const extractScheduleMutation = trpc.kai.scheduleExtractor.extractSchedule.useMutation();
  const createClassesMutation = trpc.kai.scheduleExtractor.createClassesFromSchedule.useMutation();

  // Student import mutations
  const parseStudentsMutation = trpc.kai.studentImport.parseStudentsFromDocument.useMutation();
  const bulkImportStudentsMutation = trpc.kai.studentImport.bulkImportStudents.useMutation();

  // Document analysis mutation — intelligently classify any uploaded document
  const analyzeDocumentMutation = trpc.kai.documentAnalysis.analyzeDocument.useMutation();
  // Programs extraction mutation
  const extractProgramsMutation = trpc.kai.documentAnalysis.extractPrograms.useMutation();
  // Programs create mutation (called once per program during bulk import)
  const createProgramMutation = trpc.kai.programs.create.useMutation();

  // Programs import state
  const [programImportPreview, setProgramImportPreview] = useState<{
    programs: Array<{
      name: string;
      type: string;
      ageRange?: string | null;
      price?: number | null;
      billing?: string | null;
      description?: string | null;
      maxSize?: number | null;
    }>;
    fileName: string;
    fileUrl: string;
    fileType: string;
    storageKey?: string;
    extractedText?: string;
  } | null>(null);
  const [selectedProgramRows, setSelectedProgramRows] = useState<Set<number>>(new Set());
  const [isImportingPrograms, setIsImportingPrograms] = useState(false);

  // Merchandise extraction mutation
  const extractMerchandiseMutation = trpc.kai.documentAnalysis.extractMerchandise.useMutation();
  // Merchandise create mutation — trpc.merchandise.createItem (top-level merchandise router)
  const createMerchandiseMutation = (trpc as any).merchandise.createItem.useMutation();

  // Merchandise import state
  const [merchandiseImportPreview, setMerchandiseImportPreview] = useState<{
    items: Array<{
      name: string;
      type: string;
      defaultPrice?: number | null;
      description?: string | null;
      stockQuantity?: number | null;
    }>;
    fileName: string;
    fileUrl: string;
    extractedText?: string;
  } | null>(null);
  const [selectedMerchandiseRows, setSelectedMerchandiseRows] = useState<Set<number>>(new Set());
  const [isImportingMerchandise, setIsImportingMerchandise] = useState(false);

  // Student import state
  const [studentImportPreview, setStudentImportPreview] = useState<{
    students: Array<{
      firstName: string;
      lastName: string;
      email?: string | null;
      phone?: string | null;
      dateOfBirth?: string | null;
      beltRank?: string | null;
      program?: string | null;
      guardianName?: string | null;
      guardianPhone?: string | null;
    }>;
    fileName: string;
    source: string;
  } | null>(null);
  const [selectedStudentRows, setSelectedStudentRows] = useState<Set<number>>(new Set());
  const [isImportingStudents, setIsImportingStudents] = useState(false);

  // Get instructors for the review screen
  const instructorsQuery = trpc.classes.getInstructors.useQuery();
  const instructors = instructorsQuery.data || [];

  // Handle file selection
   const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // ── Onboarding photo intercept (paperclip button) ───────────────────────
    if (isOnboardingActive) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.showPhotoUpload) {
        const imageFile = Array.from(files).find(f => f.type.startsWith('image/'));
        if (imageFile) {
          setMessages(prev => [...prev, {
            id: `onboarding-user-photo-${Date.now()}`,
            role: 'user',
            content: `📎 Uploading photo: ${imageFile.name}`,
            timestamp: new Date(),
            isOnboarding: true,
          } as any]);
          await handleOnboardingPhotoUpload(imageFile);
          e.target.value = '';
          return;
        }
      }
    }
    // ───────────────────────────────────────────────────────────────────────

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

          // Check if this is a student roster file — only trigger auto-import if filename
          // strongly suggests a student roster (not programs, schedules, or other docs)
          const fileNameLower = file.name.toLowerCase();
          const isStudentRosterFile =
            (file.type === 'application/pdf' || file.name.endsWith('.pdf') ||
             file.type.startsWith('image/') || file.name.endsWith('.jpg') ||
             file.name.endsWith('.jpeg') || file.name.endsWith('.png') ||
             file.name.endsWith('.webp')) &&
            // Must have roster-related keywords in the filename
            (fileNameLower.includes('student') || fileNameLower.includes('roster') ||
             fileNameLower.includes('member') || fileNameLower.includes('enrollment') ||
             fileNameLower.includes('enroll') || fileNameLower.includes('pupil') ||
             fileNameLower.includes('athlete') || fileNameLower.includes('participant'));
          
          if (isScheduleFile) {
            // Auto-extract schedule from the file using storage key for reliable server-side reading
            handleScheduleExtraction(result.url, file.type, file.name, result.key);
          } else if (isStudentRosterFile) {
            // Auto-parse student roster from PDF or image
            handleStudentDocumentImport(result.url, file.type, file.name, result.key);
          } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
            // Generic PDF — auto-analyze with AI to determine document type and suggest routing
            handleDocumentAnalysis(result.url, file.type, file.name, result.key);
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

    // ── Onboarding photo intercept ──────────────────────────────────────────
    // If the user is on the "Upload Photo" onboarding step, route any dropped
    // image directly to the profile photo upload handler instead of the
    // general attachment flow.
    if (isOnboardingActive) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.showPhotoUpload) {
        const imageFile = Array.from(files).find(f => f.type.startsWith('image/'));
        if (imageFile) {
          setMessages(prev => [...prev, {
            id: `onboarding-user-photo-${Date.now()}`,
            role: 'user',
            content: `📎 Uploading photo: ${imageFile.name}`,
            timestamp: new Date(),
            isOnboarding: true,
          } as any]);
          await handleOnboardingPhotoUpload(imageFile);
          return;
        }
      }
    }
    // ───────────────────────────────────────────────────────────────────────

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

          // Check if this is a student roster file — only trigger auto-import if filename
          // strongly suggests a student roster (not programs, schedules, or other docs)
          const fileNameLowerDrop = file.name.toLowerCase();
          const isStudentRosterFile =
            (file.type === 'application/pdf' || file.name.endsWith('.pdf') ||
             file.type.startsWith('image/') || file.name.endsWith('.jpg') ||
             file.name.endsWith('.jpeg') || file.name.endsWith('.png') ||
             file.name.endsWith('.webp')) &&
            // Must have roster-related keywords in the filename
            (fileNameLowerDrop.includes('student') || fileNameLowerDrop.includes('roster') ||
             fileNameLowerDrop.includes('member') || fileNameLowerDrop.includes('enrollment') ||
             fileNameLowerDrop.includes('enroll') || fileNameLowerDrop.includes('pupil') ||
             fileNameLowerDrop.includes('athlete') || fileNameLowerDrop.includes('participant'));
          
          if (isScheduleFile) {
            // Auto-extract schedule from the file using storage key for reliable server-side reading
            handleScheduleExtraction(result.url, file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', file.name, result.key);
          } else if (isStudentRosterFile) {
            // Auto-parse student roster from PDF or image
            handleStudentDocumentImport(result.url, file.type, file.name, result.key);
          } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
            // Generic PDF — auto-analyze with AI to determine document type and suggest routing
            handleDocumentAnalysis(result.url, file.type, file.name, result.key);
          } else if (file.type.startsWith('image/')) {
            // Generic image (screenshot, photo, etc.) — auto-trigger vision analysis
            // Small delay to let the attachment render first
            setTimeout(() => {
              handleSendMessage('click', '', [{ 
                id: tempId, 
                fileName: file.name, 
                fileType: file.type, 
                fileSize: file.size, 
                url: result.url, 
                storageKey: result.key, 
                uploading: false 
              }]);
            }, 300);
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

  // Handle intelligent document analysis — auto-classify any PDF and suggest routing
  const handleDocumentAnalysis = async (fileUrl: string, fileType: string, fileName: string, storageKey?: string) => {
    // Show a "reading document" message while analyzing
    const readingMsgId = `doc-reading-${Date.now()}`;
    const readingMessage: Message = {
      id: readingMsgId,
      role: 'assistant',
      content: `Reading **${fileName}**… give me a moment to figure out what’s in here.`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, readingMessage]);

    try {
      const result = await analyzeDocumentMutation.mutateAsync({
        fileUrl,
        storageKey,
        fileType,
        fileName
      });

      // Build quick reply buttons from the AI's suggested actions
      // Encode extractedText so programs import can reuse it without re-fetching
      const encodedText = encodeURIComponent((result.extractedText || '').substring(0, 2000));
      const quickReplies = (result.suggestedActions || []).map((action: { label: string; action: string }) => ({
        label: action.label,
        action: action.action === 'import_students'
          ? `import_students_from_pdf:${fileUrl}|${fileType}|${fileName}|${storageKey || ''}`
          : action.action === 'import_programs'
          ? `import_programs_from_pdf:${fileUrl}|${fileType}|${fileName}|${storageKey || ''}|${encodedText}`
          : action.action === 'import_merchandise'
          ? `import_merchandise_from_pdf:${fileUrl}|${fileType}|${fileName}|${storageKey || ''}|${encodedText}`
          : action.action === 'import_schedule'
          ? `import_schedule_from_pdf:${fileUrl}|${fileType}|${fileName}|${storageKey || ''}`
          : action.action === 'ask_kai'
          ? `ask_kai_about_doc:${fileUrl}|${fileType}|${fileName}|${storageKey || ''}`
          : action.action
      }));

      const analysisMessage: Message = {
        id: `doc-analysis-${Date.now()}`,
        role: 'assistant',
        content: result.success
          ? `I’ve read **${fileName}**. ${result.summary}\n\nWhat would you like me to do with it?`
          : `I received **${fileName}** but had trouble reading it. ${result.summary}`,
        timestamp: new Date(),
        quickReplies: quickReplies.length > 0 ? quickReplies : undefined
      };

      setMessages(prev => prev.map(m => m.id === readingMsgId ? analysisMessage : m));
    } catch (err: any) {
      const errorMessage: Message = {
        id: `doc-analysis-error-${Date.now()}`,
        role: 'assistant',
        content: `I received **${fileName}** but had trouble reading it. What would you like to do with it?`,
        timestamp: new Date(),
        quickReplies: [
          {
            label: '💬 Ask Kai about this document',
            action: `ask_kai_about_doc:${fileUrl}|${fileType}|${fileName}|${storageKey || ''}`
          },
          {
            label: '📊 Import as students',
            action: `import_students_from_pdf:${fileUrl}|${fileType}|${fileName}|${storageKey || ''}`
          },
          {
            label: '📝 Import as programs',
            action: `import_programs_from_pdf:${fileUrl}|${fileType}|${fileName}|${storageKey || ''}`
          }
        ]
      };
      setMessages(prev => prev.map(m => m.id === readingMsgId ? errorMessage : m));
    }
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
      
      const result = await extractScheduleMutation.mutateAsync({
        fileUrl,
        storageKey,
        fileType,
        fileName
      });
      
      
      if (result.success && result.classes.length > 0) {
        // If a conversation was created, navigate to it
        if (result.conversationId) {
          setSelectedConversationId(result.conversationId);
          
          // Refresh conversations to show the new one
          conversationsQuery.refetch();
          
          // Show success message
          const successMessage: Message = {
            id: `schedule-created-${Date.now()}`,
            role: 'assistant',
            content: `✅ Schedule import created! Check the **PENDING** column to review and approve ${result.classes.length} classes.`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev.filter(m => m.id !== analyzingMessage.id), successMessage]);
          return;
        }
        
        // Fallback: Store preview data and show approval modal (3rd screen)
        setSchedulePreview({
          classes: result.classes,
          fileName,
          confidence: result.confidence,
          warnings: result.warnings
        });
        
        // Show the approval modal
        setShowApprovalModal(true);
        
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
        
        successContent += `\n\n**Ready to review?** Open the approval screen to check/uncheck classes and approve the import.`;
        
        const successMessage: Message = {
          id: `extracted-${Date.now()}`,
          role: 'assistant',
          content: successContent,
          timestamp: new Date()
        };
        setMessages(prev => [...prev.filter(m => m.id !== analyzingMessage.id), successMessage]);
      } else {
        // Show detailed error message
        let errorContent = `Before I can import classes from **${fileName}**, I need a couple things to line up.`;
        
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
        content: `I wasn't able to read that file — let's make sure it's a valid Excel (.xlsx) or CSV file and try again.\n\n**Details:** ${errorMsg}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev.filter(m => m.id !== analyzingMessage.id), errorMessage]);
    } finally {
      setIsExtractingSchedule(false);
    }
  };

  // Handle student document import — parses any file and shows preview
  const handleStudentDocumentImport = async (fileUrl: string, fileType: string, fileName: string, storageKey?: string) => {
    setIsParsingStudents(true);
    setStudentThinkingMessages([
      'Reading document...',
      'Extracting student data...',
      'Parsing records...',
      'Validating information...'
    ]);
    
    const analyzingMessage: Message = {
      id: `parsing-students-${Date.now()}`,
      role: 'assistant',
      content: `Analyzing **${fileName}**... I'll extract the student records and show you a preview before anything is saved.`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, analyzingMessage]);

    try {
      const result = await parseStudentsMutation.mutateAsync({
        fileUrl,
        storageKey,
        fileType,
        fileName
      });

      if (result.success && result.students && result.students.length > 0) {
        setStudentImportPreview({
          students: result.students,
          fileName,
          source: result.source || 'document'
        });
        // Pre-select all rows
        setSelectedStudentRows(new Set(result.students.map((_: any, i: number) => i)));

        const previewMessage: Message = {
          id: `student-preview-${Date.now()}`,
          role: 'assistant',
          content: `I found **${result.students.length} student records** in **${fileName}**. Review the list below and uncheck any rows you don't want to import, then click **Import Students** to confirm.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev.filter(m => m.id !== analyzingMessage.id), previewMessage]);
      } else {
        const errorMessage: Message = {
          id: `student-parse-error-${Date.now()}`,
          role: 'assistant',
          content: result.error
            ? `I wasn't able to extract student records from **${fileName}**. \n\n**Reason:** ${result.error}\n\nTry a file with columns like: First Name, Last Name, Email, Phone, Belt Rank.`
            : `No student records were found in **${fileName}**. Make sure the file contains a student list with at least a first and last name column.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev.filter(m => m.id !== analyzingMessage.id), errorMessage]);
      }
    } catch (err: any) {
      const errorMessage: Message = {
        id: `student-parse-error-${Date.now()}`,
        role: 'assistant',
        content: `Something went wrong reading **${fileName}**. \n\n**Details:** ${err?.message || 'Unknown error'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev.filter(m => m.id !== analyzingMessage.id), errorMessage]);
    } finally {
      setIsParsingStudents(false);
      setStudentThinkingMessages([]);
    }
  };

  // Confirm and bulk-import selected students
  const handleConfirmStudentImport = async () => {
    if (!studentImportPreview) return;
    const studentsToImport = studentImportPreview.students.filter((_, i) => selectedStudentRows.has(i));
    if (studentsToImport.length === 0) {
      toast.error('No students selected. Check at least one row to import.');
      return;
    }
    setIsImportingStudents(true);
    try {
      const result = await bulkImportStudentsMutation.mutateAsync({ students: studentsToImport });
      if (result.success) {
        toast.success(`Successfully imported ${result.insertedCount} student${result.insertedCount !== 1 ? 's' : ''}!`);
        setStudentImportPreview(null);
        setSelectedStudentRows(new Set());

        // Message 1: import confirmation
        const successMessage: Message = {
          id: `student-import-done-${Date.now()}`,
          role: 'assistant',
          content: `**${result.insertedCount} student${result.insertedCount !== 1 ? 's' : ''} imported** successfully!${
            result.errors && result.errors.length > 0
              ? `\n\n**${result.errors.length} row${result.errors.length !== 1 ? 's' : ''} skipped:**\n${result.errors.slice(0, 5).join('\n')}`
              : ''
          }\n\nYour roster is live — head to the **Students** page to review it.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, successMessage]);

        // Message 2: schedule nudge (after a short delay so it feels like a natural follow-up)
        setTimeout(() => {
          const nudgeMessage: Message = {
            id: `schedule-nudge-${Date.now()}`,
            role: 'assistant',
            content: `Want to set up your **class schedule** next? Drop an Excel, CSV, or PDF file into the chat bar and I'll import it automatically — or I can walk you through creating classes one by one.`,
            timestamp: new Date(),
            quickReplies: [
              { label: '📅 Yes, import my schedule', action: 'open_schedule_import' },
              { label: 'Skip for now', action: 'dismiss_nudge' },
            ],
          };
          setMessages(prev => [...prev, nudgeMessage]);
        }, 1200);
      } else {
        toast.error('Import failed. Check the error details below.');
        const failMessage: Message = {
          id: `student-import-fail-${Date.now()}`,
          role: 'assistant',
          content: `Import failed.${result.errors ? `\n\n**Errors:**\n${result.errors.slice(0, 5).join('\n')}` : ''}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, failMessage]);
      }
    } catch (err: any) {
      toast.error(`Import failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsImportingStudents(false);
    }
  };

  // Handle creating classes from extracted schedule
  const handleCreateClasses = async (selectedClasses: ExtractedClass[]) => {
    setIsCreatingClasses(true);
    
    try {
      
      const result = await createClassesMutation.mutateAsync({
        classes: selectedClasses
      });
      
      
      if (result.success) {
        toast.success(`Successfully created ${result.createdCount} classes!`);
        setSchedulePreview(null);
        
        // Note: Classes page uses REST API (/api/classes), not tRPC
        // The page will refresh when user navigates to it
        
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
    // Clear any related state
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
    
    // Check subscription status before sending message
    // Don't show paywall while subscription status is still loading
    if (!subscriptionStatusLoading && shouldShowPaywall()) {
      setPaywallFeatureName('chat messages');
      setShowPaywall(true);
      return;
    }

    // --- KAI ONBOARDING INTERCEPTION ---
    // If onboarding is active, route the user's reply through the onboarding flow
    // instead of sending it to the AI. The hook will inject KAI's next question.
    if (isOnboardingActive && inputText.trim()) {
      // Show the user's message in the chat immediately
      const userMsg: Message = {
        id: `onboarding-user-${Date.now()}`,
        role: 'user',
        content: inputText.trim(),
        timestamp: new Date(),
        isOnboarding: true,
      };
      setMessages(prev => [...prev, userMsg]);
      setMessageInput('');
      setAttachments([]);
      // Let the hook process the reply and inject the next question
      await handleOnboardingReply(inputText.trim());
      return;
    }
     // --- END ONBOARDING INTERCEPTION ---

    // --- KAI TUTORIAL COMMAND INTERCEPT ---
    // If the input matches a smart command (e.g. "add student"), start the tutorial
    if (inputText.trim() && handleTutorialCommand(inputText.trim())) {
      setMessageInput('');
      setAttachments([]);
      return;
    }
    // --- END TUTORIAL COMMAND INTERCEPT ---

    // ─── KAI CREATIVE INTENT CLASSIFIER ────────────────────────────────────────
    // Replaces the old regex approach. Classifies every message before routing.
    const detectIntent = (
      text: string,
      hasAttachment = false
    ): 'creative_generation' | 'creative_edit' | 'data_query' | 'tutorial_help' | 'greeting' | 'unknown' => {
      const t = text.toLowerCase();
      // Creative generation keywords — use word-boundary matching for short/ambiguous words
      // to avoid false positives (e.g. 'ad' matching 'add', 'make' matching 'make a reservation')
      const creativeSubstring = [
        'flyer', 'poster', 'graphic', 'banner',
        'rack card', 'postcard', 'brochure',
        'instagram post', 'instagram story', 'facebook ad',
        'social media', 'promo image', 'promotional image',
        'marketing image', 'marketing flyer', 'marketing graphic',
        'artwork', 'illustration', 'advertisement',
      ];
      // Whole-word-only keywords — must be surrounded by word boundaries
      const creativeWholeWord = [
        'create', 'design', 'generate',
        'ad', 'logo', 'image', 'photo', 'picture', 'visual',
      ];
      // 'make' only triggers creative if followed by a creative noun
      const makesCreative = /\bmake\s+(a\s+)?(flyer|poster|graphic|banner|image|photo|logo|ad\b|advertisement)/i.test(t);
      const editKeywords = [
        'edit', 'change', 'remove background', 'add logo',
        'resize', 'improve', 'make this premium', 'put my logo',
        'add my logo', 'fix this', 'update this', 'enhance',
      ];
      const isCreative = creativeSubstring.some(k => t.includes(k)) ||
        creativeWholeWord.some(k => new RegExp(`\\b${k}\\b`).test(t)) ||
        makesCreative;
      if (isCreative) return 'creative_generation';
      if (hasAttachment || editKeywords.some(k => t.includes(k))) return 'creative_edit';
      if (t.includes('how many') || t.includes('count') || t.includes('show me') || t.includes('list')) return 'data_query';
      if (t.includes('how do i') || t.includes('show me how') || t.includes('tutorial')) return 'tutorial_help';
      if (t.includes('hello') || t.includes('hi') || t.includes('hey')) return 'greeting';
      return 'unknown';
    };

    // Parse format/size from the prompt.
    // IMPORTANT: Only return values the backend enum accepts:
    //   instagram_post | instagram_story | facebook_ad | flyer | website_banner
    // Natural-language formats like "rack card", "postcard", "brochure" all map to "flyer".
    const parseSize = (text: string): string => {
      const t = text.toLowerCase();
      // Rack card / postcard / brochure / general print → flyer
      if (
        t.includes('4x9') || t.includes('rack card') ||
        t.includes('4x6') || t.includes('postcard') ||
        t.includes('brochure') || t.includes('flyer') ||
        t.includes('poster') || t.includes('print')
      ) return 'flyer';
      if (t.includes('instagram story') || t.includes('ig story')) return 'instagram_story';
      if (t.includes('instagram post') || t.includes('ig post') || t.includes('instagram')) return 'instagram_post';
      if (t.includes('facebook ad') || t.includes('fb ad') || t.includes('facebook')) return 'facebook_ad';
      if (t.includes('website banner') || t.includes('web banner') || t.includes('banner')) return 'website_banner';
      return 'flyer'; // safe default — never pass raw user text
    };
    // Keep backward-compat alias used in the generation block below
    const parseFormatFromPrompt = parseSize;

    // Build a human-friendly ack message based on what the user asked for.
    // Uses the *original* user text to detect intent labels (e.g. "rack card style flyer")
    // while parseSize() handles the actual enum mapping separately.
    const buildCreativeAck = (text: string): string => {
      const t = text.toLowerCase();
      // Derive a human label from the *original* text, not the enum value
      let humanLabel = 'image';
      if (t.includes('4x9') || t.includes('rack card')) humanLabel = 'rack card style flyer';
      else if (t.includes('4x6') || t.includes('postcard')) humanLabel = 'postcard style flyer';
      else if (t.includes('brochure')) humanLabel = 'brochure style flyer';
      else if (t.includes('instagram story') || t.includes('ig story')) humanLabel = 'Instagram Story';
      else if (t.includes('instagram post') || t.includes('ig post') || t.includes('instagram')) humanLabel = 'Instagram Post';
      else if (t.includes('facebook ad') || t.includes('fb ad') || t.includes('facebook')) humanLabel = 'Facebook Ad';
      else if (t.includes('website banner') || t.includes('web banner') || t.includes('banner')) humanLabel = 'website banner';
      else if (t.includes('flyer') || t.includes('poster')) humanLabel = 'flyer';
      // Extract program name after "for"
      const programMatch = t.match(/for\s+([a-z][a-z\s]{1,38}?)(?:\s+(?:program|class|camp|students|kids|adults))?(?:[.,]|$)/i);
      const program = programMatch ? programMatch[1].trim() : null;
      if (program && program.length >= 2 && program.length < 40) {
        const cap = program.charAt(0).toUpperCase() + program.slice(1);
        return `Got it — I’m creating a ${humanLabel} for ${cap} now. This takes about 10–15 seconds.`;
      }
      return `Got it — I’m creating that ${humanLabel} now. This takes about 10–15 seconds.`;
    };

    const hasImageAttachments = inputAttachments.some(
      att => att.fileType?.startsWith('image/') && att.url && !att.uploading && !att.error
    );
    const chatIntent = detectIntent(inputText.trim(), hasImageAttachments);

    // ─── CREATIVE EDIT ROUTE (uploaded image + edit prompt) ─────────────────────
    const imageAttachments = inputAttachments.filter(
      att => att.fileType?.startsWith('image/') && att.url && !att.uploading && !att.error
    );
    // Detect if the user wants to ANALYZE/READ the image (vision) vs EDIT it (creative)
    const visionKeywords = ['read', 'analyze', 'analyse', 'what is', 'what does', 'what do', 'what are', 'describe', 'tell me', 'import', 'extract', 'schedule', 'class', 'student', 'roster', 'list', 'show me', 'can you see', 'look at', 'check', 'review', 'scan', 'recognize', 'identify', 'find', 'who is', 'how many'];
    const isVisionIntent = imageAttachments.length > 0 && (
      inputText.trim().length === 0 || // No text = just dropped image, analyze it
      visionKeywords.some(k => inputText.toLowerCase().includes(k))
    );
    const isCreativeEditIntent = !isVisionIntent && ((imageAttachments.length > 0 && inputText.trim().length > 2) || chatIntent === 'creative_edit');

    // ─── VISION ANALYSIS ROUTE (dropped image for Kai to read/analyze) ──────────
    if (isVisionIntent) {
      const firstImage = imageAttachments[0];
      const userMsg: Message = {
        id: (messageIdCounterRef.current++).toString(),
        role: 'user',
        content: inputText.trim() || 'Please analyze this image.',
        timestamp: new Date(),
        attachments: [...inputAttachments],
      };
      setMessages(prev => [...prev, userMsg]);
      setMessageInput('');
      setAttachments([]);
      setIsLoading(true);

      const ackMsg: Message = {
        id: (messageIdCounterRef.current++).toString(),
        role: 'assistant',
        content: `Got it — analyzing your image now...`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, ackMsg]);

      try {
        const stats = statsQuery.data;
        const historyMessages = messages
          .filter(m => !(m as any).isOnboarding)
          .slice(-20)
          .map(m => ({
            role: m.role as 'user' | 'assistant' | 'system',
            content: typeof m.content === 'string' ? m.content : String(m.content),
          }));
        const visionPayload = {
          message: inputText.trim() || 'Please analyze this image. If it contains a class schedule, extract all classes with their times, days, programs, locations, and instructors. If it contains student data, extract the student information.',
          organizationId: 1,
          conversationHistory: historyMessages,
          imageUrl: firstImage.url,
          context: stats ? {
            totalStudents: stats.totalStudents,
            activeStudents: stats.activeStudents,
            totalLeads: stats.totalLeads,
            totalClasses: stats.totalClasses
          } : undefined
        };
        const response = await kaiChatMutation.mutateAsync(visionPayload);

        // Generate TTS if voice is enabled
        let audioUrl: string | undefined;
        if (voiceEnabled) {
          try {
            const ttsResult = await generateSpeechMutation.mutateAsync({ text: response.response });
            if (ttsResult.success) audioUrl = ttsResult.audioUrl;
          } catch (e) { /* TTS optional */ }
        }

        // Replace the ack message with the real response
        // Also check ui_blocks for schedule_import data (server may put it there)
        const visionScheduleBlock = (response.ui_blocks || []).find((b: any) => b.type === 'schedule_import');
        const visionScheduleData = (response as any).scheduleImportData || (visionScheduleBlock ? visionScheduleBlock.data : undefined);

        // Strip any [SCHEDULE_JSON:{...}] block from the visible response text
        const cleanedVisionResponse = stripScheduleJson(response.response);

        // Detect task completion for review prompt
        const visionCompletionPhrases = ['done!', 'completed!', 'finished!', 'set up', 'successfully', 'has been', "i've", 'imported', 'created', 'added', 'scheduled'];
        const visionIsTaskCompletion = visionCompletionPhrases.some(p => cleanedVisionResponse.toLowerCase().includes(p));
        const visionReviewRequest = visionIsTaskCompletion ? {
          taskSummary: (inputText.trim() || 'Image analysis').slice(0, 120),
          taskType: 'schedule',
          creditsUsed: 0,
        } : undefined;

        setMessages(prev => {
          const withoutAck = prev.filter(m => m.id !== ackMsg.id);
          return [...withoutAck, {
            id: (messageIdCounterRef.current++).toString(),
            role: 'assistant' as const,
            content: cleanedVisionResponse,
            timestamp: new Date(),
            audioUrl,
            scheduleImportData: visionScheduleData,
            reviewRequest: (response as any).reviewRequest || visionReviewRequest,
          }];
        });
      } catch (err: any) {
        setMessages(prev => {
          const withoutAck = prev.filter(m => m.id !== ackMsg.id);
          return [...withoutAck, {
            id: (messageIdCounterRef.current++).toString(),
            role: 'assistant' as const,
            content: `I couldn't analyze that image. Please try again or describe what you'd like me to do with it.`,
            timestamp: new Date(),
          }];
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }
    // --- END VISION ANALYSIS ROUTE ---

    if (isCreativeEditIntent) {
      const firstImage = imageAttachments[0];
      // Convert image URL to base64 for the API
      const fetchBase64 = async (url: string): Promise<string> => {
        if (url.startsWith('data:')) {
          return url.split(',')[1];
        }
        const resp = await fetch(url);
        const blob = await resp.blob();
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      };

      const userMsg: Message = {
        id: (messageIdCounterRef.current++).toString(),
        role: 'user',
        content: inputText.trim(),
        timestamp: new Date(),
        attachments: [...inputAttachments],
      };
      setMessages(prev => [...prev, userMsg]);
      setMessageInput('');
      setAttachments([]);
      setIsLoading(true);

      const ackMsg: Message = {
        id: (messageIdCounterRef.current++).toString(),
        role: 'assistant',
        content: `Got your image! Editing it now — this takes about 10–15 seconds.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, ackMsg]);

      try {
        const base64 = await fetchBase64(firstImage.url);
        const result = await generateFromChatMutation.mutateAsync({
          prompt: inputText.trim(),
          size: 'instagram_post',
          sourceImageBase64: base64,
          sourceMimeType: firstImage.fileType || 'image/png',
        });

        const cardData: CreativePreviewCardData = {
          imageUrl: result.imageUrl,
          imageBase64: result.imageBase64,
          mimeType: result.mimeType,
          prompt: result.prompt,
          size: result.size,
          assetId: result.assetId,
          savedToLibrary: result.savedToLibrary,
        };

        const creativeMsg: Message = {
          id: (messageIdCounterRef.current++).toString(),
          role: 'assistant',
          content: result.savedToLibrary
            ? `Here's your edited image! Saved to Creative Library.`
            : `Here's your edited image!`,
          timestamp: new Date(),
          creativeImage: cardData,
        };
        setMessages(prev => [...prev, creativeMsg]);
      } catch (err: any) {
        const errMsg: Message = {
          id: (messageIdCounterRef.current++).toString(),
          role: 'assistant',
          content: `Before I get started on that edit, I just need a couple quick details — try rephrasing what you'd like changed, or head to the Edit Image tab in Kai Creative.`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errMsg]);
      } finally {
        setIsLoading(false);
      }
      return;
    }
    // --- END UPLOADED IMAGE ROUTE ---

     // ─── CREATIVE GENERATION ROUTE ──────────────────────────────────────────
    // Fires when detectIntent() returns 'creative_generation' (no image attachment)
    if (chatIntent === 'creative_generation') {
      const userMsg: Message = {
        id: (messageIdCounterRef.current++).toString(),
        role: 'user',
        content: inputText.trim(),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMsg]);
      setMessageInput('');
      setAttachments([]);
      setIsLoading(true);
      const detectedSize = parseFormatFromPrompt(inputText.trim());

      // ── Extract program/audience context from recent conversation history ──
      // When the user says "create the flyer now" without repeating the details,
      // scan the last 10 messages to find program and audience they already provided.
      const extractBriefFromHistory = (): Record<string, string> => {
        const recentMessages = messages.slice(-10);
        const conversationText = recentMessages
          .filter(m => m.role === 'user')
          .map(m => m.content)
          .join(' ');
        const answers: Record<string, string> = {};
        // Extract program — look for "for our X class", "for X program", "X class", etc.
        const programPatterns = [
          /for\s+(?:our\s+)?([a-z][a-z\s]{1,40}?)\s+(?:class|program|camp|course)/i,
          /(?:class|program)\s+(?:is\s+)?(?:called\s+)?([a-z][a-z\s]{1,40})/i,
          /(?:little ninjas|ninja|kickboxing|karate|taekwondo|bjj|jiu.jitsu|muay thai|boxing|wrestling|judo|mma|self.?defense|fitness|yoga|gymnastics|dance)/i,
        ];
        for (const pattern of programPatterns) {
          const match = conversationText.match(pattern);
          if (match) {
            answers.program = match[1]?.trim() || match[0]?.trim() || '';
            break;
          }
        }
        // Extract audience — look for "ages X-Y", "age X", "kids", "adults", etc.
        const audiencePatterns = [
          /ages?\s+[\d–\-]+(?:\s*[–\-]\s*[\d]+)?/i,
          /\d+\s*(?:to|–|-|and)\s*\d+\s*(?:year|yr)/i,
          /(?:kids|children|toddlers?|adults?|teens?|teenagers?|seniors?|youth|beginners?)/i,
        ];
        for (const pattern of audiencePatterns) {
          const match = conversationText.match(pattern);
          if (match) {
            answers.audience = match[0]?.trim() || '';
            break;
          }
        }
        return answers;
      };

      const historyBriefAnswers = extractBriefFromHistory();
      // Merge current prompt text into a richer prompt that includes history context
      const historyContext = [
        historyBriefAnswers.program ? `Program: ${historyBriefAnswers.program}` : '',
        historyBriefAnswers.audience ? `Audience: ${historyBriefAnswers.audience}` : '',
      ].filter(Boolean).join(', ');
      const enrichedPromptText = historyContext
        ? `${inputText.trim()} (${historyContext})`
        : inputText.trim();

      try {
        const result = await generateFromChatMutation.mutateAsync({
          prompt: enrichedPromptText,
          size: detectedSize,
          briefAnswers: Object.keys(historyBriefAnswers).length > 0 ? historyBriefAnswers : undefined,
        });

        const cardData: CreativePreviewCardData = {
          imageUrl: result.imageUrl,
          imageBase64: result.imageBase64,
          mimeType: result.mimeType,
          prompt: result.prompt,
          size: result.size,
          assetId: result.assetId,
          savedToLibrary: result.savedToLibrary,
        };

        const fmtLabel = detectedSize.replace(/_/g, ' ');
        const creativeMsg: Message = {
          id: (messageIdCounterRef.current++).toString(),
          role: 'assistant',
          content: result.savedToLibrary
            ? `Done. I saved this in Kai Creative — you can find it in your Creative Library.`
            : `Your ${fmtLabel} is ready. Tap Download to save it.`,
          timestamp: new Date(),
          creativeImage: cardData,
        };
        setMessages(prev => [...prev, creativeMsg]);
      } catch (err: any) {
        // Extract the server's gate message directly — it's already friendly
        const serverMsg = err?.message || err?.data?.message || '';
        const isGateBlock = serverMsg.includes('details') || serverMsg.includes('build this together') || serverMsg.includes('brief panel');
        // If we already tried to extract context from history and the gate still fired,
        // give a more specific prompt about what's still missing.
        let friendlyContent: string;
        if (isGateBlock) {
          const hasProgram = !!historyBriefAnswers.program;
          const hasAudience = !!historyBriefAnswers.audience;
          if (!hasProgram && !hasAudience) {
            friendlyContent = `To create this flyer, I need two quick details — what program is it for, and who\'s the audience?`;
          } else if (!hasProgram) {
            friendlyContent = `Almost there — which program is this flyer for? (e.g., Little Ninjas, Kickboxing, Adult Karate)`;
          } else if (!hasAudience) {
            friendlyContent = `Got the program! Who\'s the audience — what age group or skill level is this for?`;
          } else {
            friendlyContent = `I have the program and audience — just need one more detail: what\'s the key offer or call to action? (e.g., free trial, enroll now, limited spots)`;
          }
        } else {
          // Non-gate error — ask for the missing details directly instead of deflecting
          friendlyContent = `To generate this, I need a bit more context. What program is this for, and who's the target audience? (e.g., "Little Ninjas for kids ages 3–7" or "Adult Kickboxing, free trial offer")`;
        }
        const errMsg: Message = {
          id: (messageIdCounterRef.current++).toString(),
          role: 'assistant',
          content: friendlyContent,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errMsg]);
      } finally {
        setIsLoading(false);
      }
      return;
    }
    // ─── END CREATIVE INTENT INTERCEPT ──────────────────────────────────────────

    // CRITICAL: Prevent duplicate sends with in-flight lock
    if (sendingRef.current) {
      return;
    }
    if (!inputText.trim() && inputAttachments.length === 0) {
      return;
    }
    
    // Acquire the sending lock immediately to prevent race conditions
    sendingRef.current = true;
    
    // Check if any attachments are still uploading
    if (inputAttachments.some(att => att.uploading)) {
      sendingRef.current = false; // Release lock on early return
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

    // Store input before clearing
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
        sendingRef.current = false; // Release lock on early return
        return;
      }
    }
    
    // Optimistic UI update: Add user message to local state immediately with clientMessageId
    const clientMessageId = crypto.randomUUID();
    const optimisticUserMessage: Message = {
      id: clientMessageId,
      clientMessageId: clientMessageId, // Store for deduplication
      role: 'user',
      content: currentInput,
      timestamp: new Date(),
      ui_blocks: [],
      attachments: [...inputAttachments]
    };
    setMessages(prev => [...prev, optimisticUserMessage]);
    
    if (conversationId) {
      try {
        const messageResult = await addMessageMutation.mutateAsync({
          conversationId,
          role: 'user',
          content: currentInput,
          metadata: JSON.stringify({ clientMessageId })
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to save message';
        console.error('[handleSendMessage] Failed to save message:', errorMessage, error);
        toast.error(`Failed to save message: ${errorMessage}`);
        // Remove the optimistic message on error
        setMessages(prev => prev.filter(m => m.id !== optimisticUserMessage.id));
        setIsLoading(false);
        sendingRef.current = false; // Release lock on early return
        return;
      }
    } else {
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
        // Build conversation history for context (last 20 messages, excluding onboarding)
        const historyMessages = messages
          .filter(m => !(m as any).isOnboarding)
          .slice(-20)
          .map(m => ({
            role: m.role as 'user' | 'assistant' | 'system',
            content: typeof m.content === 'string' ? m.content : String(m.content),
          }));
        // Check if there's pending schedule data in recent messages that should be passed to the server
        // This is needed because the SCHEDULE_JSON block is stripped from the cleaned response in history
        const importKeywords = ['put this in', 'place this', 'add this', 'import this', 'save this',
          'put these', 'place these', 'add these', 'import these', 'save these',
          'put it in', 'place it', 'add it to classes', 'save to classes',
          'add to classes', 'put in classes', 'place in classes',
          'can you place', 'please place', 'can you add', 'please add'];
        const isImportMsg = importKeywords.some(k => currentInput.toLowerCase().includes(k));
        const pendingScheduleData = isImportMsg
          ? messages.slice().reverse().find(m => m.role === 'assistant' && m.scheduleImportData)?.scheduleImportData
          : undefined;

        const payload: any = {
          message: currentInput,
          organizationId: 1, // TODO: Get from user context when multi-org is implemented
          conversationHistory: historyMessages,
          context: stats ? {
            totalStudents: stats.totalStudents,
            activeStudents: stats.activeStudents,
            totalLeads: stats.totalLeads,
            totalClasses: stats.totalClasses
          } : undefined,
          ...(pendingScheduleData ? { pendingScheduleData } : {}),
        };
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
            } else {
              console.error('[KaiCommand] TTS generation failed:', ttsResult.error);
            }
          } catch (error) {
            console.error('[KaiCommand] TTS error:', error);
          }
        }

        // Strip any leaked [SCHEDULE_JSON:{...}] block before storing in message state
        const cleanedResponse = stripScheduleJson(response.response);

        const aiMessage: Message = {
          id: (messageIdCounterRef.current++).toString(),
          role: 'assistant',
          content: cleanedResponse,
          timestamp: new Date(),
          attachments: response.attachments || [],
          audioUrl,
          audioDuration,
          ui_blocks: response.ui_blocks || [],
          pendingAction: (response as any).pendingAction,
          quickReplies: (response as any).quickReplies,
          scheduleImportData: (response as any).scheduleImportData || undefined,
          reviewRequest: (response as any).reviewRequest || undefined,
          viewClassesLink: (response as any).viewClassesLink || undefined,
          importedClassCount: (response as any).importedClassCount || undefined,
        };
        setMessages(prev => [...prev, aiMessage]);
        
        // Parse response for structured data to populate InfoPanel
        const infoPanelContent = parseResponse(response.response);
        if (infoPanelContent) {
          setInfoPanelData(infoPanelContent);
          setInfoPanelOpen(true);
        }

        // If a tool updated the user's name, refresh auth so the UI reflects the change
        if ((response as any).refresh_user) {
          refreshAuth();
        }
        
        // Set current speech message ID for voice controls
        if (voiceEnabled && audioUrl) {
          setCurrentSpeechMessageId(aiMessage.id);
        }

        // Save AI response to database
        if (conversationId) {
          try {
            const aiMessageResult = await addMessageMutation.mutateAsync({
              conversationId,
              role: 'assistant',
              content: response.response,
              metadata: JSON.stringify({
                ui_blocks: response.ui_blocks || [],
                audioUrl,
                audioDuration
              })
            });
            // Refresh conversations to update preview
            await utils.kai.getConversations.invalidate();
          } catch (error) {
            console.error('[handleSendMessage] Failed to save AI message:', error);
            toast.error('Failed to save AI response to database');
          }
        } else {
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
        console.error('[SEND] error', error);
      } finally {
        // CRITICAL: Always reset sending lock in finally block
        sendingRef.current = false;
        setIsLoading(false);
        // Maintain input focus after send
        setTimeout(() => {
          messageInputRef.current?.focus();
        }, 100);
      }
    } else {
      // No Kai response in group conversation without @Kai mention
      setIsLoading(false);
      // Remove from pending set
      pendingMessageIdsRef.current.delete(messageId);
      // Release lock
      sendingRef.current = false;
      // Maintain input focus
      setTimeout(() => {
        messageInputRef.current?.focus();
      }, 100);
      if (staffMentions.length === 0) {
        // No mentions at all in group conversation - show hint
        toast.info('In group conversations, use @Kai to get AI assistance or @Staff to message team members');
      }
    }
  };

  // Removed handleKeyPress - Enter key is now handled by MentionInput.tsx via form.requestSubmit()

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
    return 'bg-white'; // Light mode: clean white background
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
    localStorage.setItem('kai_beta_notice_v0.9.6', 'true');
    setShowBetaNotice(false);
    navigate('/changelog');
  };

  const handleSkipNotice = () => {
    localStorage.setItem('kai_beta_notice_v0.9.6', 'true');
    setShowBetaNotice(false);
  };

  return (
    <>
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
      
      <div ref={containerRef} className={`kai-command-page w-full overflow-hidden ${getKaiCommandBgClass()} ${!isDark && !isCinematic && !isFocusMode ? 'kaiLightCommandCenter' : ''} ${isCinematic ? 'brightness-[0.85]' : ''} ${isFocusMode ? 'focus-mode fixed inset-0 z-50' : ''} transition-all duration-500 ease-in-out`} style={{
        display: 'grid',
        height: 'calc(100vh - var(--topbar-h, 56px) - var(--bottomnav-h, 72px))',
        maxHeight: 'calc(100vh - var(--topbar-h, 56px) - var(--bottomnav-h, 72px))',
        gridTemplateColumns: managementPanelOpen 
          ? `${isFocusMode ? 0 : effectiveCommandWidth}px ${effectiveCommandWidth === 0 ? '0px' : '8px'} minmax(${isMobile ? '100%' : '520px'}, 1fr) ${isMobile ? '0px' : 'clamp(360px, 30vw, 520px)'}`
          : `${isFocusMode ? 0 : effectiveCommandWidth}px ${effectiveCommandWidth === 0 ? '0px' : '8px'} 1fr`,
        gridAutoFlow: 'column',
        transition: 'grid-template-columns 0.3s ease-in-out'
      }}>
        {/* Command Center - Left Panel - Floating Module Style */}
        {/* Sidebar: fixed width, z-index 20 to stay above main content but below modals */}
        <div 
          style={{ 
            width: isFocusMode ? '0px' : `${effectiveCommandWidth}px`,
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
          className="flex-1 flex flex-col relative min-w-0 min-h-0 overflow-hidden bg-transparent"
          style={{ 
            zIndex: LAYOUT_CONSTANTS.chatZIndex, 
            position: 'relative', 
            height: '100%',
            paddingBottom: '0px'
          }}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Drag-and-drop overlay — context-aware */}
          {isDragging && (() => {
            const lastMsg = messages[messages.length - 1];
            const isPhotoStep = isOnboardingActive && lastMsg?.showPhotoUpload;
            return (
              <div
                className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
                style={{
                  background: isPhotoStep
                    ? (isDark || isCinematic ? 'rgba(10,10,11,0.93)' : 'rgba(255,255,255,0.93)')
                    : (isDark || isCinematic ? 'rgba(10,10,11,0.95)' : 'rgba(250,251,252,0.95)')
                }}
              >
                {isPhotoStep ? (
                  <div className={`flex flex-col items-center gap-5 p-10 rounded-2xl border-2 border-dashed ${
                    isDark || isCinematic ? 'border-[#FF4C4C]/60 bg-[#FF4C4C]/5' : 'border-[#FF4C4C]/50 bg-[#FF4C4C]/5'
                  }`}>
                    <div className="relative">
                      <div className={`w-24 h-24 rounded-full border-2 border-dashed flex items-center justify-center ${
                        isDark || isCinematic ? 'border-[#FF4C4C]/70 bg-[#FF4C4C]/10' : 'border-[#FF4C4C]/60 bg-[#FF4C4C]/8'
                      }`}>
                        <svg className="w-10 h-10 text-[#FF4C4C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className={`text-base font-bold tracking-wide ${
                        isDark || isCinematic ? 'text-white' : 'text-slate-800'
                      }`}>
                        Drop your photo here
                      </p>
                      <p className={`text-xs mt-1 ${
                        isDark || isCinematic ? 'text-white/50' : 'text-slate-400'
                      } uppercase tracking-wider`}>
                        JPG · PNG · WEBP · GIF
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className={`flex flex-col items-center gap-4 p-8 rounded-sm border border-dashed ${
                    isDark || isCinematic ? 'border-white/30 bg-white/5' : 'border-slate-300 bg-white'
                  }`}>
                    <div className={`w-16 h-16 rounded-sm flex items-center justify-center ${
                      isDark || isCinematic ? 'bg-white/10' : 'bg-slate-100'
                    }`}>
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
                )}
              </div>
            );
          })()}
          {/* ENVIRONMENT LAYER - Single clean backdrop for Cinematic mode */}
          {isCinematic && (
            <div 
              className="environment-layer pointer-events-none overflow-hidden"
              style={{ 
                zIndex: LAYOUT_CONSTANTS.backdropZIndex,
                position: isFocusMode ? 'fixed' : 'absolute',
                inset: 0
              }}
            >
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
                  top: '-5%',
                  left: '-5%',
                  right: '-5%',
                  bottom: '-5%',
                  width: '110%',
                  height: '110%'
                }}
              />
              {/* Single overlay for readability */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: currentEnvironment.overlayColor,
                  transition: 'background 0.4s ease-out'
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
              {isMobile ? 'COMMAND CENTER' : 'COMMAND CENTER • OPERATIONAL STATUS: ACTIVE • ALL SYSTEMS NOMINAL'}
            </p>
            <div className="flex items-center gap-1">
              {/* Mobile: Ops list toggle button */}
              {isMobile && (
                <button
                  onClick={() => setMobileOpsOpen(prev => !prev)}
                  className={`h-8 w-8 flex items-center justify-center rounded-md transition-colors ${isDark || isCinematic ? 'hover:bg-white/10 text-white/70' : 'hover:bg-slate-100 text-slate-600'}`}
                  title="Operations list"
                >
                  <Menu className="w-4 h-4" />
                </button>
              )}
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

          {/* KAI Onboarding Progress Bar — shown only during active onboarding */}
          {isOnboardingActive && onboardingTotalSteps > 0 && (() => {
            const pct = Math.round((onboardingStepNumber / onboardingTotalSteps) * 100);
            const sectionLabels: Record<string, string> = {
              name: '🥋 Identity Setup', title: '🥋 Identity Setup', profile_photo: '🥋 Identity Setup',
              programs: '🏫 School Setup', rank: '🏫 School Setup', school_name: '🏫 School Setup',
              display_name: '🏫 School Setup', tagline: '🏫 School Setup', martial_style: '🏫 School Setup',
              address: '📍 Location Setup', city_state_zip: '📍 Location Setup', country: '📍 Location Setup',
              phone: '📞 Contact Setup', email: '📞 Contact Setup', website: '📞 Contact Setup',
              logo_light: '🎨 Branding Setup', logo_dark: '🎨 Branding Setup',
              icon_logo_light: '🎨 Branding Setup', icon_logo_dark: '🎨 Branding Setup',
              brand_colors: '🎨 Branding Setup',
              timezone: '⚙️ Preferences', currency: '⚙️ Preferences',
            };
            const sectionLabel = sectionLabels[onboardingCurrentStep] || 'Activation Sequence';
            return (
              <div className={`px-4 py-2 border-b ${
                isCinematic ? 'border-white/10 bg-black/30' : isDark ? 'border-white/10 bg-black/20' : 'border-slate-200 bg-slate-50'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-semibold ${
                    isCinematic || isDark ? 'text-[#FF4C4C]' : 'text-[#FF4C4C]'
                  }`}>
                    {sectionLabel}
                  </span>
                  <span className={`text-xs font-mono ${
                    isCinematic || isDark ? 'text-white/50' : 'text-slate-400'
                  }`}>
                    {pct}% — Step {onboardingStepNumber} of {onboardingTotalSteps}
                  </span>
                </div>
                <div className={`h-1 rounded-full overflow-hidden ${
                  isCinematic || isDark ? 'bg-white/10' : 'bg-slate-200'
                }`}>
                  <div
                    className="h-full rounded-full bg-[#FF4C4C] transition-all duration-500 ease-out"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })()}

          {/* CONTENT LAYER - Messages Area (Row 2 of 3-row layout) */}
          {/* This is the scrollable middle zone - flex-1 takes remaining space */}
          {/* Composer is now a separate flex item below, so we don't need excessive bottom padding */}
          {/* Small pb-4 just for visual breathing room above the composer */}
          <div 
            ref={scrollContainerRef}
            className={`content-layer flex-1 min-h-0 relative w-full overflow-y-auto scrollbar-visible ${isFocusMode ? 'pt-16' : isCinematic ? 'pt-6' : 'pt-6'}`}
            style={{ 
              zIndex: 10,
              paddingBottom: '140px'
            }}
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
                          <UserAvatar photoUrl={user?.photoUrl} name={user?.preferredName || user?.name} size="sm" />
                          <div className="flex-1">
                            <div 
                              className={`font-medium mb-1`}
                              style={(isCinematic || isFocusMode) ? { color: '#FFFFFF', textShadow: '0 1px 3px rgba(0,0,0,0.9)' } : isDark ? { color: 'white' } : { color: '#0f172a' }}
                            >{user?.preferredName || user?.name || 'You'}</div>
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
                            <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/RWtkCgdJjxxOQJjI.png" alt="Kai" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 flex flex-col min-w-0">
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
                            {/* Schedule Import Action Buttons */}
                            {message.metadata && (() => {
                              try {
                                const metadata = typeof message.metadata === 'string' ? JSON.parse(message.metadata) : message.metadata;
                                if (metadata.extractedClasses && metadata.extractedClasses.length > 0) {
                                  return (
                                    <div className="mt-4 flex gap-2">
                                      <button
                                        onClick={async () => {
                                          try {
                                            setIsCreatingClasses(true);
                                            const result = await createClassesMutation.mutateAsync({
                                              classes: metadata.extractedClasses.filter((c: any) => !c.isDuplicate)
                                            });
                                            
                                            if (result.success) {
                                              toast.success(`Successfully imported ${result.createdCount} classes`);
                                              // Archive the conversation
                                              await archiveConversationMutation.mutateAsync({ id: selectedConversationId! });
                                              conversationsQuery.refetch();
                                            } else {
                                              toast.error(result.error || 'Failed to import classes');
                                            }
                                          } catch (error: any) {
                                            toast.error(error.message || 'Failed to import classes');
                                          } finally {
                                            setIsCreatingClasses(false);
                                          }
                                        }}
                                        disabled={isCreatingClasses}
                                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        {isCreatingClasses ? 'Importing...' : '✓ Approve & Import'}
                                      </button>
                                      <button
                                        onClick={async () => {
                                          try {
                                            await archiveConversationMutation.mutateAsync({ id: selectedConversationId! });
                                            toast.success('Schedule import rejected');
                                            conversationsQuery.refetch();
                                          } catch (error: any) {
                                            toast.error('Failed to reject import');
                                          }
                                        }}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                                      >
                                        ✗ Reject
                                      </button>
                                    </div>
                                  );
                                }
                              } catch (e) {
                                console.error('[KaiCommand] Error parsing message metadata:', e);
                              }
                              return null;
                            })()}
                            
                            {/* Onboarding: Action buttons — Back / Skip / Restart */}
                            {message.isOnboarding && (message.showSkip || message.showBack) && !message.expectsFileUpload && !message.showLogoUpload && !message.showPhotoUpload && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {/* Back button */}
                                {message.showBack && (
                                  <button
                                    onClick={() => handleOnboardingGoBack()}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors border ${
                                      isDark ? 'border-white/20 text-white/60 hover:text-white/90 hover:bg-white/5' : 'border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                    }`}
                                  >
                                    ← Back
                                  </button>
                                )}
                                {/* Skip current step */}
                                {message.showSkip && message.onboardingStep !== 'idle' && (
                                  <button
                                    onClick={() => handleOnboardingReply('skip')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors border ${
                                      isDark ? 'border-white/20 text-white/60 hover:text-white/90 hover:bg-white/5' : 'border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                    }`}
                                  >
                                    Skip
                                  </button>
                                )}
                                {/* Skip entire onboarding (greeting message only) */}
                                {message.onboardingStep === 'idle' && (
                                  <>
                                    <button
                                      onClick={() => skipOnboarding()}
                                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors border ${
                                        isDark ? 'border-white/20 text-white/60 hover:text-white/90 hover:bg-white/5' : 'border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                      }`}
                                    >
                                      Skip activation for now
                                    </button>
                                    <button
                                      onClick={() => restartKaiOnboarding()}
                                      className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors border border-[#FF4C4C]/40 text-[#FF4C4C] hover:bg-[#FF4C4C]/10"
                                    >
                                      Restart Activation
                                    </button>
                                  </>
                                )}
                              </div>
                            )}

                            {/* Onboarding: File upload button + skip button for logo steps */}
                            {message.isOnboarding && message.showLogoUpload && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                <input
                                  type="file"
                                  accept="image/png,image/svg+xml,image/jpeg,image/webp"
                                  className="hidden"
                                  ref={onboardingFileInputRef}
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const uploadType = message.logoUploadType || (
                                      message.onboardingStep === 'logo_dark' ? 'dark' :
                                      message.onboardingStep === 'icon_logo_light' ? 'icon-light' :
                                      message.onboardingStep === 'icon_logo_dark' ? 'icon-dark' :
                                      'light'
                                    );
                                    // Show user message with filename
                                    setMessages(prev => [...prev, {
                                      id: `onboarding-user-logo-${Date.now()}`,
                                      role: 'user',
                                      content: `📎 Uploaded: ${file.name}`,
                                      timestamp: new Date(),
                                      isOnboarding: true,
                                    } as Message]);
                                    await handleOnboardingLogoUpload(file, uploadType);
                                    e.target.value = '';
                                  }}
                                />
                                <button
                                  onClick={() => {
                                    onboardingFileInputRef.current?.click();
                                  }}
                                  className="flex items-center gap-2 px-4 py-2 bg-[#FF4C4C] hover:bg-[#FF5E5E] text-white rounded-lg font-medium text-sm transition-colors"
                                >
                                  <Upload className="w-4 h-4" />
                                  Upload Logo
                                </button>
                                {message.showSkip && (
                                  <button
                                    onClick={() => handleOnboardingReply('skip')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors border ${
                                      isDark ? 'border-white/20 text-white/60 hover:text-white/90 hover:bg-white/5' : 'border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                    }`}
                                  >
                                    Skip
                                  </button>
                                )}
                                {message.showBack && (
                                  <button
                                    onClick={() => handleOnboardingGoBack()}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors border ${
                                      isDark ? 'border-white/20 text-white/60 hover:text-white/90 hover:bg-white/5' : 'border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                    }`}
                                  >
                                    ← Back
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Onboarding: Profile photo upload button */}
                            {message.isOnboarding && message.showPhotoUpload && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                <input
                                  type="file"
                                  accept="image/png,image/jpeg,image/webp,image/gif"
                                  className="hidden"
                                  ref={onboardingPhotoInputRef}
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    setMessages(prev => [...prev, {
                                      id: `onboarding-user-photo-${Date.now()}`,
                                      role: 'user',
                                      content: `📎 Uploading photo: ${file.name}`,
                                      timestamp: new Date(),
                                      isOnboarding: true,
                                    } as Message]);
                                    await handleOnboardingPhotoUpload(file);
                                    e.target.value = '';
                                  }}
                                />
                                <button
                                  onClick={() => onboardingPhotoInputRef.current?.click()}
                                  className="flex items-center gap-2 px-4 py-2 bg-[#FF4C4C] hover:bg-[#FF5E5E] text-white rounded-lg font-medium text-sm transition-colors"
                                >
                                  <Upload className="w-4 h-4" />
                                  Upload Photo
                                </button>
                                <button
                                  onClick={() => skipOnboardingPhoto()}
                                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors border ${
                                    isDark ? 'border-white/20 text-white/60 hover:text-white/90 hover:bg-white/5' : 'border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                  }`}
                                >
                                  Skip
                                </button>
                                {message.showBack && (
                                  <button
                                    onClick={() => handleOnboardingGoBack()}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors border ${
                                      isDark ? 'border-white/20 text-white/60 hover:text-white/90 hover:bg-white/5' : 'border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                    }`}
                                  >
                                    ← Back
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Render Creative Image Card */}
                            {message.creativeImage && (
                              <div
                                className="mt-3 cursor-pointer"
                                onClick={() => {
                                  const img = message.creativeImage!;
                                  setResultsPanelData({
                                    type: 'creative_image',
                                    image: {
                                      imageUrl: img.imageUrl,
                                      imageBase64: img.imageBase64,
                                      mimeType: img.mimeType,
                                      prompt: img.prompt,
                                      size: img.size,
                                      assetId: img.assetId,
                                      savedToLibrary: img.savedToLibrary,
                                    },
                                  });
                                }}
                              >
                                <CreativePreviewCard
                                  data={message.creativeImage}
                                  onRetry={() => {
                                    handleSendMessage(message.creativeImage!.prompt, 'retry');
                                  }}
                                  onEdit={(_data) => {
                                    navigate('/kai/creative');
                                  }}
                                />
                                {/* View in Creative Library link */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate('/kai/creative');
                                  }}
                                  className={`mt-2 flex items-center gap-1.5 text-xs font-medium transition-colors ${
                                    isCinematic
                                      ? 'text-red-400 hover:text-red-300'
                                      : isDark
                                        ? 'text-red-400 hover:text-red-300'
                                        : 'text-red-600 hover:text-red-700'
                                  }`}
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  View in Creative Library
                                </button>
                              </div>
                            )}

                            {/* Render UI blocks (student cards, lists, etc.) */}
                            {message.ui_blocks && message.ui_blocks.length > 0 && (
                              <>
                                {console.log('[KaiCommand] Rendering ui_blocks for message:', message.id, message.ui_blocks)}
                                <UIBlockRenderer 
                                blocks={message.ui_blocks} 
                                onBlockClick={(block) => {
                                  // Open Management Panel for student cards
                                  if (block.type === 'student_card' && block.student) {
                                    setSelectedStudentId(block.student.id);
                                    setManagementPanelOpen(true);
                                    setStudentDetailsPanelOpen(false);
                                  } else if (block.type === 'student_card' && block.studentId) {
                                    setSelectedStudentId(block.studentId);
                                    setManagementPanelOpen(true);
                                    setStudentDetailsPanelOpen(false);
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
                              </>
                            )}
                          </div>
                        </>
                      )}
                      {/* Schedule Import Button + Review Card — shown side-by-side in a horizontal row */}
                      {(message.scheduleImportData?.classes?.length ?? 0) > 0 || message.reviewRequest ? (
                        <div className="mt-3 flex flex-row flex-wrap gap-3 items-start">
                      {message.scheduleImportData && message.scheduleImportData.classes && message.scheduleImportData.classes.length > 0 && (
                        <div className={`flex-1 min-w-[220px] p-3 rounded-xl border ${
                          isCinematic ? 'border-cyan-500/30 bg-cyan-950/30' :
                          isDark ? 'border-emerald-500/30 bg-emerald-950/30' :
                          'border-emerald-200 bg-emerald-50'
                        }`}>
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className={`text-sm font-semibold ${
                                isCinematic ? 'text-cyan-300' : isDark ? 'text-emerald-300' : 'text-emerald-800'
                              }`}>
                                📅 {message.scheduleImportData.classes.length} class{message.scheduleImportData.classes.length !== 1 ? 'es' : ''} detected
                              </p>
                              <p className={`text-xs mt-0.5 ${
                                isCinematic ? 'text-cyan-400/70' : isDark ? 'text-emerald-400/70' : 'text-emerald-600'
                              }`}>
                                {message.scheduleImportData.classes.slice(0, 3).map(c => c.name).join(', ')}{message.scheduleImportData.classes.length > 3 ? ` +${message.scheduleImportData.classes.length - 3} more` : ''}
                              </p>
                            </div>
                            <button
                              onClick={async () => {
                                if (!message.scheduleImportData) return;
                                const importingMsgId = `schedule-importing-${Date.now()}`;
                                setMessages(prev => [...prev, {
                                  id: importingMsgId,
                                  role: 'assistant',
                                  content: `Importing ${message.scheduleImportData!.classes.length} classes into your schedule…`,
                                  timestamp: new Date(),
                                }]);
                                // Clear the import button from this message
                                setMessages(prev => prev.map(m =>
                                  m.id === message.id ? { ...m, scheduleImportData: undefined } : m
                                ));
                                try {
                                  const result = await createClassesMutation.mutateAsync({
                                    classes: message.scheduleImportData!.classes,
                                  });
                                  setMessages(prev => prev.filter(m => m.id !== importingMsgId));
                                  if (result.success) {
                                    toast.success(`✅ ${result.createdCount} class${result.createdCount !== 1 ? 'es' : ''} added to your schedule!`);
                                    setMessages(prev => [...prev, {
                                      id: `schedule-imported-${Date.now()}`,
                                      role: 'assistant',
                                      content: `Done! I've added **${result.createdCount} class${result.createdCount !== 1 ? 'es' : ''}** to your schedule. Head to the **Classes** section to review them.`,
                                      timestamp: new Date(),
                                    }]);
                                  } else {
                                    toast.error(result.error || 'Failed to import classes');
                                    setMessages(prev => [...prev, {
                                      id: `schedule-error-${Date.now()}`,
                                      role: 'assistant',
                                      content: `I ran into an issue importing the classes: ${result.error || 'Unknown error'}. Please try again or add them manually.`,
                                      timestamp: new Date(),
                                    }]);
                                  }
                                } catch (err: any) {
                                  setMessages(prev => prev.filter(m => m.id !== importingMsgId));
                                  toast.error('Failed to import classes');
                                  setMessages(prev => [...prev, {
                                    id: `schedule-error-${Date.now()}`,
                                    role: 'assistant',
                                    content: `Something went wrong while importing. Please try again.`,
                                    timestamp: new Date(),
                                  }]);
                                }
                              }}
                              disabled={createClassesMutation.isLoading}
                              className={`shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                isCinematic
                                  ? 'bg-cyan-500 hover:bg-cyan-400 text-black'
                                  : isDark
                                  ? 'bg-emerald-500 hover:bg-emerald-400 text-white'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {createClassesMutation.isLoading ? 'Importing…' : `Import ${message.scheduleImportData.classes.length} Classes →`}
                            </button>
                          </div>
                        </div>
                      )}
                      {/* Post-task Review Card — shown after Kai completes a significant task */}
                      {message.reviewRequest && (
                        <div className="flex-1 min-w-[220px]">
                        <KaiReviewCard
                          taskSummary={message.reviewRequest.taskSummary}
                          taskType={message.reviewRequest.taskType}
                          creditsUsed={message.reviewRequest.creditsUsed}
                          conversationId={message.reviewRequest.conversationId}
                          isDark={isDark}
                          isCinematic={isCinematic}
                          onDismiss={() => {
                            setMessages(prev => prev.map(m =>
                              m.id === message.id ? { ...m, reviewRequest: undefined } : m
                            ));
                          }}
                          onSubmitted={(rating, ticketNumber) => {
                            // Clear the review card from this message
                            setMessages(prev => prev.map(m =>
                              m.id === message.id ? { ...m, reviewRequest: undefined } : m
                            ));
                          }}
                        />
                        </div>
                      )}
                        </div>
                      ) : null}
                      {/* View in Classes button — shown after a successful schedule auto-import */}
                      {message.viewClassesLink && (
                        <div className={`mt-3 flex items-center gap-3 p-3 rounded-xl border ${
                          isCinematic ? 'border-cyan-500/30 bg-cyan-950/20' :
                          isDark ? 'border-emerald-500/30 bg-emerald-950/20' :
                          'border-emerald-200 bg-emerald-50'
                        }`}>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold ${
                              isCinematic ? 'text-cyan-300' : isDark ? 'text-emerald-300' : 'text-emerald-800'
                            }`}>
                              ✅ {message.importedClassCount
                                ? `${message.importedClassCount} class${message.importedClassCount !== 1 ? 'es' : ''} added`
                                : 'Classes imported'}
                            </p>
                            <p className={`text-xs mt-0.5 ${
                              isCinematic ? 'text-cyan-400/70' : isDark ? 'text-emerald-400/70' : 'text-emerald-600'
                            }`}>
                              Tap to verify the schedule in the Classes section
                            </p>
                          </div>
                          <button
                            onClick={() => navigate('/classes')}
                            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                              isCinematic
                                ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40'
                                : isDark
                                ? 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700'
                            }`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                              <line x1="16" y1="2" x2="16" y2="6"/>
                              <line x1="8" y1="2" x2="8" y2="6"/>
                              <line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                            View in Classes
                          </button>
                        </div>
                      )}
                      {/* Quick-reply action buttons */}
                      {message.quickReplies && message.quickReplies.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {message.quickReplies.map((qr) => (
                            <button
                              key={qr.action}
                              onClick={async () => {
                                if (qr.action.startsWith('navigate:')) {
                                  const path = qr.action.replace('navigate:', '');
                                  navigate(path);
                                } else if (qr.action === 'open_schedule_import') {
                                  // Open the file picker pre-filtered to schedule files
                                  const input = document.createElement('input');
                                  input.type = 'file';
                                  input.accept = '.xlsx,.xls,.csv,.pdf';
                                  input.onchange = async (e) => {
                                    const file = (e.target as HTMLInputElement).files?.[0];
                                    if (file) {
                                      // Simulate dropping the file into the chat
                                      const dataTransfer = new DataTransfer();
                                      dataTransfer.items.add(file);
                                      const dropEvent = new DragEvent('drop', { dataTransfer, bubbles: true });
                                      // Trigger file upload via the existing fileInputRef path
                                      const fileInput = document.querySelector('input[type="file"][accept*="xlsx"]') as HTMLInputElement;
                                      if (fileInput) {
                                        Object.defineProperty(fileInput, 'files', { value: dataTransfer.files, writable: false });
                                        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
                                      } else {
                                        // Fallback: add a Kai message guiding the user
                                        setMessages(prev => [...prev, {
                                          id: `schedule-guide-${Date.now()}`,
                                          role: 'assistant',
                                          content: 'Click the **paperclip icon** in the chat bar below and select your schedule file (Excel, CSV, or PDF). I\'ll parse it and show you a preview before creating any classes.',
                                          timestamp: new Date(),
                                        }]);
                                      }
                                    }
                                  };
                                  input.click();
                                } else if (qr.action === 'dismiss_nudge') {
                                  // Remove the quick replies from this message
                                  setMessages(prev => prev.map(m =>
                                    m.id === message.id ? { ...m, quickReplies: [] } : m
                                  ));
                                  setMessages(prev => [...prev, {
                                    id: `skip-ack-${Date.now()}`,
                                    role: 'assistant',
                                    content: 'Got it! The file is attached to this conversation. Go ahead and ask me anything about it — I can read it and answer your questions.',
                                    timestamp: new Date(),
                                  }]);
                                } else if (qr.action.startsWith('import_students_from_pdf:')) {
                                  // Import students from a specific PDF that was already uploaded
                                  const pdfData = qr.action.replace('import_students_from_pdf:', '');
                                  const [fileUrl, fileType, fileName, storageKey] = pdfData.split('|');
                                  // Remove quick replies from this message
                                  setMessages(prev => prev.map(m =>
                                    m.id === message.id ? { ...m, quickReplies: [] } : m
                                  ));
                                  handleStudentDocumentImport(fileUrl, fileType, fileName, storageKey);
                                } else if (qr.action.startsWith('import_programs_from_pdf:')) {
                                  // Real programs import flow — extract structured data then show preview card
                                  const pdfData = qr.action.replace('import_programs_from_pdf:', '');
                                  const parts = pdfData.split('|');
                                  const [fileUrl, fileType, fileName, storageKey, encodedText] = parts;
                                  const extractedText = encodedText ? decodeURIComponent(encodedText) : undefined;
                                  setMessages(prev => prev.map(m =>
                                    m.id === message.id ? { ...m, quickReplies: [] } : m
                                  ));
                                  const extractingMsgId = `prog-extracting-${Date.now()}`;
                                  setMessages(prev => [...prev, {
                                    id: extractingMsgId,
                                    role: 'assistant',
                                    content: `Extracting program data from **${fileName}**…`,
                                    timestamp: new Date()
                                  }]);
                                  try {
                                    const extractResult = await extractProgramsMutation.mutateAsync({
                                      fileUrl: fileUrl || undefined,
                                      storageKey: storageKey || undefined,
                                      fileType,
                                      fileName,
                                      extractedText
                                    });
                                    if (extractResult.success && extractResult.programs.length > 0) {
                                      setMessages(prev => prev.filter(m => m.id !== extractingMsgId));
                                      setMessages(prev => [...prev, {
                                        id: `prog-preview-ready-${Date.now()}`,
                                        role: 'assistant',
                                        content: `Found **${extractResult.programs.length} program${extractResult.programs.length !== 1 ? 's' : ''}** in **${fileName}**. Review the list below and confirm which ones to import.`,
                                        timestamp: new Date()
                                      }]);
                                      setProgramImportPreview({
                                        programs: extractResult.programs,
                                        fileName,
                                        fileUrl,
                                        fileType,
                                        storageKey: storageKey || undefined,
                                        extractedText
                                      });
                                      setSelectedProgramRows(new Set(extractResult.programs.map((_: any, i: number) => i)));
                                    } else {
                                      setMessages(prev => prev.map(m => m.id === extractingMsgId ? {
                                        ...m,
                                        content: `I couldn't find any program data in **${fileName}**. ${extractResult.error || 'The document may not contain structured program information.'}`
                                      } : m));
                                    }
                                  } catch (e: any) {
                                    setMessages(prev => prev.map(m => m.id === extractingMsgId ? {
                                      ...m,
                                      content: `There was an error extracting programs from **${fileName}**: ${e.message}`
                                    } : m));
                                  }
                                } else if (qr.action.startsWith('import_merchandise_from_pdf:')) {
                                  // Real merchandise import flow — extract structured data then show preview card
                                  const pdfData = qr.action.replace('import_merchandise_from_pdf:', '');
                                  const parts = pdfData.split('|');
                                  const [fileUrl, fileType, fileName, , encodedText] = parts;
                                  const extractedText = encodedText ? decodeURIComponent(encodedText) : undefined;
                                  setMessages(prev => prev.map(m =>
                                    m.id === message.id ? { ...m, quickReplies: [] } : m
                                  ));
                                  const extractingMsgId = `merch-extracting-${Date.now()}`;
                                  setMessages(prev => [...prev, {
                                    id: extractingMsgId,
                                    role: 'assistant',
                                    content: `Extracting merchandise data from **${fileName}**…`,
                                    timestamp: new Date()
                                  }]);
                                  try {
                                    const extractResult = await extractMerchandiseMutation.mutateAsync({
                                      fileUrl: fileUrl || '',
                                      extractedText
                                    });
                                    if (extractResult.success && extractResult.items.length > 0) {
                                      setMessages(prev => prev.filter(m => m.id !== extractingMsgId));
                                      setMessages(prev => [...prev, {
                                        id: `merch-preview-ready-${Date.now()}`,
                                        role: 'assistant',
                                        content: `Found **${extractResult.items.length} item${extractResult.items.length !== 1 ? 's' : ''}** in **${fileName}**. Review the list below and confirm which ones to import.`,
                                        timestamp: new Date()
                                      }]);
                                      setMerchandiseImportPreview({
                                        items: extractResult.items,
                                        fileName,
                                        fileUrl,
                                        extractedText
                                      });
                                      setSelectedMerchandiseRows(new Set(extractResult.items.map((_: any, i: number) => i)));
                                    } else {
                                      setMessages(prev => prev.map(m => m.id === extractingMsgId ? {
                                        ...m,
                                        content: `I couldn't find any merchandise items in **${fileName}**. ${extractResult.error || 'The document may not contain structured product information.'}`
                                      } : m));
                                    }
                                  } catch (e: any) {
                                    setMessages(prev => prev.map(m => m.id === extractingMsgId ? {
                                      ...m,
                                      content: `There was an error extracting merchandise from **${fileName}**: ${e.message}`
                                    } : m));
                                  }
                                } else if (qr.action.startsWith('import_schedule_from_pdf:')) {
                                  // Import schedule from PDF — use the existing schedule extraction handler
                                  const pdfData = qr.action.replace('import_schedule_from_pdf:', '');
                                  const [fileUrl, fileType, fileName, storageKey] = pdfData.split('|');
                                  setMessages(prev => prev.map(m =>
                                    m.id === message.id ? { ...m, quickReplies: [] } : m
                                  ));
                                  handleScheduleExtraction(fileUrl, fileType, fileName, storageKey);
                                } else if (qr.action.startsWith('ask_kai_about_doc:')) {
                                  // Ask Kai about the document — send a chat message with context
                                  const pdfData = qr.action.replace('ask_kai_about_doc:', '');
                                  const [, , fileName] = pdfData.split('|');
                                  setMessages(prev => prev.map(m =>
                                    m.id === message.id ? { ...m, quickReplies: [] } : m
                                  ));
                                  setMessages(prev => [...prev, {
                                    id: `ask-kai-ack-${Date.now()}`,
                                    role: 'assistant',
                                    content: `Sure! I\'ve read **${fileName}**. What would you like to know about it? You can ask me questions like \'What programs are listed?\' or \'Summarize this document\'.`,
                                    timestamp: new Date(),
                                  }]);
                                } else if (qr.action.startsWith('confirm_archive:')) {
                                  // User confirmed a destructive action — execute it now
                                  setMessages(prev => prev.map(m =>
                                    m.id === message.id ? { ...m, quickReplies: [], pendingAction: undefined } : m
                                  ));
                                  const argsJson = qr.action.replace('confirm_archive:', '');
                                  let toolArgs: Record<string, any> = {};
                                  try { toolArgs = JSON.parse(argsJson); } catch {}
                                  const pendingAction = message.pendingAction || { toolName: 'remove_student', toolArgs };
                                  // Add user confirmation message
                                  setMessages(prev => [...prev, {
                                    id: `confirm-user-${Date.now()}`,
                                    role: 'user',
                                    content: qr.label,
                                    timestamp: new Date(),
                                  }]);
                                  setIsLoading(true);
                                  try {
                                    const confirmResult = await kaiChatMutation.mutateAsync({
                                      message: `✅ Confirmed: archive ${pendingAction.toolArgs?.studentName || 'student'}`,
                                      conversationHistory: [],
                                      confirmedAction: {
                                        toolName: pendingAction.toolName,
                                        toolArgs: pendingAction.toolArgs,
                                      },
                                    });
                                    setMessages(prev => [...prev, {
                                      id: `confirm-result-${Date.now()}`,
                                      role: 'assistant',
                                      content: confirmResult.response,
                                      timestamp: new Date(),
                                    }]);
                                  } catch (e: any) {
                                    setMessages(prev => [...prev, {
                                      id: `confirm-error-${Date.now()}`,
                                      role: 'assistant',
                                      content: `❌ Failed to execute action: ${e.message}`,
                                      timestamp: new Date(),
                                    }]);
                                  } finally {
                                    setIsLoading(false);
                                  }
                                } else if (qr.action === 'cancel_action') {
                                  // User cancelled the destructive action
                                  setMessages(prev => prev.map(m =>
                                    m.id === message.id ? { ...m, quickReplies: [], pendingAction: undefined } : m
                                  ));
                                  setMessages(prev => [...prev, {
                                    id: `cancel-ack-${Date.now()}`,
                                    role: 'assistant',
                                    content: '✅ Action cancelled. No changes were made.',
                                    timestamp: new Date(),
                                  }]);
                                }
                              }}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium border transition-colors ${
                                qr.action === 'open_schedule_import' || 
                                qr.action.startsWith('import_students_from_pdf:') ||
                                qr.action.startsWith('import_programs_from_pdf:') ||
                                qr.action.startsWith('import_merchandise_from_pdf:') ||
                                qr.action.startsWith('import_schedule_from_pdf:') ||
                                qr.action.startsWith('confirm_archive:')
                                  ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                                  : isDark || isCinematic
                                    ? 'bg-white/8 hover:bg-white/15 text-white/70 border-white/15'
                                    : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200 shadow-sm'
                              }`}
                            >
                              {qr.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3 relative" style={{ zIndex: 30 }}>
                      <div className="w-8 h-8 rounded-full shrink-0 shadow-lg shadow-red-500/30 overflow-hidden">
                        <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/RWtkCgdJjxxOQJjI.png" alt="Kai" className="w-full h-full object-cover animate-pulse" />
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
                  
                  {/* Approval Modal - 3rd Screen */}
                  {schedulePreview && (
                    <ScheduleApprovalModal
                      isOpen={showApprovalModal}
                      classes={schedulePreview.classes}
                      fileName={schedulePreview.fileName}
                      onApprove={async (selectedClasses) => {
                        try {
                          const result = await createClassesMutation.mutateAsync({
                            classes: selectedClasses
                          });
                          
                          if (result.success) {
                            toast.success(`Successfully imported ${result.createdCount} classes`);
                            setSchedulePreview(null);
                            setShowApprovalModal(false);
                            instructorsQuery.refetch();
                            
                            const successMessage: Message = {
                              id: `success-${Date.now()}`,
                              role: 'assistant',
                              content: `✅ **Schedule imported successfully!** I've added **${result.createdCount} classes** to your schedule.`,
                              timestamp: new Date()
                            };
                            setMessages(prev => [...prev, successMessage]);
                          } else {
                            toast.error(result.errors?.[0] || 'Failed to import classes');
                          }
                        } catch (error: any) {
                          toast.error('Failed to import classes: ' + error.message);
                        }
                      }}
                      onCancel={() => {
                        setShowApprovalModal(false);
                        setSchedulePreview(null);
                      }}
                    />
                  )}
                  
                  {/* Student Import Preview Card */}
                  {studentImportPreview && (
                    <div className="mx-4 mb-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
                      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-red-400" />
                          <span className="text-sm font-semibold text-white">
                            {selectedStudentRows.size} of {studentImportPreview.students.length} students selected
                          </span>
                          <span className="text-xs text-white/40">from {studentImportPreview.fileName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (selectedStudentRows.size === studentImportPreview.students.length) {
                                setSelectedStudentRows(new Set());
                              } else {
                                setSelectedStudentRows(new Set(studentImportPreview.students.map((_, i) => i)));
                              }
                            }}
                            className="text-xs text-white/50 hover:text-white/80 transition-colors"
                          >
                            {selectedStudentRows.size === studentImportPreview.students.length ? 'Deselect all' : 'Select all'}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setStudentImportPreview(null); setSelectedStudentRows(new Set()); }}
                            className="text-white/40 hover:text-white/70 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="overflow-x-auto max-h-64 overflow-y-auto">
                        <table className="w-full text-xs">
                          <thead className="sticky top-0 bg-black/40">
                            <tr>
                              <th className="w-8 px-3 py-2"></th>
                              <th className="px-3 py-2 text-left text-white/50 font-medium">Name</th>
                              <th className="px-3 py-2 text-left text-white/50 font-medium">Email</th>
                              <th className="px-3 py-2 text-left text-white/50 font-medium">Phone</th>
                              <th className="px-3 py-2 text-left text-white/50 font-medium">Belt</th>
                              <th className="px-3 py-2 text-left text-white/50 font-medium">Program</th>
                            </tr>
                          </thead>
                          <tbody>
                            {studentImportPreview.students.map((s, i) => (
                              <tr
                                key={i}
                                className={`border-t border-white/5 cursor-pointer transition-colors ${
                                  selectedStudentRows.has(i) ? 'bg-red-500/10' : 'opacity-40'
                                }`}
                                onClick={() => {
                                  setSelectedStudentRows(prev => {
                                    const next = new Set(prev);
                                    if (next.has(i)) next.delete(i); else next.add(i);
                                    return next;
                                  });
                                }}
                              >
                                <td className="px-3 py-2">
                                  <input
                                    type="checkbox"
                                    checked={selectedStudentRows.has(i)}
                                    onChange={() => {}}
                                    className="accent-red-500"
                                  />
                                </td>
                                <td className="px-3 py-2 text-white font-medium">{s.firstName} {s.lastName}</td>
                                <td className="px-3 py-2 text-white/60">{s.email || '—'}</td>
                                <td className="px-3 py-2 text-white/60">{s.phone || '—'}</td>
                                <td className="px-3 py-2 text-white/60">{s.beltRank || '—'}</td>
                                <td className="px-3 py-2 text-white/60">{s.program || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between">
                        <span className="text-xs text-white/40">
                          {isImportingStudents ? 'Importing...' : `${selectedStudentRows.size} student${selectedStudentRows.size !== 1 ? 's' : ''} will be added to your roster`}
                        </span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => { setStudentImportPreview(null); setSelectedStudentRows(new Set()); }}
                            className="px-3 py-1.5 text-xs rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleConfirmStudentImport}
                            disabled={selectedStudentRows.size === 0 || isImportingStudents}
                            className="px-4 py-1.5 text-xs rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center gap-1.5"
                          >
                            {isImportingStudents ? (
                              <><Loader2 className="w-3 h-3 animate-spin" /> Importing...</>
                            ) : (
                              <><Upload className="w-3 h-3" /> Import {selectedStudentRows.size} Student{selectedStudentRows.size !== 1 ? 's' : ''}</>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Programs Import Preview Card */}
                  {programImportPreview && (
                    <div className="mx-4 mb-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
                      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">📋</span>
                          <span className="text-sm font-semibold text-white">
                            {selectedProgramRows.size} of {programImportPreview.programs.length} programs selected
                          </span>
                          <span className="text-xs text-white/40">from {programImportPreview.fileName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (selectedProgramRows.size === programImportPreview.programs.length) {
                                setSelectedProgramRows(new Set());
                              } else {
                                setSelectedProgramRows(new Set(programImportPreview.programs.map((_, i) => i)));
                              }
                            }}
                            className="text-xs text-white/50 hover:text-white/80 transition-colors"
                          >
                            {selectedProgramRows.size === programImportPreview.programs.length ? 'Deselect all' : 'Select all'}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setProgramImportPreview(null); setSelectedProgramRows(new Set()); }}
                            className="text-white/40 hover:text-white/70 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="overflow-x-auto max-h-64 overflow-y-auto">
                        <table className="w-full text-xs">
                          <thead className="sticky top-0 bg-black/40">
                            <tr>
                              <th className="w-8 px-3 py-2"></th>
                              <th className="px-3 py-2 text-left text-white/50 font-medium">Program Name</th>
                              <th className="px-3 py-2 text-left text-white/50 font-medium">Type</th>
                              <th className="px-3 py-2 text-left text-white/50 font-medium">Age Range</th>
                              <th className="px-3 py-2 text-left text-white/50 font-medium">Price</th>
                              <th className="px-3 py-2 text-left text-white/50 font-medium">Billing</th>
                            </tr>
                          </thead>
                          <tbody>
                            {programImportPreview.programs.map((p, i) => (
                              <tr
                                key={i}
                                className={`border-t border-white/5 cursor-pointer transition-colors ${
                                  selectedProgramRows.has(i) ? 'bg-red-500/10' : 'opacity-40'
                                }`}
                                onClick={() => {
                                  setSelectedProgramRows(prev => {
                                    const next = new Set(prev);
                                    if (next.has(i)) next.delete(i); else next.add(i);
                                    return next;
                                  });
                                }}
                              >
                                <td className="px-3 py-2">
                                  <input type="checkbox" checked={selectedProgramRows.has(i)} onChange={() => {}} className="accent-red-500" />
                                </td>
                                <td className="px-3 py-2 text-white font-medium">{p.name}</td>
                                <td className="px-3 py-2 text-white/60 capitalize">{p.type || '—'}</td>
                                <td className="px-3 py-2 text-white/60">{p.ageRange || '—'}</td>
                                <td className="px-3 py-2 text-white/60">{p.price != null ? `$${(p.price / 100).toFixed(2)}` : '—'}</td>
                                <td className="px-3 py-2 text-white/60 capitalize">{p.billing ? p.billing.replace('_', ' ') : '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between">
                        <span className="text-xs text-white/40">
                          {isImportingPrograms ? 'Importing...' : `${selectedProgramRows.size} program${selectedProgramRows.size !== 1 ? 's' : ''} will be added to Programs`}
                        </span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => { setProgramImportPreview(null); setSelectedProgramRows(new Set()); }}
                            className="px-3 py-1.5 text-xs rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={selectedProgramRows.size === 0 || isImportingPrograms}
                            onClick={async () => {
                              if (!programImportPreview) return;
                              setIsImportingPrograms(true);
                              const toImport = programImportPreview.programs.filter((_, i) => selectedProgramRows.has(i));
                              let imported = 0;
                              let failed = 0;
                              const validTypes = ['membership', 'class_pack', 'drop_in', 'private'] as const;
                              const validBillings = ['monthly', 'weekly', 'per_session', 'one_time'] as const;
                              for (const prog of toImport) {
                                try {
                                  const safeType = validTypes.includes(prog.type as any) ? (prog.type as typeof validTypes[number]) : 'membership';
                                  const safeBilling = prog.billing && validBillings.includes(prog.billing as any) ? (prog.billing as typeof validBillings[number]) : undefined;
                                  await createProgramMutation.mutateAsync({
                                    name: prog.name,
                                    type: safeType,
                                    ageRange: prog.ageRange || undefined,
                                    price: typeof prog.price === 'number' ? prog.price : undefined,
                                    billing: safeBilling,
                                    description: prog.description || undefined,
                                    maxSize: typeof prog.maxSize === 'number' ? prog.maxSize : undefined,
                                  });
                                  imported++;
                                } catch (err: any) {
                                  console.error('[programs import] Failed to create program:', prog.name, err?.message);
                                  failed++;
                                }
                              }
                              setIsImportingPrograms(false);
                              setProgramImportPreview(null);
                              setSelectedProgramRows(new Set());
                              setMessages(prev => [...prev, {
                                id: `prog-import-done-${Date.now()}`,
                                role: 'assistant',
                                content: failed === 0
                                  ? `✅ Successfully imported **${imported} program${imported !== 1 ? 's' : ''}** to your Programs page!`
                                  : `Imported **${imported}** program${imported !== 1 ? 's' : ''} with **${failed}** error${failed !== 1 ? 's' : ''}. Check the Programs page for details.`,
                                timestamp: new Date()
                              }]);
                            }}
                            className="px-4 py-1.5 text-xs rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center gap-1.5"
                          >
                            {isImportingPrograms ? (
                              <><Loader2 className="w-3 h-3 animate-spin" /> Importing...</>
                            ) : (
                              <><Upload className="w-3 h-3" /> Import {selectedProgramRows.size} Program{selectedProgramRows.size !== 1 ? 's' : ''}</>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Merchandise Import Preview Card */}
                  {merchandiseImportPreview && (
                    <div className={`mx-auto w-full max-w-2xl rounded-xl border overflow-hidden ${
                      isDark || isCinematic ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'
                    }`}>
                      <div className={`flex items-center justify-between px-4 py-3 border-b ${
                        isDark || isCinematic ? 'border-white/10' : 'border-slate-100'
                      }`}>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold uppercase tracking-wide ${
                            isDark || isCinematic ? 'text-white/60' : 'text-slate-500'
                          }`}>Merchandise Preview</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            isDark || isCinematic ? 'bg-white/10 text-white/70' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {selectedMerchandiseRows.size} of {merchandiseImportPreview.items.length} items selected
                          </span>
                          <span className="text-xs text-white/40">from {merchandiseImportPreview.fileName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (selectedMerchandiseRows.size === merchandiseImportPreview.items.length) {
                                setSelectedMerchandiseRows(new Set());
                              } else {
                                setSelectedMerchandiseRows(new Set(merchandiseImportPreview.items.map((_, i) => i)));
                              }
                            }}
                            className={`text-xs px-2 py-1 rounded-md border transition-colors ${
                              isDark || isCinematic ? 'border-white/15 text-white/60 hover:bg-white/10' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                            }`}
                          >
                            {selectedMerchandiseRows.size === merchandiseImportPreview.items.length ? 'Deselect all' : 'Select all'}
                          </button>
                          <button
                            onClick={() => { setMerchandiseImportPreview(null); setSelectedMerchandiseRows(new Set()); }}
                            className={`text-xs px-2 py-1 rounded-md border transition-colors ${
                              isDark || isCinematic ? 'border-white/15 text-white/60 hover:bg-white/10' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                            }`}
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className={isDark || isCinematic ? 'bg-white/5' : 'bg-slate-50'}>
                              <th className="w-8 px-3 py-2"></th>
                              <th className={`text-left px-3 py-2 font-medium ${ isDark || isCinematic ? 'text-white/50' : 'text-slate-500' }`}>Name</th>
                              <th className={`text-left px-3 py-2 font-medium ${ isDark || isCinematic ? 'text-white/50' : 'text-slate-500' }`}>Type</th>
                              <th className={`text-left px-3 py-2 font-medium ${ isDark || isCinematic ? 'text-white/50' : 'text-slate-500' }`}>Price</th>
                              <th className={`text-left px-3 py-2 font-medium ${ isDark || isCinematic ? 'text-white/50' : 'text-slate-500' }`}>Stock</th>
                              <th className={`text-left px-3 py-2 font-medium ${ isDark || isCinematic ? 'text-white/50' : 'text-slate-500' }`}>Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            {merchandiseImportPreview.items.map((item, i) => (
                              <tr
                                key={i}
                                onClick={() => {
                                  const next = new Set(selectedMerchandiseRows);
                                  if (next.has(i)) next.delete(i); else next.add(i);
                                  setSelectedMerchandiseRows(next);
                                }}
                                className={`cursor-pointer border-t transition-colors ${
                                  isDark || isCinematic
                                    ? `border-white/5 ${selectedMerchandiseRows.has(i) ? 'bg-white/8' : 'hover:bg-white/4'}`
                                    : `border-slate-100 ${selectedMerchandiseRows.has(i) ? 'bg-red-50' : 'hover:bg-slate-50'}`
                                }`}
                              >
                                <td className="px-3 py-2">
                                  <input type="checkbox" readOnly checked={selectedMerchandiseRows.has(i)} className="accent-red-500" />
                                </td>
                                <td className={`px-3 py-2 font-medium ${ isDark || isCinematic ? 'text-white/90' : 'text-slate-800' }`}>{item.name}</td>
                                <td className={`px-3 py-2 ${ isDark || isCinematic ? 'text-white/60' : 'text-slate-500' }`}>{item.type}</td>
                                <td className={`px-3 py-2 ${ isDark || isCinematic ? 'text-white/60' : 'text-slate-500' }`}>{item.defaultPrice != null ? `$${item.defaultPrice}` : '—'}</td>
                                <td className={`px-3 py-2 ${ isDark || isCinematic ? 'text-white/60' : 'text-slate-500' }`}>{item.stockQuantity != null ? item.stockQuantity : '—'}</td>
                                <td className={`px-3 py-2 ${ isDark || isCinematic ? 'text-white/60' : 'text-slate-500' }`}>{item.description || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className={`flex items-center justify-between px-4 py-3 border-t ${
                        isDark || isCinematic ? 'border-white/10 bg-white/3' : 'border-slate-100 bg-slate-50'
                      }`}>
                        <span className={`text-xs ${ isDark || isCinematic ? 'text-white/50' : 'text-slate-500' }`}>
                          {isImportingMerchandise ? 'Importing...' : `${selectedMerchandiseRows.size} item${selectedMerchandiseRows.size !== 1 ? 's' : ''} will be added to Merchandise`}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setMerchandiseImportPreview(null); setSelectedMerchandiseRows(new Set()); }}
                            className={`px-4 py-1.5 text-xs rounded-lg border transition-colors ${
                              isDark || isCinematic ? 'border-white/15 text-white/60 hover:bg-white/10' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            Cancel
                          </button>
                          <button
                            disabled={selectedMerchandiseRows.size === 0 || isImportingMerchandise}
                            onClick={async () => {
                              if (!merchandiseImportPreview) return;
                              setIsImportingMerchandise(true);
                              const toImport = merchandiseImportPreview.items.filter((_, i) => selectedMerchandiseRows.has(i));
                              let imported = 0;
                              let failed = 0;
                              for (const item of toImport) {
                                try {
                                  const typeMap: Record<string, string> = {
                                    uniform: 'uniform', gear: 'gear', belt: 'belt', equipment: 'equipment', other: 'other'
                                  };
                                  await createMerchandiseMutation.mutateAsync({
                                    name: item.name,
                                    type: (typeMap[item.type?.toLowerCase()] || 'other') as any,
                                    defaultPrice: Math.round((item.defaultPrice ?? 0) * 100),
                                    requiresSize: false,
                                    description: item.description || undefined,
                                    stockQuantity: item.stockQuantity ?? undefined,
                                  });
                                  imported++;
                                } catch (e) {
                                  console.error('Failed to import merchandise item:', item.name, e);
                                  failed++;
                                }
                              }
                              setIsImportingMerchandise(false);
                              setMerchandiseImportPreview(null);
                              setSelectedMerchandiseRows(new Set());
                              setMessages(prev => [...prev, {
                                id: `merch-import-done-${Date.now()}`,
                                role: 'assistant',
                                content: failed === 0
                                  ? `Imported **${imported} item${imported !== 1 ? 's' : ''}** to Merchandise successfully. Head over to the Merchandise page to review them.`
                                  : `Imported **${imported}** item${imported !== 1 ? 's' : ''} with **${failed}** error${failed !== 1 ? 's' : ''}. Check the Merchandise page for details.`,
                                timestamp: new Date(),
                                quickReplies: failed === 0 ? [
                                  { label: '🛍️ View Merchandise', action: 'navigate:/merchandise' }
                                ] : [
                                  { label: '🛍️ View Merchandise', action: 'navigate:/merchandise' }
                                ]
                              }]);
                            }}
                            className="px-4 py-1.5 text-xs rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center gap-1.5"
                          >
                            {isImportingMerchandise ? (
                              <><Loader2 className="w-3 h-3 animate-spin" /> Importing...</>
                            ) : (
                              <><Upload className="w-3 h-3" /> Import {selectedMerchandiseRows.size} Item{selectedMerchandiseRows.size !== 1 ? 's' : ''}</>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                  
                  {/* Kai Thinking Indicator during PDF parsing - at bottom before composer */}
                  {isParsingStudents && (
                    <KaiThinkingIndicator
                      isVisible={isParsingStudents}
                      messages={studentThinkingMessages}
                      isDark={isDark}
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* COMPOSER DOCK - Natural flex positioning at bottom of center panel */}
          <div 
            className="flex justify-center w-full flex-shrink-0 border-t border-white/10"
            style={{
              zIndex: LAYOUT_CONSTANTS.composerZIndex,
              paddingBottom: '16px',
              paddingTop: '16px',
              paddingLeft: '16px',
              paddingRight: '16px',
              boxSizing: 'border-box',
              background: 'transparent',
              marginBottom: '0px'
            }}
          >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage('submit');
            }}
            className={`kaiBar flex items-center gap-2 transition-all duration-300 relative z-[100] border focus-within:kai-command-bar-focus`}
            style={{
              background: isCinematic ? 'rgba(20, 20, 20, 0.85)' : (isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.95)'),
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              maxWidth: '664px',
              width: '100%',
              minHeight: '56px',
              borderRadius: '999px',
              padding: '12px 16px',
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              borderColor: isCinematic ? 'rgba(255, 255, 255, 0.95)' : (isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.1)'),
              borderWidth: isCinematic ? '2px' : '1px',
              boxSizing: 'border-box',
              position: 'relative',
              boxShadow: isCinematic ? '0 0 30px rgba(255, 255, 255, 0.3), 0 0 60px rgba(255, 255, 255, 0.15), 0 4px 12px rgba(0, 0, 0, 0.5)' : 'none'
            }}
          >
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,text/plain,.xlsx,.xls,.csv"
              multiple
              className="hidden"
            />
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
              onClick={() => fileInputRef.current?.click()}
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
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#FFFFFF' }} />
              ) : (
                <Send className="w-4 h-4" style={{ color: '#FFFFFF' }} />
              )}
            </Button>
          </form>
          </div>

          {/* Student Details Panel - Overlay (keep for backward compatibility) */}
          {selectedStudentId && studentDetailsPanelOpen && !managementPanelOpen && (
            <StudentDetailsPanel
              studentId={selectedStudentId}
              isOpen={studentDetailsPanelOpen}
              onClose={() => {
                setStudentDetailsPanelOpen(false);
                setSelectedStudentId(null);
              }}
              theme={theme}
            />
          )}
        </div>
        
        {/* Management Panel - Right Column (Grid Column 4) */}
        <ManagementPanel
          isOpen={managementPanelOpen}
          onClose={() => {
            setManagementPanelOpen(false);
            setSelectedStudentId(null);
          }}
          studentId={selectedStudentId}
          theme={theme}
        />
      </div>

      {/* INFO PANEL - Third Column */}
      <InfoPanel 
        open={infoPanelOpen}
        data={infoPanelData}
        isDark={isDark}
        isCinematic={isCinematic}
        onClose={() => setInfoPanelOpen(false)}
      />
      

      
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
      
      {/* Onboarding is handled in-chat via useKaiOnboarding hook */}

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
            if (!user || !user.activeOrgId) {
              toast.error('Organization not found');
              return;
            }
            
            const result = await createTrialCheckoutMutation.mutateAsync({
              organizationId: user.activeOrgId,
              customerEmail: user.email || ''
            });
            
            if (result?.url) {
              window.location.href = result.url;
            } else {
              toast.error('Failed to create checkout session');
            }
          } catch (error: any) {
            console.error('Trial checkout error:', error);
            toast.error(error?.message || 'Failed to start trial');
          }
        }}
        onManageBilling={async () => {
          setShowPaywall(false);
          navigate('/billing');
        }}
        subscriptionStatus="no_subscription"
        featureName={paywallFeatureName}
      />
      
      {/* Mobile Ops Drawer - slides up from bottom when mobileOpsOpen */}
      {isMobile && mobileOpsOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 z-[800]"
            onClick={() => setMobileOpsOpen(false)}
          />
          {/* Drawer */}
          <div
            className={`fixed bottom-[var(--bottom-nav-height,72px)] left-0 right-0 z-[810] rounded-t-2xl overflow-hidden ${
              isDark || isCinematic ? 'bg-[oklch(0.09_0.008_25)]' : 'bg-white'
            } shadow-2xl`}
            style={{ maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}
          >
            {/* Drawer handle */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <span className={`text-xs font-semibold uppercase tracking-wider ${isDark || isCinematic ? 'text-white/60' : 'text-slate-500'}`}>Operations</span>
              <button onClick={() => setMobileOpsOpen(false)} className="p-1">
                <X className={`w-4 h-4 ${isDark || isCinematic ? 'text-white/60' : 'text-slate-500'}`} />
              </button>
            </div>
            {/* Ops list */}
            <div className="overflow-y-auto flex-1 p-3 space-y-2">
              {filteredConversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => { setSelectedConversationId(conv.id); setMobileOpsOpen(false); }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                    selectedConversationId === conv.id
                      ? 'bg-primary/20 border border-primary/40'
                      : isDark || isCinematic ? 'bg-white/5 hover:bg-white/10 border border-white/10' : 'bg-slate-50 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <p className={`text-sm font-medium truncate ${isDark || isCinematic ? 'text-white/90' : 'text-slate-800'}`}>{conv.title}</p>
                  <p className={`text-xs truncate mt-0.5 ${isDark || isCinematic ? 'text-white/40' : 'text-slate-400'}`}>{conv.preview}</p>
                </button>
              ))}
              {filteredConversations.length === 0 && (
                <p className={`text-center text-sm py-8 ${isDark || isCinematic ? 'text-white/30' : 'text-slate-400'}`}>No operations yet</p>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
// Conversation Card Component - Tactical Mission Tilele
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

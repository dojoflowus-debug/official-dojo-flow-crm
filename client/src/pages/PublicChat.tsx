import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Send, ArrowUp } from "lucide-react";
import { useOrganizationSettings } from "@/hooks/useOrganizationSettings";
import { getEffectiveTheme, getInitials, type PlatformType } from "@/lib/platformDetection";

/**
 * Public AI Chat Page - Apple iOS Messages Style
 * Accessible via links in emails/SMS (e.g., /chat?id=123&type=lead&name=John)
 * Allows leads and students to chat with the AI assistant
 * 
 * Features:
 * - Automatic platform detection (iOS/Android/Desktop)
 * - Apple iOS Messages aesthetic (default)
 * - Material Design for Android
 * - School logo and name from Settings
 * - Responsive and accessible
 */

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function PublicChat() {
  console.log('[PublicChat] Component rendering - NEW iOS DESIGN');
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [aiName, setAiName] = useState("Kai");
  const [userName, setUserName] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Fetch organization settings (logo, name, theme)
  const { settings, isLoading: settingsLoading } = useOrganizationSettings();
  
  // Detect platform and get effective theme
  const [platformTheme, setPlatformTheme] = useState<PlatformType>('ios');
  
  useEffect(() => {
    const theme = getEffectiveTheme(settings.themeOverride);
    setPlatformTheme(theme);
  }, [settings.themeOverride]);

  // Parse URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const name = params.get("name");
    const id = params.get("id");
    const type = params.get("type");

    if (name) {
      setUserName(decodeURIComponent(name));
    }

    // Use organization name or default to "Kai"
    setAiName(settings.name || "Kai");

    // Add welcome message
    const welcomeMessage: Message = {
      id: 1,
      role: "assistant",
      content: `Hi ${name || "there"}! 👋 I'm ${aiName}, your AI assistant. How can I help you today?`,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, [settings.name]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: messages.length + 1,
      role: "user",
      content: inputMessage,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    try {
      // TODO: Call your AI API here
      // For now, simulate AI response
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const aiResponse: Message = {
        id: messages.length + 2,
        role: "assistant",
        content: `Thanks for your message! I'm here to help answer any questions about our classes, scheduling, pricing, or anything else you'd like to know.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  // iOS-specific styles
  const isIOS = platformTheme === 'ios';
  const isAndroid = platformTheme === 'android';

  // Generate initials for fallback logo
  const initials = getInitials(settings.name);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-2 sm:p-4">
      {/* iOS Messages-style Card */}
      <div 
        className={`w-full max-w-2xl h-[calc(100vh-2rem)] sm:h-[600px] flex flex-col overflow-hidden ${
          isIOS 
            ? 'rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.12)]' 
            : 'rounded-[16px] shadow-[0_4px_24px_rgba(0,0,0,0.16)]'
        } bg-white dark:bg-slate-900`}
      >
        {/* iOS-style Header with Blur */}
        <div 
          className={`${
            isIOS 
              ? 'backdrop-blur-xl bg-white/80 dark:bg-slate-900/80' 
              : 'bg-white dark:bg-slate-900 shadow-sm'
          } border-b border-slate-200/50 dark:border-slate-700/50 px-4 py-3 sm:px-6 sm:py-4 flex-shrink-0`}
          style={{
            backdropFilter: isIOS ? 'blur(16px)' : 'none',
            WebkitBackdropFilter: isIOS ? 'blur(16px)' : 'none',
          }}
        >
          <div className="flex items-center gap-3">
            {/* Logo or Initials Circle */}
            {settings.logoUrl ? (
              <img 
                src={settings.logoUrl} 
                alt={settings.name}
                className={`w-8 h-8 ${isIOS ? 'rounded-full' : 'rounded-lg'} object-cover flex-shrink-0`}
              />
            ) : (
              <div 
                className={`w-8 h-8 ${
                  isIOS ? 'rounded-full' : 'rounded-lg'
                } bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center flex-shrink-0`}
              >
                <span className="text-white text-sm font-semibold">
                  {initials}
                </span>
              </div>
            )}
            
            {/* School Name and Subtitle */}
            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white truncate">
                {settings.name}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {aiName} • Always here to help
              </p>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] sm:max-w-[70%] ${
                  message.role === "user"
                    ? isIOS
                      ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-[18px] rounded-tr-[4px]"
                      : "bg-blue-600 text-white rounded-[16px] rounded-tr-[4px] shadow-sm"
                    : isIOS
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-[18px] rounded-tl-[4px] border border-slate-200/50 dark:border-slate-700/50"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-[16px] rounded-tl-[4px] shadow-sm"
                } px-4 py-2.5 sm:py-3`}
              >
                <p className="text-[15px] sm:text-base leading-relaxed whitespace-pre-wrap break-words">
                  {message.content}
                </p>
                <p
                  className={`text-[11px] sm:text-xs mt-1 ${
                    message.role === "user"
                      ? "text-blue-100"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}
          
          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div
                className={`${
                  isIOS
                    ? "bg-white dark:bg-slate-800 rounded-[18px] rounded-tl-[4px] border border-slate-200/50 dark:border-slate-700/50"
                    : "bg-slate-100 dark:bg-slate-800 rounded-[16px] rounded-tl-[4px] shadow-sm"
                } px-4 py-3`}
              >
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.15s" }}
                  />
                  <div
                    className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.3s" }}
                  />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* iOS-style Composer */}
        <div 
          className={`${
            isIOS 
              ? 'backdrop-blur-xl bg-white/80 dark:bg-slate-900/80' 
              : 'bg-white dark:bg-slate-900'
          } border-t border-slate-200/50 dark:border-slate-700/50 px-3 sm:px-4 py-2.5 sm:py-3 flex-shrink-0`}
          style={{
            backdropFilter: isIOS ? 'blur(16px)' : 'none',
            WebkitBackdropFilter: isIOS ? 'blur(16px)' : 'none',
          }}
        >
          <div className="flex items-end gap-2">
            {/* iOS Pill Input */}
            <div 
              className={`flex-1 ${
                isIOS
                  ? 'bg-slate-100 dark:bg-slate-800 rounded-[20px] border border-slate-200/50 dark:border-slate-700/50'
                  : 'bg-slate-100 dark:bg-slate-800 rounded-[24px] border border-slate-300 dark:border-slate-700'
              } px-4 py-2 flex items-center`}
            >
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Message..."
                disabled={isLoading}
                rows={1}
                className="flex-1 bg-transparent border-none outline-none resize-none text-[15px] sm:text-base text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 max-h-[120px] overflow-y-auto"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}
              />
            </div>
            
            {/* iOS-style Send Button */}
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className={`${
                isIOS
                  ? 'w-9 h-9 sm:w-10 sm:h-10 rounded-full'
                  : 'w-10 h-10 sm:w-11 sm:h-11 rounded-full shadow-md'
              } ${
                !inputMessage.trim() || isLoading
                  ? 'bg-slate-300 dark:bg-slate-700'
                  : 'bg-blue-500 hover:bg-blue-600 active:scale-95'
              } flex items-center justify-center transition-all duration-150 flex-shrink-0`}
              aria-label="Send message"
            >
              <ArrowUp className={`${isIOS ? 'w-5 h-5' : 'w-5 h-5'} text-white`} strokeWidth={2.5} />
            </button>
          </div>
          
          {/* Hint Text */}
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 text-center hidden sm:block">
            Press Enter to send • Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}

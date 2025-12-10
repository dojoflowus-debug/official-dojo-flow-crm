import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import {
  Send, Plus, MessageSquare, Trash2, Pin, MoreVertical,
  Users, DollarSign, TrendingUp, AlertCircle, Sparkles
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// Message bubble component
function MessageBubble({ 
  role, 
  content, 
  isLatest 
}: { 
  role: "user" | "assistant"; 
  content: string;
  isLatest?: boolean;
}) {
  const isUser = role === "user";
  
  return (
    <div className={cn("flex gap-3 mb-4", isUser && "flex-row-reverse")}>
      <Avatar className={cn("h-8 w-8", isUser ? "bg-primary" : "bg-gradient-to-br from-emerald-400 to-cyan-500")}>
        <AvatarFallback className="text-white text-xs">
          {isUser ? "You" : "K"}
        </AvatarFallback>
      </Avatar>
      <div className={cn(
        "max-w-[80%] rounded-2xl px-4 py-3",
        isUser 
          ? "bg-primary text-primary-foreground rounded-tr-sm" 
          : "bg-muted rounded-tl-sm"
      )}>
        {isUser ? (
          <p className="text-sm">{content}</p>
        ) : (
          <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
            <Streamdown>{content}</Streamdown>
          </div>
        )}
      </div>
    </div>
  );
}

// Conversation list item
function ConversationItem({
  conversation,
  isActive,
  onClick,
  onDelete,
  onPin
}: {
  conversation: any;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
  onPin: () => void;
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors",
        isActive ? "bg-primary/10 text-primary" : "hover:bg-muted"
      )}
      onClick={onClick}
    >
      <MessageSquare className="h-4 w-4 shrink-0" />
      <span className="flex-1 truncate text-sm">
        {conversation.title || "New Conversation"}
      </span>
      {conversation.isPinned && <Pin className="h-3 w-3 text-muted-foreground" />}
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
            <MoreVertical className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onPin(); }}>
            <Pin className="h-4 w-4 mr-2" />
            {conversation.isPinned ? "Unpin" : "Pin"}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Quick stats panel
function QuickStatsPanel({ data }: { data: any }) {
  if (!data) return null;
  
  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
      <Card className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border-emerald-500/20">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-500" />
            <span className="text-xs text-muted-foreground">Active Students</span>
          </div>
          <p className="text-2xl font-bold mt-1">{data.students?.active || 0}</p>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <span className="text-xs text-muted-foreground">Late Payers</span>
          </div>
          <p className="text-2xl font-bold mt-1">{data.billing?.latePayers || 0}</p>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <span className="text-xs text-muted-foreground">New Leads</span>
          </div>
          <p className="text-2xl font-bold mt-1">{data.leads?.new || 0}</p>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-purple-500" />
            <span className="text-xs text-muted-foreground">Monthly Revenue</span>
          </div>
          <p className="text-2xl font-bold mt-1">${data.billing?.totalMonthlyRevenue || 0}</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Suggested prompts
const SUGGESTED_PROMPTS = [
  "How many active students do we have?",
  "Who are the late payers?",
  "Show me the belt distribution",
  "What's our monthly revenue?",
  "How many new leads this week?",
  "Which students are at risk (Category C)?",
];

export default function KaiChat() {
  const { user, isAuthenticated } = useAuth();
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Queries
  const { data: conversations, refetch: refetchConversations } = trpc.conversation.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const { data: messages, refetch: refetchMessages } = trpc.message.list.useQuery(
    { conversationId: activeConversationId! },
    { enabled: !!activeConversationId }
  );
  const { data: kaiData } = trpc.kai.dataSummary.useQuery(undefined, { enabled: isAuthenticated });

  // Mutations
  const createConversation = trpc.conversation.create.useMutation({
    onSuccess: (data) => {
      setActiveConversationId(data.id);
      refetchConversations();
    },
  });
  const deleteConversation = trpc.conversation.delete.useMutation({
    onSuccess: () => {
      if (conversations && conversations.length > 1) {
        setActiveConversationId(conversations[0].id);
      } else {
        setActiveConversationId(null);
      }
      refetchConversations();
    },
  });
  const updateConversation = trpc.conversation.update.useMutation({
    onSuccess: () => refetchConversations(),
  });
  const sendMessage = trpc.message.send.useMutation({
    onSuccess: () => {
      refetchMessages();
      setIsTyping(false);
    },
    onError: () => {
      setIsTyping(false);
      toast.error("Failed to send message");
    },
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Set first conversation as active
  useEffect(() => {
    if (conversations && conversations.length > 0 && !activeConversationId) {
      setActiveConversationId(conversations[0].id);
    }
  }, [conversations, activeConversationId]);

  const handleNewConversation = () => {
    createConversation.mutate({ title: "New Conversation" });
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    
    if (!activeConversationId) {
      // Create new conversation first
      const result = await createConversation.mutateAsync({ title: inputValue.slice(0, 50) });
      setActiveConversationId(result.id);
      
      setIsTyping(true);
      sendMessage.mutate({
        conversationId: result.id,
        content: inputValue.trim(),
      });
    } else {
      setIsTyping(true);
      sendMessage.mutate({
        conversationId: activeConversationId,
        content: inputValue.trim(),
      });
    }
    
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInputValue(prompt);
    inputRef.current?.focus();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Sparkles className="h-12 w-12 mx-auto text-primary mb-4" />
            <h2 className="text-xl font-bold mb-2">Welcome to Kai Command</h2>
            <p className="text-muted-foreground mb-4">
              Please sign in to start chatting with Kai, your AI assistant.
            </p>
            <Button onClick={() => window.location.href = "/api/oauth/login"}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Conversations */}
      <div className="w-72 border-r bg-card flex flex-col">
        <div className="p-4 border-b">
          <Button onClick={handleNewConversation} className="w-full" disabled={createConversation.isPending}>
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>
        
        <ScrollArea className="flex-1 p-2">
          {conversations?.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={conv.id === activeConversationId}
              onClick={() => setActiveConversationId(conv.id)}
              onDelete={() => deleteConversation.mutate({ id: conv.id })}
              onPin={() => updateConversation.mutate({ 
                id: conv.id, 
                data: { isPinned: !conv.isPinned } 
              })}
            />
          ))}
          {(!conversations || conversations.length === 0) && (
            <div className="text-center text-muted-foreground text-sm py-8">
              No conversations yet
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 border-b flex items-center px-6 bg-card">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold">Kai Command</h1>
              <p className="text-xs text-muted-foreground">AI-powered assistant with real-time data</p>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-6">
          {!activeConversationId || !messages || messages.length === 0 ? (
            <div className="max-w-2xl mx-auto">
              {/* Welcome message */}
              <div className="text-center mb-8">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Hello, {user?.name || "there"}!</h2>
                <p className="text-muted-foreground">
                  I'm Kai, your AI assistant. I have access to your school's real-time data.
                  Ask me anything about students, billing, leads, or statistics.
                </p>
              </div>

              {/* Quick Stats */}
              <QuickStatsPanel data={kaiData} />

              {/* Suggested Prompts */}
              <div className="mt-6">
                <p className="text-sm text-muted-foreground mb-3">Try asking:</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <Badge
                      key={prompt}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors py-2 px-3"
                      onClick={() => handleSuggestedPrompt(prompt)}
                    >
                      {prompt}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto">
              {messages.map((msg, idx) => (
                <MessageBubble
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  isLatest={idx === messages.length - 1}
                />
              ))}
              {isTyping && (
                <div className="flex gap-3 mb-4">
                  <Avatar className="h-8 w-8 bg-gradient-to-br from-emerald-400 to-cyan-500">
                    <AvatarFallback className="text-white text-xs">K</AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t bg-card">
          <div className="max-w-3xl mx-auto flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Kai anything about your school..."
              className="flex-1"
              disabled={sendMessage.isPending}
            />
            <Button 
              onClick={handleSend} 
              disabled={!inputValue.trim() || sendMessage.isPending}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { APP_LOGO, APP_TITLE } from "@/const";
import { 
  ArrowLeft,
  Send,
  Inbox,
  User,
  Clock,
  AlertCircle,
  Loader2,
  RefreshCw,
  Mail,
  MailOpen
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { trpc } from "@/lib/trpc";

interface Message {
  id: number;
  studentId: number;
  senderType: "student" | "staff";
  senderId: number;
  senderName: string;
  subject: string | null;
  content: string;
  isRead: number;
  parentMessageId: number | null;
  priority: "normal" | "high" | "urgent";
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Student Messages - View and send messages to instructors
 */
export default function StudentMessages() {
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState<number | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false);
  const [newMessageSubject, setNewMessageSubject] = useState("");
  const [newMessageBody, setNewMessageBody] = useState("");
  const [replyText, setReplyText] = useState("");

  // Get student ID from localStorage
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("student_logged_in");
    const storedStudentId = localStorage.getItem("student_id");
    
    if (!isLoggedIn) {
      navigate("/student-login");
      return;
    }
    
    if (storedStudentId) {
      setStudentId(parseInt(storedStudentId));
    }
  }, [navigate]);

  // Fetch messages from backend
  const { data: messages = [], isLoading, refetch } = trpc.studentPortal.getMessages.useQuery(
    { studentId: studentId! },
    { enabled: !!studentId }
  );

  // Fetch unread count
  const { data: unreadCount = 0 } = trpc.studentPortal.getUnreadCount.useQuery(
    { studentId: studentId! },
    { enabled: !!studentId }
  );

  // Send message mutation
  const sendMessageMutation = trpc.studentPortal.sendMessage.useMutation({
    onSuccess: () => {
      setShowNewMessageDialog(false);
      setNewMessageSubject("");
      setNewMessageBody("");
      refetch();
    },
  });

  // Mark as read mutation
  const markAsReadMutation = trpc.studentPortal.markAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleMessageClick = (message: Message) => {
    setSelectedMessage(message);
    // Mark as read if it's from staff and unread
    if (message.senderType === "staff" && !message.isRead && studentId) {
      markAsReadMutation.mutate({ messageId: message.id, studentId });
    }
  };

  const handleNewMessage = () => {
    setShowNewMessageDialog(true);
  };

  const handleSendNewMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !newMessageBody.trim()) return;
    
    sendMessageMutation.mutate({
      studentId,
      subject: newMessageSubject || undefined,
      content: newMessageBody,
    });
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMessage || !replyText.trim() || !studentId) return;
    
    sendMessageMutation.mutate({
      studentId,
      subject: `Re: ${selectedMessage.subject || "No Subject"}`,
      content: replyText,
      parentMessageId: selectedMessage.id,
    });
    
    setReplyText("");
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return d.toLocaleDateString([], { weekday: 'long' });
    } else {
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-600";
      case "high": return "bg-orange-600";
      default: return "bg-blue-600";
    }
  };

  // Group messages by thread (parent messages only in list)
  const parentMessages = messages.filter(m => !m.parentMessageId);
  const getThreadReplies = (messageId: number) => 
    messages.filter(m => m.parentMessageId === messageId);

  if (!studentId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => selectedMessage ? setSelectedMessage(null) : navigate("/student-dashboard")}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              {selectedMessage ? "Back" : "Dashboard"}
            </Button>
            <div>
              <h1 className="text-xl font-bold text-white">Messages</h1>
              <p className="text-xs text-slate-400">
                {selectedMessage 
                  ? selectedMessage.subject || "No Subject"
                  : `${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}`
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetch()}
              className="text-slate-400 hover:text-white"
            >
              <RefreshCw className="h-5 w-5" />
            </Button>
            {APP_LOGO && (
              <img 
                src={APP_LOGO} 
                alt={APP_TITLE} 
                className="h-10 w-auto"
              />
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {!selectedMessage ? (
            <>
              {/* Inbox Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-blue-600/20">
                    <Inbox className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Inbox</h2>
                    <p className="text-sm text-slate-400">
                      {parentMessages.length} conversation{parentMessages.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleNewMessage}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Send className="h-4 w-4 mr-2" />
                  New Message
                </Button>
              </div>

              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              )}

              {/* Empty State */}
              {!isLoading && parentMessages.length === 0 && (
                <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800 p-12 text-center">
                  <div className="p-4 rounded-full bg-slate-800 w-fit mx-auto mb-4">
                    <Mail className="h-8 w-8 text-slate-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">No messages yet</h3>
                  <p className="text-slate-400 mb-6">
                    Start a conversation with your instructors
                  </p>
                  <Button
                    onClick={handleNewMessage}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send First Message
                  </Button>
                </Card>
              )}

              {/* Messages List */}
              {!isLoading && parentMessages.length > 0 && (
                <div className="space-y-3">
                  {parentMessages.map((message) => {
                    const replies = getThreadReplies(message.id);
                    const isUnread = message.senderType === "staff" && !message.isRead;
                    
                    return (
                      <Card
                        key={message.id}
                        onClick={() => handleMessageClick(message)}
                        className={`bg-slate-900/50 backdrop-blur-sm border-slate-800 p-6 cursor-pointer hover:border-blue-600 transition-all hover:shadow-lg hover:shadow-blue-900/20 ${
                          isUnread ? 'border-l-4 border-l-blue-600' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className={`p-2 rounded-full ${message.senderType === 'staff' ? 'bg-blue-600/20' : 'bg-green-600/20'}`}>
                              {isUnread ? (
                                <Mail className={`h-5 w-5 ${message.senderType === 'staff' ? 'text-blue-500' : 'text-green-500'}`} />
                              ) : (
                                <MailOpen className={`h-5 w-5 ${message.senderType === 'staff' ? 'text-blue-500' : 'text-green-500'}`} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className={`font-semibold ${isUnread ? 'text-white' : 'text-slate-300'}`}>
                                  {message.senderType === 'student' ? 'You' : message.senderName}
                                </h3>
                                {isUnread && (
                                  <Badge className="bg-blue-600 text-white border-0 text-xs">
                                    New
                                  </Badge>
                                )}
                                {message.priority !== 'normal' && (
                                  <Badge className={`${getPriorityColor(message.priority)} text-white border-0 text-xs`}>
                                    {message.priority}
                                  </Badge>
                                )}
                                {replies.length > 0 && (
                                  <Badge variant="outline" className="text-slate-400 border-slate-700 text-xs">
                                    {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                                  </Badge>
                                )}
                              </div>
                              <p className={`text-sm font-medium mb-1 ${isUnread ? 'text-slate-200' : 'text-slate-400'}`}>
                                {message.subject || "No Subject"}
                              </p>
                              <p className="text-sm text-slate-500 line-clamp-1">
                                {message.content}
                              </p>
                              <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                                <Clock className="h-3 w-3" />
                                <span>{formatDate(message.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Message View */}
              <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800 p-6 mb-6">
                <div className="flex items-start gap-4 mb-6 pb-6 border-b border-slate-800">
                  <div className={`p-3 rounded-full ${selectedMessage.senderType === 'staff' ? 'bg-blue-600/20' : 'bg-green-600/20'}`}>
                    <User className={`h-6 w-6 ${selectedMessage.senderType === 'staff' ? 'text-blue-500' : 'text-green-500'}`} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-white mb-1">
                      {selectedMessage.subject || "No Subject"}
                    </h2>
                    <p className="text-sm text-slate-400 mb-2">
                      From: {selectedMessage.senderType === 'student' ? 'You' : selectedMessage.senderName}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(selectedMessage.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="prose prose-invert max-w-none">
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {selectedMessage.content}
                  </p>
                </div>

                {/* Thread Replies */}
                {getThreadReplies(selectedMessage.id).length > 0 && (
                  <div className="mt-6 pt-6 border-t border-slate-800 space-y-4">
                    <h3 className="text-sm font-semibold text-slate-400 mb-4">Replies</h3>
                    {getThreadReplies(selectedMessage.id).map((reply) => (
                      <div 
                        key={reply.id} 
                        className={`pl-6 border-l-2 ${reply.senderType === 'student' ? 'border-green-600' : 'border-blue-600'}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-sm font-semibold text-white">
                            {reply.senderType === 'student' ? 'You' : reply.senderName}
                          </p>
                          <span className="text-xs text-slate-500">
                            {new Date(reply.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-300 whitespace-pre-wrap">
                          {reply.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Reply Form */}
              <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800 p-6">
                <form onSubmit={handleSendReply}>
                  <Textarea
                    placeholder="Type your reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 min-h-[100px] mb-4"
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={!replyText.trim() || sendMessageMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {sendMessageMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Send Reply
                    </Button>
                  </div>
                </form>
              </Card>
            </>
          )}
        </div>
      </main>

      {/* New Message Dialog */}
      <Dialog open={showNewMessageDialog} onOpenChange={setShowNewMessageDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>New Message</DialogTitle>
            <DialogDescription className="text-slate-400">
              Send a message to your instructors
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSendNewMessage} className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Subject</label>
              <Input
                placeholder="Enter subject..."
                value={newMessageSubject}
                onChange={(e) => setNewMessageSubject(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Message</label>
              <Textarea
                placeholder="Type your message..."
                value={newMessageBody}
                onChange={(e) => setNewMessageBody(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 min-h-[150px]"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewMessageDialog(false)}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!newMessageBody.trim() || sendMessageMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Send Message
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

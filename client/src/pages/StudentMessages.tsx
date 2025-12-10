import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  MessageSquare,
  Send,
  Inbox,
  User,
  Clock
} from "lucide-react";
import { useLocation } from "wouter";

/**
 * Student Messages - View and send messages to instructors
 */
export default function StudentMessages() {
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false);
  const [newMessageSubject, setNewMessageSubject] = useState("");
  const [newMessageBody, setNewMessageBody] = useState("");
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    // Check if student is logged in
    const isLoggedIn = localStorage.getItem("student_logged_in");
    if (!isLoggedIn) {
      setLocation("/student-login");
      return;
    }

    // TODO: Fetch messages from backend API
    // Mock data for now
    setMessages([
      {
        id: 1,
        from: "John Smith",
        subject: "Great progress in class!",
        preview: "I wanted to let you know that you're doing excellent work...",
        body: "I wanted to let you know that you're doing excellent work in class. Your technique has improved significantly over the past month. Keep up the great work!",
        date: "Oct 25, 2025",
        time: "2:30 PM",
        read: false,
        replies: []
      },
      {
        id: 2,
        from: "Sarah Johnson",
        subject: "Belt Test Preparation",
        preview: "Your belt test is scheduled for November 15th...",
        body: "Your belt test is scheduled for November 15th at 6:00 PM. Please make sure to practice the required forms and techniques. Let me know if you have any questions.",
        date: "Oct 23, 2025",
        time: "10:15 AM",
        read: true,
        replies: [
          {
            id: 1,
            from: "You",
            body: "Thank you! I'll be ready.",
            date: "Oct 23, 2025",
            time: "11:00 AM"
          }
        ]
      },
      {
        id: 3,
        from: "Admin",
        subject: "Upcoming Tournament",
        preview: "We're hosting a tournament on December 5th...",
        body: "We're hosting a tournament on December 5th. Registration is now open. This is a great opportunity to test your skills in a competitive environment.",
        date: "Oct 20, 2025",
        time: "9:00 AM",
        read: true,
        replies: []
      }
    ]);
  }, [setLocation]);

  const handleMessageClick = (message: any) => {
    setSelectedMessage(message);
    // Mark as read
    setMessages(messages.map(m => 
      m.id === message.id ? { ...m, read: true } : m
    ));
  };

  const handleNewMessage = () => {
    setShowNewMessageDialog(true);
  };

  const handleSendNewMessage = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Send message through backend API
    console.log("Sending message:", { newMessageSubject, newMessageBody });
    setShowNewMessageDialog(false);
    setNewMessageSubject("");
    setNewMessageBody("");
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMessage || !replyText.trim()) return;
    
    // TODO: Send reply through backend API
    console.log("Sending reply:", replyText);
    
    // Add reply to selected message
    const newReply = {
      id: selectedMessage.replies.length + 1,
      from: "You",
      body: replyText,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString()
    };
    
    setSelectedMessage({
      ...selectedMessage,
      replies: [...selectedMessage.replies, newReply]
    });
    
    setReplyText("");
  };

  const unreadCount = messages.filter(m => !m.read).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => selectedMessage ? setSelectedMessage(null) : setLocation("/student-dashboard")}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-white">Messages</h1>
              <p className="text-xs text-slate-400">
                {selectedMessage ? selectedMessage.subject : `${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          
          {APP_LOGO && (
            <img 
              src={APP_LOGO} 
              alt={APP_TITLE} 
              className="h-10 w-auto"
            />
          )}
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
                      {messages.length} message{messages.length !== 1 ? 's' : ''}
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

              {/* Messages List */}
              <div className="space-y-3">
                {messages.map((message) => (
                  <Card
                    key={message.id}
                    onClick={() => handleMessageClick(message)}
                    className={`bg-slate-900/50 backdrop-blur-sm border-slate-800 p-6 cursor-pointer hover:border-blue-600 transition-colors ${
                      !message.read ? 'border-l-4 border-l-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-2 rounded-full bg-blue-600/20">
                          <User className="h-5 w-5 text-blue-500" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-white">
                              {message.from}
                            </h3>
                            {!message.read && (
                              <Badge className="bg-blue-600 text-white border-0 text-xs">
                                New
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium text-slate-300 mb-1">
                            {message.subject}
                          </p>
                          <p className="text-sm text-slate-400 line-clamp-1">
                            {message.preview}
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                            <Clock className="h-3 w-3" />
                            <span>{message.date} at {message.time}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Message View */}
              <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800 p-6 mb-6">
                <div className="flex items-start gap-4 mb-6 pb-6 border-b border-slate-800">
                  <div className="p-3 rounded-full bg-blue-600/20">
                    <User className="h-6 w-6 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-white mb-1">
                      {selectedMessage.subject}
                    </h2>
                    <p className="text-sm text-slate-400 mb-2">
                      From: {selectedMessage.from}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="h-3 w-3" />
                      <span>{selectedMessage.date} at {selectedMessage.time}</span>
                    </div>
                  </div>
                </div>

                <div className="prose prose-invert max-w-none">
                  <p className="text-slate-300 leading-relaxed">
                    {selectedMessage.body}
                  </p>
                </div>

                {/* Replies */}
                {selectedMessage.replies.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-slate-800 space-y-4">
                    {selectedMessage.replies.map((reply: any) => (
                      <div key={reply.id} className="pl-6 border-l-2 border-blue-600">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-sm font-semibold text-white">
                            {reply.from}
                          </p>
                          <span className="text-xs text-slate-500">
                            {reply.date} at {reply.time}
                          </span>
                        </div>
                        <p className="text-sm text-slate-300">
                          {reply.body}
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
                    className="bg-slate-800 border-slate-700 text-white mb-4 min-h-[120px]"
                    required
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Send className="h-4 w-4 mr-2" />
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
              <Input
                placeholder="Subject"
                value={newMessageSubject}
                onChange={(e) => setNewMessageSubject(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
                required
              />
            </div>

            <div>
              <Textarea
                placeholder="Type your message..."
                value={newMessageBody}
                onChange={(e) => setNewMessageBody(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white min-h-[200px]"
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewMessageDialog(false)}
                className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

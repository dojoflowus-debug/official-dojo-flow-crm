import { useState } from 'react';
import { Link } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MentionInput } from '@/components/MentionInput';
import { 
  ArrowLeft, 
  Mail, 
  MailOpen, 
  Send, 
  User,
  Users,
  Bot,
  Clock,
  ChevronRight,
  MessageSquare,
  Inbox,
  Filter,
  GraduationCap
} from 'lucide-react';

export default function StaffInbox() {
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'students' | 'staff'>('all');
  const [newMessage, setNewMessage] = useState('');

  // Fetch threads
  const { data: threadsData, isLoading, refetch } = trpc.messaging.getStaffThreads.useQuery({ filter });

  // Fetch unread count
  const { data: unreadData } = trpc.messaging.getStaffUnreadCount.useQuery();

  // Fetch thread messages when selected
  const { data: threadData } = trpc.messaging.getThreadMessages.useQuery(
    { threadId: selectedThreadId! },
    { enabled: !!selectedThreadId }
  );

  // Send message mutation
  const sendMutation = trpc.messaging.sendMessage.useMutation({
    onSuccess: () => {
      setNewMessage('');
      refetch();
    },
  });

  const threads = threadsData?.threads || [];
  const unreadCount = unreadData?.unreadCount || 0;

  const handleSendMessage = (text: string, mentions: any[]) => {
    if (!text.trim()) return;
    
    sendMutation.mutate({
      body: text,
      mentions,
      threadId: selectedThreadId || undefined,
    });
  };

  // Get icon for participant type
  const getParticipantIcon = (type: string) => {
    switch (type) {
      case 'student':
        return <GraduationCap className="w-4 h-4 text-blue-500" />;
      case 'staff':
        return <Users className="w-4 h-4 text-green-500" />;
      case 'kai':
        return <Bot className="w-4 h-4 text-red-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                Staff Inbox
                {unreadCount > 0 && (
                  <Badge className="bg-red-500 text-white">{unreadCount}</Badge>
                )}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Messages & Mentions
              </p>
            </div>
          </div>
          
          {/* Filter buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'students' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('students')}
            >
              <GraduationCap className="w-4 h-4 mr-1" />
              Students
            </Button>
            <Button
              variant={filter === 'staff' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('staff')}
            >
              <Users className="w-4 h-4 mr-1" />
              Staff
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Thread List */}
          <div className="lg:col-span-1 space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 dark:text-white">Conversations</h2>
              <Button
                size="sm"
                onClick={() => setSelectedThreadId(null)}
                className="bg-red-600 hover:bg-red-700"
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                New
              </Button>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : threads.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
                <Inbox className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No conversations yet</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Start a new message with @ mentions
                </p>
              </div>
            ) : (
              threads.map((thread: any) => (
                <button
                  key={thread.id}
                  onClick={() => setSelectedThreadId(thread.id)}
                  className={`w-full bg-white dark:bg-gray-800 rounded-xl p-4 text-left transition-all hover:shadow-md ${
                    selectedThreadId === thread.id 
                      ? 'ring-2 ring-red-500 shadow-md' 
                      : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      thread.unreadCount > 0 
                        ? 'bg-red-100 dark:bg-red-900/30' 
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      {thread.unreadCount > 0 ? (
                        <Mail className="w-5 h-5 text-red-600 dark:text-red-400" />
                      ) : (
                        <MailOpen className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {thread.participants?.slice(0, 3).map((p: any, i: number) => (
                            <span key={i}>{getParticipantIcon(p.userType)}</span>
                          ))}
                          {thread.participants?.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{thread.participants.length - 3}
                            </span>
                          )}
                        </div>
                        {thread.unreadCount > 0 && (
                          <Badge className="bg-red-500 text-white text-xs">
                            {thread.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 truncate font-medium">
                        {thread.subject || 'No subject'}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                        {thread.lastMessage?.body || 'No messages'}
                      </p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        {new Date(thread.lastMessageAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Message View / Compose */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden min-h-[600px] flex flex-col">
              {selectedThreadId && threadData ? (
                <>
                  {/* Thread header */}
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {threadData.thread.subject || 'Conversation'}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      {threadData.thread.participants?.map((p: any, i: number) => (
                        <span key={i} className="flex items-center gap-1 text-xs text-gray-500">
                          {getParticipantIcon(p.userType)}
                          {p.role}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {threadData.messages.map((msg: any) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.senderType === 'staff' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] rounded-xl p-3 ${
                          msg.senderType === 'staff'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium opacity-80">
                              {msg.senderRole || msg.senderType}
                            </span>
                            <span className="text-xs opacity-60">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                          {msg.mentions?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {msg.mentions.map((m: any, i: number) => (
                                <span
                                  key={i}
                                  className={`text-xs px-1.5 py-0.5 rounded ${
                                    msg.senderType === 'staff'
                                      ? 'bg-white/20'
                                      : 'bg-red-500/10 text-red-600'
                                  }`}
                                >
                                  @{m.displayName}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Reply input */}
                  <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                    <MentionInput
                      value={newMessage}
                      onChange={setNewMessage}
                      onSubmit={handleSendMessage}
                      placeholder="Reply... (Type @ to mention)"
                    />
                    <div className="flex justify-end mt-2">
                      <Button
                        onClick={() => handleSendMessage(newMessage, [])}
                        disabled={!newMessage.trim() || sendMutation.isPending}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                /* New message composer */
                <div className="flex-1 flex flex-col p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    New Message
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    Type @ to mention students, instructors, or Kai. Messages will be delivered to their inbox.
                  </p>
                  
                  <div className="flex-1 flex flex-col justify-end">
                    <MentionInput
                      value={newMessage}
                      onChange={setNewMessage}
                      onSubmit={handleSendMessage}
                      placeholder="Start typing... Use @ to mention someone"
                      className="min-h-[120px]"
                    />
                    <div className="flex justify-between items-center mt-4">
                      <p className="text-xs text-gray-400">
                        Tip: @Kai will trigger an AI response
                      </p>
                      <Button
                        onClick={() => handleSendMessage(newMessage, [])}
                        disabled={!newMessage.trim() || sendMutation.isPending}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

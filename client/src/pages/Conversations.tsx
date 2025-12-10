import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, User, Clock, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function Conversations() {
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  
  const { data: conversations, isLoading } = trpc.conversations.getAll.useQuery({ status: "open" });
  const { data: stats } = trpc.conversations.getStats.useQuery();
  
  const selectedConversation = trpc.conversations.getById.useQuery(
    { id: selectedConversationId! },
    { enabled: selectedConversationId !== null }
  );

  const sendMessageMutation = trpc.conversations.sendMessage.useMutation({
    onSuccess: () => {
      setMessageText("");
      selectedConversation.refetch();
      toast.success("Message sent!");
    },
    onError: (error) => {
      toast.error(`Failed to send: ${error.message}`);
    },
  });

  const markAsReadMutation = trpc.conversations.markAsRead.useMutation({
    onSuccess: () => {
      // Refetch conversations to update unread count
    },
  });

  const handleSelectConversation = (id: number) => {
    setSelectedConversationId(id);
    markAsReadMutation.mutate({ conversationId: id });
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversationId) return;
    
    sendMessageMutation.mutate({
      conversationId: selectedConversationId,
      content: messageText,
      senderType: "staff",
    });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex h-screen">
        {/* Sidebar - Conversations List */}
        <div className="w-96 border-r border-zinc-800 flex flex-col">
          <div className="p-6 border-b border-zinc-800">
            <h1 className="text-2xl font-bold mb-2">Messages</h1>
            <p className="text-sm text-gray-400">Two-way SMS conversations</p>
          </div>

          {/* Stats */}
          {stats && (
            <div className="p-4 border-b border-zinc-800 grid grid-cols-2 gap-2">
              <div className="bg-zinc-900 p-3 rounded-lg">
                <div className="text-xs text-gray-400 mb-1">Open</div>
                <div className="text-xl font-bold text-green-500">{stats.openConversations}</div>
              </div>
              <div className="bg-zinc-900 p-3 rounded-lg">
                <div className="text-xs text-gray-400 mb-1">Unread</div>
                <div className="text-xl font-bold text-red-500">{stats.unreadCount}</div>
              </div>
            </div>
          )}

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-6 text-center text-gray-400">Loading...</div>
            ) : conversations && conversations.length > 0 ? (
              <div className="divide-y divide-zinc-800">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation.id)}
                    className={`p-4 cursor-pointer hover:bg-zinc-900 transition-colors ${
                      selectedConversationId === conversation.id ? "bg-zinc-900" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-white">{conversation.participantName}</div>
                          <div className="text-xs text-gray-400">{conversation.participantPhone}</div>
                        </div>
                      </div>
                      {conversation.unreadCount > 0 && (
                        <Badge variant="destructive" className="bg-red-600">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-400 line-clamp-2 mb-1">
                      {conversation.lastMessagePreview || "No messages yet"}
                    </div>
                    {conversation.lastMessageAt && (
                      <div className="text-xs text-gray-500">
                        {format(new Date(conversation.lastMessageAt), "MMM d, h:mm a")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center">
                <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No conversations yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Main - Conversation Thread */}
        <div className="flex-1 flex flex-col">
          {selectedConversationId && selectedConversation.data ? (
            <>
              {/* Thread Header */}
              <div className="p-6 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{selectedConversation.data.participantName}</h2>
                    <p className="text-sm text-gray-400">
                      {selectedConversation.data.participantPhone} • {selectedConversation.data.participantType}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {selectedConversation.data.messages && selectedConversation.data.messages.length > 0 ? (
                  selectedConversation.data.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.direction === "outbound" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-md rounded-lg p-4 ${
                          message.direction === "outbound"
                            ? "bg-red-600 text-white"
                            : "bg-zinc-800 text-white"
                        }`}
                      >
                        <div className="mb-2">{message.content}</div>
                        <div className="flex items-center gap-2 text-xs opacity-70">
                          <Clock className="w-3 h-3" />
                          <span>{format(new Date(message.createdAt), "MMM d, h:mm a")}</span>
                          {message.direction === "outbound" && message.status === "delivered" && (
                            <CheckCircle2 className="w-3 h-3" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-400 py-12">
                    No messages yet. Start the conversation!
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="p-6 border-t border-zinc-800">
                <div className="flex gap-3">
                  <Textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your message..."
                    className="bg-zinc-900 border-zinc-800 text-white resize-none"
                    rows={3}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || sendMessageMutation.isPending}
                    className="bg-red-600 hover:bg-red-700 self-end"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Select a conversation</h3>
                <p className="text-gray-400">Choose a conversation from the list to view messages</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

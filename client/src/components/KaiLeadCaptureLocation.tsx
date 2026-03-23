import React, { useState, useEffect, useRef } from 'react';
import { resolveActiveLocation, LocationContext, saveLocationContext } from '../lib/locationContext';

interface Message {
  id: string;
  role: 'user' | 'kai';
  content: string;
  timestamp: Date;
}

interface LeadData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  ageGroup?: string;
  programInterest?: string;
  location?: string;
  schedulePreference?: string;
  goal?: string;
}

export default function KaiLeadCaptureLocation() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationStage, setConversationStage] = useState('greeting');
  const [leadData, setLeadData] = useState<LeadData>({});
  const [locationContext, setLocationContext] = useState<LocationContext | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Detect and load location context on mount
  useEffect(() => {
    const loadLocationContext = async () => {
      try {
        // Resolve location from URL, query param, or localStorage
        const locationSlug = resolveActiveLocation(
          window.location.pathname,
          window.location.hostname,
          window.location.search
        );

        let location: LocationContext | null = null;

        if (locationSlug) {
          // Fetch location config by slug
          const response = await fetch(`/api/location/config/${locationSlug}`);
          if (response.ok) {
            location = await response.json();
          }
        } else {
          // Fallback to default location
          const response = await fetch('/api/location/default');
          if (response.ok) {
            location = await response.json();
          }
        }

        if (location) {
          setLocationContext(location);
          saveLocationContext(location);
        }
      } catch (error) {
        console.error('[KaiLeadCapture] Error loading location context:', error);
      } finally {
        setLocationLoading(false);
      }
    };

    loadLocationContext();
  }, []);

  // Initialize chat with location-aware greeting
  useEffect(() => {
    if (!locationLoading && locationContext && messages.length === 0) {
      const greeting = `Hi! I'm Kai 👋 Welcome to MyDojo ${locationContext.name}. I can help you pick the right program and book a free intro class. What are you looking for today?`;
      
      setMessages([
        {
          id: '1',
          role: 'kai',
          content: greeting,
          timestamp: new Date(),
        },
      ]);
    }
  }, [locationLoading, locationContext]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading || !locationContext) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Send to lead capture API
      const response = await fetch('/api/kai/lead-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: 120001, // TODO: Get from context
          locationId: locationContext.id,
          locationSlug: locationContext.slug,
          locationName: locationContext.name,
          pagePath: window.location.pathname,
          userMessage: inputValue,
          conversationStage,
          currentLeadData: leadData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      // Update conversation state
      setConversationStage(data.nextStage);
      setLeadData(data.extractedData);

      // Add Kai response
      const kaiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'kai',
        content: data.kaiResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, kaiMessage]);

      // Handle lead completion
      if (data.nextStage === 'complete' && data.leadId) {
        // Lead was saved successfully
        setTimeout(() => {
          const completionMessage: Message = {
            id: (Date.now() + 2).toString(),
            role: 'kai',
            content: `Perfect ✅ You're all set. If anything changes, just message me here anytime.`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, completionMessage]);
        }, 1000);
      }
    } catch (error) {
      console.error('[KaiLeadCapture] Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'kai',
        content: 'Let me try that again — go ahead and resend your message.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (locationLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-white">Loading Kai...</p>
        </div>
      </div>
    );
  }

  if (!locationContext) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="text-center text-white">
          <p className="text-xl mb-4">Unable to load location</p>
          <p className="text-gray-400">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header with Location */}
      <div className="bg-slate-800/50 border-b border-slate-700 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">K</span>
          </div>
          <div>
            <p className="text-white font-semibold">Kai</p>
            <p className="text-sm text-gray-300">MyDojo {locationContext.name} • Always here to help</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-red-600 text-white rounded-br-none'
                  : 'bg-slate-700 text-gray-100 rounded-bl-none'
              }`}
            >
              <p className="text-sm leading-relaxed">{message.content}</p>
              <p className="text-xs mt-1 opacity-70">
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-700 text-gray-100 px-4 py-3 rounded-lg rounded-bl-none">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-700 bg-slate-800/50 p-6 backdrop-blur-sm">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1 bg-slate-700 text-white placeholder-gray-400 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-6 py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

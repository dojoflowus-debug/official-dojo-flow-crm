/**
 * KaiLeadCapture - AI Chat Lead Capture Component
 * Kai engages website visitors in natural conversation to qualify and capture leads
 * Automatically adds qualified leads to the DojoFlow lead pipeline
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, X } from 'lucide-react';

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
  experienceLevel?: string;
  goal?: string;
}

interface KaiLeadCaptureProps {
  organizationId: number;
  locationId?: number;
  onLeadCaptured?: (lead: LeadData) => void;
  embedded?: boolean; // true if embedded on website
}

const PROGRAMS = {
  'little_ninjas': 'Little Ninjas (3-5)',
  'kids': 'Dragon Kids (6-12)',
  'teens': 'Teens (13-15)',
  'adults': 'Adults (16+)',
  'kickboxing': 'Kickboxing'
};

const AGE_GROUPS = {
  'toddler': '3-5 years',
  'child': '6-12 years',
  'teen': '13-15 years',
  'adult': '16+ years'
};

/**
 * KaiLeadCapture - Conversational lead qualification and capture
 */
export const KaiLeadCapture: React.FC<KaiLeadCaptureProps> = ({
  organizationId,
  locationId,
  onLeadCaptured,
  embedded = false,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [leadData, setLeadData] = useState<LeadData>({});
  const [conversationStage, setConversationStage] = useState<'greeting' | 'age' | 'program' | 'location' | 'schedule' | 'contact' | 'booking' | 'complete'>('greeting');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize with greeting
  useEffect(() => {
    const greetingMessage: Message = {
      id: '1',
      role: 'kai',
      content: "Hi! I'm Kai 👋 I can help you pick the right program and book a free intro class. What are you looking for today?",
      timestamp: new Date(),
    };
    setMessages([greetingMessage]);
  }, []);

  const addMessage = (role: 'user' | 'kai', content: string) => {
    const message: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, message]);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    addMessage('user', userMessage);
    setInputValue('');
    setIsLoading(true);

    try {
      console.log('[KAI] Sending message:', { userMessage, conversationStage, leadData });
      
      // Send to backend for AI processing and lead extraction
      const response = await fetch('/api/kai/lead-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          locationId,
          userMessage,
          conversationStage,
          currentLeadData: leadData,
          conversationHistory: messages,
        }),
      });

      if (!response.ok) throw new Error('Failed to process message');

      const data = await response.json();
      
      console.log('[KAI] API Response:', {
        currentStage: conversationStage,
        nextStage: data.nextStage,
        extractedData: data.extractedData,
        leadData: leadData,
        kaiResponse: data.kaiResponse,
      });
      
      // Update lead data with extracted information
      if (data.extractedData) {
        setLeadData(prev => ({ ...prev, ...data.extractedData }));
      }

      // Update conversation stage
      if (data.nextStage) {
        setConversationStage(data.nextStage);
      }

      // Add Kai's response
      addMessage('kai', data.kaiResponse);

      // If lead is complete, capture it
      if (data.nextStage === 'complete' && data.leadId) {
        onLeadCaptured?.(data.capturedLead);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      addMessage('kai', "Sorry, I had trouble processing that. Can you try again?");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`flex flex-col h-full ${embedded ? 'w-full' : 'w-96'}`}
      style={{
        backgroundColor: '#0f172a',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 border-b"
        style={{
          borderColor: 'rgba(255,255,255,0.1)',
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-sm">
              K
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Kai</p>
              <p className="text-xs text-gray-400">Always here to help</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-3"
        style={{
          backgroundColor: '#0f172a',
        }}
      >
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                message.role === 'user'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-800 text-gray-100'
              }`}
              style={{
                backgroundColor: message.role === 'user' ? '#ef4444' : 'rgba(255,255,255,0.08)',
                color: message.role === 'user' ? 'white' : 'rgba(255,255,255,0.9)',
              }}
            >
              {message.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div
              className="px-4 py-2 rounded-lg"
              style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
              }}
            >
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSendMessage}
        className="border-t p-3"
        style={{
          borderColor: 'rgba(255,255,255,0.1)',
          backgroundColor: '#0f172a',
        }}
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1 px-3 py-2 rounded-lg text-sm bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
            style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

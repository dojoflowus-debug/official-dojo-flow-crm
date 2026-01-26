/**
 * KaiChatStateful - Intelligent Kai chat with conversation state machine
 * Replaces the simple hard-coded script with logic-driven responses
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ConversationState,
  initialState,
  extractStudentType,
  extractAge,
  extractBookingIntent,
  extractPricingIntent,
  extractScheduleIntent,
  extractDayTimePreference,
  extractContactInfo,
  suggestProgram,
  getNextQuestion,
  calculateCompletion,
} from '@/lib/conversationStateMachine';

interface Message {
  id: string;
  role: 'user' | 'kai';
  text: string;
  timestamp: Date;
}

interface KaiChatStatefulProps {
  organizationId: number;
  locationSlug?: string;
  locationName?: string;
  locationId?: number;
  embedded?: boolean;
}

export const KaiChatStateful: React.FC<KaiChatStatefulProps> = ({
  organizationId,
  locationSlug,
  locationName = 'MyDojo',
  locationId,
  embedded = false,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [state, setState] = useState<ConversationState>({
    ...initialState,
    locationSlug: locationSlug || null,
    locationName: locationName || 'MyDojo',
    locationId: locationId || null,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize with Kai's greeting
  useEffect(() => {
    const greeting = `Hi! 👋 Welcome to ${locationName}. I can help you pick the right program and book a free intro class. What are you looking for today?`;
    setMessages([
      {
        id: '0',
        role: 'kai',
        text: greeting,
        timestamp: new Date(),
      },
    ]);
  }, [locationName]);

  /**
   * Generate Kai's response based on conversation state
   */
  const generateResponse = (userMessage: string, updatedState: ConversationState): string => {
    // Extract information from user message
    const studentType = extractStudentType(userMessage) || updatedState.studentType;
    const age = extractAge(userMessage) || updatedState.age;
    const bookingIntent = extractBookingIntent(userMessage);
    const pricingIntent = extractPricingIntent(userMessage);
    const scheduleIntent = extractScheduleIntent(userMessage);
    const dayTimePreference = extractDayTimePreference(userMessage) || updatedState.preferredDayTime;
    const contactInfo = extractContactInfo(userMessage);

    // Update state
    const newState: ConversationState = {
      ...updatedState,
      studentType: studentType || updatedState.studentType,
      age: age !== null ? age : updatedState.age,
      preferredDayTime: dayTimePreference || updatedState.preferredDayTime,
      name: contactInfo.name || updatedState.name,
      phone: contactInfo.phone || updatedState.phone,
      email: contactInfo.email || updatedState.email,
    };

    // Detect intent if not already set
    if (!newState.intent) {
      if (bookingIntent) {
        newState.intent = 'book_intro';
      } else if (pricingIntent) {
        newState.intent = 'pricing';
      } else if (scheduleIntent) {
        newState.intent = 'schedule';
      } else {
        newState.intent = 'general_questions';
      }
    }

    // Suggest program based on age
    if (age && !newState.programInterest) {
      newState.programInterest = suggestProgram(age);
    }

    setState(newState);

    // Generate response based on next question needed
    const nextQuestion = getNextQuestion(newState);

    // Handle pricing questions
    if (pricingIntent && newState.intent === 'pricing') {
      return `Great question! At ${locationName}, our pricing varies by program and age group. Our team can give you exact details. What's your preferred contact method - phone or email?`;
    }

    // Handle schedule questions
    if (scheduleIntent && newState.intent === 'schedule') {
      return `At ${locationName}, we offer classes throughout the week. What age group are you interested in? That'll help me show you the best times.`;
    }

    // Handle student type question
    if (!newState.studentType) {
      return `Got it! Who is this for - a child, teen, or yourself?`;
    }

    // Handle age question
    if ((newState.studentType === 'child' || newState.studentType === 'teen') && newState.age === null) {
      return `Awesome! How old ${newState.studentType === 'child' ? 'is your child' : 'are they'}?`;
    }

    // Suggest program based on age
    if (newState.age && !newState.programInterest) {
      const program = suggestProgram(newState.age);
      if (program) {
        newState.programInterest = program;
        return `Perfect! At ${locationName}, our ${program} program is ideal for age ${newState.age}. When would work best for you - weekdays after school or weekends?`;
      }
    }

    // Handle schedule preference
    if (newState.intent === 'book_intro' && !newState.preferredDayTime && newState.programInterest) {
      return `Great! When would work best for a free intro class - ${dayTimePreference || 'weekdays or weekends'}?`;
    }

    // Handle name collection
    if (!newState.name) {
      return `Excellent! To complete your booking, what's your name?`;
    }

    // Handle contact collection
    if (!newState.phone && !newState.email) {
      return `Thanks, ${newState.name}! What's the best way to reach you - phone or email?`;
    }

    // Ready to book
    if (newState.intent === 'book_intro' && newState.name && (newState.phone || newState.email)) {
      return `Perfect! ${newState.name}, I've got everything. Let me get you booked for a free intro class at ${locationName}. Click below to reserve your spot! 📅`;
    }

    // Default response
    return `Thanks for that info! At ${locationName}, we'd love to help. What else can I tell you about our programs?`;
  };

  /**
   * Handle user message submission
   */
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Generate Kai's response
      const kaiResponse = generateResponse(inputValue, state);

      // Add Kai's message
      const kaiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'kai',
        text: kaiResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, kaiMessage]);

      // Save lead to database if booking is complete
      if (state.intent === 'book_intro' && state.name && (state.phone || state.email)) {
        await saveLead();
      }
    } catch (error) {
      console.error('Error generating response:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Save lead to database
   */
  const saveLead = async () => {
    try {
      const response = await fetch('/api/leads/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: state.name?.split(' ')[0] || state.name,
          lastName: state.name?.split(' ').slice(1).join(' ') || '',
          phone: state.phone,
          email: state.email,
          ageGroup: state.age ? (state.age < 13 ? 'child' : 'teen') : 'adult',
          interestedProgram: state.programInterest,
          locationId: state.locationId,
          locationName: state.locationName,
          locationSlug: state.locationSlug,
          organizationId,
          source: 'website_chat',
          message: `Lead captured via Kai chat at ${state.locationName}. Program: ${state.programInterest}. Schedule: ${state.preferredDayTime}.`,
        }),
      });

      if (response.ok) {
        console.log('Lead saved successfully');
      }
    } catch (error) {
      console.error('Error saving lead:', error);
    }
  };

  return (
    <div className={`flex flex-col ${embedded ? 'h-screen' : 'h-[600px]'} bg-white rounded-lg shadow-lg overflow-hidden`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center font-bold text-lg">
            K
          </div>
          <div>
            <h2 className="font-semibold">Kai</h2>
            <p className="text-sm text-gray-300">{locationName} • Always here to help</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-red-500 text-white rounded-br-none'
                  : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none'
              }`}
            >
              <p className="text-sm">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-900 border border-gray-200 px-4 py-2 rounded-lg rounded-bl-none">
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
      <div className="border-t border-gray-200 p-4 bg-white">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Send
          </button>
        </form>
      </div>

      {/* Completion indicator (dev only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 px-4 py-2 text-xs text-gray-600 border-t border-gray-200">
          Completion: {calculateCompletion(state)}% | Intent: {state.intent || 'none'} | Student: {state.studentType || 'unknown'}
        </div>
      )}
    </div>
  );
};

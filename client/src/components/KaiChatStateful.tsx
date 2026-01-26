/**
 * KaiChatStateful - Intelligent Kai chat with validation-based state machine
 * Implements proper validation, state transitions, and clarifying follow-ups
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ConversationState,
  ConversationStage,
  initialState,
  extractStudentType,
  extractAge,
  extractBookingIntent,
  extractPricingIntent,
  extractScheduleIntent,
  extractDayTimePreference,
  extractContactInfo,
  extractContactMethod,
  suggestProgram,
  getProgramAgeRange,
  getNextStage,
  getNextQuestion,
  calculateCompletion,
  isValidPhone,
  isValidEmail,
  isValidAge,
  isValidName,
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
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
   * Generate Kai's response based on conversation state and validation
   */
  const generateResponse = (userMessage: string, currentState: ConversationState): { response: string; newState: ConversationState; shouldAdvance: boolean } => {
    let newState = { ...currentState };
    let response = '';
    let shouldAdvance = false;

    // Extract information from user message
    const studentType = extractStudentType(userMessage);
    const age = extractAge(userMessage);
    const bookingIntent = extractBookingIntent(userMessage);
    const pricingIntent = extractPricingIntent(userMessage);
    const scheduleIntent = extractScheduleIntent(userMessage);
    const dayTimePreference = extractDayTimePreference(userMessage);
    const contactMethod = extractContactMethod(userMessage);
    const contactInfo = extractContactInfo(userMessage);

    // Determine current stage and validate input
    const stageTransition = getNextStage(currentState, userMessage);
    const { stage: nextStage, validationPassed } = stageTransition;

    // Handle each conversation stage
    switch (currentState.currentStage) {
      case 'INTRO':
        if (bookingIntent) {
          newState.intent = 'book_intro';
          newState.currentStage = 'CAPTURE_STUDENT_TYPE';
          newState.lastAskedField = 'student_type';
          response = `Got it! Who is this for - a child, teen, or yourself?`;
          shouldAdvance = true;
        } else if (pricingIntent) {
          newState.intent = 'pricing';
          response = `Great question! At ${locationName}, our pricing varies by program. What age group are you interested in?`;
          shouldAdvance = false;
        } else if (scheduleIntent) {
          newState.intent = 'schedule';
          response = `At ${locationName}, we offer classes throughout the week. What age group are you interested in?`;
          shouldAdvance = false;
        } else {
          response = `I can help you book a free intro class, answer pricing questions, or tell you about our schedule. What would you like to know?`;
          shouldAdvance = false;
        }
        break;

      case 'CAPTURE_STUDENT_TYPE':
        if (studentType) {
          newState.studentType = studentType;
          newState.lastAskedField = null;
          
          if (studentType === 'child' || studentType === 'teen') {
            newState.currentStage = 'CAPTURE_STUDENT_AGE';
            newState.lastAskedField = 'age';
            response = `Awesome! How old ${studentType === 'child' ? 'is your child' : 'are they'}?`;
            shouldAdvance = true;
          } else {
            newState.currentStage = 'CAPTURE_NAME';
            newState.lastAskedField = 'name';
            response = `Perfect! To get you booked, what's your name?`;
            shouldAdvance = true;
          }
        } else {
          // Clarify if user gave non-value answer
          if (currentState.lastAskedField === 'student_type') {
            response = `I can help with child, teen, or adult programs. Which one are you interested in?`;
          } else {
            response = `Got it! Who is this for - a child, teen, or yourself?`;
          }
          newState.lastAskedField = 'student_type';
          shouldAdvance = false;
        }
        break;

      case 'CAPTURE_STUDENT_AGE':
        if (age !== null && isValidAge(age)) {
          newState.age = age;
          newState.programInterest = suggestProgram(age);
          newState.currentStage = 'CAPTURE_NAME';
          newState.lastAskedField = 'name';
          
          const program = newState.programInterest;
          const ageRange = getProgramAgeRange(program);
          response = `Perfect! At ${locationName}, our ${program} program is ideal for ages ${ageRange}. To get you booked, what's your name?`;
          shouldAdvance = true;
        } else {
          // Clarify if user gave non-value answer
          if (currentState.lastAskedField === 'age') {
            response = `I need a number between 2 and 99. For example, if they're 7 years old, just reply with "7".`;
          } else {
            response = `How old are they? Just give me the number.`;
          }
          newState.lastAskedField = 'age';
          shouldAdvance = false;
        }
        break;

      case 'CAPTURE_NAME':
        if (contactInfo.name && isValidName(contactInfo.name)) {
          newState.name = contactInfo.name;
          newState.currentStage = 'CAPTURE_CONTACT_METHOD';
          newState.lastAskedField = 'contact_method';
          response = `Thanks, ${contactInfo.name}! What's the best way to reach you - phone or email?`;
          shouldAdvance = true;
        } else {
          // Clarify if user gave non-value answer
          if (currentState.lastAskedField === 'name') {
            response = `I need a name to complete your booking. What should I call you?`;
          } else {
            response = `What's your name?`;
          }
          newState.lastAskedField = 'name';
          shouldAdvance = false;
        }
        break;

      case 'CAPTURE_CONTACT_METHOD':
        if (contactMethod) {
          newState.preferredContactMethod = contactMethod;
          newState.currentStage = 'CAPTURE_PHONE_OR_EMAIL';
          newState.lastAskedField = contactMethod === 'email' ? 'email' : 'phone';
          
          if (contactMethod === 'email') {
            response = `Perfect! What email should I use? (e.g., name@email.com)`;
          } else {
            response = `Perfect! What phone number should we text or call you at? (e.g., 281-555-0123)`;
          }
          shouldAdvance = true;
        } else {
          // Clarify if user gave non-value answer (e.g., just "Phone")
          if (currentState.lastAskedField === 'contact_method') {
            response = `I can do phone or email. If phone, reply with your number like 281-555-0123. If email, reply like name@email.com.`;
          } else {
            response = `What's the best way to reach you - phone or email?`;
          }
          newState.lastAskedField = 'contact_method';
          shouldAdvance = false;
        }
        break;

      case 'CAPTURE_PHONE_OR_EMAIL':
        const method = currentState.preferredContactMethod;
        
        if (method === 'email') {
          if (contactInfo.email && isValidEmail(contactInfo.email)) {
            newState.email = contactInfo.email;
            newState.currentStage = 'CONFIRM_BOOKING_INTENT';
            newState.lastAskedField = null;
            
            const program = newState.programInterest || 'our program';
            response = `Excellent! ${newState.name}, I've got everything. Let me get you booked for a free intro class at ${locationName}. Click below to reserve your spot! 📅`;
            shouldAdvance = true;
          } else {
            if (currentState.lastAskedField === 'email') {
              response = `I need a valid email address. It should look like: name@email.com`;
            } else {
              response = `What's your email address?`;
            }
            newState.lastAskedField = 'email';
            shouldAdvance = false;
          }
        } else if (method === 'phone' || method === 'text') {
          if (contactInfo.phone && isValidPhone(contactInfo.phone)) {
            newState.phone = contactInfo.phone;
            newState.currentStage = 'CONFIRM_BOOKING_INTENT';
            newState.lastAskedField = null;
            
            const program = newState.programInterest || 'our program';
            response = `Excellent! ${newState.name}, I've got everything. Let me get you booked for a free intro class at ${locationName}. Click below to reserve your spot! 📅`;
            shouldAdvance = true;
          } else {
            if (currentState.lastAskedField === 'phone') {
              response = `I need a valid phone number. It should look like: 281-555-0123 or 2815550123`;
            } else {
              response = `What's your phone number?`;
            }
            newState.lastAskedField = 'phone';
            shouldAdvance = false;
          }
        }
        break;

      case 'CONFIRM_BOOKING_INTENT':
      case 'SUCCESS':
        response = `Thanks for choosing ${locationName}! Our team will be in touch soon to confirm your free intro class.`;
        shouldAdvance = false;
        break;

      default:
        response = `At ${locationName}, we'd love to help. What can I tell you about our programs?`;
        shouldAdvance = false;
    }

    // Update completion percentage
    newState.completionPercentage = calculateCompletion(newState);

    return { response, newState, shouldAdvance };
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
      // Generate Kai's response with validation
      const { response, newState, shouldAdvance } = generateResponse(inputValue, state);
      
      setState(newState);

      // Add Kai's message
      const kaiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'kai',
        text: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, kaiMessage]);

      // Save lead to database if booking is complete
      if (newState.currentStage === 'CONFIRM_BOOKING_INTENT' && newState.name && (newState.phone || newState.email)) {
        await saveLead(newState);
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
  const saveLead = async (leadState: ConversationState) => {
    try {
      const response = await fetch('/api/leads/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: leadState.name?.split(' ')[0] || leadState.name,
          lastName: leadState.name?.split(' ').slice(1).join(' ') || '',
          phone: leadState.phone,
          email: leadState.email,
          ageGroup: leadState.age ? (leadState.age < 13 ? 'child' : 'teen') : 'adult',
          interestedProgram: leadState.programInterest,
          locationId: leadState.locationId,
          locationName: leadState.locationName,
          locationSlug: leadState.locationSlug,
          organizationId,
          source: 'website_chat',
          message: `Lead captured via Kai chat at ${leadState.locationName}. Program: ${leadState.programInterest}. Schedule: ${leadState.preferredDayTime}.`,
        }),
      });

      if (response.ok) {
        console.log('Lead saved successfully');
      }
    } catch (error) {
      console.error('Error saving lead:', error);
    }
  };

  // Check if debug mode should be shown
  const showDebug = process.env.NODE_ENV === 'development' || (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === '1');

  return (
    <div className={`flex flex-col ${embedded ? 'h-screen' : 'h-[600px]'} bg-white rounded-lg shadow-lg overflow-hidden relative`}>
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 pb-20">
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

      {/* Input - Premium Glass Design */}
      <div className="sticky bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-900/20 to-transparent backdrop-blur-sm">
        <form onSubmit={handleSendMessage} className="flex gap-3 items-center">
          {/* Input Field */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-slate-800/40 backdrop-blur-md border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/30 focus:bg-slate-800/60 transition-all duration-200 shadow-lg focus:shadow-[0_0_20px_rgba(239,68,68,0.3)]"
          />
          {/* Send Button - Glowing Red */}
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-[0_0_20px_rgba(239,68,68,0.6)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none active:scale-95 flex items-center gap-2"
          >
            <span>Send</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7m0 0l-7 7m7-7H6" />
            </svg>
          </button>
        </form>
      </div>

      {/* Completion indicator (dev only or with ?debug=1) */}
      {showDebug && (
        <div className="absolute bottom-20 left-0 right-0 bg-gray-100 px-4 py-2 text-xs text-gray-600 border-t border-gray-200">
          Stage: {state.currentStage} | Completion: {calculateCompletion(state)}% | Intent: {state.intent || 'none'} | Student: {state.studentType || 'unknown'}
        </div>
      )}
    </div>
  );
};

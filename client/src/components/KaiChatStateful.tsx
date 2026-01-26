/**
 * KaiChatStateful - Intelligent Kai chat with validation-based state machine
 * Implements proper validation, state transitions, and clarifying follow-ups
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ConversationState,
  ConversationStage,
  initialState,
  extractLeadSignals,
  extractStudentType,
  extractAge,
  extractBookingIntent,
  extractPricingIntent,
  extractScheduleIntent,
  extractDayTimePreference,
  extractContactInfo,
  extractContactMethod,
  extractEmail,
  extractPhone,
  getProgramForAge,
  getNextStage,
  calculateCompletion,
  isValidPhone,
  isValidEmail,
  isValidAge,
  isValidName,
  isStageComplete,
  applySignals,
  findNextIncompleteStage,
  shouldSkipQuestion,
} from '@/lib/conversationStateMachine';
import { CalendarPicker } from './CalendarPicker';

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

// Debug flag - set to false in production
const DEBUG_KAI_STATE = process.env.NODE_ENV === 'development';

const debugLog = (label: string, data: any) => {
  if (DEBUG_KAI_STATE) {
    console.log(`[KAI ${label}]`, data);
  }
};

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
  // Derive showCalendar from stage instead of using separate state
  const showCalendarDerived = state.currentStage === 'CAPTURE_SCHEDULE' && !state.preferredDayTime;
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
   * Uses unified signal extraction to prevent "I already told you" loops
   */
  const generateResponse = (userMessage: string, currentState: ConversationState): { response: string; newState: ConversationState; shouldAdvance: boolean } => {
    let newState = { ...currentState };
    let response = '';
    let shouldAdvance = false;

    // UNIFIED SIGNAL EXTRACTION - scan message for ALL possible signals
    const signals = extractLeadSignals(userMessage);
    
    // Merge extracted signals into state
    if (signals.email && isValidEmail(signals.email)) {
      newState.email = signals.email;
      newState.preferredContactMethod = 'email';
    }
    if (signals.phone && isValidPhone(signals.phone)) {
      newState.phone = signals.phone;
      newState.preferredContactMethod = 'phone';
    }
    if (signals.age !== undefined && isValidAge(signals.age)) {
      newState.age = signals.age;
      if (signals.programInterest) {
        newState.programInterest = signals.programInterest;
      }
    }
    if (signals.name && isValidName(signals.name)) {
      newState.name = signals.name;
    }
    if (signals.studentType) {
      newState.studentType = signals.studentType;
    }
    if (signals.preferredDayTime) {
      newState.preferredDayTime = signals.preferredDayTime;
    }

    // Track asked count for loop breaker
    if (!newState.askedCount) {
      newState.askedCount = {};
    }

    // Handle each conversation stage
    switch (currentState.currentStage) {
      case 'INTRO':
        if (extractBookingIntent(userMessage)) {
          newState.intent = 'book_intro';
          newState.currentStage = 'CAPTURE_STUDENT_TYPE';
          newState.lastAskedField = null;
          response = `Got it! Who is this for - a child, teen, or yourself?`;
          shouldAdvance = true;
        } else if (extractPricingIntent(userMessage)) {
          newState.intent = 'pricing_inquiry';
          response = `Great question! Our programs range from $99-$199/month depending on the schedule. Which age group are you interested in?`;
          shouldAdvance = false;
        } else {
          response = `At ${locationName}, we'd love to help. What can I tell you about our programs?`;
          shouldAdvance = false;
        }
        break;

      case 'CAPTURE_STUDENT_TYPE':
        if (newState.studentType) {
          if (newState.studentType === 'child' || newState.studentType === 'teen') {
            newState.currentStage = 'CAPTURE_STUDENT_AGE';
            newState.lastAskedField = null;
            response = `Awesome! How old is your ${newState.studentType}?`;
          } else {
            newState.currentStage = 'CAPTURE_NAME';
            newState.lastAskedField = null;
            response = `Perfect! What's your name?`;
          }
          shouldAdvance = true;
        } else {
          // Loop breaker - if asked 2+ times, show buttons
          const askedCount = (newState.askedCount['student_type'] || 0) + 1;
          newState.askedCount['student_type'] = askedCount;
          
          if (askedCount >= 2) {
            response = `I can do child, teen, or adult. If it's for a child, just say "child" or "my 7 year old". If it's for you, say "myself" or "adult".`;
          } else {
            response = `Who is this for - a child, teen, or yourself?`;
          }
          newState.lastAskedField = 'student_type';
          shouldAdvance = false;
        }
        break;

      case 'CAPTURE_STUDENT_AGE':
        if (newState.age && isValidAge(newState.age)) {
          // Auto-suggest program based on age
          if (!newState.programInterest) {
            const suggestedProgram = suggestProgram(newState.age);
            if (suggestedProgram) {
              newState.programInterest = suggestedProgram;
            }
          }
          
          newState.currentStage = 'CAPTURE_NAME';
          newState.lastAskedField = null;
          
          const ageRange = getProgramAgeRange(newState.programInterest);
          response = `Perfect! At ${locationName}, our ${newState.programInterest} program is ideal for ages ${ageRange}. To get you booked, what's your name?`;
          shouldAdvance = true;
        } else {
          // Targeted repair prompt for invalid age
          const askedCount = (newState.askedCount['age'] || 0) + 1;
          newState.askedCount['age'] = askedCount;
          
          if (askedCount >= 2) {
            response = `I need a valid age (2-99). Just give me a number like 7 or 12.`;
          } else {
            response = `How old is your ${currentState.studentType}?`;
          }
          newState.lastAskedField = 'age';
          shouldAdvance = false;
        }
        break;

      case 'CAPTURE_NAME':
        if (newState.name && isValidName(newState.name)) {
          newState.currentStage = 'CAPTURE_SCHEDULE';
          newState.lastAskedField = null;
          response = `Thanks, ${newState.name}! When would you like to come in for a free intro class?`;
          shouldAdvance = true;
        } else {
          // Targeted repair prompt for invalid name
          const askedCount = (newState.askedCount['name'] || 0) + 1;
          newState.askedCount['name'] = askedCount;
          
          if (askedCount >= 2) {
            response = `I need a valid name. Just give me your first name or full name.`;
          } else {
            response = `What's your name?`;
          }
          newState.lastAskedField = 'name';
          shouldAdvance = false;
        }
        break;

      case 'CAPTURE_SCHEDULE':
        if (newState.preferredDayTime) {
          // Calendar was selected, show confirmation and move to contact method
          newState.currentStage = 'CAPTURE_CONTACT_METHOD';
          newState.lastAskedField = null;
          response = `Perfect! I've got you for ${newState.preferredDayTime}. What's the best way to reach you - phone or email?`;
          shouldAdvance = true;
        } else {
          // Show calendar UI (derived from stage)
          response = `Pick a day and time that works for you:`;
          shouldAdvance = false;
        }
        break;

      case 'CAPTURE_CONTACT_METHOD': {
        // SMART CONTACT METHOD: Accept email or phone directly
        if (newState.email && isValidEmail(newState.email)) {
          newState.preferredContactMethod = 'email';
          newState.currentStage = 'CONFIRM_BOOKING_INTENT';
          newState.lastAskedField = null;
          response = `Excellent! ${newState.name}, I've got everything. Let me get you booked for a free intro class at ${locationName}. Click below to reserve your spot! 📅`;
          shouldAdvance = true;
        } else if (newState.phone && isValidPhone(newState.phone)) {
          newState.preferredContactMethod = 'phone';
          newState.currentStage = 'CONFIRM_BOOKING_INTENT';
          newState.lastAskedField = null;
          response = `Excellent! ${newState.name}, I've got everything. Let me get you booked for a free intro class at ${locationName}. Click below to reserve your spot! 📅`;
          shouldAdvance = true;
        } else if (newState.email && newState.phone && !newState.preferredContactMethod) {
          // Both email and phone provided, ask for preference
          const askedCount = (newState.askedCount['contact_preference'] || 0) + 1;
          newState.askedCount['contact_preference'] = askedCount;
          
          if (askedCount >= 2) {
            response = `Do you prefer text/call at ${newState.phone} or email at ${newState.email}?`;
          } else {
            response = `Do you prefer text/call or email?`;
          }
          newState.lastAskedField = 'contact_preference';
          shouldAdvance = false;
        } else if (signals.preferredContactMethod) {
          // User said "phone" or "email" keyword
          newState.preferredContactMethod = signals.preferredContactMethod;
          
          if (signals.preferredContactMethod === 'email') {
            newState.currentStage = 'CAPTURE_PHONE_OR_EMAIL';
            newState.lastAskedField = 'email';
            response = `Perfect! What email should I use? (e.g., name@email.com)`;
          } else {
            newState.currentStage = 'CAPTURE_PHONE_OR_EMAIL';
            newState.lastAskedField = 'phone';
            response = `Perfect! What phone number should we text or call you at? (e.g., 281-555-0123)`;
          }
          shouldAdvance = true;
        } else {
          // Targeted repair prompt
          const askedCount = (newState.askedCount['contact_method'] || 0) + 1;
          newState.askedCount['contact_method'] = askedCount;
          
          if (askedCount >= 2) {
            response = `I can do phone or email. If phone, reply with your number like 281-555-0123. If email, reply like name@email.com.`;
          } else {
            response = `What's the best way to reach you - phone or email?`;
          }
          newState.lastAskedField = 'contact_method';
          shouldAdvance = false;
        }
        break;
      }

      case 'CAPTURE_PHONE_OR_EMAIL': {
        const method = newState.preferredContactMethod;
        
        if (method === 'email') {
          if (newState.email && isValidEmail(newState.email)) {
            newState.currentStage = 'CONFIRM_BOOKING_INTENT';
            newState.lastAskedField = null;
            response = `Excellent! ${newState.name}, I've got everything. Let me get you booked for a free intro class at ${locationName}. Click below to reserve your spot! 📅`;
            shouldAdvance = true;
          } else {
            // Targeted repair prompt for invalid email
            const askedCount = (newState.askedCount['email'] || 0) + 1;
            newState.askedCount['email'] = askedCount;
            
            if (askedCount >= 2) {
              response = `That email looks a little off. Can you re-type it like name@email.com?`;
            } else {
              response = `What's your email address?`;
            }
            newState.lastAskedField = 'email';
            shouldAdvance = false;
          }
        } else if (method === 'phone' || method === 'text') {
          if (newState.phone && isValidPhone(newState.phone)) {
            newState.currentStage = 'CONFIRM_BOOKING_INTENT';
            newState.lastAskedField = null;
            response = `Excellent! ${newState.name}, I've got everything. Let me get you booked for a free intro class at ${locationName}. Click below to reserve your spot! 📅`;
            shouldAdvance = true;
          } else {
            // Targeted repair prompt for invalid phone
            const askedCount = (newState.askedCount['phone'] || 0) + 1;
            newState.askedCount['phone'] = askedCount;
            
            if (askedCount >= 2) {
              response = `Can you send the full phone number (10 digits), like 281-555-0123?`;
            } else {
              response = `What's your phone number?`;
            }
            newState.lastAskedField = 'phone';
            shouldAdvance = false;
          }
        }
        break;
      }

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

    // Generate Kai's response
    const { response, newState, shouldAdvance } = generateResponse(inputValue, state);
    setState(newState);

    // Add Kai's response
    setTimeout(() => {
      const kaiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'kai',
        text: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, kaiMessage]);
      setIsLoading(false);
    }, 500);
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

  // Check if lead capture is complete
  const isLeadComplete = state.currentStage === 'CONFIRM_BOOKING_INTENT' || state.currentStage === 'SUCCESS';
  const completion = calculateCompletion(state);

  // Handle Reserve Your Spot button click
  const handleReserveSpot = async () => {
    // Save lead to database
    await saveLead(state);
    
    // Redirect to scheduling/payment flow
    // For now, we'll show a confirmation message
    // In production, this would redirect to Stripe checkout or scheduling system
    const checkoutUrl = `/checkout?program=${state.programInterest}&age=${state.age}&location=${state.locationSlug}&name=${encodeURIComponent(state.name || '')}&email=${state.email}&phone=${state.phone}`;
    window.open(checkoutUrl, '_blank');
  };

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
        {/* Calendar Picker for Schedule Selection */}
        {showCalendarDerived && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-lg rounded-bl-none p-4 w-full max-w-md">
              <CalendarPicker
                onSelectDateTime={(date, time) => {
                  const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                  const timeStr = time || '4:00 PM';
                  const preferredDayTime = `${dateStr} at ${timeStr}`;
                  
                  // Update state with selected date/time
                  setState((prev) => ({
                    ...prev,
                    preferredDayTime,
                    currentStage: 'CAPTURE_CONTACT_METHOD',
                  }));
                  
                  // Add confirmation message
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: Date.now().toString(),
                      role: 'user',
                      text: `${dateStr} at ${timeStr}`,
                      timestamp: new Date(),
                    },
                    {
                      id: (Date.now() + 1).toString(),
                      role: 'kai',
                      text: `Perfect, I've got you for ${preferredDayTime}. What's the best way to reach you - phone or email?`,
                      timestamp: new Date(),
                    },
                  ]);
                  
                  // Calendar will auto-hide when stage changes
                }}
              />
            </div>
          </div>
        )}
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

      {/* Success State - Reserve Your Spot Button */}
      {isLeadComplete && (
        <div className="sticky bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-green-900/30 via-slate-900/20 to-transparent backdrop-blur-sm border-t border-green-500/20">
          <div className="space-y-3">
            {/* Confirmation Summary */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3 text-sm text-white">
              <div className="font-semibold text-green-400 mb-2">✓ Ready to book!</div>
              <div className="space-y-1 text-gray-300 text-xs">
                <div>📍 {state.programInterest} (Ages {state.age}+)</div>
                <div>👤 {state.name}</div>
                <div>📧 {state.email || state.phone}</div>
              </div>
            </div>
            {/* Reserve Your Spot Button */}
            <button
              onClick={handleReserveSpot}
              className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg font-bold transition-all duration-200 shadow-lg hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] active:scale-95 flex items-center justify-center gap-2 group"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Reserve Your Spot</span>
            </button>
          </div>
        </div>
      )}

      {/* Input - Premium Glass Design (hidden when lead is complete) */}
      {!isLeadComplete && (
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
      )}

      {/* Completion indicator (dev only or with ?debug=1) */}
      {showDebug && (
        <div className="absolute bottom-20 left-0 right-0 bg-gray-100 px-4 py-2 text-xs text-gray-600 border-t border-gray-200">
          Stage: {state.currentStage} | Completion: {calculateCompletion(state)}% | Intent: {state.intent || 'none'} | Student: {state.studentType || 'unknown'}
        </div>
      )}
    </div>
  );
};

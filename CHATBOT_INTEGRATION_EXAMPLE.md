# Chatbot Integration Example

This is a complete example of how to integrate the DojoFlow lead submission API into your website's chatbot.

## Setup

1. Store your DojoFlow credentials in environment variables:

```env
VITE_DOJOFLOW_EMAIL=sensei@mydojomartialarts.com
VITE_DOJOFLOW_PASSWORD=your-secure-password
VITE_DOJOFLOW_API_URL=https://dojoflow.manus.space
```

2. Create a service file for API calls:

## LeadService.ts

```typescript
// services/leadService.ts

interface LeadData {
  firstName: string;
  lastName: string;
  phone: string;
  programInterest: string;
  appointmentDate?: string;
  appointmentTime?: string;
  message?: string;
}

interface AvailableSlot {
  time: string;
  label: string;
}

const API_URL = import.meta.env.VITE_DOJOFLOW_API_URL || 'https://dojoflow.manus.space';
const EMAIL = import.meta.env.VITE_DOJOFLOW_EMAIL;
const PASSWORD = import.meta.env.VITE_DOJOFLOW_PASSWORD;

export const leadService = {
  async validateCredentials(): Promise<{ valid: boolean; message: string }> {
    try {
      const params = new URLSearchParams({
        email: EMAIL,
        password: PASSWORD,
      });

      const response = await fetch(
        `${API_URL}/api/trpc/publicLead.validateCredentials?${params}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const result = await response.json();
      return result.result?.data || { valid: false, message: 'Validation failed' };
    } catch (error) {
      console.error('Credential validation error:', error);
      return { valid: false, message: 'Network error' };
    }
  },

  async getAvailableSlots(): Promise<AvailableSlot[]> {
    try {
      const params = new URLSearchParams({
        email: EMAIL,
        password: PASSWORD,
      });

      const response = await fetch(
        `${API_URL}/api/trpc/publicLead.getAvailableSlots?${params}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const result = await response.json();
      return result.result?.data?.slots || [];
    } catch (error) {
      console.error('Error fetching slots:', error);
      return [];
    }
  },

  async submitLead(leadData: LeadData): Promise<{ success: boolean; leadId?: number; message: string }> {
    try {
      const response = await fetch(`${API_URL}/api/trpc/publicLead.submitLead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: EMAIL,
          password: PASSWORD,
          ...leadData,
          source: 'Website Chatbot',
        }),
      });

      const result = await response.json();

      if (result.result?.data?.success) {
        return {
          success: true,
          leadId: result.result.data.leadId,
          message: result.result.data.message,
        };
      } else {
        return {
          success: false,
          message: result.error?.message || 'Failed to submit lead',
        };
      }
    } catch (error) {
      console.error('Lead submission error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  },
};
```

## ChatbotWidget.tsx

```typescript
// components/ChatbotWidget.tsx

import React, { useState, useEffect } from 'react';
import { leadService } from '@/services/leadService';

type ChatStep = 'greeting' | 'firstName' | 'lastName' | 'phone' | 'program' | 'appointment' | 'time' | 'message' | 'confirmation';

interface ChatMessage {
  role: 'bot' | 'user';
  content: string;
}

const PROGRAMS = ['Karate', 'Judo', 'Taekwondo', 'Kung Fu', 'Brazilian Jiu-Jitsu'];

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentStep, setCurrentStep] = useState<ChatStep>('greeting');
  const [isLoading, setIsLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    programInterest: '',
    appointmentDate: '',
    appointmentTime: '',
    message: '',
  });

  // Initialize chatbot
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      initializeChatbot();
    }
  }, [isOpen]);

  async function initializeChatbot() {
    setIsLoading(true);
    
    // Validate credentials
    const validation = await leadService.validateCredentials();
    
    setIsLoading(false);

    if (!validation.valid) {
      addMessage('bot', '❌ Unable to connect. Please refresh the page and try again.');
      return;
    }

    // Get available slots
    const slots = await leadService.getAvailableSlots();
    setAvailableSlots(slots);

    // Start conversation
    addMessage('bot', '👋 Welcome! I\'m here to help you get started with our programs. What\'s your first name?');
    setCurrentStep('firstName');
  }

  function addMessage(role: 'bot' | 'user', content: string) {
    setMessages(prev => [...prev, { role, content }]);
  }

  async function handleUserInput(input: string) {
    addMessage('user', input);

    switch (currentStep) {
      case 'firstName':
        setFormData(prev => ({ ...prev, firstName: input }));
        addMessage('bot', `Nice to meet you, ${input}! What's your last name?`);
        setCurrentStep('lastName');
        break;

      case 'lastName':
        setFormData(prev => ({ ...prev, lastName: input }));
        addMessage('bot', `Thanks, ${input}! What's the best phone number to reach you?`);
        setCurrentStep('phone');
        break;

      case 'phone':
        setFormData(prev => ({ ...prev, phone: input }));
        addMessage('bot', `Great! Which program are you interested in?\n\n${PROGRAMS.map((p, i) => `${i + 1}. ${p}`).join('\n')}`);
        setCurrentStep('program');
        break;

      case 'program':
        const selectedProgram = PROGRAMS[parseInt(input) - 1];
        if (selectedProgram) {
          setFormData(prev => ({ ...prev, programInterest: selectedProgram }));
          addMessage('bot', `Excellent choice! Would you like to schedule an introductory session?\n\nReply with:\n- "Yes" to schedule\n- "No" to skip`);
          setCurrentStep('appointment');
        } else {
          addMessage('bot', 'Please select a valid program number.');
        }
        break;

      case 'appointment':
        if (input.toLowerCase() === 'yes') {
          addMessage('bot', `Great! Here are our available times:\n\n${availableSlots.map((s, i) => `${i + 1}. ${s.label}`).join('\n')}`);
          setCurrentStep('time');
        } else {
          addMessage('bot', 'No problem! Is there anything else you\'d like to tell us?');
          setCurrentStep('message');
        }
        break;

      case 'time':
        const selectedSlot = availableSlots[parseInt(input) - 1];
        if (selectedSlot) {
          setFormData(prev => ({ ...prev, appointmentTime: selectedSlot.time }));
          // For simplicity, use today's date. In production, let user select date
          const today = new Date().toISOString().split('T')[0];
          setFormData(prev => ({ ...prev, appointmentDate: today }));
          addMessage('bot', `Perfect! I've scheduled you for ${selectedSlot.label} today. Is there anything else you\'d like to tell us?`);
          setCurrentStep('message');
        } else {
          addMessage('bot', 'Please select a valid time slot.');
        }
        break;

      case 'message':
        setFormData(prev => ({ ...prev, message: input }));
        await submitLead();
        break;
    }
  }

  async function submitLead() {
    setIsLoading(true);
    addMessage('bot', '📝 Processing your information...');

    const result = await leadService.submitLead(formData);

    setIsLoading(false);

    if (result.success) {
      addMessage('bot', `✅ ${result.message}\n\nWe'll be in touch soon! Thank you for choosing us.`);
      setCurrentStep('confirmation');
      
      // Reset after 3 seconds
      setTimeout(() => {
        resetChat();
      }, 3000);
    } else {
      addMessage('bot', `❌ ${result.message}\n\nPlease try again or contact us directly.`);
      setCurrentStep('message');
    }
  }

  function resetChat() {
    setMessages([]);
    setCurrentStep('greeting');
    setFormData({
      firstName: '',
      lastName: '',
      phone: '',
      programInterest: '',
      appointmentDate: '',
      appointmentTime: '',
      message: '',
    });
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col">
          {/* Header */}
          <div className="bg-red-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <h3 className="font-bold">DojoFlow Assistant</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-red-700 p-1 rounded"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg">
                  ⏳ Processing...
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          {currentStep !== 'confirmation' && (
            <div className="border-t p-4">
              <input
                type="text"
                placeholder="Type your response..."
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value) {
                    handleUserInput(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
                disabled={isLoading}
              />
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-red-600 text-white rounded-full p-4 shadow-lg hover:bg-red-700 transition"
        >
          💬 Chat
        </button>
      )}
    </div>
  );
}
```

## Usage

Add the chatbot widget to your website:

```typescript
// pages/Home.tsx or your main layout

import { ChatbotWidget } from '@/components/ChatbotWidget';

export default function Home() {
  return (
    <div>
      {/* Your website content */}
      <ChatbotWidget />
    </div>
  );
}
```

## Customization

### Change Programs List

Edit the `PROGRAMS` array in `ChatbotWidget.tsx`:

```typescript
const PROGRAMS = ['Karate', 'Judo', 'Taekwondo', 'Kung Fu', 'Brazilian Jiu-Jitsu'];
```

### Customize Messages

Edit the `addMessage` calls to match your brand voice.

### Change Colors

Update the Tailwind classes (e.g., `bg-red-600`) to match your brand colors.

### Add Date Selection

Currently, the chatbot uses today's date. To allow date selection:

```typescript
case 'appointment':
  if (input.toLowerCase() === 'yes') {
    addMessage('bot', 'What date would you prefer? (YYYY-MM-DD)');
    setCurrentStep('date');
  }
  break;

case 'date':
  setFormData(prev => ({ ...prev, appointmentDate: input }));
  addMessage('bot', `Great! Here are our available times:\n\n${availableSlots.map((s, i) => `${i + 1}. ${s.label}`).join('\n')}`);
  setCurrentStep('time');
  break;
```

## Testing

1. Open the website
2. Click the chat button
3. Follow the conversation flow
4. Check DojoFlow's Lead Pipeline to see the new lead

## Troubleshooting

**Chatbot doesn't open:**
- Check browser console for errors
- Verify environment variables are set correctly

**Leads not appearing:**
- Verify credentials are correct
- Check network tab in browser dev tools
- Ensure DojoFlow account is set up properly

**Appointment slots not showing:**
- Check `getAvailableSlots` is returning data
- Verify API connectivity

## Next Steps

1. Customize the chatbot appearance to match your brand
2. Add date selection for appointments
3. Integrate with email notifications
4. Add lead confirmation emails
5. Set up automation rules in DojoFlow

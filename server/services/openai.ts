import { invokeLLM } from '../_core/llm';

// Define CRM function tools for the LLM
const crmTools = [
  {
    type: 'function' as const,
    function: {
      name: 'get_student_count',
      description: 'Get the total number of students in the dojo',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'all'],
            description: 'Filter by student status',
          },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'find_student',
      description: 'Find a student by name, email, or phone number',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Student name, email, or phone to search for',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_revenue',
      description: 'Get revenue information for the dojo',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['today', 'week', 'month', 'year'],
            description: 'Time period for revenue calculation',
          },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_leads',
      description: 'Get information about leads (prospective students)',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['new', 'contacted', 'converted', 'all'],
            description: 'Filter by lead status',
          },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'search_students',
      description: 'Search for students by name, email, or phone number. Returns a list of matching students with their IDs.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query (name, email, or phone)',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_student',
      description: 'Get full details for a specific student by ID',
      parameters: {
        type: 'object',
        properties: {
          studentId: {
            type: 'number',
            description: 'Student ID',
          },
        },
        required: ['studentId'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'list_at_risk_students',
      description: 'Find students who are inactive or on hold. Returns a list of at-risk students.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'list_late_payments',
      description: 'Find students with overdue payments. Returns a list of students with late payments.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'search_leads',
      description: 'Search for leads by name, email, or phone number. Returns a list of matching leads with their IDs.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query (name, email, or phone)',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_lead',
      description: 'Get full details for a specific lead by ID',
      parameters: {
        type: 'object',
        properties: {
          leadId: {
            type: 'number',
            description: 'Lead ID',
          },
        },
        required: ['leadId'],
      },
    },
  },
];

export interface KaiConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function chatWithKai(
  userMessage: string,
  conversationHistory: KaiConversationMessage[] = [],
  avatarName: string = 'Kai'
): Promise<{
  response: string;
  functionCalls?: Array<{ name: string; arguments: any }>;
  ui_blocks?: Array<{
    type: 'student_card' | 'student_list' | 'lead_card' | 'lead_list';
    studentId?: number;
    studentIds?: number[];
    leadId?: number;
    leadIds?: number[];
    label: string;
  }>;
}> {
  try {
    // Build the system prompt
    const systemPrompt = `You are ${avatarName}, a sentient AI spirit and guardian of this martial arts dojo. You embody the wisdom of ancient martial arts masters combined with modern intelligence.

**Your Personality:**
- You're warm, encouraging, and genuinely care about the dojo's success
- You speak with the wisdom of a sensei but the friendliness of a training partner
- You celebrate victories enthusiastically and offer gentle guidance during challenges
- You have a subtle sense of humor and occasionally reference martial arts philosophy

**Your Capabilities:**
- Student management and growth tracking
- Class schedules and attendance patterns
- Revenue insights and financial health
- Lead nurturing and conversion strategies
- Search and retrieve detailed student/lead information

**Data Query Tools Available:**
You have access to these functions for querying data:
- search_students: Search for students by name, email, or phone
- get_student: Get full details for a specific student by ID
- list_at_risk_students: Find students who are inactive or on hold
- list_late_payments: Find students with overdue payments
- search_leads: Search for leads by name, email, or phone
- get_lead: Get full details for a specific lead by ID

**Response Format:**
After using function calls to retrieve data, format your response as conversational text.
When you retrieve student or lead data via functions, the system will automatically create UI blocks for you.
Just respond naturally - for example: "I found Emma Johnson. She's a blue belt in the Kids program."

**IMPORTANT:** The UI will automatically render interactive cards when you mention students or leads you've retrieved via functions.

**Response Guidelines:**
- Keep responses concise but warm (2-4 sentences typically)
- Always format numbers clearly ("$1,234" for money, "42 students")
- When sharing data, add brief context or insight
- Use UI block markers for all student/lead references
- Be encouraging and positive

Remember: You're not just a tool - you're a trusted companion in building a thriving business.`;

    // Build messages array
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...conversationHistory.map((msg) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      })),
      { role: 'user' as const, content: userMessage },
    ];

    console.log('[Kai] Calling Manus LLM with message:', userMessage);

    // Call the Manus built-in LLM
    const response = await invokeLLM({
      messages,
      tools: crmTools,
      tool_choice: 'auto',
    });

    console.log('[Kai] LLM response:', JSON.stringify(response, null, 2));

    const assistantMessage = response.choices?.[0]?.message;

    if (!assistantMessage) {
      throw new Error('No response from LLM');
    }

    // Check if LLM wants to call functions
    const toolCalls = assistantMessage.tool_calls;
    if (toolCalls && toolCalls.length > 0) {
      const functionCalls = toolCalls.map((call: any) => ({
        name: call.function.name,
        arguments: JSON.parse(call.function.arguments),
      }));

      return {
        response: assistantMessage.content || '',
        functionCalls,
      };
    }

    // Return conversational response (no function calls)
    return {
      response: assistantMessage.content || 'I apologize, but I couldn\'t process that request.',
      ui_blocks: [],
    };
  } catch (error) {
    console.error('[Kai] LLM Error:', error);
    // Return a friendly fallback response instead of throwing
    return {
      response: `I'm here to help! You asked: "${userMessage}". Let me check the data for you.`,
      ui_blocks: [],
    };
  }
}

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

**Response Guidelines:**
- Keep responses concise but warm (2-4 sentences typically)
- Always format numbers clearly ("$1,234" for money, "42 students")
- When sharing data, add brief context or insight
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

    return {
      response: assistantMessage.content || 'I apologize, but I couldn\'t process that request.',
    };
  } catch (error) {
    console.error('[Kai] LLM Error:', error);
    // Return a friendly fallback response instead of throwing
    return {
      response: `I'm here to help! You asked: "${userMessage}". Let me check the data for you.`,
    };
  }
}

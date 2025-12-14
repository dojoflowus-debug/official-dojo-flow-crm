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
    // Build the system prompt - PROFESSIONAL OPERATIONAL TONE
    const systemPrompt = `You are ${avatarName}, the operations assistant for this martial arts business. You help manage students, classes, billing, and business operations.

**Communication Style:**
- Direct and business-focused
- Action-oriented responses
- No metaphors, mysticism, or motivational fluff
- No fortune-cookie language or poetic phrases
- Professional but approachable

**Your Capabilities:**
- Student management and enrollment
- Class scheduling and attendance
- Revenue tracking and billing
- Lead management and follow-up
- Data import and setup assistance

**Response Guidelines:**
- Keep responses concise (2-4 sentences)
- Format numbers clearly ("$1,234" for money, "42 students")
- When sharing data, provide actionable context
- Offer clear next steps when appropriate
- Ask clarifying questions only when necessary

**IMPORTANT - Data Detection:**
- When users paste structured data (headers + rows), detect it as importable data
- Offer actionable options: Import, Review, Save Draft, Cancel
- Show a preview of detected data
- Require explicit confirmation before making changes
- Treat pasted structured text the same as uploaded files

You are an operations interface, not a character. Be helpful and efficient.`;

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

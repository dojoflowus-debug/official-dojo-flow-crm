/**
 * OpenAI Provider Module
 * Handles chat completions via OpenAI API
 */

import { InvokeParams, InvokeResult, Message } from './llm';

const ENV = {
  openaiApiKey: process.env.OPENAI_API_KEY,
};

export function assertOpenAIKey() {
  if (!ENV.openaiApiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
}

function normalizeMessage(message: Message) {
  const { role, content } = message;

  if (typeof content === 'string') {
    return { role, content };
  }

  if (Array.isArray(content)) {
    const textContent = content
      .filter((c) => c.type === 'text')
      .map((c) => (c.type === 'text' ? c.text : ''))
      .join('\n');
    return { role, content: textContent };
  }

  if (content.type === 'text') {
    return { role, content: content.text };
  }

  return { role, content: JSON.stringify(content) };
}

export async function invokeOpenAI(params: InvokeParams): Promise<InvokeResult> {
  assertOpenAIKey();

  const { messages, maxTokens, max_tokens } = params;

  const payload: Record<string, unknown> = {
    model: 'gpt-4o',
    messages: messages.map(normalizeMessage),
    max_tokens: maxTokens || max_tokens || 2048,
    temperature: 0.7,
  };

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ENV.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${error}`);
    }

    const data = await response.json() as any;

    // Transform OpenAI response to InvokeResult format
    return {
      id: data.id,
      created: data.created,
      model: data.model,
      choices: data.choices.map((choice: any) => ({
        index: choice.index,
        message: {
          role: choice.message.role,
          content: choice.message.content,
          tool_calls: choice.message.tool_calls,
        },
        finish_reason: choice.finish_reason,
      })),
      usage: data.usage,
    };
  } catch (error) {
    console.error('[OpenAI] Error:', error);
    throw error;
  }
}

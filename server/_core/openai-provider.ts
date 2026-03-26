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

/**
 * Normalize a message for the OpenAI API.
 * Preserves multipart content blocks (image_url, file_url, text) so that
 * vision and document-parsing calls work correctly. Previously this function
 * stripped all non-text content, which caused GPT-4o to hallucinate placeholder
 * data instead of reading the actual uploaded PDF/image.
 */
function normalizeMessage(message: Message) {
  const { role, content } = message;

  // Plain string — pass through as-is
  if (typeof content === 'string') {
    return { role, content };
  }

  // Single content block
  if (!Array.isArray(content)) {
    if (content.type === 'text') {
      return { role, content: content.text };
    }
    // image_url or file_url block — wrap in array for OpenAI
    return { role, content: [content] };
  }

  // Multipart array — preserve all blocks that OpenAI supports.
  // OpenAI supports: text, image_url. For file_url (PDF), we convert to
  // image_url with the same URL so GPT-4o vision can read it.
  const normalizedParts = (content as any[]).map((c: any) => {
    if (c.type === 'text') {
      return { type: 'text', text: c.text };
    }
    if (c.type === 'image_url') {
      return { type: 'image_url', image_url: c.image_url };
    }
    if (c.type === 'file_url') {
      // OpenAI doesn't have a native file_url type — send the PDF URL as an
      // image_url with detail:high so GPT-4o vision can render and read it.
      return {
        type: 'image_url',
        image_url: { url: c.file_url?.url ?? c.file_url, detail: 'high' },
      };
    }
    // Fallback: stringify unknown block types
    return { type: 'text', text: JSON.stringify(c) };
  });

  return { role, content: normalizedParts };
}

export async function invokeOpenAI(params: InvokeParams): Promise<InvokeResult> {
  assertOpenAIKey();

  const { messages, maxTokens, max_tokens, tools, tool_choice, toolChoice } = params;

  // Detect whether any message contains image/file content so we can use a
  // higher token budget for vision/document extraction calls.
  const hasVisionContent = messages.some((m) => {
    const c = m.content;
    if (Array.isArray(c)) {
      return (c as any[]).some((block: any) => block.type === 'image_url' || block.type === 'file_url');
    }
    return false;
  });

  // Vision/document calls need more tokens to return full JSON arrays.
  // Default for text-only calls stays at 2048; vision calls get 4096.
  const defaultTokens = hasVisionContent ? 4096 : 2048;

  const payload: Record<string, unknown> = {
    model: 'gpt-4o',
    messages: messages.map(normalizeMessage),
    max_tokens: maxTokens || max_tokens || defaultTokens,
    temperature: 0.7,
  };
  
  // Add tools if provided
  if (tools && tools.length > 0) {
    payload.tools = tools;
    payload.tool_choice = toolChoice || tool_choice || 'auto';
  }

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

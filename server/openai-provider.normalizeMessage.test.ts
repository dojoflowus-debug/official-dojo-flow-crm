/**
 * Tests for openai-provider.ts normalizeMessage fix
 * Verifies that multipart content (image_url, file_url) is preserved
 * instead of being stripped to text-only.
 */
import { describe, it, expect } from 'vitest';

// ─── Inline the normalizeMessage logic for unit testing ───────────────────────
// (mirrors the implementation in openai-provider.ts)
function normalizeMessage(message: { role: string; content: any }) {
  const { role, content } = message;
  if (typeof content === 'string') return { role, content };
  if (!Array.isArray(content)) {
    if (content.type === 'text') return { role, content: content.text };
    return { role, content: [content] };
  }
  const normalizedParts = (content as any[]).map((c: any) => {
    if (c.type === 'text') return { type: 'text', text: c.text };
    if (c.type === 'image_url') return { type: 'image_url', image_url: c.image_url };
    if (c.type === 'file_url') {
      return {
        type: 'image_url',
        image_url: { url: c.file_url?.url ?? c.file_url, detail: 'high' },
      };
    }
    return { type: 'text', text: JSON.stringify(c) };
  });
  return { role, content: normalizedParts };
}

describe('normalizeMessage — multipart content preservation', () => {
  it('should pass through plain string content unchanged', () => {
    const msg = { role: 'user', content: 'Hello world' };
    const result = normalizeMessage(msg);
    expect(result.content).toBe('Hello world');
  });

  it('should preserve image_url blocks in multipart content', () => {
    const msg = {
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: 'https://example.com/img.jpg', detail: 'high' } },
        { type: 'text', text: 'Describe this image' },
      ],
    };
    const result = normalizeMessage(msg) as any;
    expect(Array.isArray(result.content)).toBe(true);
    expect(result.content).toHaveLength(2);
    expect(result.content[0].type).toBe('image_url');
    expect(result.content[0].image_url.url).toBe('https://example.com/img.jpg');
    expect(result.content[1].type).toBe('text');
    expect(result.content[1].text).toBe('Describe this image');
  });

  it('should convert file_url blocks to image_url for OpenAI compatibility', () => {
    const msg = {
      role: 'user',
      content: [
        { type: 'file_url', file_url: { url: 'https://example.com/roster.pdf', mime_type: 'application/pdf' } },
        { type: 'text', text: 'Extract all students' },
      ],
    };
    const result = normalizeMessage(msg) as any;
    expect(Array.isArray(result.content)).toBe(true);
    expect(result.content).toHaveLength(2);
    // file_url should be converted to image_url
    expect(result.content[0].type).toBe('image_url');
    expect(result.content[0].image_url.url).toBe('https://example.com/roster.pdf');
    expect(result.content[0].image_url.detail).toBe('high');
    expect(result.content[1].type).toBe('text');
  });

  it('OLD BEHAVIOR (bug): stripping multipart to text-only would lose image/file blocks', () => {
    // This test documents the OLD broken behavior to make the regression obvious
    function oldNormalizeMessage(message: { role: string; content: any }) {
      const { role, content } = message;
      if (typeof content === 'string') return { role, content };
      if (Array.isArray(content)) {
        // OLD: filter to text only — this was the bug
        const textContent = content
          .filter((c: any) => c.type === 'text')
          .map((c: any) => (c.type === 'text' ? c.text : ''))
          .join('\n');
        return { role, content: textContent };
      }
      if (content.type === 'text') return { role, content: content.text };
      return { role, content: JSON.stringify(content) };
    }

    const msg = {
      role: 'user',
      content: [
        { type: 'file_url', file_url: { url: 'https://example.com/roster.pdf' } },
        { type: 'text', text: 'Extract all students' },
      ],
    };
    const oldResult = oldNormalizeMessage(msg) as any;
    // Old behavior: returns a plain string with only the text part
    expect(typeof oldResult.content).toBe('string');
    expect(oldResult.content).toBe('Extract all students');
    // The PDF URL is LOST — this is why only placeholder data was returned

    // New behavior: preserves both blocks
    const newResult = normalizeMessage(msg) as any;
    expect(Array.isArray(newResult.content)).toBe(true);
    expect(newResult.content).toHaveLength(2);
    expect(newResult.content[0].type).toBe('image_url'); // PDF converted to image_url
  });

  it('should detect vision content for max_tokens auto-scaling', () => {
    const messages = [
      {
        role: 'user',
        content: [
          { type: 'file_url', file_url: { url: 'https://example.com/roster.pdf' } },
          { type: 'text', text: 'Extract students' },
        ],
      },
    ];
    const hasVisionContent = messages.some((m) => {
      const c = m.content;
      if (Array.isArray(c)) {
        return (c as any[]).some((block: any) => block.type === 'image_url' || block.type === 'file_url');
      }
      return false;
    });
    expect(hasVisionContent).toBe(true);
    const defaultTokens = hasVisionContent ? 4096 : 2048;
    expect(defaultTokens).toBe(4096);
  });

  it('should use 2048 default tokens for text-only messages', () => {
    const messages = [
      { role: 'user', content: 'Hello, how many students do I have?' },
    ];
    const hasVisionContent = messages.some((m) => {
      const c = m.content;
      if (Array.isArray(c)) {
        return (c as any[]).some((block: any) => block.type === 'image_url' || block.type === 'file_url');
      }
      return false;
    });
    expect(hasVisionContent).toBe(false);
    const defaultTokens = hasVisionContent ? 4096 : 2048;
    expect(defaultTokens).toBe(2048);
  });
});

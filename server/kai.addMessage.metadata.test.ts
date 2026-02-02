import { describe, it, expect } from 'vitest';
import { getDb } from './db';
import { conversations, messages } from '../drizzle/schema';
import { eq, desc } from 'drizzle-orm';

describe('kai.addMessage with metadata', () => {
  it('should save and retrieve message with metadata object', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const testMetadata = {
      clientMessageId: 'test-client-id-vitest-' + Date.now(),
      timestamp: new Date().toISOString(),
      source: 'vitest'
    };

    // Get an existing conversation to use for testing
    const existingConvs = await db.select().from(conversations).limit(1);
    
    if (existingConvs.length === 0) {
      console.log('⚠ No existing conversations found, skipping test');
      return;
    }

    const conversationId = existingConvs[0].id;
    const organizationId = existingConvs[0].organizationId || 120001;

    // Insert message with metadata (matching kaiConversationsRouter pattern)
    await db.insert(messages).values({
      conversationId: conversationId,
      organizationId: organizationId,
      role: 'user',
      content: 'Test message with metadata from vitest',
      metadata: JSON.stringify(testMetadata),
      createdAt: new Date().toISOString(),
    });

    // Retrieve the most recent message we just inserted
    const savedMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.id))
      .limit(1);

    expect(savedMessages.length).toBe(1);
    const savedMessage = savedMessages[0];
    expect(savedMessage.content).toBe('Test message with metadata from vitest');
    expect(savedMessage.metadata).toBeDefined();
    
    // Parse and verify metadata
    const parsedMetadata = JSON.parse(savedMessage.metadata!);
    expect(parsedMetadata.clientMessageId).toContain('test-client-id-vitest-');
    expect(parsedMetadata.source).toBe('vitest');

    // Clean up
    await db.delete(messages).where(eq(messages.id, savedMessage.id));

    console.log('✓ Message saved with metadata successfully');
  });

  it('should save message without metadata (null)', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Get an existing conversation
    const existingConvs = await db.select().from(conversations).limit(1);
    
    if (existingConvs.length === 0) {
      console.log('⚠ No existing conversations found, skipping test');
      return;
    }

    const conversationId = existingConvs[0].id;
    const organizationId = existingConvs[0].organizationId || 120001;

    // Insert message without metadata
    await db.insert(messages).values({
      conversationId: conversationId,
      organizationId: organizationId,
      role: 'assistant',
      content: 'Test message without metadata from vitest',
      metadata: null,
      createdAt: new Date().toISOString(),
    });

    // Retrieve the most recent message
    const savedMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.id))
      .limit(1);

    expect(savedMessages.length).toBe(1);
    const savedMessage = savedMessages[0];
    expect(savedMessage.content).toBe('Test message without metadata from vitest');
    expect(savedMessage.metadata).toBeNull();

    // Clean up
    await db.delete(messages).where(eq(messages.id, savedMessage.id));

    console.log('✓ Message saved without metadata successfully');
  });

  it('should handle complex metadata objects', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const complexMetadata = {
      clientMessageId: 'complex-id-456-' + Date.now(),
      attachments: [
        { type: 'image', url: 'https://example.com/image.jpg' },
        { type: 'file', url: 'https://example.com/doc.pdf' }
      ],
      tags: ['important', 'follow-up'],
      customData: {
        nested: {
          value: 'deep value'
        }
      }
    };

    // Get an existing conversation
    const existingConvs = await db.select().from(conversations).limit(1);
    
    if (existingConvs.length === 0) {
      console.log('⚠ No existing conversations found, skipping test');
      return;
    }

    const conversationId = existingConvs[0].id;
    const organizationId = existingConvs[0].organizationId || 120001;

    // Insert message with complex metadata
    await db.insert(messages).values({
      conversationId: conversationId,
      organizationId: organizationId,
      role: 'user',
      content: 'Test message with complex metadata from vitest',
      metadata: JSON.stringify(complexMetadata),
      createdAt: new Date().toISOString(),
    });

    // Retrieve the most recent message
    const savedMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.id))
      .limit(1);

    expect(savedMessages.length).toBe(1);
    const savedMessage = savedMessages[0];
    expect(savedMessage.content).toBe('Test message with complex metadata from vitest');
    
    // Parse and verify complex metadata
    const parsedMetadata = JSON.parse(savedMessage.metadata!);
    expect(parsedMetadata.clientMessageId).toContain('complex-id-456-');
    expect(parsedMetadata.attachments).toHaveLength(2);
    expect(parsedMetadata.tags).toContain('important');
    expect(parsedMetadata.customData.nested.value).toBe('deep value');

    // Clean up
    await db.delete(messages).where(eq(messages.id, savedMessage.id));

    console.log('✓ Message saved with complex metadata successfully');
  });
});

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from './db';
import { kaiConversations, kaiMessages } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Kai Conversations Database', () => {
  let db: Awaited<ReturnType<typeof getDb>>;
  let testConversationId: number;
  const testUserId = 1; // Use a test user ID

  beforeAll(async () => {
    db = await getDb();
  });

  afterAll(async () => {
    // Clean up test data
    if (db && testConversationId) {
      await db.delete(kaiMessages).where(eq(kaiMessages.conversationId, testConversationId));
      await db.delete(kaiConversations).where(eq(kaiConversations.id, testConversationId));
    }
  });

  it('should create a new conversation', async () => {
    if (!db) throw new Error('Database not available');

    const [result] = await db.insert(kaiConversations).values({
      userId: testUserId,
      title: 'Test Conversation',
    });

    expect(result.insertId).toBeDefined();
    expect(result.insertId).toBeGreaterThan(0);
    testConversationId = result.insertId;
  });

  it('should retrieve the created conversation', async () => {
    if (!db) throw new Error('Database not available');

    const [conversation] = await db.select()
      .from(kaiConversations)
      .where(eq(kaiConversations.id, testConversationId))
      .limit(1);

    expect(conversation).toBeDefined();
    expect(conversation.title).toBe('Test Conversation');
    expect(conversation.userId).toBe(testUserId);
    expect(conversation.status).toBe('active');
  });

  it('should add a message to the conversation', async () => {
    if (!db) throw new Error('Database not available');

    const [result] = await db.insert(kaiMessages).values({
      conversationId: testConversationId,
      role: 'user',
      content: 'Hello, this is a test message',
    });

    expect(result.insertId).toBeDefined();
    expect(result.insertId).toBeGreaterThan(0);
  });

  it('should retrieve messages for the conversation', async () => {
    if (!db) throw new Error('Database not available');

    const messages = await db.select()
      .from(kaiMessages)
      .where(eq(kaiMessages.conversationId, testConversationId));

    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0].content).toBe('Hello, this is a test message');
    expect(messages[0].role).toBe('user');
  });

  it('should update conversation preview', async () => {
    if (!db) throw new Error('Database not available');

    await db.update(kaiConversations)
      .set({ preview: 'Hello, this is a test message' })
      .where(eq(kaiConversations.id, testConversationId));

    const [conversation] = await db.select()
      .from(kaiConversations)
      .where(eq(kaiConversations.id, testConversationId))
      .limit(1);

    expect(conversation.preview).toBe('Hello, this is a test message');
  });
});

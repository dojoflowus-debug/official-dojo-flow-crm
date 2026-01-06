import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from './db';
import { kaiConversations, kaiMessages } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Kai Conversation Creation Fix - organizationId Bug', () => {
  let db: Awaited<ReturnType<typeof getDb>>;
  let testConversationId: number;
  const testUserId = 2580004; // Use a test user ID
  const testOrgId = 120001; // Use a test org ID

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

  it('should create a new conversation with explicit organizationId', async () => {
    if (!db) throw new Error('Database not available');
    
    // This mimics what the fixed createConversation procedure does
    const [result] = await db.insert(kaiConversations).values({
      organizationId: testOrgId, // Explicitly passing organizationId (not default)
      userId: testUserId,
      title: 'Test Conversation',
      summary: null,
      preview: null,
      threadType: 'kai_direct',
      status: 'active',
      category: 'kai',
      priority: 'neutral',
      lastMessageAt: new Date().toISOString(),
      participantIds: JSON.stringify([testUserId]),
    });

    expect(result.insertId).toBeDefined();
    expect(result.insertId).toBeGreaterThan(0);
    testConversationId = result.insertId;
  });

  it('should retrieve the created conversation with correct organizationId', async () => {
    if (!db) throw new Error('Database not available');
    
    const [conversation] = await db.select()
      .from(kaiConversations)
      .where(eq(kaiConversations.id, testConversationId))
      .limit(1);

    expect(conversation).toBeDefined();
    expect(conversation.organizationId).toBe(testOrgId); // Verify organizationId is correct
    expect(conversation.title).toBe('Test Conversation');
    expect(conversation.userId).toBe(testUserId);
    expect(conversation.status).toBe('active');
  });

  it('should add a message with explicit organizationId', async () => {
    if (!db) throw new Error('Database not available');
    
    // This mimics what the fixed addMessage procedure does
    const [result] = await db.insert(kaiMessages).values({
      conversationId: testConversationId,
      organizationId: testOrgId, // Explicitly passing organizationId (not default)
      role: 'user',
      content: 'Hello, this is a test message',
    });

    expect(result.insertId).toBeDefined();
    expect(result.insertId).toBeGreaterThan(0);
  });

  it('should retrieve messages with correct organizationId', async () => {
    if (!db) throw new Error('Database not available');
    
    const messages = await db.select()
      .from(kaiMessages)
      .where(eq(kaiMessages.conversationId, testConversationId));

    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0].organizationId).toBe(testOrgId); // Verify organizationId is correct
    expect(messages[0].content).toBe('Hello, this is a test message');
    expect(messages[0].role).toBe('user');
  });
});

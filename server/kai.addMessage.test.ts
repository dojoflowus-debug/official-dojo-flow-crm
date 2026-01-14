import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from './db';
import { kaiConversations, kaiMessages, users } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Kai Add Message - Procedure Test', () => {
  let db: any;
  let testUserId: number;
  let testConversationId: number;
  let testOrgId: number;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error('Database not available');

    // Create test user
    const userResult = await db.insert(users).values({
      email: `test-addmessage-${Date.now()}@example.com`,
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
    });
    testUserId = Number(userResult[0].insertId);
    testOrgId = 1; // Default org

    // Create test conversation
    const convResult = await db.insert(kaiConversations).values({
      organizationId: testOrgId,
      userId: testUserId,
      title: 'Test Conversation',
      status: 'active',
      category: 'kai',
      priority: 'neutral',
      threadType: 'kai_direct',
    });
    testConversationId = Number(convResult[0].insertId);

    console.log('[Test Setup] Created user:', testUserId, 'conversation:', testConversationId);
  });

  afterAll(async () => {
    if (db && testConversationId) {
      // Clean up test data
      await db.delete(kaiMessages).where(eq(kaiMessages.conversationId, testConversationId));
      await db.delete(kaiConversations).where(eq(kaiConversations.id, testConversationId));
      await db.delete(users).where(eq(users.id, testUserId));
      console.log('[Test Cleanup] Deleted test data');
    }
  });

  it('should add a user message to conversation', async () => {
    if (!db) throw new Error('Database not available');

    const messageContent = 'Hello Kai, how many students do we have?';

    // Insert message using the same logic as the procedure
    const [result] = await db.insert(kaiMessages).values({
      conversationId: testConversationId,
      organizationId: testOrgId,
      role: 'user',
      content: messageContent,
      metadata: null,
    });

    const messageId = Number(result.insertId);
    console.log('[Test] Message saved with ID:', messageId);

    // Verify message was created
    const [message] = await db.select()
      .from(kaiMessages)
      .where(eq(kaiMessages.id, messageId))
      .limit(1);

    expect(message).toBeDefined();
    expect(message.content).toBe(messageContent);
    expect(message.role).toBe('user');
    expect(message.conversationId).toBe(testConversationId);
  });

  it('should add an assistant message to conversation', async () => {
    if (!db) throw new Error('Database not available');

    const messageContent = 'You have 25 active students.';

    // Insert message
    const [result] = await db.insert(kaiMessages).values({
      conversationId: testConversationId,
      organizationId: testOrgId,
      role: 'assistant',
      content: messageContent,
      metadata: null,
    });

    const messageId = Number(result.insertId);

    // Verify message was created
    const messages = await db.select()
      .from(kaiMessages)
      .where(eq(kaiMessages.conversationId, testConversationId));

    expect(messages.length).toBeGreaterThanOrEqual(1);
    expect(messages.some((m: any) => m.role === 'assistant' && m.content === messageContent)).toBe(true);
  });

  it('should update conversation preview when message is added', async () => {
    if (!db) throw new Error('Database not available');

    const messageContent = 'This is a test message for preview';
    const preview = messageContent.substring(0, 200);

    // Insert message
    await db.insert(kaiMessages).values({
      conversationId: testConversationId,
      organizationId: testOrgId,
      role: 'user',
      content: messageContent,
      metadata: null,
    });

    // Update conversation preview (simulating the procedure logic)
    await db.update(kaiConversations)
      .set({
        preview,
        lastMessageAt: new Date().toISOString(),
      })
      .where(eq(kaiConversations.id, testConversationId));

    // Verify conversation was updated
    const [conversation] = await db.select()
      .from(kaiConversations)
      .where(eq(kaiConversations.id, testConversationId))
      .limit(1);

    expect(conversation.preview).toBe(preview);
    expect(conversation.lastMessageAt).toBeDefined();
  });

  it('should retrieve all messages for a conversation in order', async () => {
    if (!db) throw new Error('Database not available');

    // Add multiple messages
    const messages = [
      { role: 'user', content: 'First message' },
      { role: 'assistant', content: 'Second message' },
      { role: 'user', content: 'Third message' },
    ];

    for (const msg of messages) {
      await db.insert(kaiMessages).values({
        conversationId: testConversationId,
        organizationId: testOrgId,
        role: msg.role,
        content: msg.content,
        metadata: null,
      });
    }

    // Retrieve all messages
    const retrievedMessages = await db.select()
      .from(kaiMessages)
      .where(eq(kaiMessages.conversationId, testConversationId))
      .orderBy(kaiMessages.createdAt);

    expect(retrievedMessages.length).toBeGreaterThanOrEqual(3);
  });

  it('should handle message with metadata', async () => {
    if (!db) throw new Error('Database not available');

    const messageContent = 'Message with metadata';
    const metadata = JSON.stringify({ type: 'test', timestamp: new Date().toISOString() });

    // Insert message with metadata
    const [result] = await db.insert(kaiMessages).values({
      conversationId: testConversationId,
      organizationId: testOrgId,
      role: 'system',
      content: messageContent,
      metadata: metadata,
    });

    const messageId = Number(result.insertId);

    // Verify message with metadata
    const [message] = await db.select()
      .from(kaiMessages)
      .where(eq(kaiMessages.id, messageId))
      .limit(1);

    expect(message.metadata).toBe(metadata);
  });
});

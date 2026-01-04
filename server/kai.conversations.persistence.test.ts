import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from './db';
import { kaiConversations, kaiMessages, users } from '../drizzle/schema';
import { eq, and, isNull } from 'drizzle-orm';

describe('Kai Conversations - Persistence Integration Tests', () => {
  let db: any;
  let testUserId: number;
  let testConversationId: number;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error('Database not available');

    // Create a test user for this test suite
    const [userResult] = await db.insert(users).values({
      email: `test-kai-persistence-${Date.now()}@test.com`,
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
    });
    testUserId = userResult.insertId;
    console.log('[Test Setup] Created test user with ID:', testUserId);
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

  it('should create a conversation and persist it to database', async () => {
    console.log('[Test 1] Starting: Create conversation');
    
    // Create a conversation
    const [result] = await db.insert(kaiConversations).values({
      userId: testUserId,
      title: 'Test Conversation',
      preview: null,
      threadType: 'kai_direct',
      status: 'active',
      category: 'kai',
      priority: 'neutral',
      lastMessageAt: new Date(),
      participantIds: JSON.stringify([testUserId]),
    });

    testConversationId = result.insertId;
    console.log('[Test 1] Created conversation with ID:', testConversationId);

    // Verify it was created
    const [conversation] = await db.select()
      .from(kaiConversations)
      .where(eq(kaiConversations.id, testConversationId))
      .limit(1);

    expect(conversation).toBeDefined();
    expect(conversation.userId).toBe(testUserId);
    expect(conversation.title).toBe('Test Conversation');
    expect(conversation.status).toBe('active');
    console.log('[Test 1] PASS: Conversation persisted correctly');
  });

  it('should add a message and update conversation lastMessageAt', async () => {
    console.log('[Test 2] Starting: Add message');
    
    if (!testConversationId) throw new Error('No conversation ID');

    // Add a message
    const messageContent = 'Test message content';
    const [messageResult] = await db.insert(kaiMessages).values({
      conversationId: testConversationId,
      role: 'user',
      content: messageContent,
      metadata: null,
    });

    const messageId = messageResult.insertId;
    console.log('[Test 2] Created message with ID:', messageId);

    // Update conversation with message preview and timestamp
    const beforeUpdate = new Date();
    await db.update(kaiConversations)
      .set({
        preview: messageContent.substring(0, 200),
        lastMessageAt: new Date(),
      })
      .where(eq(kaiConversations.id, testConversationId));

    // Verify message was created
    const [message] = await db.select()
      .from(kaiMessages)
      .where(eq(kaiMessages.id, messageId))
      .limit(1);

    expect(message).toBeDefined();
    expect(message.content).toBe(messageContent);
    expect(message.role).toBe('user');
    console.log('[Test 2] PASS: Message persisted correctly');

    // Verify conversation was updated
    const [updatedConversation] = await db.select()
      .from(kaiConversations)
      .where(eq(kaiConversations.id, testConversationId))
      .limit(1);

    expect(updatedConversation.preview).toBe(messageContent);
    expect(updatedConversation.lastMessageAt).toBeDefined();
    
    // Handle both Date objects and string timestamps from database
    const lastMessageTime = typeof updatedConversation.lastMessageAt === 'string' 
      ? new Date(updatedConversation.lastMessageAt).getTime()
      : updatedConversation.lastMessageAt.getTime();
    // Database timestamps may lose millisecond precision, so check within 1 second
    expect(lastMessageTime).toBeGreaterThanOrEqual(beforeUpdate.getTime() - 1000);
    console.log('[Test 2] PASS: Conversation updated with message preview and timestamp');
  });

  it('should retrieve conversations after page refresh', async () => {
    console.log('[Test 3] Starting: Retrieve conversations');
    
    if (!testConversationId) throw new Error('No conversation ID');

    // Simulate page refresh by querying conversations
    const conversations = await db.select()
      .from(kaiConversations)
      .where(and(
        eq(kaiConversations.userId, testUserId),
        isNull(kaiConversations.deletedAt)
      ));

    console.log('[Test 3] Retrieved conversations:', conversations.length);
    expect(conversations.length).toBeGreaterThan(0);

    // Find our test conversation
    const testConv = conversations.find(c => c.id === testConversationId);
    expect(testConv).toBeDefined();
    expect(testConv.title).toBe('Test Conversation');
    expect(testConv.preview).toBe('Test message content');
    console.log('[Test 3] PASS: Conversation retrieved after refresh');
  });

  it('should retrieve all messages for a conversation', async () => {
    console.log('[Test 4] Starting: Retrieve messages');
    
    if (!testConversationId) throw new Error('No conversation ID');

    // Add another message
    const [messageResult2] = await db.insert(kaiMessages).values({
      conversationId: testConversationId,
      role: 'assistant',
      content: 'Assistant response',
      metadata: null,
    });

    // Retrieve all messages
    const messages = await db.select()
      .from(kaiMessages)
      .where(eq(kaiMessages.conversationId, testConversationId));

    console.log('[Test 4] Retrieved messages:', messages.length);
    expect(messages.length).toBeGreaterThanOrEqual(2);
    expect(messages[0].role).toBe('user');
    expect(messages[1].role).toBe('assistant');
    console.log('[Test 4] PASS: All messages retrieved in correct order');
  });

  it('should soft-delete a conversation', async () => {
    console.log('[Test 5] Starting: Soft-delete conversation');
    
    if (!testConversationId) throw new Error('No conversation ID');

    // Soft-delete the conversation
    await db.update(kaiConversations)
      .set({ deletedAt: new Date() })
      .where(eq(kaiConversations.id, testConversationId));

    // Verify it's marked as deleted
    const [deletedConversation] = await db.select()
      .from(kaiConversations)
      .where(eq(kaiConversations.id, testConversationId))
      .limit(1);

    expect(deletedConversation.deletedAt).toBeDefined();
    console.log('[Test 5] PASS: Conversation soft-deleted');

    // Verify it doesn't appear in active conversations
    const activeConversations = await db.select()
      .from(kaiConversations)
      .where(and(
        eq(kaiConversations.userId, testUserId),
        isNull(kaiConversations.deletedAt)
      ));

    const stillExists = activeConversations.find(c => c.id === testConversationId);
    expect(stillExists).toBeUndefined();
    console.log('[Test 5] PASS: Deleted conversation excluded from active list');
  });

  it('should verify data persistence across multiple queries', async () => {
    console.log('[Test 6] Starting: Verify persistence across queries');
    
    // Restore the conversation for this test
    await db.update(kaiConversations)
      .set({ deletedAt: null })
      .where(eq(kaiConversations.id, testConversationId));

    // Query 1: Get conversation
    const [conv1] = await db.select()
      .from(kaiConversations)
      .where(eq(kaiConversations.id, testConversationId))
      .limit(1);

    // Query 2: Get messages
    const messages = await db.select()
      .from(kaiMessages)
      .where(eq(kaiMessages.conversationId, testConversationId));

    // Query 3: Get conversation again
    const [conv2] = await db.select()
      .from(kaiConversations)
      .where(eq(kaiConversations.id, testConversationId))
      .limit(1);

    expect(conv1.id).toBe(conv2.id);
    expect(conv1.title).toBe(conv2.title);
    expect(conv1.preview).toBe(conv2.preview);
    expect(messages.length).toBeGreaterThan(0);
    // Log the actual types returned
    console.log('[Test 6] conv1.lastMessageAt type:', typeof conv1.lastMessageAt);
    console.log('[Test 6] messages[0].createdAt type:', typeof messages[0].createdAt);
    console.log('[Test 6] PASS: Data persists consistently across multiple queries');
  });
});

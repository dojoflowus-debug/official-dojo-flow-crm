import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from './db';
import { kaiConversations, kaiMessages, users } from '../drizzle/schema';
import { eq, and, isNull, isNotNull } from 'drizzle-orm';

describe('Kai Delete Messages - Soft Delete Implementation', () => {
  let db: any;
  let testUserId: number;
  let testConversationId: number;
  let testOrgId: number;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error('Database not available');

    // Create test user
    const userResult = await db.insert(users).values({
      email: `test-deletemessages-${Date.now()}@example.com`,
      firstName: 'Test',
      lastName: 'Delete',
      role: 'user',
    });
    testUserId = Number(userResult[0].insertId);
    testOrgId = 1;

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
      await db.delete(kaiMessages).where(eq(kaiMessages.conversationId, testConversationId));
      await db.delete(kaiConversations).where(eq(kaiConversations.id, testConversationId));
      await db.delete(users).where(eq(users.id, testUserId));
      console.log('[Test Cleanup] Deleted test data');
    }
  });

  it('should create messages without deletedAt', async () => {
    const [result1] = await db.insert(kaiMessages).values({
      conversationId: testConversationId,
      organizationId: testOrgId,
      role: 'user',
      content: 'Hello',
      metadata: null,
    });

    const [result2] = await db.insert(kaiMessages).values({
      conversationId: testConversationId,
      organizationId: testOrgId,
      role: 'assistant',
      content: 'Hi there',
      metadata: null,
    });

    const messages = await db.select()
      .from(kaiMessages)
      .where(
        and(
          eq(kaiMessages.conversationId, testConversationId),
          isNull(kaiMessages.deletedAt)
        )
      );

    expect(messages.length).toBeGreaterThanOrEqual(2);
    expect(messages[0].deletedAt).toBeNull();
    expect(messages[1].deletedAt).toBeNull();
  });

  it('should soft-delete messages by setting deletedAt', async () => {
    // Create two messages
    const [result1] = await db.insert(kaiMessages).values({
      conversationId: testConversationId,
      organizationId: testOrgId,
      role: 'user',
      content: 'Message 1 - Delete Test',
      metadata: null,
    });

    const [result2] = await db.insert(kaiMessages).values({
      conversationId: testConversationId,
      organizationId: testOrgId,
      role: 'assistant',
      content: 'Message 2 - Delete Test',
      metadata: null,
    });

    // Get initial count of non-deleted messages
    const beforeDelete = await db.select()
      .from(kaiMessages)
      .where(
        and(
          eq(kaiMessages.conversationId, testConversationId),
          isNull(kaiMessages.deletedAt)
        )
      );

    const initialCount = beforeDelete.length;

    // Soft-delete all messages
    const now = new Date();
    await db.update(kaiMessages)
      .set({ deletedAt: now })
      .where(
        and(
          eq(kaiMessages.conversationId, testConversationId),
          isNull(kaiMessages.deletedAt)
        )
      );

    // Verify messages are marked as deleted
    const afterDelete = await db.select()
      .from(kaiMessages)
      .where(
        and(
          eq(kaiMessages.conversationId, testConversationId),
          isNull(kaiMessages.deletedAt)
        )
      );

    expect(afterDelete.length).toBe(0);

    // Verify messages still exist in database with deletedAt set
    const allMessages = await db.select()
      .from(kaiMessages)
      .where(eq(kaiMessages.conversationId, testConversationId));

    expect(allMessages.length).toBeGreaterThanOrEqual(2);
    expect(allMessages[0].deletedAt).not.toBeNull();
  });

  it('should not re-fetch deleted messages when querying with filter', async () => {
    // Create test messages
    const [result1] = await db.insert(kaiMessages).values({
      conversationId: testConversationId,
      organizationId: testOrgId,
      role: 'user',
      content: 'Message - No Refetch Test 1',
      metadata: null,
    });

    const [result2] = await db.insert(kaiMessages).values({
      conversationId: testConversationId,
      organizationId: testOrgId,
      role: 'assistant',
      content: 'Message - No Refetch Test 2',
      metadata: null,
    });

    // Soft-delete all messages
    const now = new Date();
    await db.update(kaiMessages)
      .set({ deletedAt: now })
      .where(
        and(
          eq(kaiMessages.conversationId, testConversationId),
          isNull(kaiMessages.deletedAt)
        )
      );

    // Query with deletion filter (simulating getMessages procedure)
    const visibleMessages = await db.select()
      .from(kaiMessages)
      .where(
        and(
          eq(kaiMessages.conversationId, testConversationId),
          isNull(kaiMessages.deletedAt)
        )
      );

    expect(visibleMessages.length).toBe(0);
  });

  it('should only soft-delete non-deleted messages', async () => {
    // Create test messages
    const [result1] = await db.insert(kaiMessages).values({
      conversationId: testConversationId,
      organizationId: testOrgId,
      role: 'user',
      content: 'Message - Partial Delete 1',
      metadata: null,
    });

    const [result2] = await db.insert(kaiMessages).values({
      conversationId: testConversationId,
      organizationId: testOrgId,
      role: 'assistant',
      content: 'Message - Partial Delete 2',
      metadata: null,
    });

    // Get message IDs
    const allMessages = await db.select()
      .from(kaiMessages)
      .where(eq(kaiMessages.conversationId, testConversationId));

    const messageId1 = allMessages[allMessages.length - 2].id;

    // Soft-delete first message
    const now1 = new Date();
    await db.update(kaiMessages)
      .set({ deletedAt: now1 })
      .where(eq(kaiMessages.id, messageId1));

    // Try to soft-delete all non-deleted messages
    const now2 = new Date();
    await db.update(kaiMessages)
      .set({ deletedAt: now2 })
      .where(
        and(
          eq(kaiMessages.conversationId, testConversationId),
          isNull(kaiMessages.deletedAt)
        )
      );

    // Verify no non-deleted messages remain
    const visibleMessages = await db.select()
      .from(kaiMessages)
      .where(
        and(
          eq(kaiMessages.conversationId, testConversationId),
          isNull(kaiMessages.deletedAt)
        )
      );

    expect(visibleMessages.length).toBe(0);
    
    // Verify at least 2 messages are now deleted (including the one we deleted before)
    const deletedMessages = await db.select()
      .from(kaiMessages)
      .where(
        and(
          eq(kaiMessages.conversationId, testConversationId),
          isNotNull(kaiMessages.deletedAt)
        )
      );
    
    expect(deletedMessages.length).toBeGreaterThanOrEqual(2);
  });

  it('should not return deleted messages on refresh', async () => {
    // Create test messages
    const [result1] = await db.insert(kaiMessages).values({
      conversationId: testConversationId,
      organizationId: testOrgId,
      role: 'user',
      content: 'Message - Refresh Test 1',
      metadata: null,
    });

    const [result2] = await db.insert(kaiMessages).values({
      conversationId: testConversationId,
      organizationId: testOrgId,
      role: 'assistant',
      content: 'Message - Refresh Test 2',
      metadata: null,
    });

    // Verify messages are visible
    let visibleMessages = await db.select()
      .from(kaiMessages)
      .where(
        and(
          eq(kaiMessages.conversationId, testConversationId),
          isNull(kaiMessages.deletedAt)
        )
      );

    expect(visibleMessages.length).toBeGreaterThanOrEqual(2);

    // Soft-delete all messages
    const now = new Date();
    await db.update(kaiMessages)
      .set({ deletedAt: now })
      .where(
        and(
          eq(kaiMessages.conversationId, testConversationId),
          isNull(kaiMessages.deletedAt)
        )
      );

    // Simulate refresh by querying again
    visibleMessages = await db.select()
      .from(kaiMessages)
      .where(
        and(
          eq(kaiMessages.conversationId, testConversationId),
          isNull(kaiMessages.deletedAt)
        )
      );

    expect(visibleMessages.length).toBe(0);
  });
});

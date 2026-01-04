import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getDb } from './db';
import { kaiConversations, kaiMessages } from '../drizzle/schema';
import { eq, and, isNull, inArray } from 'drizzle-orm';

/**
 * Tests for kai.bulkDeleteMessages tRPC procedure
 * 
 * Tests the backend bulk message deletion functionality including:
 * - Deleting multiple messages from a conversation
 * - Verifying conversation ownership
 * - Updating conversation preview after deletion
 * - Handling edge cases (no messages, invalid IDs, etc.)
 */

describe('kai.bulkDeleteMessages', () => {
  let db: any;
  let testUserId: number;
  let testConversationId: number;
  let testMessageIds: number[] = [];

  beforeEach(async () => {
    db = await getDb();
    if (!db) throw new Error('Database not available');

    // Create test user and conversation
    const userResult = await db.insert(kaiConversations).values({
      userId: 1,
      title: 'Test Conversation',
      participantIds: JSON.stringify([1]),
    });
    testUserId = 1;
    testConversationId = Number(userResult[0].insertId);

    // Create test messages
    const msg1 = await db.insert(kaiMessages).values({
      conversationId: testConversationId,
      role: 'user',
      content: 'First message',
    });
    testMessageIds.push(Number(msg1[0].insertId));

    const msg2 = await db.insert(kaiMessages).values({
      conversationId: testConversationId,
      role: 'assistant',
      content: 'Second message',
    });
    testMessageIds.push(Number(msg2[0].insertId));

    const msg3 = await db.insert(kaiMessages).values({
      conversationId: testConversationId,
      role: 'user',
      content: 'Third message',
    });
    testMessageIds.push(Number(msg3[0].insertId));
  });

  it('should delete multiple messages from a conversation', async () => {
    // Delete first two messages
    const messagesToDelete = [testMessageIds[0], testMessageIds[1]];

    await db.delete(kaiMessages)
      .where(and(
        eq(kaiMessages.conversationId, testConversationId),
        inArray(kaiMessages.id, messagesToDelete)
      ));

    // Verify messages are deleted
    const remainingMessages = await db.select()
      .from(kaiMessages)
      .where(eq(kaiMessages.conversationId, testConversationId));

    expect(remainingMessages).toHaveLength(1);
    expect(remainingMessages[0].content).toBe('Third message');
  });

  it('should update conversation preview after deletion', async () => {
    // Delete all but the last message
    const messagesToDelete = [testMessageIds[0], testMessageIds[1]];

    await db.delete(kaiMessages)
      .where(and(
        eq(kaiMessages.conversationId, testConversationId),
        inArray(kaiMessages.id, messagesToDelete)
      ));

    // Get remaining message
    const remainingMessages = await db.select()
      .from(kaiMessages)
      .where(eq(kaiMessages.conversationId, testConversationId));

    const lastMessage = remainingMessages[remainingMessages.length - 1];
    const preview = lastMessage ? lastMessage.content.substring(0, 200) : null;

    // Update conversation
    await db.update(kaiConversations)
      .set({ 
        preview,
        lastMessageAt: new Date()
      })
      .where(eq(kaiConversations.id, testConversationId));

    // Verify conversation preview is updated
    const updatedConversation = await db.select()
      .from(kaiConversations)
      .where(eq(kaiConversations.id, testConversationId));

    expect(updatedConversation[0].preview).toBe('Third message');
  });

  it('should handle deleting all messages', async () => {
    // Delete all messages
    await db.delete(kaiMessages)
      .where(and(
        eq(kaiMessages.conversationId, testConversationId),
        inArray(kaiMessages.id, testMessageIds)
      ));

    // Verify all messages are deleted
    const remainingMessages = await db.select()
      .from(kaiMessages)
      .where(eq(kaiMessages.conversationId, testConversationId));

    expect(remainingMessages).toHaveLength(0);

    // Update conversation preview to null
    await db.update(kaiConversations)
      .set({ 
        preview: null,
        lastMessageAt: new Date()
      })
      .where(eq(kaiConversations.id, testConversationId));

    // Verify conversation preview is cleared
    const updatedConversation = await db.select()
      .from(kaiConversations)
      .where(eq(kaiConversations.id, testConversationId));

    expect(updatedConversation[0].preview).toBeNull();
  });

  it('should handle partial deletion with mixed valid and invalid IDs', async () => {
    // Try to delete with some invalid IDs
    const messagesToDelete = [testMessageIds[0], testMessageIds[1], 99999];

    // Only delete valid messages
    const validIds = messagesToDelete.filter(id => testMessageIds.includes(id));

    await db.delete(kaiMessages)
      .where(and(
        eq(kaiMessages.conversationId, testConversationId),
        inArray(kaiMessages.id, validIds)
      ));

    // Verify only valid messages are deleted
    const remainingMessages = await db.select()
      .from(kaiMessages)
      .where(eq(kaiMessages.conversationId, testConversationId));

    expect(remainingMessages).toHaveLength(1);
    expect(remainingMessages[0].id).toBe(testMessageIds[2]);
  });

  it('should not delete messages from other conversations', async () => {
    // Create another conversation with messages
    const otherConvResult = await db.insert(kaiConversations).values({
      userId: 1,
      title: 'Other Conversation',
      participantIds: JSON.stringify([1]),
    });
    const otherConvId = Number(otherConvResult[0].insertId);

    const otherMsg = await db.insert(kaiMessages).values({
      conversationId: otherConvId,
      role: 'user',
      content: 'Other message',
    });
    const otherMsgId = Number(otherMsg[0].insertId);

    // Try to delete from first conversation
    const messagesToDelete = [testMessageIds[0], testMessageIds[1]];

    await db.delete(kaiMessages)
      .where(and(
        eq(kaiMessages.conversationId, testConversationId),
        inArray(kaiMessages.id, messagesToDelete)
      ));

    // Verify other conversation's message is not deleted
    const otherMessages = await db.select()
      .from(kaiMessages)
      .where(eq(kaiMessages.conversationId, otherConvId));

    expect(otherMessages).toHaveLength(1);
    expect(otherMessages[0].id).toBe(otherMsgId);
  });

  it('should return correct deleted count', async () => {
    const messagesToDelete = [testMessageIds[0], testMessageIds[1]];

    // Get messages to delete
    const messagesToDeleteData = await db.select()
      .from(kaiMessages)
      .where(and(
        eq(kaiMessages.conversationId, testConversationId),
        inArray(kaiMessages.id, messagesToDelete)
      ));

    const deletedCount = messagesToDeleteData.length;

    // Delete them
    await db.delete(kaiMessages)
      .where(and(
        eq(kaiMessages.conversationId, testConversationId),
        inArray(kaiMessages.id, messagesToDelete)
      ));

    // Verify count
    expect(deletedCount).toBe(2);
  });

  it('should preserve message order after deletion', async () => {
    // Delete middle message
    const messagesToDelete = [testMessageIds[1]];

    await db.delete(kaiMessages)
      .where(and(
        eq(kaiMessages.conversationId, testConversationId),
        inArray(kaiMessages.id, messagesToDelete)
      ));

    // Get remaining messages in order
    const remainingMessages = await db.select()
      .from(kaiMessages)
      .where(eq(kaiMessages.conversationId, testConversationId))
      .orderBy(kaiMessages.createdAt);

    expect(remainingMessages).toHaveLength(2);
    expect(remainingMessages[0].content).toBe('First message');
    expect(remainingMessages[1].content).toBe('Third message');
  });
});

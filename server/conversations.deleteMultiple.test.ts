import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getDb } from "./db";
import { conversations, messages } from "../drizzle/schema";
import { eq, inArray } from "drizzle-orm";

describe("conversations.deleteMultiple", () => {
  let db: any;

  beforeEach(async () => {
    db = await getDb();
    if (!db) throw new Error("Database not available");
  });

  afterEach(async () => {
    // Clean up test data
    if (db) {
      try {
        const testConversations = await db.select().from(conversations);
        for (const conv of testConversations) {
          await db.delete(messages).where(eq(messages.conversationId, conv.id));
          await db.delete(conversations).where(eq(conversations.id, conv.id));
        }
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  });

  it("should delete multiple conversations and their messages", async () => {
    // Create test conversations
    const conv1Result = await db.insert(conversations).values({
      participantType: "lead",
      participantId: 1,
      participantName: "Test Lead 1",
      participantPhone: "+1234567890",
      status: "open",
      unreadCount: 0,
    });

    const conv2Result = await db.insert(conversations).values({
      participantType: "lead",
      participantId: 2,
      participantName: "Test Lead 2",
      participantPhone: "+0987654321",
      status: "open",
      unreadCount: 0,
    });

    const conv1Id = conv1Result[0].insertId;
    const conv2Id = conv2Result[0].insertId;

    // Add messages to conversations
    await db.insert(messages).values({
      conversationId: conv1Id,
      direction: "inbound",
      content: "Test message 1",
      senderType: "customer",
      status: "delivered",
    });

    await db.insert(messages).values({
      conversationId: conv2Id,
      direction: "inbound",
      content: "Test message 2",
      senderType: "customer",
      status: "delivered",
    });

    // Verify conversations and messages exist
    let allConversations = await db.select().from(conversations);
    let allMessages = await db.select().from(messages);
    expect(allConversations.length).toBeGreaterThanOrEqual(2);
    expect(allMessages.length).toBeGreaterThanOrEqual(2);

    // Delete multiple conversations
    for (const convId of [conv1Id, conv2Id]) {
      await db.delete(messages).where(eq(messages.conversationId, convId));
    }
    await db.delete(conversations).where(
      inArray(conversations.id, [conv1Id, conv2Id])
    );

    // Verify conversations are deleted
    const remainingConversations = await db
      .select()
      .from(conversations)
      .where(inArray(conversations.id, [conv1Id, conv2Id]));
    expect(remainingConversations.length).toBe(0);

    // Verify messages are deleted
    const remainingMessages = await db
      .select()
      .from(messages)
      .where(inArray(messages.conversationId, [conv1Id, conv2Id]));
    expect(remainingMessages.length).toBe(0);
  });

  it("should handle deletion of single conversation", async () => {
    // Create test conversation
    const convResult = await db.insert(conversations).values({
      participantType: "student",
      participantId: 1,
      participantName: "Test Student",
      participantPhone: "+1111111111",
      status: "open",
      unreadCount: 0,
    });

    const convId = convResult[0].insertId;

    // Add message
    await db.insert(messages).values({
      conversationId: convId,
      direction: "outbound",
      content: "Test outbound message",
      senderType: "staff",
      status: "sent",
    });

    // Delete conversation
    await db.delete(messages).where(eq(messages.conversationId, convId));
    await db.delete(conversations).where(eq(conversations.id, convId));

    // Verify deletion
    const deletedConversation = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, convId));
    expect(deletedConversation.length).toBe(0);

    const deletedMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, convId));
    expect(deletedMessages.length).toBe(0);
  });

  it("should not affect other conversations when deleting specific ones", async () => {
    // Create three conversations
    const conv1Result = await db.insert(conversations).values({
      participantType: "lead",
      participantId: 1,
      participantName: "Lead 1",
      participantPhone: "+1111111111",
      status: "open",
      unreadCount: 0,
    });

    const conv2Result = await db.insert(conversations).values({
      participantType: "lead",
      participantId: 2,
      participantName: "Lead 2",
      participantPhone: "+2222222222",
      status: "open",
      unreadCount: 0,
    });

    const conv3Result = await db.insert(conversations).values({
      participantType: "lead",
      participantId: 3,
      participantName: "Lead 3",
      participantPhone: "+3333333333",
      status: "open",
      unreadCount: 0,
    });

    const conv1Id = conv1Result[0].insertId;
    const conv2Id = conv2Result[0].insertId;
    const conv3Id = conv3Result[0].insertId;

    // Delete only conv1 and conv2
    await db.delete(messages).where(inArray(messages.conversationId, [conv1Id, conv2Id]));
    await db.delete(conversations).where(
      inArray(conversations.id, [conv1Id, conv2Id])
    );

    // Verify conv3 still exists
    const remainingConversations = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conv3Id));
    expect(remainingConversations.length).toBe(1);
    expect(remainingConversations[0].participantName).toBe("Lead 3");

    // Verify conv1 and conv2 are deleted
    const deletedConversations = await db
      .select()
      .from(conversations)
      .where(inArray(conversations.id, [conv1Id, conv2Id]));
    expect(deletedConversations.length).toBe(0);
  });

  it("should handle conversations with multiple messages", async () => {
    // Create conversation
    const convResult = await db.insert(conversations).values({
      participantType: "student",
      participantId: 1,
      participantName: "Test Student",
      participantPhone: "+1234567890",
      status: "open",
      unreadCount: 3,
    });

    const convId = convResult[0].insertId;

    // Add multiple messages
    for (let i = 0; i < 5; i++) {
      await db.insert(messages).values({
        conversationId: convId,
        direction: i % 2 === 0 ? "inbound" : "outbound",
        content: `Message ${i + 1}`,
        senderType: i % 2 === 0 ? "customer" : "staff",
        status: "delivered",
      });
    }

    // Verify messages exist
    let conversationMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, convId));
    expect(conversationMessages.length).toBe(5);

    // Delete conversation and messages
    await db.delete(messages).where(eq(messages.conversationId, convId));
    await db.delete(conversations).where(eq(conversations.id, convId));

    // Verify all deleted
    const remainingMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, convId));
    expect(remainingMessages.length).toBe(0);

    const remainingConversations = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, convId));
    expect(remainingConversations.length).toBe(0);
  });
});

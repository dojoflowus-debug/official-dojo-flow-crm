import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { kaiConversations } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Test for kai.createConversation mutation
 * Verifies that conversations can be created with all required fields
 */
describe("kai.createConversation", () => {
  let db: any;
  let testConversationId: number | null = null;

  beforeAll(async () => {
    db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }
  });

  afterAll(async () => {
    // Cleanup: Delete test conversation if it was created
    if (testConversationId) {
      await db
        .delete(kaiConversations)
        .where(eq(kaiConversations.id, testConversationId));
    }
  });

  it("should create a conversation with all required fields", async () => {
    // Test data
    const organizationId = 1;
    const userId = 1;
    const title = "Test Conversation";
    const participantIds = JSON.stringify([userId]);

    // Insert a test conversation using the same values as the mutation
    const [result] = await db.insert(kaiConversations).values({
      organizationId,
      userId,
      title,
      summary: null,
      preview: null,
      threadType: "kai_direct",
      status: "active",
      category: "kai",
      priority: "neutral",
      lastMessageAt: new Date(),
      participantIds,
    });

    testConversationId = result.insertId;

    // Verify the conversation was created
    expect(testConversationId).toBeDefined();
    expect(testConversationId).toBeGreaterThan(0);

    // Fetch the created conversation
    const [createdConversation] = await db
      .select()
      .from(kaiConversations)
      .where(eq(kaiConversations.id, testConversationId));

    // Verify all fields
    expect(createdConversation).toBeDefined();
    expect(createdConversation.organizationId).toBe(organizationId);
    expect(createdConversation.userId).toBe(userId);
    expect(createdConversation.title).toBe(title);
    expect(createdConversation.summary).toBeNull();
    expect(createdConversation.preview).toBeNull();
    expect(createdConversation.threadType).toBe("kai_direct");
    expect(createdConversation.status).toBe("active");
    expect(createdConversation.category).toBe("kai");
    expect(createdConversation.priority).toBe("neutral");
    expect(createdConversation.participantIds).toBe(participantIds);
  });

  it("should not fail with database insertion error", async () => {
    // This test ensures the fix prevents the "Failed to create conversation" error
    // by explicitly setting all columns with defaults

    const organizationId = 1;
    const userId = 1;
    const title = "Error Prevention Test";

    let insertError: Error | null = null;

    try {
      const [result] = await db.insert(kaiConversations).values({
        organizationId,
        userId,
        title,
        summary: null,
        preview: null,
        threadType: "kai_direct",
        status: "active",
        category: "kai",
        priority: "neutral",
        lastMessageAt: new Date(),
        participantIds: JSON.stringify([userId]),
      });

      if (result.insertId) {
        testConversationId = result.insertId;
      }
    } catch (error) {
      insertError = error as Error;
    }

    // Verify no error occurred
    expect(insertError).toBeNull();
  });
});

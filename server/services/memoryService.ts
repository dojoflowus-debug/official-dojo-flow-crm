import { db } from "../db";
import { memoryLogs, userProfiles } from "../../drizzle/schema";
import { eq, and, desc, limit } from "drizzle-orm";
import { openai } from "../integrations/openai";

/**
 * Memory Service for Kai AI
 * Handles storing, retrieving, and managing persistent memory for human-like continuity
 */

export interface MemoryWriteInput {
  organizationId: number;
  userId: number;
  userRole: "lead" | "student" | "parent" | "staff";
  content: string;
  emotionalSignals?: string[]; // e.g., ["frustrated", "excited", "hesitant"]
  interactionContext?: string; // e.g., "booking", "question", "support"
  tags?: {
    emotions?: string[];
    intent?: string[];
    flags?: string[];
    behaviors?: string[];
  };
}

export interface MemoryRetrievalInput {
  organizationId: number;
  userId: number;
  limit?: number;
  memoryTypes?: ("short_term" | "mid_term" | "long_term")[];
}

/**
 * MEMORY WRITE: Auto-triggered on meaningful interactions
 * Extracts intent, emotion, key facts and stores in memory_logs
 */
export async function writeMemory(input: MemoryWriteInput) {
  try {
    const {
      organizationId,
      userId,
      userRole,
      content,
      emotionalSignals,
      interactionContext,
      tags,
    } = input;

    // Determine memory type based on content length and context
    let memoryType: "short_term" | "mid_term" | "long_term" = "short_term";
    if (content.length > 500 || interactionContext === "enrollment") {
      memoryType = "mid_term";
    }
    if (tags?.behaviors?.includes("milestone") || tags?.behaviors?.includes("promotion")) {
      memoryType = "long_term";
    }

    // Generate embedding using OpenAI
    let embedding: string | null = null;
    try {
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: content,
      });
      embedding = JSON.stringify(embeddingResponse.data[0].embedding);
    } catch (error) {
      console.error("Failed to generate embedding:", error);
      // Continue without embedding if it fails
    }

    // Insert memory log
    const result = await db.insert(memoryLogs).values({
      organizationId,
      userId,
      userRole,
      content,
      memoryType,
      tags: tags ? JSON.stringify(tags) : null,
      embedding,
      emotionalSignals: emotionalSignals?.join(","),
      interactionContext,
      confidenceScore: 100,
    });

    // Update user profile interaction count and last interaction
    await updateUserProfile(organizationId, userId, userRole, {
      lastInteractionAt: new Date().toISOString(),
      emotionalProfile: emotionalSignals?.[0],
      interactionCount: true, // Increment
    });

    return result;
  } catch (error) {
    console.error("Error writing memory:", error);
    throw error;
  }
}

/**
 * MEMORY RETRIEVAL: Pre-response hook
 * Queries vector DB for top 3-5 relevant past memories
 * Injects into system prompt as context
 */
export async function retrieveMemory(input: MemoryRetrievalInput) {
  try {
    const { organizationId, userId, limit: resultLimit = 5, memoryTypes } = input;

    let query = db
      .select()
      .from(memoryLogs)
      .where(
        and(
          eq(memoryLogs.organizationId, organizationId),
          eq(memoryLogs.userId, userId),
          eq(memoryLogs.isArchived, 0)
        )
      );

    if (memoryTypes && memoryTypes.length > 0) {
      // Filter by memory types if specified
      query = query.where(
        memoryTypes.length === 1
          ? eq(memoryLogs.memoryType, memoryTypes[0])
          : memoryTypes.includes("short_term") ||
            memoryTypes.includes("mid_term") ||
            memoryTypes.includes("long_term")
      );
    }

    const memories = await query
      .orderBy(desc(memoryLogs.createdAt))
      .limit(resultLimit);

    return memories;
  } catch (error) {
    console.error("Error retrieving memory:", error);
    throw error;
  }
}

/**
 * Format retrieved memories for injection into system prompt
 */
export function formatMemoryContext(memories: any[]): string {
  if (!memories || memories.length === 0) {
    return "";
  }

  const context = memories
    .map((mem) => {
      const emotionalNote = mem.emotionalSignals ? ` (${mem.emotionalSignals})` : "";
      return `• ${mem.content}${emotionalNote}`;
    })
    .join("\n");

  return `Relevant Memory Context:\n${context}`;
}

/**
 * MEMORY SUMMARIZATION: Nightly job
 * Compresses older memories into structured summaries
 * Updates user_profiles.aiSummary
 */
export async function summarizeMemories(organizationId: number, userId: number) {
  try {
    // Get all memories for this user
    const allMemories = await db
      .select()
      .from(memoryLogs)
      .where(
        and(
          eq(memoryLogs.organizationId, organizationId),
          eq(memoryLogs.userId, userId),
          eq(memoryLogs.isArchived, 0)
        )
      )
      .orderBy(desc(memoryLogs.createdAt));

    if (allMemories.length === 0) return;

    // Use OpenAI to generate summary
    const memoryTexts = allMemories.map((m) => m.content).join("\n---\n");

    const summary = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a memory summarization expert. Summarize the following conversation history into 2-3 key insights about the person, their goals, pain points, and emotional state.",
        },
        {
          role: "user",
          content: memoryTexts,
        },
      ],
      max_tokens: 300,
    });

    const summaryText =
      summary.choices[0].type === "text" ? summary.choices[0].text : "";

    // Update user profile with summary
    await db
      .update(userProfiles)
      .set({
        aiSummary: summaryText,
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(userProfiles.organizationId, organizationId),
          eq(userProfiles.userId, userId)
        )
      );

    // Archive old short-term memories (older than 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    await db
      .update(memoryLogs)
      .set({ isArchived: 1 })
      .where(
        and(
          eq(memoryLogs.organizationId, organizationId),
          eq(memoryLogs.userId, userId),
          eq(memoryLogs.memoryType, "short_term"),
          memoryLogs.createdAt < sevenDaysAgo
        )
      );

    return summaryText;
  } catch (error) {
    console.error("Error summarizing memories:", error);
    throw error;
  }
}

/**
 * Update user profile with interaction data
 */
async function updateUserProfile(
  organizationId: number,
  userId: number,
  userRole: "lead" | "student" | "parent" | "staff",
  updates: {
    lastInteractionAt?: string;
    emotionalProfile?: string;
    interactionCount?: boolean;
  }
) {
  try {
    // Check if profile exists
    const existing = await db
      .select()
      .from(userProfiles)
      .where(
        and(
          eq(userProfiles.organizationId, organizationId),
          eq(userProfiles.userId, userId)
        )
      );

    if (existing.length === 0) {
      // Create new profile
      await db.insert(userProfiles).values({
        organizationId,
        userId,
        userRole,
        name: `User ${userId}`, // Placeholder
        lastInteractionAt: updates.lastInteractionAt,
        emotionalProfile: updates.emotionalProfile,
        interactionCount: updates.interactionCount ? 1 : 0,
      });
    } else {
      // Update existing profile
      const updateData: any = {
        updatedAt: new Date().toISOString(),
      };

      if (updates.lastInteractionAt) {
        updateData.lastInteractionAt = updates.lastInteractionAt;
      }

      if (updates.emotionalProfile) {
        updateData.emotionalProfile = updates.emotionalProfile;
      }

      if (updates.interactionCount) {
        updateData.interactionCount = existing[0].interactionCount + 1;
      }

      await db
        .update(userProfiles)
        .set(updateData)
        .where(
          and(
            eq(userProfiles.organizationId, organizationId),
            eq(userProfiles.userId, userId)
          )
        );
    }
  } catch (error) {
    console.error("Error updating user profile:", error);
    // Don't throw - this is non-critical
  }
}

/**
 * Get user profile with memory context
 */
export async function getUserProfileWithMemory(
  organizationId: number,
  userId: number
) {
  try {
    const profile = await db
      .select()
      .from(userProfiles)
      .where(
        and(
          eq(userProfiles.organizationId, organizationId),
          eq(userProfiles.userId, userId)
        )
      );

    if (profile.length === 0) return null;

    // Get recent memories
    const memories = await retrieveMemory({
      organizationId,
      userId,
      limit: 5,
      memoryTypes: ["mid_term", "long_term"],
    });

    return {
      profile: profile[0],
      recentMemories: memories,
      memoryContext: formatMemoryContext(memories),
    };
  } catch (error) {
    console.error("Error getting user profile with memory:", error);
    throw error;
  }
}

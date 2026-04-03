import { db } from "../db";
import { memoryLogs, userProfiles } from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import { summarizeMemories } from "../services/memoryService";

/**
 * Nightly Memory Summarization Job
 * Runs daily to compress memories and update user profiles
 * Should be scheduled via cron or job scheduler
 */

export async function runMemorySummarizationJob() {
  console.log("[Memory Job] Starting nightly memory summarization...");

  try {
    // Get all unique user-organization pairs that have memories
    const userMemoryPairs = await db
      .selectDistinct({
        organizationId: memoryLogs.organizationId,
        userId: memoryLogs.userId,
      })
      .from(memoryLogs)
      .where(eq(memoryLogs.isArchived, 0));

    console.log(
      `[Memory Job] Found ${userMemoryPairs.length} users with memories to summarize`
    );

    let successCount = 0;
    let errorCount = 0;

    // Process each user
    for (const pair of userMemoryPairs) {
      try {
        await summarizeMemories(pair.organizationId, pair.userId);
        successCount++;
      } catch (error) {
        console.error(
          `[Memory Job] Error summarizing memories for user ${pair.userId}:`,
          error
        );
        errorCount++;
      }
    }

    console.log(
      `[Memory Job] Completed: ${successCount} successful, ${errorCount} errors`
    );

    // Archive very old memories (older than 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const archivedCount = await db
      .update(memoryLogs)
      .set({ isArchived: 1 })
      .where(
        and(
          eq(memoryLogs.memoryType, "short_term"),
          memoryLogs.createdAt < thirtyDaysAgo,
          eq(memoryLogs.isArchived, 0)
        )
      );

    console.log(`[Memory Job] Archived ${archivedCount} old memories`);

    return {
      success: true,
      summarized: successCount,
      errors: errorCount,
      archived: archivedCount,
    };
  } catch (error) {
    console.error("[Memory Job] Fatal error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Calculate memory health metrics
 */
export async function getMemoryHealthMetrics(organizationId: number) {
  try {
    const totalMemories = await db
      .select({ count: sql`COUNT(*)` })
      .from(memoryLogs)
      .where(
        and(
          eq(memoryLogs.organizationId, organizationId),
          eq(memoryLogs.isArchived, 0)
        )
      );

    const memoryByType = await db
      .select({
        type: memoryLogs.memoryType,
        count: sql`COUNT(*)`,
      })
      .from(memoryLogs)
      .where(
        and(
          eq(memoryLogs.organizationId, organizationId),
          eq(memoryLogs.isArchived, 0)
        )
      )
      .groupBy(memoryLogs.memoryType);

    const usersWithMemory = await db
      .selectDistinct({ userId: memoryLogs.userId })
      .from(memoryLogs)
      .where(
        and(
          eq(memoryLogs.organizationId, organizationId),
          eq(memoryLogs.isArchived, 0)
        )
      );

    const avgEngagementScore = await db
      .select({ avg: sql`AVG(${userProfiles.engagementScore})` })
      .from(userProfiles)
      .where(eq(userProfiles.organizationId, organizationId));

    return {
      totalMemories: totalMemories[0]?.count || 0,
      memoryByType: memoryByType.reduce(
        (acc, item) => {
          acc[item.type] = item.count;
          return acc;
        },
        {} as Record<string, number>
      ),
      usersWithMemory: usersWithMemory.length,
      avgEngagementScore: avgEngagementScore[0]?.avg || 0,
    };
  } catch (error) {
    console.error("Error getting memory health metrics:", error);
    throw error;
  }
}

/**
 * Clean up corrupted or invalid memories
 */
export async function cleanupInvalidMemories(organizationId: number) {
  try {
    // Remove memories with empty content
    const emptyCount = await db
      .delete(memoryLogs)
      .where(
        and(
          eq(memoryLogs.organizationId, organizationId),
          memoryLogs.content === ""
        )
      );

    // Remove memories with confidence score below 10
    const lowConfidenceCount = await db
      .update(memoryLogs)
      .set({ isArchived: 1 })
      .where(
        and(
          eq(memoryLogs.organizationId, organizationId),
          sql`${memoryLogs.confidenceScore} < 10`
        )
      );

    console.log(
      `[Memory Cleanup] Deleted ${emptyCount} empty memories, archived ${lowConfidenceCount} low-confidence memories`
    );

    return { deleted: emptyCount, archived: lowConfidenceCount };
  } catch (error) {
    console.error("Error cleaning up invalid memories:", error);
    throw error;
  }
}

/**
 * Export memories for backup or analysis
 */
export async function exportMemories(organizationId: number, userId?: number) {
  try {
    let query = db
      .select()
      .from(memoryLogs)
      .where(eq(memoryLogs.organizationId, organizationId));

    if (userId) {
      query = query.where(eq(memoryLogs.userId, userId));
    }

    const memories = await query.orderBy(memoryLogs.createdAt);

    return {
      organizationId,
      userId,
      exportedAt: new Date().toISOString(),
      count: memories.length,
      memories,
    };
  } catch (error) {
    console.error("Error exporting memories:", error);
    throw error;
  }
}

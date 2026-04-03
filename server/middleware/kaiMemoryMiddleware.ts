import { getUserProfileWithMemory, writeMemory } from "../services/memoryService";
import { analyzeAndTag, determineConversionStatus, calculateEngagementScore } from "../services/taggingEngine";
import type { Request, Response, NextFunction } from "express";

/**
 * Kai Memory Middleware
 * Integrates memory system into Kai chat responses
 * Handles memory retrieval, tagging, and context injection
 */

export interface KaiMemoryContext {
  organizationId: number;
  userId: number;
  userRole: "lead" | "student" | "parent" | "staff";
  userMessage: string;
  memoryContext: string;
  userProfile?: any;
  tags?: any;
}

/**
 * Middleware to attach memory context to Kai requests
 */
export async function attachMemoryContext(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { organizationId, userId, userRole, message } = req.body;

    if (!organizationId || !userId || !userRole || !message) {
      return next();
    }

    // Get user profile with memory context
    const profileWithMemory = await getUserProfileWithMemory(organizationId, userId);

    // Analyze and tag the current message
    const tags = await analyzeAndTag({
      content: message,
      userRole,
      context: "chat",
    });

    // Attach to request for use in handlers
    (req as any).memoryContext = {
      organizationId,
      userId,
      userRole,
      userMessage: message,
      memoryContext: profileWithMemory?.memoryContext || "",
      userProfile: profileWithMemory?.profile,
      tags,
    } as KaiMemoryContext;

    next();
  } catch (error) {
    console.error("Error in attachMemoryContext:", error);
    next(); // Continue without memory context on error
  }
}

/**
 * Enhance system prompt with memory context
 */
export function enhanceSystemPrompt(
  basePrompt: string,
  memoryContext: KaiMemoryContext
): string {
  let enhancedPrompt = basePrompt;

  // Add memory context if available
  if (memoryContext.memoryContext) {
    enhancedPrompt += `\n\n${memoryContext.memoryContext}`;
  }

  // Add emotional intelligence instructions
  if (memoryContext.tags?.emotions.length > 0) {
    const emotionalTone = getEmotionalTone(memoryContext.tags.emotions);
    enhancedPrompt += `\n\nUser's emotional state: ${emotionalTone}. Adapt your tone accordingly.`;
  }

  // Add behavioral context
  if (memoryContext.userProfile?.behavioralTags) {
    try {
      const behaviors = JSON.parse(memoryContext.userProfile.behavioralTags);
      if (behaviors.includes("price_sensitive")) {
        enhancedPrompt += "\n\nThis user is price-conscious. Focus on value and ROI.";
      }
      if (behaviors.includes("high_intent")) {
        enhancedPrompt += "\n\nThis user shows high intent. Be proactive with recommendations.";
      }
      if (behaviors.includes("hesitant")) {
        enhancedPrompt += "\n\nThis user is hesitant. Provide reassurance and social proof.";
      }
    } catch (e) {
      // Ignore parse errors
    }
  }

  // Add personalization
  if (memoryContext.userProfile?.name) {
    enhancedPrompt += `\n\nYou're speaking with ${memoryContext.userProfile.name}.`;
  }

  return enhancedPrompt;
}

/**
 * Get emotional tone description based on detected emotions
 */
function getEmotionalTone(emotions: string[]): string {
  if (emotions.includes("frustrated") || emotions.includes("angry")) {
    return "frustrated or upset - be empathetic and solution-focused";
  }
  if (emotions.includes("hesitant") || emotions.includes("anxious")) {
    return "hesitant or anxious - be reassuring and provide confidence";
  }
  if (emotions.includes("excited") || emotions.includes("motivated")) {
    return "excited and motivated - match their energy and capitalize on momentum";
  }
  if (emotions.includes("satisfied")) {
    return "satisfied - maintain positive relationship and explore upsell opportunities";
  }
  return "neutral";
}

/**
 * Save interaction to memory after Kai responds
 */
export async function saveInteractionToMemory(
  memoryContext: KaiMemoryContext,
  kaiResponse: string
) {
  try {
    // Combine user message and Kai response for memory
    const interactionContent = `User: "${memoryContext.userMessage}"\n\nKai: "${kaiResponse}"`;

    // Write to memory
    await writeMemory({
      organizationId: memoryContext.organizationId,
      userId: memoryContext.userId,
      userRole: memoryContext.userRole,
      content: interactionContent,
      emotionalSignals: memoryContext.tags?.emotions,
      interactionContext: memoryContext.tags?.intent?.[0],
      tags: {
        emotions: memoryContext.tags?.emotions,
        intent: memoryContext.tags?.intent,
        flags: memoryContext.tags?.flags,
        behaviors: memoryContext.tags?.behaviors,
      },
    });

    // Update user profile with engagement metrics
    if (memoryContext.userProfile) {
      const engagementScore = calculateEngagementScore(
        memoryContext.userProfile.interactionCount + 1,
        memoryContext.tags?.emotions || [],
        memoryContext.tags?.behaviors || []
      );

      const conversionStatus = determineConversionStatus(
        memoryContext.tags?.behaviors || [],
        memoryContext.userProfile.interactionCount + 1
      );

      // These would be updated in a separate database call
      // For now, we just log them
      console.log(
        `Updated ${memoryContext.userProfile.name}: engagement=${engagementScore}, status=${conversionStatus}`
      );
    }
  } catch (error) {
    console.error("Error saving interaction to memory:", error);
    // Don't throw - this is non-critical
  }
}

/**
 * Format memory context for display in chat
 */
export function formatMemoryForDisplay(memoryContext: KaiMemoryContext): string {
  const parts: string[] = [];

  if (memoryContext.userProfile?.name) {
    parts.push(`👤 ${memoryContext.userProfile.name}`);
  }

  if (memoryContext.tags?.emotions.length > 0) {
    parts.push(`😊 Emotions: ${memoryContext.tags.emotions.join(", ")}`);
  }

  if (memoryContext.tags?.intent.length > 0) {
    parts.push(`🎯 Intent: ${memoryContext.tags.intent.join(", ")}`);
  }

  if (memoryContext.userProfile?.engagementScore) {
    parts.push(`⚡ Engagement: ${memoryContext.userProfile.engagementScore}%`);
  }

  return parts.join(" | ");
}

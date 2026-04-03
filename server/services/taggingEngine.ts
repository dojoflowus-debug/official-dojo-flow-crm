import { openai } from "../integrations/openai";

/**
 * Smart Tagging Engine for Kai AI
 * Automatically tags interactions with emotional and behavioral signals
 */

export interface TaggingInput {
  content: string;
  userRole: "lead" | "student" | "parent" | "staff";
  context?: string; // e.g., "booking", "question", "support"
}

export interface TaggingOutput {
  emotions: string[];
  intent: string[];
  flags: string[];
  behaviors: string[];
  confidence: number;
}

/**
 * Emotional tags that Kai recognizes
 */
const EMOTIONAL_TAGS = [
  "frustrated",
  "excited",
  "hesitant",
  "confident",
  "anxious",
  "satisfied",
  "disappointed",
  "curious",
  "concerned",
  "motivated",
];

/**
 * Behavioral tags for lead/student classification
 */
const BEHAVIORAL_TAGS = [
  "high_intent",
  "price_sensitive",
  "no_show",
  "high_attendance",
  "at_risk",
  "cold_lead",
  "warm_lead",
  "hot_lead",
  "converted",
  "inactive",
  "milestone_achieved",
  "promotion_ready",
];

/**
 * Intent tags for understanding what the user wants
 */
const INTENT_TAGS = [
  "booking",
  "question",
  "support",
  "enrollment",
  "feedback",
  "complaint",
  "inquiry",
  "scheduling",
  "cancellation",
  "upgrade",
];

/**
 * Flag tags for alerts and attention
 */
const FLAG_TAGS = [
  "needs_followup",
  "billing_issue",
  "attendance_concern",
  "safety_concern",
  "special_needs",
  "vip",
  "referral_source",
];

/**
 * Analyze interaction and return smart tags
 */
export async function analyzeAndTag(input: TaggingInput): Promise<TaggingOutput> {
  try {
    const { content, userRole, context } = input;

    // Use GPT to analyze the interaction
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: `You are an expert at analyzing customer interactions and extracting emotional, behavioral, and intent signals.
          
Analyze the following interaction and return a JSON object with these fields:
- emotions: array of emotions from this list: ${EMOTIONAL_TAGS.join(", ")}
- intent: array of intents from this list: ${INTENT_TAGS.join(", ")}
- flags: array of flags from this list: ${FLAG_TAGS.join(", ")}
- behaviors: array of behavioral signals (can be custom)
- confidence: 0-100 confidence score for your analysis

Return ONLY valid JSON, no markdown or extra text.`,
        },
        {
          role: "user",
          content: `User Role: ${userRole}
Context: ${context || "general"}
Message: "${content}"

Analyze this interaction and return the JSON object.`,
        },
      ],
      max_tokens: 500,
      temperature: 0.3, // Lower temperature for consistent tagging
    });

    const responseText =
      response.choices[0].type === "text" ? response.choices[0].text : "{}";

    // Parse the response
    let tagging: TaggingOutput;
    try {
      tagging = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse tagging response:", responseText);
      // Return default tags if parsing fails
      tagging = {
        emotions: [],
        intent: [context || "inquiry"],
        flags: [],
        behaviors: [],
        confidence: 50,
      };
    }

    // Validate and clean tags
    tagging.emotions = tagging.emotions?.filter((e) => EMOTIONAL_TAGS.includes(e)) || [];
    tagging.intent = tagging.intent?.filter((i) => INTENT_TAGS.includes(i)) || [];
    tagging.flags = tagging.flags?.filter((f) => FLAG_TAGS.includes(f)) || [];
    tagging.confidence = Math.min(100, Math.max(0, tagging.confidence || 50));

    return tagging;
  } catch (error) {
    console.error("Error in analyzeAndTag:", error);
    // Return safe defaults on error
    return {
      emotions: [],
      intent: [context || "inquiry"],
      flags: [],
      behaviors: [],
      confidence: 0,
    };
  }
}

/**
 * Determine conversion status based on behavioral tags
 */
export function determineConversionStatus(
  behaviors: string[],
  interactionCount: number
): "cold" | "warm" | "hot" | "converted" | "inactive" {
  if (behaviors.includes("converted")) return "converted";
  if (behaviors.includes("inactive")) return "inactive";
  if (behaviors.includes("hot_lead") || interactionCount > 5) return "hot";
  if (behaviors.includes("warm_lead") || interactionCount > 2) return "warm";
  return "cold";
}

/**
 * Calculate engagement score based on interactions and behaviors
 */
export function calculateEngagementScore(
  interactionCount: number,
  emotions: string[],
  behaviors: string[]
): number {
  let score = Math.min(100, interactionCount * 10);

  // Boost for positive emotions
  if (emotions.includes("excited") || emotions.includes("motivated")) score += 20;
  if (emotions.includes("satisfied")) score += 15;

  // Reduce for negative emotions
  if (emotions.includes("frustrated") || emotions.includes("disappointed")) score -= 15;
  if (emotions.includes("hesitant") || emotions.includes("anxious")) score -= 10;

  // Boost for positive behaviors
  if (behaviors.includes("high_attendance")) score += 25;
  if (behaviors.includes("high_intent")) score += 20;
  if (behaviors.includes("promotion_ready")) score += 30;

  // Reduce for negative behaviors
  if (behaviors.includes("no_show")) score -= 30;
  if (behaviors.includes("at_risk")) score -= 20;

  return Math.min(100, Math.max(0, score));
}

/**
 * Generate behavioral recommendations based on tags
 */
export function generateRecommendations(
  emotions: string[],
  behaviors: string[],
  interactionCount: number
): string[] {
  const recommendations: string[] = [];

  // Emotional-based recommendations
  if (emotions.includes("frustrated")) {
    recommendations.push("Send empathetic follow-up with solutions");
  }
  if (emotions.includes("hesitant")) {
    recommendations.push("Provide reassurance and success stories");
  }
  if (emotions.includes("excited")) {
    recommendations.push("Capitalize on momentum - offer premium options");
  }

  // Behavioral-based recommendations
  if (behaviors.includes("price_sensitive")) {
    recommendations.push("Highlight value and ROI");
  }
  if (behaviors.includes("no_show")) {
    recommendations.push("Send reminder 24 hours before next session");
  }
  if (behaviors.includes("at_risk")) {
    recommendations.push("Schedule check-in call to understand concerns");
  }
  if (behaviors.includes("promotion_ready")) {
    recommendations.push("Congratulate and offer next level program");
  }

  // Interaction-based recommendations
  if (interactionCount === 1) {
    recommendations.push("Send welcome sequence");
  }
  if (interactionCount > 5 && !behaviors.includes("converted")) {
    recommendations.push("Time to close - offer special deal");
  }

  return recommendations;
}

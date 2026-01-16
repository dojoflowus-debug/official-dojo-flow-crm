/**
 * Kai NLP Router
 * Lightweight intent classifier for routing user queries to appropriate Kai Data Tools
 * Uses keyword matching and fuzzy similarity for efficient classification
 */

import { KAI_MODULE_REGISTRY, getAllExampleUtterances, getProcedureDetails } from "./kai-module-registry";

export interface ClassificationResult {
  procedure: string;
  confidence: number;
  module: string;
  reasoning: string;
}

/**
 * Simple Levenshtein distance for fuzzy matching
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate similarity score (0-1) between two strings
 */
function calculateSimilarity(a: string, b: string): number {
  const maxLength = Math.max(a.length, b.length);
  if (maxLength === 0) return 1;
  const distance = levenshteinDistance(a, b);
  return 1 - distance / maxLength;
}

/**
 * Extract keywords from query
 */
function extractKeywords(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

/**
 * Check if query contains any of the keywords
 */
function containsKeywords(query: string, keywords: string[]): boolean {
  const queryWords = extractKeywords(query);
  return keywords.some((keyword) =>
    queryWords.some((word) => word.includes(keyword) || keyword.includes(word))
  );
}

/**
 * Keyword patterns for each procedure
 */
const KEYWORD_PATTERNS: Record<string, { keywords: string[]; weight: number }> = {
  // Student procedures
  searchStudents: { keywords: ["search", "find", "student", "look", "name", "email", "phone"], weight: 0.7 },
  getStudent: { keywords: ["get", "student", "profile", "details", "info", "show"], weight: 0.6 },
  listAtRiskStudents: { keywords: ["risk", "inactive", "drop", "absent", "missing"], weight: 0.8 },

  // Lead procedures
  searchLeads: { keywords: ["search", "find", "lead", "prospect", "email", "phone"], weight: 0.7 },
  getLead: { keywords: ["get", "lead", "profile", "details", "info"], weight: 0.6 },

  // Classes procedures
  listClasses: { keywords: ["list", "classes", "show", "available", "schedule"], weight: 0.7 },
  getClassCapacity: { keywords: ["capacity", "enrollment", "full", "spots", "available"], weight: 0.8 },
  getClassRoster: { keywords: ["roster", "students", "enrolled", "list", "class"], weight: 0.7 },
  getAttendanceSummary: { keywords: ["attendance", "present", "absent", "summary", "stats"], weight: 0.8 },

  // Kiosk procedures
  getKioskToday: { keywords: ["kiosk", "checkin", "check-in", "today", "activity"], weight: 0.8 },
  getCheckins: { keywords: ["checkin", "check-in", "attendance", "date", "range"], weight: 0.7 },
  getNewVisitors: { keywords: ["new", "visitor", "visitor", "first", "time"], weight: 0.8 },
  getWaiverStatus: { keywords: ["waiver", "signed", "compliance", "legal"], weight: 0.9 },

  // Billing procedures
  getRevenueSummary: { keywords: ["revenue", "income", "earnings", "sales", "money"], weight: 0.8 },
  getOverdueAccounts: { keywords: ["overdue", "unpaid", "owes", "past", "due"], weight: 0.9 },
  getFailedPayments: { keywords: ["failed", "payment", "declined", "error", "issue"], weight: 0.8 },
};

/**
 * Main NLP router function
 * Classifies user query to appropriate Kai Data Tool procedure
 */
export function classifyIntent(query: string): ClassificationResult | null {
  const normalizedQuery = query.toLowerCase().trim();

  if (!normalizedQuery) {
    return null;
  }

  // Step 1: Try exact match with example utterances
  const examples = getAllExampleUtterances();
  const exactMatches = examples.filter((ex) => {
    const similarity = calculateSimilarity(normalizedQuery, ex.utterance);
    return similarity > 0.85; // High threshold for exact matches
  });

  if (exactMatches.length > 0) {
    const topMatch = exactMatches[0];
    return {
      procedure: topMatch.procedure,
      confidence: 0.95,
      module: topMatch.module,
      reasoning: `Matched example utterance: "${topMatch.utterance}"`,
    };
  }

  // Step 2: Keyword-based matching
  const scores: Array<{ procedure: string; score: number; keywords: string[] }> = [];

  Object.entries(KEYWORD_PATTERNS).forEach(([procedure, { keywords, weight }]) => {
    if (containsKeywords(normalizedQuery, keywords)) {
      const matchedKeywords = keywords.filter((kw) =>
        normalizedQuery.includes(kw)
      );
      const score = (matchedKeywords.length / keywords.length) * weight;
      scores.push({ procedure, score, keywords: matchedKeywords });
    }
  });

  if (scores.length > 0) {
    const topScore = scores.sort((a, b) => b.score - a.score)[0];
    const confidence = Math.min(topScore.score + 0.1, 0.9); // Cap at 0.9

    // Find module for procedure
    let module = "unknown";
    Object.entries(KAI_MODULE_REGISTRY).forEach(([moduleKey, moduleData]) => {
      if (moduleData.capabilities.some((cap) => cap.procedure === topScore.procedure)) {
        module = moduleKey;
      }
    });

    return {
      procedure: topScore.procedure,
      confidence,
      module,
      reasoning: `Matched keywords: ${topScore.keywords.join(", ")}`,
    };
  }

  // Step 3: Fuzzy match with all example utterances
  const fuzzyMatches = examples
    .map((ex) => ({
      ...ex,
      similarity: calculateSimilarity(normalizedQuery, ex.utterance),
    }))
    .filter((ex) => ex.similarity > 0.6)
    .sort((a, b) => b.similarity - a.similarity);

  if (fuzzyMatches.length > 0) {
    const topMatch = fuzzyMatches[0];
    return {
      procedure: topMatch.procedure,
      confidence: topMatch.similarity,
      module: topMatch.module,
      reasoning: `Fuzzy matched: "${topMatch.utterance}" (${(topMatch.similarity * 100).toFixed(0)}% similar)`,
    };
  }

  // No match found
  return null;
}

/**
 * Get suggested procedures based on partial query
 * Useful for autocomplete or suggestions
 */
export function suggestProcedures(query: string, limit: number = 5): ClassificationResult[] {
  const normalizedQuery = query.toLowerCase().trim();

  if (!normalizedQuery) {
    // Return top procedures from each module
    const suggestions: ClassificationResult[] = [];
    Object.entries(KAI_MODULE_REGISTRY).forEach(([moduleKey, moduleData]) => {
      if (moduleData.capabilities.length > 0) {
        const cap = moduleData.capabilities[0];
        suggestions.push({
          procedure: cap.procedure,
          confidence: 0.5,
          module: moduleKey,
          reasoning: "Default suggestion",
        });
      }
    });
    return suggestions.slice(0, limit);
  }

  const examples = getAllExampleUtterances();
  const matches = examples
    .map((ex) => ({
      ...ex,
      similarity: calculateSimilarity(normalizedQuery, ex.utterance),
    }))
    .filter((ex) => ex.similarity > 0.3)
    .sort((a, b) => b.similarity - a.similarity);

  // Deduplicate by procedure
  const seen = new Set<string>();
  const suggestions: ClassificationResult[] = [];

  matches.forEach((match) => {
    if (!seen.has(match.procedure)) {
      seen.add(match.procedure);
      suggestions.push({
        procedure: match.procedure,
        confidence: match.similarity,
        module: match.module,
        reasoning: `Suggested based on: "${match.utterance}"`,
      });
    }
  });

  return suggestions.slice(0, limit);
}

/**
 * Validate if a procedure exists in the registry
 */
export function isValidProcedure(procedure: string): boolean {
  return getProcedureDetails(procedure) !== null;
}

/**
 * Get all available procedures
 */
export function getAllProcedures(): string[] {
  const procedures: string[] = [];
  Object.values(KAI_MODULE_REGISTRY).forEach((module) => {
    module.capabilities.forEach((cap) => {
      procedures.push(cap.procedure);
    });
  });
  return procedures;
}

/**
 * Lead Scoring Engine
 * Automatically calculates lead scores based on activities and engagement
 */

import { getDb } from "./db";
import { leads, leadActivities, leadScoringRules } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";

// Default scoring rules - points for each activity type
export const DEFAULT_SCORING_RULES: Record<string, { points: number; description: string }> = {
  // Email activities
  email_opened: { points: 5, description: "Opened an email" },
  email_clicked: { points: 10, description: "Clicked a link in email" },
  email_replied: { points: 15, description: "Replied to an email" },
  email_sent: { points: 3, description: "Email sent to lead" },
  
  // Website activities
  website_visit: { points: 3, description: "Visited the website" },
  form_submission: { points: 15, description: "Submitted a form" },
  
  // Call activities
  call_completed: { points: 20, description: "Completed a phone call" },
  call_attempted: { points: 5, description: "Call attempted (no answer)" },
  call_voicemail: { points: 5, description: "Left a voicemail" },
  
  // SMS activities
  sms_sent: { points: 5, description: "SMS sent to lead" },
  sms_replied: { points: 15, description: "Lead replied to SMS" },
  
  // Engagement activities
  intro_scheduled: { points: 25, description: "Scheduled an intro class" },
  trial_attended: { points: 30, description: "Attended a trial class" },
  trial_no_show: { points: -10, description: "No-show for trial class" },
  
  // Notes and tasks
  note_added: { points: 2, description: "Note added to lead" },
  task_completed: { points: 3, description: "Task completed for lead" },
  
  // Status changes (positive progression)
  status_contact_made: { points: 10, description: "Moved to Contact Made" },
  status_intro_scheduled: { points: 15, description: "Moved to Intro Scheduled" },
  status_offer_presented: { points: 20, description: "Moved to Offer Presented" },
  
  // Negative signals
  status_lost: { points: -20, description: "Marked as Lost" },
  unsubscribed: { points: -15, description: "Unsubscribed from communications" },
};

/**
 * Get scoring rules from database, falling back to defaults
 */
export async function getScoringRules(): Promise<Record<string, number>> {
  const db = getDb();
  if (!db) {
    return Object.fromEntries(
      Object.entries(DEFAULT_SCORING_RULES).map(([k, v]) => [k, v.points])
    );
  }
  
  const rules = await db.select().from(leadScoringRules).where(eq(leadScoringRules.isActive, 1));
  
  if (rules.length === 0) {
    // Return defaults if no rules in DB
    return Object.fromEntries(
      Object.entries(DEFAULT_SCORING_RULES).map(([k, v]) => [k, v.points])
    );
  }
  
  return Object.fromEntries(rules.map(r => [r.activityType, r.points]));
}

/**
 * Map activity type and outcome to scoring rule key
 */
function getActivityScoreKey(activity: {
  type: string;
  callOutcome?: string | null;
  newStatus?: string | null;
}): string | null {
  const { type, callOutcome, newStatus } = activity;
  
  switch (type) {
    case "call":
      if (callOutcome === "answered") return "call_completed";
      if (callOutcome === "voicemail") return "call_voicemail";
      if (callOutcome === "no_answer" || callOutcome === "busy") return "call_attempted";
      return "call_attempted";
    
    case "email":
      return "email_sent";
    
    case "sms":
      return "sms_sent";
    
    case "note":
      return "note_added";
    
    case "meeting":
      return "intro_scheduled";
    
    case "task":
      return "task_completed";
    
    case "status_change":
      if (newStatus === "Contact Made") return "status_contact_made";
      if (newStatus === "Intro Scheduled") return "status_intro_scheduled";
      if (newStatus === "Offer Presented") return "status_offer_presented";
      if (newStatus === "Lost/Winback") return "status_lost";
      return null;
    
    default:
      return null;
  }
}

/**
 * Calculate lead score based on all activities
 */
export async function calculateLeadScore(leadId: number): Promise<number> {
  const db = getDb();
  if (!db) return 50;
  
  const rules = await getScoringRules();
  
  // Get all activities for this lead
  const activities = await db
    .select()
    .from(leadActivities)
    .where(eq(leadActivities.leadId, leadId))
    .orderBy(desc(leadActivities.createdAt));
  
  // Start with base score of 50
  let score = 50;
  
  // Calculate score from activities
  for (const activity of activities) {
    const scoreKey = getActivityScoreKey({
      type: activity.type,
      callOutcome: activity.callOutcome,
      newStatus: activity.newStatus,
    });
    
    if (scoreKey && rules[scoreKey]) {
      score += rules[scoreKey];
    }
  }
  
  // Apply time decay - reduce score for old leads with no recent activity
  if (activities.length > 0) {
    const lastActivity = activities[0];
    const daysSinceLastActivity = Math.floor(
      (Date.now() - new Date(lastActivity.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Decay 2 points per week of inactivity (after 7 days)
    if (daysSinceLastActivity > 7) {
      const weeksInactive = Math.floor((daysSinceLastActivity - 7) / 7);
      score -= weeksInactive * 2;
    }
  }
  
  // Clamp score between 0 and 100
  return Math.max(0, Math.min(100, score));
}

/**
 * Update lead score in database
 */
export async function updateLeadScore(leadId: number): Promise<number> {
  const db = getDb();
  const score = await calculateLeadScore(leadId);
  
  if (db) {
    await db
      .update(leads)
      .set({
        leadScore: score,
        leadScoreUpdatedAt: new Date(),
      })
      .where(eq(leads.id, leadId));
  }
  
  return score;
}

/**
 * Recalculate scores for all leads
 */
export async function recalculateAllLeadScores(): Promise<{ updated: number; errors: number }> {
  const db = getDb();
  if (!db) return { updated: 0, errors: 0 };
  
  const allLeads = await db.select({ id: leads.id }).from(leads);
  
  let updated = 0;
  let errors = 0;
  
  for (const lead of allLeads) {
    try {
      await updateLeadScore(lead.id);
      updated++;
    } catch (error) {
      console.error(`Error updating score for lead ${lead.id}:`, error);
      errors++;
    }
  }
  
  return { updated, errors };
}

/**
 * Get score color based on value
 */
export function getScoreColor(score: number): "green" | "yellow" | "red" {
  if (score >= 70) return "green";
  if (score >= 40) return "yellow";
  return "red";
}

/**
 * Get score label based on value
 */
export function getScoreLabel(score: number): string {
  if (score >= 80) return "Hot";
  if (score >= 60) return "Warm";
  if (score >= 40) return "Neutral";
  if (score >= 20) return "Cool";
  return "Cold";
}

/**
 * Initialize default scoring rules in database
 */
export async function initializeScoringRules(): Promise<void> {
  const db = getDb();
  if (!db) return;
  
  const existingRules = await db.select().from(leadScoringRules);
  
  if (existingRules.length === 0) {
    // Insert default rules
    const rulesToInsert = Object.entries(DEFAULT_SCORING_RULES).map(([activityType, { points, description }]) => ({
      activityType,
      points,
      description,
      isActive: 1,
    }));
    
    for (const rule of rulesToInsert) {
      await db.insert(leadScoringRules).values(rule);
    }
    
    console.log(`Initialized ${rulesToInsert.length} default scoring rules`);
  }
}

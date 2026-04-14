/**
 * Kai Command Execution Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Parses natural-language staff commands and executes real CRM actions:
 *   - Contact resolution (leads + students)
 *   - Program / pricing resolution
 *   - Enrollment link generation
 *   - SMS / email send via existing Twilio integration
 *   - Activity logging to lead_activities table
 *   - Idempotency guard (no duplicate sends within 5 minutes)
 *
 * Architecture:
 *   commandParser → intentResolver → contactResolver → programResolver
 *   → enrollmentLinkResolver → messageTemplateBuilder → actionExecutor
 *   → activityLogger → responseFormatter
 */

import { getDb } from "./db";
import { sendSMS } from "./_core/twilio";
import {
  leads,
  students,
  programs,
  locations,
  leadActivities,
  dojoSettings,
} from "../drizzle/schema";
import { eq, and, or, like, desc, gte } from "drizzle-orm";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type CommandIntent =
  | "SEND_ENROLLMENT_PACKAGE"   // pricing + enrollment link
  | "SEND_PRICING_ONLY"         // plans/pricing only
  | "SEND_TRIAL_OFFER"          // trial offer
  | "SEND_ENROLLMENT_LINK_ONLY" // just the enrollment link
  | "SEND_MISSED_CLASS_FOLLOWUP"// missed class follow-up
  | "SEND_REACTIVATION"         // win-back / reactivation
  | "SEND_INTRO_REMINDER"       // intro appointment reminder
  | "UNKNOWN";

export interface ParsedCommand {
  intent: CommandIntent;
  contactName: string | null;
  channels: Array<"sms" | "email">;
  contentRequested: Array<"plans" | "pricing" | "enrollment_link" | "trial_offer" | "intro_reminder">;
  requiresContactResolution: boolean;
  requiresProgramResolution: boolean;
  rawQuery: string;
}

export interface ResolvedContact {
  type: "lead" | "student";
  id: number;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  programInterest?: string | null;
  ageGroup?: string | null;
}

export interface ResolvedProgram {
  id: number;
  name: string;
  type: string;
  billing: string | null;
  price: number | null;
  trialType: string | null;
  trialLengthDays: number | null;
  trialPrice: number | null;
  ageRange: string | null;
  description: string | null;
}

export interface CommandExecutionResult {
  success: boolean;
  intent: CommandIntent;
  contact?: ResolvedContact;
  program?: ResolvedProgram;
  messageSent?: string;
  channel?: "sms" | "email";
  deliveryId?: string;
  enrollmentLink?: string;
  error?: string;
  ambiguousContacts?: ResolvedContact[];
  ambiguousPrograms?: ResolvedProgram[];
  loggedActivityId?: number;
  isDuplicate?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. COMMAND PARSER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parses a natural-language staff command into a structured ParsedCommand.
 */
export function parseCommand(query: string): ParsedCommand {
  const q = query.toLowerCase().trim();

  // Detect channels
  const channels: Array<"sms" | "email"> = [];
  if (/\b(text|sms|message|msg)\b/.test(q)) channels.push("sms");
  if (/\b(email|mail)\b/.test(q)) channels.push("email");
  if (channels.length === 0) channels.push("sms"); // default to SMS

  // Detect content requested
  const contentRequested: ParsedCommand["contentRequested"] = [];
  if (/\b(plan|plans|pricing|price|prices|cost|rate|rates|fees?)\b/.test(q)) {
    contentRequested.push("plans");
    contentRequested.push("pricing");
  }
  if (/\b(enroll(ment)?|sign.?up|register|link|join|start)\b/.test(q)) {
    contentRequested.push("enrollment_link");
  }
  if (/\b(trial|free.?class|intro.?class|try.?out|tryout)\b/.test(q)) {
    contentRequested.push("trial_offer");
  }
  if (/\b(intro|appointment|appt|schedule|reminder)\b/.test(q)) {
    contentRequested.push("intro_reminder");
  }

  // Determine intent
  let intent: CommandIntent = "UNKNOWN";

  if (
    (contentRequested.includes("plans") || contentRequested.includes("pricing")) &&
    contentRequested.includes("enrollment_link")
  ) {
    intent = "SEND_ENROLLMENT_PACKAGE";
  } else if (contentRequested.includes("trial_offer")) {
    intent = "SEND_TRIAL_OFFER";
  } else if (contentRequested.includes("enrollment_link")) {
    intent = "SEND_ENROLLMENT_LINK_ONLY";
  } else if (contentRequested.includes("plans") || contentRequested.includes("pricing")) {
    intent = "SEND_PRICING_ONLY";
  } else if (/\b(missed.?class|absent|didn.?t.?show|no.?show)\b/.test(q)) {
    intent = "SEND_MISSED_CLASS_FOLLOWUP";
  } else if (/\b(reactivat|win.?back|comeback|come.?back|inactive)\b/.test(q)) {
    intent = "SEND_REACTIVATION";
  } else if (contentRequested.includes("intro_reminder")) {
    intent = "SEND_INTRO_REMINDER";
  }

  // Extract contact name
  // Patterns: "text Vincent ...", "send to Marcus", "message Sarah the ...", "email John ..."
  const contactPatterns = [
    /(?:text|sms|message|msg|email|mail|send(?:\s+(?:to|pricing|plans|info|it))?\s+to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    /(?:follow\s+up\s+with)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    /\bto\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/i,
  ];

  let contactName: string | null = null;
  for (const pattern of contactPatterns) {
    const match = query.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      // Exclude common words that aren't names
      const excludeWords = ["him", "her", "them", "everyone", "all", "the", "a", "an", "me", "us"];
      if (!excludeWords.includes(name.toLowerCase())) {
        contactName = name;
        break;
      }
    }
  }

  return {
    intent,
    contactName,
    channels,
    contentRequested,
    requiresContactResolution: contactName !== null,
    requiresProgramResolution: contentRequested.includes("plans") || contentRequested.includes("pricing") || contentRequested.includes("enrollment_link") || contentRequested.includes("trial_offer"),
    rawQuery: query,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. CONTACT RESOLVER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolves a contact name to a CRM record (lead or student).
 * Returns array of matches (empty = not found, >1 = ambiguous).
 */
export async function resolveContact(
  name: string,
  organizationId: number
): Promise<ResolvedContact[]> {
  const db = await getDb();
  if (!db) return [];

  const nameParts = name.trim().split(/\s+/);
  const firstName = nameParts[0];
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;

  const results: ResolvedContact[] = [];

  // Search leads
  const leadConditions = lastName
    ? and(
        eq(leads.organizationId, organizationId),
        like(leads.firstName, `%${firstName}%`),
        like(leads.lastName, `%${lastName}%`)
      )
    : and(
        eq(leads.organizationId, organizationId),
        or(
          like(leads.firstName, `%${firstName}%`),
          like(leads.lastName, `%${firstName}%`)
        )
      );

  const leadResults = await db
    .select()
    .from(leads)
    .where(leadConditions)
    .limit(5);

  for (const lead of leadResults) {
    results.push({
      type: "lead",
      id: lead.id,
      firstName: lead.firstName,
      lastName: lead.lastName,
      phone: lead.phone || null,
      email: lead.email || null,
      programInterest: (lead as any).programInterest || null,
      ageGroup: (lead as any).ageGroup || null,
    });
  }

  // Search students if no leads found
  if (results.length === 0) {
    const studentConditions = lastName
      ? and(
          eq(students.organizationId, organizationId),
          like(students.firstName, `%${firstName}%`),
          like(students.lastName, `%${lastName}%`)
        )
      : and(
          eq(students.organizationId, organizationId),
          or(
            like(students.firstName, `%${firstName}%`),
            like(students.lastName, `%${firstName}%`)
          )
        );

    const studentResults = await db
      .select()
      .from(students)
      .where(studentConditions)
      .limit(5);

    for (const student of studentResults) {
      results.push({
        type: "student",
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        phone: student.phone || null,
        email: student.email || null,
      });
    }
  }

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. PROGRAM / PRICING RESOLVER
// ─────────────────────────────────────────────────────────────────────────────

const PROGRAM_KEYWORDS: Record<string, string[]> = {
  "Little Ninjas": ["little ninja", "little ninjas", "ninja", "tiny", "3-5", "3 to 5", "preschool", "toddler"],
  "Dragon Kids": ["dragon", "dragon kids", "kids", "children", "child", "6-12", "6 to 12", "elementary"],
  "Teens & Adults": ["teen", "adult", "teens", "adults", "teenager", "13+", "grown"],
  "Kickboxing": ["kickbox", "kickboxing", "kick boxing", "cardio", "fitness"],
  "Summer Camp": ["summer camp", "summer", "camp"],
  "After School": ["after school", "afterschool", "after-school"],
};

/**
 * Resolves the best-matching program from the CRM based on query context.
 * Returns array of matches (empty = use all active programs).
 */
export async function resolveProgram(
  query: string,
  contact: ResolvedContact | null,
  organizationId: number
): Promise<ResolvedProgram[]> {
  const db = await getDb();
  if (!db) return [];

  const q = query.toLowerCase();

  // Try to match by keyword in query
  let programNameHint: string | null = null;
  for (const [programName, keywords] of Object.entries(PROGRAM_KEYWORDS)) {
    if (keywords.some((kw) => q.includes(kw))) {
      programNameHint = programName;
      break;
    }
  }

  // Also check contact's programInterest
  if (!programNameHint && contact?.programInterest) {
    const interest = contact.programInterest.toLowerCase();
    for (const [programName, keywords] of Object.entries(PROGRAM_KEYWORDS)) {
      if (keywords.some((kw) => interest.includes(kw))) {
        programNameHint = programName;
        break;
      }
    }
  }

  // Query programs table
  const allPrograms = await db
    .select()
    .from(programs)
    .where(
      and(
        eq(programs.isActive, 1),
        eq(programs.showOnEnrollment, 1),
        eq(programs.organizationId, organizationId)
      )
    )
    .orderBy(programs.sortOrder);

  if (allPrograms.length === 0) {
    // Fallback: get any active programs for this org
    const fallback = await db
      .select()
      .from(programs)
      .where(and(eq(programs.isActive, 1), eq(programs.organizationId, organizationId)))
      .limit(10);
    return fallback.map(mapProgram);
  }

  if (programNameHint) {
    const matched = allPrograms.filter((p) =>
      p.name.toLowerCase().includes(programNameHint!.toLowerCase()) ||
      programNameHint!.toLowerCase().includes(p.name.toLowerCase())
    );
    if (matched.length > 0) return matched.map(mapProgram);
  }

  // Return all active programs if no specific match
  return allPrograms.map(mapProgram);
}

function mapProgram(p: any): ResolvedProgram {
  return {
    id: p.id,
    name: p.name,
    type: p.type,
    billing: p.billing || null,
    price: p.price || null,
    trialType: p.trialType || null,
    trialLengthDays: p.trialLengthDays || null,
    trialPrice: p.trialPrice || null,
    ageRange: p.ageRange || null,
    description: p.description || null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. ENROLLMENT LINK RESOLVER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates or retrieves the enrollment link for a given program/location.
 */
export async function resolveEnrollmentLink(
  organizationId: number,
  program?: ResolvedProgram | null
): Promise<string> {
  const db = await getDb();
  const baseUrl = process.env.VITE_APP_URL || "https://dojo-flow.ai";

  if (!db) return `${baseUrl}/enroll`;

  // Try to find a kiosk slug for this org
  const [location] = await db
    .select()
    .from(locations)
    .where(and(eq(locations.organizationId, organizationId), eq(locations.isActive, 1)))
    .limit(1);

  if (location?.kioskSlug) {
    const kioskBase = `${baseUrl}/kiosk/${location.kioskSlug}`;
    // If a specific program is requested, try to append program param
    if (program) {
      return `${kioskBase}?program=${encodeURIComponent(program.name)}`;
    }
    return kioskBase;
  }

  // Fallback to generic enrollment URL
  if (program) {
    return `${baseUrl}/enroll?program=${encodeURIComponent(program.name)}`;
  }
  return `${baseUrl}/enroll`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. MESSAGE TEMPLATE BUILDER
// ─────────────────────────────────────────────────────────────────────────────

interface TemplateVars {
  firstName: string;
  businessName: string;
  operatorName: string;
  programName: string;
  pricingSummary: string;
  enrollmentLink: string;
  trialOffer: string;
}

const MESSAGE_TEMPLATES: Record<CommandIntent, string> = {
  SEND_ENROLLMENT_PACKAGE: `Hey {{firstName}}! 👋 Here's the info on our {{programName}} program.

📋 Plans & Pricing:
{{pricingSummary}}

🔗 Get started here:
{{enrollmentLink}}

Questions? Just reply to this message — we're happy to help!
— {{operatorName}}`,

  SEND_PRICING_ONLY: `Hey {{firstName}}! Here's a quick look at our {{programName}} pricing:

{{pricingSummary}}

Ready to get started? Reply back and we'll set everything up!
— {{operatorName}}`,

  SEND_TRIAL_OFFER: `Hey {{firstName}}! 🥋 We'd love to have you try a class at {{businessName}}.

{{trialOffer}}

🔗 Sign up here:
{{enrollmentLink}}

See you on the mat!
— {{operatorName}}`,

  SEND_ENROLLMENT_LINK_ONLY: `Hey {{firstName}}! Here's your enrollment link for {{programName}}:

{{enrollmentLink}}

Let us know if you have any questions!
— {{operatorName}}`,

  SEND_MISSED_CLASS_FOLLOWUP: `Hey {{firstName}}, we missed you in class! 👊 Hope everything's okay.

When you're ready to get back on the mat, we're here. Reply to this message and we'll get you set up.
— {{operatorName}}`,

  SEND_REACTIVATION: `Hey {{firstName}}! It's been a while — we'd love to have you back at {{businessName}}.

We have some great programs that might be a perfect fit. Reply to this message and let's catch up!
— {{operatorName}}`,

  SEND_INTRO_REMINDER: `Hey {{firstName}}! Just a quick reminder about your intro class at {{businessName}}.

Looking forward to seeing you! Reply if you need to reschedule.
— {{operatorName}}`,

  UNKNOWN: `Hey {{firstName}}, thanks for your interest in {{businessName}}! 

Reply to this message and we'll get you all the information you need.
— {{operatorName}}`,
};

/**
 * Builds the outbound message from a template, injecting all variables.
 */
export async function buildMessage(
  intent: CommandIntent,
  contact: ResolvedContact,
  programs: ResolvedProgram[],
  enrollmentLink: string,
  organizationId: number
): Promise<string> {
  const db = await getDb();

  // Fetch dojo settings for business name / operator name
  let businessName = "our dojo";
  let operatorName = "the team";

  if (db) {
    const [settings] = await db
      .select()
      .from(dojoSettings)
      .where(eq(dojoSettings.organizationId, organizationId))
      .limit(1)
      .catch(() => db.select().from(dojoSettings).limit(1));

    if (settings) {
      businessName = (settings as any).businessName || businessName;
      operatorName =
        (settings as any).preferredName ||
        (settings as any).operatorName ||
        operatorName;
    }
  }

  // Build pricing summary
  const primaryProgram = programs[0];
  const programName = primaryProgram?.name || "our programs";

  let pricingSummary = "";
  if (programs.length > 0) {
    pricingSummary = programs
      .slice(0, 4) // max 4 programs in SMS
      .map((p) => {
        const price = p.price ? `$${(p.price / 100).toFixed(0)}/mo` : "Contact us for pricing";
        const trial =
          p.trialType && p.trialType !== "none"
            ? ` (${p.trialLengthDays}-day trial ${p.trialPrice === 0 ? "FREE" : `$${(p.trialPrice! / 100).toFixed(0)}`})`
            : "";
        const ageRange = p.ageRange ? ` | Ages ${p.ageRange}` : "";
        return `• ${p.name}: ${price}${trial}${ageRange}`;
      })
      .join("\n");
  } else {
    pricingSummary = "Contact us for current pricing.";
  }

  // Build trial offer text
  let trialOffer = "";
  if (primaryProgram?.trialType && primaryProgram.trialType !== "none") {
    const trialPrice =
      primaryProgram.trialPrice === 0
        ? "FREE"
        : `$${((primaryProgram.trialPrice || 0) / 100).toFixed(0)}`;
    trialOffer = `Try ${primaryProgram.name} FREE for ${primaryProgram.trialLengthDays} days — ${trialPrice} trial offer.`;
  } else {
    trialOffer = `Come try a FREE intro class at ${businessName}!`;
  }

  const template = MESSAGE_TEMPLATES[intent] || MESSAGE_TEMPLATES.UNKNOWN;

  const vars: TemplateVars = {
    firstName: contact.firstName,
    businessName,
    operatorName,
    programName,
    pricingSummary,
    enrollmentLink,
    trialOffer,
  };

  let message = template;
  for (const [key, value] of Object.entries(vars)) {
    message = message.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }

  return message;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. IDEMPOTENCY GUARD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Checks if the same message was already sent to this contact within the last 5 minutes.
 * Prevents duplicate sends if user accidentally re-submits.
 */
export async function checkDuplicateSend(
  contactId: number,
  contactType: "lead" | "student",
  intent: CommandIntent,
  organizationId: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  if (contactType === "lead") {
    const recent = await db
      .select()
      .from(leadActivities)
      .where(
        and(
          eq(leadActivities.leadId, contactId),
          eq(leadActivities.type, "sms"),
          eq(leadActivities.isAutomated, 0),
          gte(leadActivities.createdAt, fiveMinutesAgo.toISOString().slice(0, 19).replace('T', ' '))
        )
      )
      .limit(1);

    return recent.length > 0;
  }

  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. ACTIVITY LOGGER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Logs the command execution to the CRM activity timeline.
 */
export async function logActivity(params: {
  contactId: number;
  contactType: "lead" | "student";
  intent: CommandIntent;
  channel: "sms" | "email";
  messageSent: string;
  deliveryId: string | null;
  success: boolean;
  initiatedByName: string;
  initiatedById: number;
  organizationId: number;
}): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    if (params.contactType === "lead") {
      const result = await db.insert(leadActivities).values({
        leadId: params.contactId,
        type: params.channel === "sms" ? "sms" : "email",
        title: `Kai sent ${params.channel.toUpperCase()}: ${params.intent.replace(/_/g, " ")}`,
        content: params.messageSent,
        isAutomated: 0,
        createdById: params.initiatedById,
        createdByName: params.initiatedByName,
        metadata: JSON.stringify({
          intent: params.intent,
          deliveryId: params.deliveryId,
          success: params.success,
          sentViaKai: true,
        }),
      });
      return (result as any).insertId || null;
    }
    // For students, we could log to a student_activities table if it exists
    // For now, return null (no student activity log)
    return null;
  } catch (err) {
    console.error("[Kai Command Engine] Activity log error:", err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. ACTION EXECUTOR — main entry point
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Executes a fully resolved command: sends the message and logs the action.
 */
export async function executeCommand(params: {
  intent: CommandIntent;
  contact: ResolvedContact;
  programs: ResolvedProgram[];
  channel: "sms" | "email";
  enrollmentLink: string;
  organizationId: number;
  initiatedById: number;
  initiatedByName: string;
}): Promise<CommandExecutionResult> {
  const { intent, contact, programs: resolvedPrograms, channel, enrollmentLink, organizationId } = params;

  // Build message
  const messageSent = await buildMessage(intent, contact, resolvedPrograms, enrollmentLink, organizationId);

  if (channel === "sms") {
    if (!contact.phone) {
      return {
        success: false,
        intent,
        contact,
        error: `No phone number on file for ${contact.firstName} ${contact.lastName}.`,
      };
    }

    // Send SMS via Twilio
    const smsResult = await sendSMS({
      to: contact.phone,
      body: messageSent,
      organizationId,
    });

    if (!smsResult.success) {
      return {
        success: false,
        intent,
        contact,
        messageSent,
        channel,
        error: `SMS delivery failed: ${smsResult.error || "Unknown Twilio error"}`,
      };
    }

    // Log activity
    const activityId = await logActivity({
      contactId: contact.id,
      contactType: contact.type,
      intent,
      channel,
      messageSent,
      deliveryId: smsResult.messageId || null,
      success: true,
      initiatedByName: params.initiatedByName,
      initiatedById: params.initiatedById,
      organizationId,
    });

    return {
      success: true,
      intent,
      contact,
      program: resolvedPrograms[0] || undefined,
      messageSent,
      channel,
      deliveryId: smsResult.messageId,
      enrollmentLink,
      loggedActivityId: activityId || undefined,
    };
  }

  // Email channel (future)
  return {
    success: false,
    intent,
    contact,
    error: "Email channel not yet implemented. Use SMS.",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. HIGH-LEVEL ORCHESTRATOR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Full pipeline: parse → resolve → build → send → log → return result.
 * Called by the Kai tool executor.
 */
export async function runCommandPipeline(params: {
  query: string;
  contactNameOverride?: string;   // if user already confirmed which contact
  programNameOverride?: string;   // if user already confirmed which program
  channelOverride?: "sms" | "email";
  organizationId: number;
  initiatedById: number;
  initiatedByName: string;
}): Promise<CommandExecutionResult> {
  const { query, organizationId } = params;

  // 1. Parse
  const parsed = parseCommand(query);
  const contactName = params.contactNameOverride || parsed.contactName;
  const channel = params.channelOverride || parsed.channels[0] || "sms";

  if (!contactName) {
    return {
      success: false,
      intent: parsed.intent,
      error: "No contact name found in your command. Try: 'Text [Name] the plans and enrollment link'",
    };
  }

  // 2. Resolve contact
  const contactMatches = await resolveContact(contactName, organizationId);

  if (contactMatches.length === 0) {
    return {
      success: false,
      intent: parsed.intent,
      error: `No contact named "${contactName}" found in the CRM. Check the spelling or add them as a new lead.`,
    };
  }

  if (contactMatches.length > 1 && !params.contactNameOverride) {
    return {
      success: false,
      intent: parsed.intent,
      ambiguousContacts: contactMatches,
      error: `Found ${contactMatches.length} contacts named "${contactName}". Which one did you mean?`,
    };
  }

  const contact = contactMatches[0];

  // 3. Idempotency check
  const isDuplicate = await checkDuplicateSend(contact.id, contact.type, parsed.intent, organizationId);
  if (isDuplicate) {
    return {
      success: false,
      intent: parsed.intent,
      contact,
      isDuplicate: true,
      error: `A message was already sent to ${contact.firstName} in the last 5 minutes. Skipping to prevent duplicate.`,
    };
  }

  // 4. Resolve programs
  const resolvedPrograms = await resolveProgram(
    params.programNameOverride ? params.programNameOverride : query,
    contact,
    organizationId
  );

  // 5. Resolve enrollment link
  const enrollmentLink = await resolveEnrollmentLink(
    organizationId,
    resolvedPrograms[0] || null
  );

  // 6. Execute
  return executeCommand({
    intent: parsed.intent,
    contact,
    programs: resolvedPrograms,
    channel,
    enrollmentLink,
    organizationId,
    initiatedById: params.initiatedById,
    initiatedByName: params.initiatedByName,
  });
}

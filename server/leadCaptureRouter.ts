/**
 * Lead Capture Router - AI Chat lead qualification and capture
 * Handles Kai's conversation with website visitors and extracts lead information
 */

import { Router, Request, Response } from 'express';
import { getDb } from './db';
import { leads } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

const router = Router();

interface LeadCaptureRequest {
  organizationId: number;
  locationId?: number;
  userMessage: string;
  conversationStage: string;
  currentLeadData: any;
  conversationHistory: any[];
}

/**
 * Extract lead information from user messages using AI
 */
async function extractLeadInfo(userMessage: string, currentData: any, stage?: string): Promise<any> {
  // This would typically call OpenAI or similar to extract structured data
  // For now, we'll implement basic pattern matching
  
  const extracted: any = {};

  // Extract name (look for patterns like "I'm John" or "My name is John Doe")
  // Also accept single words if we're in the contact stage (expecting a name)
  let nameMatch = userMessage.match(/(?:i'm|my name is|call me|i'm called)\s+([A-Za-z]+)(?:\s+([A-Za-z]+))?/i);
  
  if (nameMatch) {
    extracted.firstName = nameMatch[1];
    if (nameMatch[2]) extracted.lastName = nameMatch[2];
  } else if (stage === 'contact' && userMessage.length < 50) {
    // In contact stage, accept a single word or two words as a name
    // This handles cases like "John" or "John Smith"
    const words = userMessage.trim().split(/\s+/).filter(w => /^[A-Za-z]+$/.test(w));
    if (words.length > 0) {
      extracted.firstName = words[0];
      if (words.length > 1) extracted.lastName = words.slice(1).join(' ');
    }
  }

  // Extract email
  const emailMatch = userMessage.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
  if (emailMatch) extracted.email = emailMatch[1];

  // Extract phone
  const phoneMatch = userMessage.match(/(\d{3}[-.\s]?\d{3}[-.\s]?\d{4}|\d{10})/);
  if (phoneMatch) extracted.phone = phoneMatch[1].replace(/[-.\s]/g, '');

  // Extract program interest FIRST (check kickboxing first before karate)
  let programInterestFound = false;
  if (/kickbox|boxing/i.test(userMessage)) {
    extracted.programInterest = 'kickboxing';
    programInterestFound = true;
  } else if (/\b(karate|martial arts|ninja)\b/i.test(userMessage)) {
    extracted.programInterest = 'kids';
    programInterestFound = true;
  }

  // Extract age group keywords (only set programInterest if not already found)
  if (/\b(little|toddler|3|4|5|preschool)\b/i.test(userMessage)) {
    extracted.ageGroup = 'toddler';
    if (!programInterestFound) extracted.programInterest = 'little_ninjas';
  } else if (/\b(teen|teenager|13|14|15|high school)\b/i.test(userMessage)) {
    extracted.ageGroup = 'teen';
    if (!programInterestFound) extracted.programInterest = 'teens';
  } else if (/\b(kid|child|6|7|8|9|10|11|12|elementary|middle school)\b/i.test(userMessage)) {
    extracted.ageGroup = 'child';
    if (!programInterestFound) extracted.programInterest = 'kids';
  } else if (/\b(adult|16|17|18|19|20|30|40|50|60|grown|me|myself)\b/i.test(userMessage)) {
    extracted.ageGroup = 'adult';
    if (!programInterestFound) extracted.programInterest = 'adults';
  }

  // Extract location (any mention of location/city/area/place)
  if (/\b(location|city|area|downtown|uptown|street|place|branch|studio|main|center|dojo)\b/i.test(userMessage)) {
    // Try to extract a specific location name, or just mark as provided
    const locationMatch = userMessage.match(/(?:at|in|location|city|area|downtown|uptown|street|place|branch|studio)\s+([a-zA-Z\s]+?)(?:\.|,|and|prefer|my|phone|$)/i);
    extracted.location = locationMatch ? locationMatch[1].trim() : 'specified';
  }

  // Extract schedule preference
  if (/\b(morning|early|before school)\b/i.test(userMessage)) extracted.schedulePreference = 'morning';
  if (/\b(afternoon|after school|evening|night)\b/i.test(userMessage)) extracted.schedulePreference = 'afternoon';
  if (/\b(weekend|saturday|sunday)\b/i.test(userMessage)) extracted.schedulePreference = 'weekend';

  // Extract goals (check in order of priority)
  if (/\b(confid|self-esteem|confidence|courage|brave)\b/i.test(userMessage)) {
    extracted.goal = 'confidence';
  } else if (/\b(fit|health|exercise|weight)\b/i.test(userMessage)) {
    extracted.goal = 'fitness';
  } else if (/\b(discipline|focus|respect|manners)\b/i.test(userMessage)) {
    extracted.goal = 'discipline';
  } else if (/\b(defense|protect|safe|safety)\b/i.test(userMessage)) {
    extracted.goal = 'self-defense';
  } else if (/\b(compet|tournament|belt|rank)\b/i.test(userMessage)) {
    extracted.goal = 'competition';
  }

  return extracted;
}

/**
 * Determine next conversation stage based on collected data
 */
function determineNextStage(currentStage: string, leadData: any): string {
  switch (currentStage) {
    case 'greeting':
      return leadData.ageGroup ? 'program' : 'age';
    case 'age':
      return leadData.ageGroup ? 'program' : 'age';
    case 'program':
      return leadData.programInterest ? 'location' : 'program';
    case 'location':
      return leadData.location ? 'schedule' : 'location';
    case 'schedule':
      return leadData.schedulePreference ? 'contact' : 'schedule';
    case 'contact':
      return (leadData.phone || leadData.email) ? 'booking' : 'contact';
    case 'booking':
      return 'complete';
    default:
      return 'greeting';
  }
}

/**
 * Generate Kai's response based on conversation stage
 */
function generateKaiResponse(stage: string, leadData: any, userMessage: string): string {
  switch (stage) {
    case 'greeting':
      if (!leadData.ageGroup) {
        return "No worries, I can guide you. Who is this for: a child, teen, or adult?";
      }
      return "Got it! Let me find the perfect program for you. ✅";

    case 'age':
      return "Who is this for: a child, teen, or adult?";

    case 'program':
      const program = leadData.programInterest || 'our programs';
      return `Great! ${program} is an excellent choice. Which location are you closest to?`;

    case 'location':
      return "Which city or location are you closest to?";

    case 'schedule':
      return "What days usually work best for you? (e.g., weekdays, weekends, specific times)";

    case 'contact':
      return "Perfect! What's the best number to text you available intro times?";

    case 'booking':
      const name = leadData.firstName ? `${leadData.firstName}` : 'there';
      return `Want me to reserve your free intro class now, ${name}? It takes 30 seconds. 📅`;

    case 'complete':
      return `Perfect ✅ You're all set. If anything changes, just message me here anytime.`;

    default:
      return "How can I help you today?";
  }
}

/**
 * POST /api/kai/lead-capture
 * Process user message and advance conversation
 */
router.post('/lead-capture', async (req: Request, res: Response) => {
  try {
    const {
      organizationId,
      locationId,
      userMessage,
      conversationStage,
      currentLeadData,
    } = req.body as LeadCaptureRequest;

    if (!organizationId || !userMessage) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Extract lead information from message
    const extractedData = await extractLeadInfo(userMessage, currentLeadData, conversationStage);
    const updatedLeadData = { ...currentLeadData, ...extractedData };
    
    // Debug logging
    if (conversationStage === 'contact') {
      console.log(`[KAI DEBUG] Contact stage - Message: "${userMessage}" | Extracted: ${JSON.stringify(extractedData)} | Updated: ${JSON.stringify(updatedLeadData)}`);
    }

    // Determine next conversation stage
    const nextStage = determineNextStage(conversationStage, updatedLeadData);

    // Generate Kai's response
    const kaiResponse = generateKaiResponse(nextStage, updatedLeadData, userMessage);

    // If lead is complete, save to database
    let leadId = null;
    let capturedLead = null;

    if (nextStage === 'complete' && updatedLeadData.firstName && (updatedLeadData.phone || updatedLeadData.email)) {
      try {
        const db = await getDb();
        const result = await db.insert(leads).values({
          firstName: updatedLeadData.firstName,
          lastName: updatedLeadData.lastName || '',
          email: updatedLeadData.email || null,
          phone: updatedLeadData.phone || null,
          ageGroup: updatedLeadData.ageGroup,
          interestedProgram: updatedLeadData.programInterest,
          locationId: locationId || null,
          organizationId,
          source: 'website_chat',
          status: 'New Lead',
          stage: 'new',
          leadScore: 75, // High score for chat-qualified leads
          message: `Lead captured via Kai chat at ${locationName || 'Unknown Location'}. Goal: ${updatedLeadData.goal || 'Not specified'}. Schedule: ${updatedLeadData.schedulePreference || 'Not specified'}.`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Get the inserted ID from the result
        if (Array.isArray(result) && result.length > 0) {
          leadId = (result[0] as any).insertId || (result[0] as any).id;
        }
        capturedLead = updatedLeadData;
      } catch (dbError) {
        console.error('Error saving lead to database:', dbError);
        // Continue anyway, don't fail the request
      }
    }

    res.json({
      success: true,
      extractedData,
      nextStage,
      kaiResponse,
      leadId,
      capturedLead,
    });
  } catch (error) {
    console.error('Error in lead capture:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

export default router;

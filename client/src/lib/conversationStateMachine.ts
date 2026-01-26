/**
 * Conversation State Machine
 * Manages Kai's conversation flow with stateful logic, validation, and state transitions
 */

export type Intent = 'book_intro' | 'pricing' | 'schedule' | 'general_questions' | null;
export type StudentType = 'child' | 'teen' | 'adult' | null;
export type Program = 'Little Ninjas' | 'Dragon Kids' | 'Teens' | 'Adults' | 'Kickboxing' | null;
export type ConversationStage = 
  | 'INTRO'
  | 'CAPTURE_STUDENT_TYPE'
  | 'CAPTURE_STUDENT_AGE'
  | 'CAPTURE_NAME'
  | 'CAPTURE_SCHEDULE'
  | 'CAPTURE_CONTACT_METHOD'
  | 'CAPTURE_PHONE_OR_EMAIL'
  | 'CONFIRM_LOCATION'
  | 'CONFIRM_BOOKING_INTENT'
  | 'SUCCESS';

export interface ConversationState {
  // User intent
  intent: Intent;
  
  // Student demographics
  studentType: StudentType;
  age: number | null;
  
  // Program selection
  programInterest: Program;
  
  // Schedule preference
  preferredDayTime: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  
  // Contact info
  name: string | null;
  phone: string | null;
  email: string | null;
  preferredContactMethod: 'phone' | 'email' | 'text' | null;
  
  // Location
  locationId: number | null;
  locationSlug: string | null;
  locationName: string | null;
  
  // Conversation tracking
  currentStage: ConversationStage;
  lastAskedField: string | null;
  askedQuestions: Set<string>;
  askedCount: Record<string, number>;
  completionPercentage: number;
}

/**
 * STAGE CONTRACT - Single source of truth for required fields per stage
 * Each stage defines which fields MUST be populated for it to be considered complete
 */
export const STAGE_REQUIREMENTS: Record<ConversationStage, string[]> = {
  'INTRO': ['intent'],
  'CAPTURE_STUDENT_TYPE': ['studentType'],
  'CAPTURE_STUDENT_AGE': ['age'],
  'CAPTURE_NAME': ['name'],
  'CAPTURE_SCHEDULE': ['preferredDate', 'preferredTime'],
  'CAPTURE_CONTACT_METHOD': ['preferredContactMethod'],
  'CAPTURE_PHONE_OR_EMAIL': ['email_or_phone'], // Either email or phone
  'CONFIRM_LOCATION': ['locationId'],
  'CONFIRM_BOOKING_INTENT': [
    'studentType',
    'age',
    'programInterest',
    'name',
    'preferredContactMethod',
    'email_or_phone',
    'locationId',
  ],
  'SUCCESS': [],
};

export const initialState: ConversationState = {
  intent: null,
  studentType: null,
  age: null,
  programInterest: null,
  preferredDayTime: null,
  preferredDate: null,
  preferredTime: null,
  name: null,
  phone: null,
  email: null,
  preferredContactMethod: null,
  locationId: null,
  locationSlug: null,
  locationName: null,
  currentStage: 'INTRO',
  lastAskedField: null,
  askedQuestions: new Set(),
  askedCount: {},
  completionPercentage: 0,
};

/**
 * Validation functions
 */

export function isValidPhone(phone: string): boolean {
  // Accept formatted (555-123-4567) and unformatted (5551234567)
  const phoneRegex = /^(\d{3}[-\.\s]?\d{3}[-\.\s]?\d{4}|\d{10})$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
}

export function isValidEmail(email: string): boolean {
  // Must include @ and domain
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+$/;
  return emailRegex.test(email);
}

export function isValidAge(age: number): boolean {
  return age >= 2 && age <= 99;
}

export function isValidName(name: string): boolean {
  // Non-empty, alphabetic characters and spaces
  return /^[A-Za-z\s]+$/.test(name.trim()) && name.trim().length > 0;
}

/**
 * Hard program mapping rules based on age
 */
export function getProgramForAge(age: number | null): Program {
  if (!age) return null;
  
  if (age >= 3 && age <= 5) return 'Little Ninjas';
  if (age >= 6 && age <= 12) return 'Dragon Kids';
  if (age >= 13 && age <= 15) return 'Teens';
  if (age >= 16) return 'Adults';
  
  return null;
}

/**
 * Natural language extraction utilities
 */

export function extractStudentType(message: string): StudentType | null {
  const lowerMsg = message.toLowerCase();
  
  // Child indicators - includes age-based patterns
  if (/\b(my\s+)?(?:son|daughter|child|kid|kids|little one|toddler)\b|\b(?:my\s+)?(?:\d{1,2})\s+year\s+old\b/i.test(message)) {
    return 'child';
  }
  
  // Teen indicators
  if (/\b(my\s+)?(?:teen|teenager|adolescent)\b|\b(?:my\s+)?(?:13|14|15|16|17|18)\s+year\s+old\b/i.test(message)) {
    return 'teen';
  }
  
  // Adult indicators
  if (/\b(myself|for me|adult|grown.?up|i'm|im)\b/i.test(message)) {
    return 'adult';
  }
  
  return null;
}

export function extractAge(message: string): number | null {
  // Match patterns like "7 years old", "he's 7", "age 7", "my 3yo", "three year old", etc.
  
  // First try numeric patterns: "7", "7 years old", "age 7", "my 3yo"
  const numericMatch = message.match(/(?:age\s+)?(\d{1,2})(?:\s+years?\s+old|yo)?/i);
  if (numericMatch) {
    const age = parseInt(numericMatch[1]);
    if (isValidAge(age)) {
      return age;
    }
  }
  
  // Try word-based ages: "three year old", "five years old", etc.
  const wordAges: Record<string, number> = {
    'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
    'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20
  };
  
  const ageWords = Object.keys(wordAges).join('|');
  const wordMatch = message.match(new RegExp(`\\b(${ageWords})\\s+years?\\s+old\\b`, 'i'));
  if (wordMatch) {
    const age = wordAges[wordMatch[1].toLowerCase()];
    if (isValidAge(age)) {
      return age;
    }
  }
  
  return null;
}

export function extractBookingIntent(message: string): boolean {
  // Priority booking intent detector - triggers when user wants to book a class
  // Matches: book, schedule, reserve, trial, free intro, sign up, enroll, try a class, lesson for my, intro class
  const bookingKeywords = /\b(book|schedule|reserve|trial|free\s+(?:intro|class|trial)|enroll|start|register|try\s+(?:a\s+)?class)\b|\bsign.{0,50}?up\b|\blesson\s+for\s+my\b|\bintro\s+class\b|\bclass\s+for\s+my\b/i;
  
  // Also trigger if user mentions child age + class/lesson in same message
  const childAgeWithClass = /(?:\d{1,2}\s+year\s+old|my\s+(?:son|daughter|child)).*(?:class|lesson|intro)/i.test(message);
  
  return bookingKeywords.test(message) || childAgeWithClass;
}

export function extractPricingIntent(message: string): boolean {
  return /\b(price|cost|fee|how\s+much|rates?|membership|tuition)\b/i.test(message);
}

export function extractScheduleIntent(message: string): boolean {
  return /\b(schedule|times?|hours?|when|days?|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i.test(message);
}

export function extractDayTimePreference(message: string): string | null {
  // Match day preferences
  const dayMatch = message.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|weekday|weekend)\b/i);
  
  // Match time preferences - only match times in specific contexts (not standalone numbers)
  const timeMatch = message.match(/\b(morning|afternoon|evening|night|after\s+school|before\s+school)\b|(?:at\s+|around\s+)?(\d{1,2})\s*(?:am|pm|o'clock|oclock)|\d{1,2}(?:am|pm)/i);
  
  if (dayMatch || timeMatch) {
    return [dayMatch?.[1], timeMatch?.[1] || timeMatch?.[2]].filter(Boolean).join(' ');
  }
  
  return null;
}

export function extractContactMethod(message: string): 'phone' | 'email' | 'text' | null {
  const lowerMsg = message.toLowerCase();
  
  if (/\b(phone|call|text|sms|message)\b/i.test(message)) {
    return /\b(text|sms|message)\b/i.test(message) ? 'text' : 'phone';
  }
  
  if (/\bemail\b/i.test(message)) {
    return 'email';
  }
  
  return null;
}

export function extractEmail(message: string): string | null {
  const emailMatch = message.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
  return emailMatch ? emailMatch[1] : null;
}

export function extractPhone(message: string): string | null {
  const phoneMatch = message.match(/(\d{3}[-\.\s]?\d{3}[-\.\s]?\d{4}|\d{10})/);
  return phoneMatch ? phoneMatch[1] : null;
}

export function extractContactInfo(message: string): { name?: string; phone?: string; email?: string } {
  const result: { name?: string; phone?: string; email?: string } = {};
  
  // Extract name - look for patterns like "I'm John", "My name is John", or just a single word
  const nameMatch = message.match(/(?:i'm|my name is|call me|i'm called)\s+([A-Za-z]+)(?:\s+([A-Za-z]+))?/i);
  if (nameMatch) {
    result.name = nameMatch[1];
    if (nameMatch[2]) {
      result.name = `${nameMatch[1]} ${nameMatch[2]}`;
    }
  } else {
    // Fallback: if message is short and contains only letters/spaces, treat it as a name
    const trimmed = message.trim();
    if (trimmed.length < 50 && /^[A-Za-z\s]+$/.test(trimmed) && trimmed.split(/\s+/).length <= 3) {
      result.name = trimmed;
    }
  }
  
  // Extract phone
  const phone = extractPhone(message);
  if (phone) {
    result.phone = phone;
  }
  
  // Extract email
  const email = extractEmail(message);
  if (email) {
    result.email = email;
  }
  
  return result;
}

/**
 * UNIFIED LEAD SIGNAL EXTRACTION
 * Scans message for ALL possible signals regardless of current state
 * Prevents "I already told you" loops by merging all extracted values
 */
export interface ExtractedLeadSignals {
  email?: string;
  phone?: string;
  age?: number;
  name?: string;
  studentType?: StudentType;
  programInterest?: Program;
  preferredDayTime?: string;
  preferredDate?: string;
  preferredTime?: string;
  preferredContactMethod?: 'phone' | 'email' | 'text';
}

export function extractLeadSignals(message: string): ExtractedLeadSignals {
  const signals: ExtractedLeadSignals = {};
  
  // Extract email - if found, set contact method to email
  const email = extractEmail(message);
  if (email && isValidEmail(email)) {
    signals.email = email;
    signals.preferredContactMethod = 'email';
  }
  
  // Extract phone - if found, set contact method to phone
  const phone = extractPhone(message);
  if (phone && isValidPhone(phone)) {
    signals.phone = phone;
    signals.preferredContactMethod = 'phone';
  }
  
  // Extract age
  const age = extractAge(message);
  if (age) {
    signals.age = age;
  }
  
  // Extract name
  const contactInfo = extractContactInfo(message);
  if (contactInfo.name) {
    signals.name = contactInfo.name;
  }
  
  // Extract student type
  const studentType = extractStudentType(message);
  if (studentType) {
    signals.studentType = studentType;
  }
  
  // Extract contact method keyword (if no email/phone found)
  if (!signals.preferredContactMethod) {
    const contactMethod = extractContactMethod(message);
    if (contactMethod) {
      signals.preferredContactMethod = contactMethod;
    }
  }
  
  // Extract day/time preference
  const dayTime = extractDayTimePreference(message);
  if (dayTime) {
    signals.preferredDayTime = dayTime;
  }
  
  return signals;
}

/**
 * APPLY SIGNALS - Single source of truth
 * Merges extracted signals into state with normalization rules
 * This MUST be called BEFORE routing to next stage
 */
export function applySignals(state: ConversationState, message: string): ConversationState {
  const signals = extractLeadSignals(message);
  const updatedState = { ...state };
  
  // Apply extracted signals
  if (signals.email) updatedState.email = signals.email;
  if (signals.phone) updatedState.phone = signals.phone;
  if (signals.age !== undefined) updatedState.age = signals.age;
  if (signals.name) updatedState.name = signals.name;
  if (signals.studentType) updatedState.studentType = signals.studentType;
  if (signals.preferredContactMethod) updatedState.preferredContactMethod = signals.preferredContactMethod;
  if (signals.preferredDayTime) updatedState.preferredDayTime = signals.preferredDayTime;
  
  // Normalization: if age is set and studentType is missing, infer studentType
  if (updatedState.age !== null && !updatedState.studentType) {
    if (updatedState.age >= 3 && updatedState.age <= 12) {
      updatedState.studentType = 'child';
    } else if (updatedState.age >= 13 && updatedState.age <= 15) {
      updatedState.studentType = 'teen';
    } else if (updatedState.age >= 16) {
      updatedState.studentType = 'adult';
    }
  }
  
  // Normalization: if age is set, automatically set program
  if (updatedState.age !== null) {
    updatedState.programInterest = getProgramForAge(updatedState.age);
  }
  
  // Normalization: if studentType is 'child' but age is in teen range, correct it
  if (updatedState.studentType === 'child' && updatedState.age !== null && updatedState.age >= 13) {
    updatedState.studentType = updatedState.age >= 16 ? 'adult' : 'teen';
    updatedState.programInterest = getProgramForAge(updatedState.age);
  }
  
  return updatedState;
}

/**
 * State completion checking - Uses STAGE_REQUIREMENTS as single source of truth
 */
export function isStageComplete(stage: ConversationStage, state: ConversationState): boolean {
  const requirements = STAGE_REQUIREMENTS[stage];
  
  if (!requirements || requirements.length === 0) {
    return true; // No requirements = stage complete
  }
  
  // Check each required field
  for (const field of requirements) {
    if (field === 'email_or_phone') {
      // Special case: either email or phone required
      if (!state.email && !state.phone) {
        return false;
      }
    } else if (field === 'intent') {
      if (state.intent !== 'book_intro') return false;
    } else if (field === 'studentType') {
      if (!state.studentType) return false;
    } else if (field === 'age') {
      if (state.age === null) return false;
    } else if (field === 'name') {
      if (!state.name) return false;
    } else if (field === 'preferredDate') {
      if (!state.preferredDate) return false;
    } else if (field === 'preferredTime') {
      if (!state.preferredTime) return false;
    } else if (field === 'preferredContactMethod') {
      if (!state.preferredContactMethod) return false;
    } else if (field === 'email') {
      if (!state.email) return false;
    } else if (field === 'phone') {
      if (!state.phone) return false;
    } else if (field === 'locationId') {
      if (!state.locationId) return false;
    } else if (field === 'programInterest') {
      if (!state.programInterest) return false;
    }
  }
  
  return true;
}

/**
 * FIND NEXT INCOMPLETE STAGE
 * Loops forward from current stage until finding an incomplete stage
 * Skips stages that are already answered
 */
export function findNextIncompleteStage(currentStage: ConversationStage, state: ConversationState): ConversationStage {
  const stages: ConversationStage[] = [
    'INTRO',
    'CAPTURE_STUDENT_TYPE',
    'CAPTURE_STUDENT_AGE',
    'CAPTURE_NAME',
    'CAPTURE_SCHEDULE',
    'CAPTURE_CONTACT_METHOD',
    'CAPTURE_PHONE_OR_EMAIL',
    'CONFIRM_BOOKING_INTENT',
    'SUCCESS'
  ];
  
  // Find current stage index
  const currentIndex = stages.indexOf(currentStage);
  
  // Loop forward until we find an incomplete stage
  for (let i = currentIndex; i < stages.length; i++) {
    const stage = stages[i];
    if (!isStageComplete(stage, state)) {
      return stage;
    }
  }
  
  return 'SUCCESS';
}

/**
 * REPEAT-QUESTION BREAKER
 * Prevents asking the same field twice if user's last message contains that field
 * Returns true if we should skip asking about this field
 */
export function shouldSkipQuestion(
  field: string,
  message: string,
  state: ConversationState
): boolean {
  const lowerMsg = message.toLowerCase();
  
  // If we just asked about age and message contains age info, skip asking again
  if (field === 'age') {
    const hasAge = extractAge(message) !== null;
    if (hasAge) return true;
  }
  
  // If we just asked about student type and message contains student type, skip asking again
  if (field === 'studentType') {
    const hasStudentType = extractStudentType(message) !== null;
    if (hasStudentType) return true;
  }
  
  // If we just asked about name and message looks like a name, skip asking again
  if (field === 'name') {
    const contactInfo = extractContactInfo(message);
    if (contactInfo.name) return true;
  }
  
  // If we just asked about contact and message contains email/phone, skip asking again
  if (field === 'contact') {
    const hasEmail = extractEmail(message) !== null;
    const hasPhone = extractPhone(message) !== null;
    if (hasEmail || hasPhone) return true;
  }
  
  // If we just asked about contact method and message specifies it, skip asking again
  if (field === 'contactMethod') {
    const hasContactMethod = extractContactMethod(message) !== null;
    if (hasContactMethod) return true;
  }
  
  // If we just asked about schedule and message contains schedule, skip asking again
  if (field === 'schedule') {
    const hasSchedule = extractDayTimePreference(message) !== null;
    if (hasSchedule) return true;
  }
  
  return false;
}

/**
 * Calculate completion percentage based on captured fields
 */
export function calculateCompletion(state: ConversationState): number {
  let completedFields = 0;
  const totalFields = 7; // intent, studentType, age, name, schedule, contactMethod, contact
  
  if (state.intent) completedFields++;
  if (state.studentType) completedFields++;
  if (state.age !== null) completedFields++;
  if (state.name) completedFields++;
  if (state.preferredDate && state.preferredTime) completedFields++;
  if (state.preferredContactMethod) completedFields++;
  if ((state.preferredContactMethod === 'email' && state.email) || 
      ((state.preferredContactMethod === 'phone' || state.preferredContactMethod === 'text') && state.phone)) {
    completedFields++;
  }
  
  return Math.round((completedFields / totalFields) * 100);
}

/**
 * Get the next stage based on current state
 */
export function getNextStage(currentStage: ConversationStage, state: ConversationState): ConversationStage {
  switch (currentStage) {
    case 'INTRO':
      return 'CAPTURE_STUDENT_TYPE';
    
    case 'CAPTURE_STUDENT_TYPE':
      return 'CAPTURE_STUDENT_AGE';
    
    case 'CAPTURE_STUDENT_AGE':
      return 'CAPTURE_NAME';
    
    case 'CAPTURE_NAME':
      return 'CAPTURE_SCHEDULE';
    
    case 'CAPTURE_SCHEDULE':
      return 'CAPTURE_CONTACT_METHOD';
    
    case 'CAPTURE_CONTACT_METHOD':
      return 'CAPTURE_PHONE_OR_EMAIL';
    
    case 'CAPTURE_PHONE_OR_EMAIL':
      return 'CONFIRM_BOOKING_INTENT';
    
    case 'CONFIRM_LOCATION':
      return 'CONFIRM_BOOKING_INTENT';
    
    case 'CONFIRM_BOOKING_INTENT':
      return 'SUCCESS';
    
    default:
      return 'SUCCESS';
  }
}

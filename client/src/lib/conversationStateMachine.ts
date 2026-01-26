/**
 * Conversation State Machine
 * Manages Kai's conversation flow with stateful logic, validation, and state transitions
 */

export type Intent = 'book_intro' | 'pricing' | 'schedule' | 'general_questions' | null;
export type StudentType = 'child' | 'teen' | 'adult' | null;
export type Program = 'Little Ninjas' | 'Dragon Kids' | 'Teens' | 'Kickboxing' | null;
export type ConversationStage = 
  | 'INTRO'
  | 'CAPTURE_STUDENT_TYPE'
  | 'CAPTURE_STUDENT_AGE'
  | 'CAPTURE_NAME'
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

export const initialState: ConversationState = {
  intent: null,
  studentType: null,
  age: null,
  programInterest: null,
  preferredDayTime: null,
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
  // Match patterns like "7 years old", "he's 7", "age 7", etc.
  const ageMatch = message.match(/(?:age\s+)?(\d{1,2})(?:\s+years?\s+old)?/i);
  if (ageMatch) {
    const age = parseInt(ageMatch[1]);
    if (isValidAge(age)) {
      return age;
    }
  }
  return null;
}

export function extractBookingIntent(message: string): boolean {
  // Match booking-related keywords, including "sign up" with words in between
  return /\b(book|schedule|free\s+(?:intro|class|trial)|enroll|start|register)\b|\bsign.{0,50}?up\b/i.test(message);
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
  if (age !== null) {
    signals.age = age;
    // Auto-suggest program based on age
    signals.programInterest = suggestProgram(age) || undefined;
  }
  
  // Extract student type
  const studentType = extractStudentType(message);
  if (studentType) {
    signals.studentType = studentType;
  }
  
  // Extract name (only if not already extracted as email/phone)
  if (!email && !phone) {
    const contactInfo = extractContactInfo(message);
    if (contactInfo.name && isValidName(contactInfo.name)) {
      signals.name = contactInfo.name;
    }
  }
  
  // Extract day/time preference
  const dayTime = extractDayTimePreference(message);
  if (dayTime) {
    signals.preferredDayTime = dayTime;
  }
  
  // Extract contact method (if not already set by email/phone)
  if (!signals.preferredContactMethod) {
    const method = extractContactMethod(message);
    if (method) {
      signals.preferredContactMethod = method;
    }
  }
  
  return signals;
}

/**
 * Program suggestion based on age
 */
export function suggestProgram(age: number | null): Program | null {
  if (!age) return null;
  
  if (age >= 3 && age <= 5) return 'Little Ninjas';
  if (age >= 6 && age <= 12) return 'Dragon Kids';
  if (age >= 13 && age <= 15) return 'Teens';
  if (age >= 16) return 'Teens';
  
  return null;
}

export function getProgramAgeRange(program: Program): string {
  switch (program) {
    case 'Little Ninjas': return '3–5';
    case 'Dragon Kids': return '6–12';
    case 'Teens': return '13+';
    case 'Kickboxing': return 'All ages';
    default: return '';
  }
}

/**
 * STATE COMPLETION GATING
 * Each state defines required fields and completion check
 */
export interface StateDefinition {
  requiredFields: (keyof ConversationState)[];
  isComplete: (state: ConversationState) => boolean;
  nextStage: ConversationStage;
}

const stateDefinitions: Record<ConversationStage, StateDefinition> = {
  'INTRO': {
    requiredFields: ['intent'],
    isComplete: (state) => state.intent !== null,
    nextStage: 'CAPTURE_STUDENT_TYPE',
  },
  'CAPTURE_STUDENT_TYPE': {
    requiredFields: ['studentType'],
    isComplete: (state) => state.studentType !== null,
    nextStage: 'CAPTURE_STUDENT_AGE',
  },
  'CAPTURE_STUDENT_AGE': {
    requiredFields: ['age'],
    isComplete: (state) => state.age !== null,
    nextStage: 'CAPTURE_NAME',
  },
  'CAPTURE_NAME': {
    requiredFields: ['name'],
    isComplete: (state) => state.name !== null && isValidName(state.name),
    nextStage: 'CAPTURE_CONTACT_METHOD',
  },
  'CAPTURE_CONTACT_METHOD': {
    requiredFields: ['preferredContactMethod', 'email', 'phone'],
    isComplete: (state) => {
      // If both email and phone exist, must have a preference
      if (state.email && state.phone) {
        return state.preferredContactMethod !== null;
      }
      // If only email exists, contact method must be email
      if (state.email) {
        return state.preferredContactMethod === 'email';
      }
      // If only phone exists, contact method must be phone/text
      if (state.phone) {
        return state.preferredContactMethod === 'phone' || state.preferredContactMethod === 'text';
      }
      return false;
    },
    nextStage: 'CONFIRM_LOCATION',
  },
  'CAPTURE_PHONE_OR_EMAIL': {
    requiredFields: ['email', 'phone'],
    isComplete: (state) => (state.email && isValidEmail(state.email)) || (state.phone && isValidPhone(state.phone)),
    nextStage: 'CONFIRM_LOCATION',
  },
  'CONFIRM_LOCATION': {
    requiredFields: ['locationId'],
    isComplete: (state) => state.locationId !== null,
    nextStage: 'CONFIRM_BOOKING_INTENT',
  },
  'CONFIRM_BOOKING_INTENT': {
    requiredFields: [],
    isComplete: (state) => true,
    nextStage: 'SUCCESS',
  },
  'SUCCESS': {
    requiredFields: [],
    isComplete: (state) => true,
    nextStage: 'SUCCESS',
  },
};

export function isStateComplete(state: ConversationState): boolean {
  const definition = stateDefinitions[state.currentStage];
  if (!definition) return false;
  return definition.isComplete(state);
}

export function getStateDefinition(stage: ConversationStage): StateDefinition {
  return stateDefinitions[stage];
}

/**
 * State machine transitions with validation
 */

export function getNextStage(state: ConversationState, userMessage: string): { stage: ConversationStage; validationPassed: boolean } {
  const currentStage = state.currentStage;
  
  // Extract all signals from message
  const signals = extractLeadSignals(userMessage);
  
  switch (currentStage) {
    case 'INTRO':
      if (extractBookingIntent(userMessage)) {
        return { stage: 'CAPTURE_STUDENT_TYPE', validationPassed: true };
      }
      return { stage: 'INTRO', validationPassed: false };
    
    case 'CAPTURE_STUDENT_TYPE': {
      const studentType = signals.studentType || extractStudentType(userMessage);
      if (studentType) {
        if (studentType === 'child' || studentType === 'teen') {
          return { stage: 'CAPTURE_STUDENT_AGE', validationPassed: true };
        }
        return { stage: 'CAPTURE_NAME', validationPassed: true };
      }
      return { stage: 'CAPTURE_STUDENT_TYPE', validationPassed: false };
    }
    
    case 'CAPTURE_STUDENT_AGE': {
      const age = signals.age || extractAge(userMessage);
      if (age !== null && isValidAge(age)) {
        return { stage: 'CAPTURE_NAME', validationPassed: true };
      }
      return { stage: 'CAPTURE_STUDENT_AGE', validationPassed: false };
    }
    
    case 'CAPTURE_NAME': {
      const name = signals.name || extractContactInfo(userMessage).name;
      if (name && isValidName(name)) {
        return { stage: 'CAPTURE_CONTACT_METHOD', validationPassed: true };
      }
      return { stage: 'CAPTURE_NAME', validationPassed: false };
    }
    
    case 'CAPTURE_CONTACT_METHOD': {
      // SMART CONTACT METHOD: Accept email or phone directly
      if (signals.email && isValidEmail(signals.email)) {
        return { stage: 'CONFIRM_LOCATION', validationPassed: true };
      }
      if (signals.phone && isValidPhone(signals.phone)) {
        return { stage: 'CONFIRM_LOCATION', validationPassed: true };
      }
      
      // If both email and phone exist, ask for preference
      if (state.email && state.phone && !state.preferredContactMethod) {
        return { stage: 'CAPTURE_CONTACT_METHOD', validationPassed: false };
      }
      
      // Accept contact method keyword
      const method = signals.preferredContactMethod || extractContactMethod(userMessage);
      if (method) {
        return { stage: 'CAPTURE_PHONE_OR_EMAIL', validationPassed: true };
      }
      
      return { stage: 'CAPTURE_CONTACT_METHOD', validationPassed: false };
    }
    
    case 'CAPTURE_PHONE_OR_EMAIL': {
      if (signals.email && isValidEmail(signals.email)) {
        return { stage: 'CONFIRM_LOCATION', validationPassed: true };
      }
      if (signals.phone && isValidPhone(signals.phone)) {
        return { stage: 'CONFIRM_LOCATION', validationPassed: true };
      }
      return { stage: 'CAPTURE_PHONE_OR_EMAIL', validationPassed: false };
    }
    
    case 'CONFIRM_LOCATION':
      // For now, skip location confirmation if not provided
      return { stage: 'CONFIRM_BOOKING_INTENT', validationPassed: true };
    
    case 'CONFIRM_BOOKING_INTENT':
      return { stage: 'SUCCESS', validationPassed: true };
    
    case 'SUCCESS':
      return { stage: 'SUCCESS', validationPassed: true };
    
    default:
      return { stage: 'INTRO', validationPassed: false };
  }
}

/**
 * Calculate completion percentage
 */
export function calculateCompletion(state: ConversationState): number {
  const weights: Record<ConversationStage, number> = {
    'INTRO': 0,
    'CAPTURE_STUDENT_TYPE': 14,
    'CAPTURE_STUDENT_AGE': 28,
    'CAPTURE_NAME': 42,
    'CAPTURE_CONTACT_METHOD': 56,
    'CAPTURE_PHONE_OR_EMAIL': 70,
    'CONFIRM_LOCATION': 84,
    'CONFIRM_BOOKING_INTENT': 88,
    'SUCCESS': 100,
  };
  
  return weights[state.currentStage] || 0;
}

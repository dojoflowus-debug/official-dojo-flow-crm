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
  const phoneMatch = message.match(/(\d{3}[-\.\s]?\d{3}[-\.\s]?\d{4}|\d{10})/);
  if (phoneMatch) {
    result.phone = phoneMatch[1];
  }
  
  // Extract email
  const emailMatch = message.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
  if (emailMatch) {
    result.email = emailMatch[1];
  }
  
  return result;
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
 * State machine transitions with validation
 */

export function getNextStage(state: ConversationState, userMessage: string): { stage: ConversationStage; validationPassed: boolean } {
  const currentStage = state.currentStage;
  
  switch (currentStage) {
    case 'INTRO':
      if (extractBookingIntent(userMessage)) {
        return { stage: 'CAPTURE_STUDENT_TYPE', validationPassed: true };
      }
      return { stage: 'INTRO', validationPassed: false };
    
    case 'CAPTURE_STUDENT_TYPE': {
      const studentType = extractStudentType(userMessage);
      if (studentType) {
        if (studentType === 'child' || studentType === 'teen') {
          return { stage: 'CAPTURE_STUDENT_AGE', validationPassed: true };
        }
        return { stage: 'CAPTURE_NAME', validationPassed: true };
      }
      return { stage: 'CAPTURE_STUDENT_TYPE', validationPassed: false };
    }
    
    case 'CAPTURE_STUDENT_AGE': {
      const age = extractAge(userMessage);
      if (age !== null && isValidAge(age)) {
        return { stage: 'CAPTURE_NAME', validationPassed: true };
      }
      return { stage: 'CAPTURE_STUDENT_AGE', validationPassed: false };
    }
    
    case 'CAPTURE_NAME': {
      const contactInfo = extractContactInfo(userMessage);
      if (contactInfo.name && isValidName(contactInfo.name)) {
        return { stage: 'CAPTURE_CONTACT_METHOD', validationPassed: true };
      }
      return { stage: 'CAPTURE_NAME', validationPassed: false };
    }
    
    case 'CAPTURE_CONTACT_METHOD': {
      const method = extractContactMethod(userMessage);
      if (method) {
        return { stage: 'CAPTURE_PHONE_OR_EMAIL', validationPassed: true };
      }
      return { stage: 'CAPTURE_CONTACT_METHOD', validationPassed: false };
    }
    
    case 'CAPTURE_PHONE_OR_EMAIL': {
      const contactInfo = extractContactInfo(userMessage);
      const method = state.preferredContactMethod;
      
      if (method === 'phone' || method === 'text') {
        if (contactInfo.phone && isValidPhone(contactInfo.phone)) {
          return { stage: 'CONFIRM_BOOKING_INTENT', validationPassed: true };
        }
      } else if (method === 'email') {
        if (contactInfo.email && isValidEmail(contactInfo.email)) {
          return { stage: 'CONFIRM_BOOKING_INTENT', validationPassed: true };
        }
      }
      return { stage: 'CAPTURE_PHONE_OR_EMAIL', validationPassed: false };
    }
    
    case 'CONFIRM_BOOKING_INTENT':
      return { stage: 'SUCCESS', validationPassed: true };
    
    case 'SUCCESS':
      return { stage: 'SUCCESS', validationPassed: true };
    
    default:
      return { stage: 'INTRO', validationPassed: false };
  }
}

/**
 * Determine next question based on state
 */
export function getNextQuestion(state: ConversationState): string | null {
  // If no intent detected, ask about intent
  if (!state.intent) {
    return 'intent';
  }
  
  // If booking intent and no student type, ask about student type
  if (state.intent === 'book_intro' && !state.studentType) {
    return 'student_type';
  }
  
  // If student type is child/teen and no age, ask age
  if ((state.studentType === 'child' || state.studentType === 'teen') && state.age === null) {
    return 'age';
  }
  
  // If no program interest, ask about program
  if (!state.programInterest) {
    return 'program';
  }
  
  // If booking intent and no day/time preference, ask about schedule
  if (state.intent === 'book_intro' && !state.preferredDayTime) {
    return 'schedule';
  }
  
  // If no name, ask for name
  if (!state.name) {
    return 'name';
  }
  
  // If no contact method, ask for contact method
  if (!state.preferredContactMethod) {
    return 'contact_method';
  }
  
  // If no phone/email, ask for contact
  if (!state.phone && !state.email) {
    return 'contact';
  }
  
  // All required info collected
  return null;
}

/**
 * Calculate completion percentage
 */
export function calculateCompletion(state: ConversationState): number {
  const requiredFields = [
    state.intent,
    state.studentType,
    state.age,
    state.programInterest,
    state.preferredDayTime,
    state.name,
    state.preferredContactMethod,
    state.phone || state.email,
  ];
  
  const filled = requiredFields.filter(Boolean).length;
  return Math.round((filled / requiredFields.length) * 100);
}

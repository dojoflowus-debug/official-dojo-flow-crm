/**
 * Conversation State Machine
 * Manages Kai's conversation flow with stateful logic
 */

export type Intent = 'book_intro' | 'pricing' | 'schedule' | 'general_questions' | null;
export type StudentType = 'child' | 'teen' | 'adult' | null;
export type Program = 'Little Ninjas' | 'Dragon Kids' | 'Teens' | 'Kickboxing' | null;

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
  
  // Location
  locationId: number | null;
  locationSlug: string | null;
  locationName: string | null;
  
  // Conversation tracking
  askedQuestions: Set<string>; // Track which questions have been asked
  completionPercentage: number; // 0-100
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
  locationId: null,
  locationSlug: null,
  locationName: null,
  askedQuestions: new Set(),
  completionPercentage: 0,
};

/**
 * Natural language extraction utilities
 */

export function extractStudentType(message: string): StudentType | null {
  const lowerMsg = message.toLowerCase();
  
  // Child indicators
  if (/\b(my\s+)?(?:son|daughter|child|kid|kids|little one|toddler)\b/i.test(message)) {
    return 'child';
  }
  
  // Teen indicators
  if (/\b(my\s+)?(?:teen|teenager|adolescent|13|14|15|16|17|18)\b/i.test(message)) {
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
    if (age >= 3 && age <= 99) {
      return age;
    }
  }
  return null;
}

export function extractBookingIntent(message: string): boolean {
  return /\b(book|schedule|free\s+(?:intro|class|trial)|sign\s+up|enroll|start|register)\b/i.test(message);
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
  // Match: morning, afternoon, evening, night, after school, before school
  // Match: 5am, 7pm, at 5, 5 oclock, etc.
  const timeMatch = message.match(/\b(morning|afternoon|evening|night|after\s+school|before\s+school)\b|(?:at\s+|around\s+)?(\d{1,2})\s*(?:am|pm|o'clock|oclock)|\d{1,2}(?:am|pm)/i);
  
  if (dayMatch || timeMatch) {
    return [dayMatch?.[1], timeMatch?.[1] || timeMatch?.[2]].filter(Boolean).join(' ');
  }
  
  return null;
}

export function extractContactInfo(message: string): { name?: string; phone?: string; email?: string } {
  const result: { name?: string; phone?: string; email?: string } = {};
  
  // Extract name - look for patterns like "I'm John", "My name is John", or just a single word in contact stage
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
  if (age >= 16) return 'Teens'; // or Kickboxing depending on interest
  
  return null;
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
    state.phone || state.email,
  ];
  
  const filled = requiredFields.filter(Boolean).length;
  return Math.round((filled / requiredFields.length) * 100);
}

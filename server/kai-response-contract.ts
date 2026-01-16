/**
 * Kai Response Contract
 * Enforces hard rules for Kai responses to prevent fragments and weird answers.
 * Ensures every response is complete, helpful, and follows the contract.
 */

import z from 'zod';

export interface SearchResult<T> {
  items: T[];
  total: number;
  query: string;
}

export interface KaiResponseAction {
  label: string;
  action: string;
  icon?: string;
}

export interface KaiResponseCard {
  type: 'student' | 'lead' | 'class' | 'attendance' | 'billing' | 'generic';
  title: string;
  subtitle?: string;
  data: Record<string, any>;
  actions?: KaiResponseAction[];
}

export interface KaiResponse {
  message: string;
  cards?: KaiResponseCard[];
  actions?: KaiResponseAction[];
  nextSteps?: string;
  source?: string; // Module source (Students, Billing, etc.)
  confidence?: number;
}

/**
 * Enforce Response Contract for zero results
 */
export function respondToZeroResults(
  query: string,
  searchType: 'student' | 'lead' | 'class' | 'contact',
  organizationName: string = 'your school'
): KaiResponse {
  const typeLabel = {
    student: 'student',
    lead: 'lead',
    class: 'class',
    contact: 'contact',
  }[searchType];

  const searchActions: KaiResponseAction[] = [
    { label: 'Search by phone', action: 'search_by_phone' },
    { label: 'Search by email', action: 'search_by_email' },
  ];

  if (searchType === 'student') {
    searchActions.push({ label: 'Create new student', action: 'create_student' });
  }

  return {
    message: `I couldn't find a ${typeLabel} named "${query}" in ${organizationName}. Let me help you search another way or create a new record.`,
    actions: searchActions,
    source: 'Students',
  };
}

/**
 * Enforce Response Contract for multiple results
 */
export function respondToMultipleResults<T extends Record<string, any>>(
  results: T[],
  query: string,
  displayFields: string[],
  searchType: 'student' | 'lead' | 'class'
): KaiResponse {
  const maxResults = 5;
  const displayResults = results.slice(0, maxResults);

  const resultSummary = displayResults
    .map((item, idx) => {
      const fields = displayFields.map((field) => item[field]).filter(Boolean).join(' • ');
      return `${idx + 1}. ${fields}`;
    })
    .join('\n');

  return {
    message: `I found ${results.length} matching ${searchType}${results.length > 1 ? 's' : ''}. Which one did you mean?\n\n${resultSummary}`,
    cards: displayResults.map((item) => ({
      type: searchType as any,
      title: item.name || item.title || 'Unnamed',
      subtitle: displayFields.map((f) => item[f]).filter(Boolean).join(' • '),
      data: item,
      actions: [{ label: 'Select', action: `select_${searchType}_${item.id}` }],
    })),
    source: searchType === 'student' ? 'Students' : searchType === 'lead' ? 'Leads' : 'Classes',
  };
}

/**
 * Enforce Response Contract for exact match
 */
export function respondToExactMatch(
  item: Record<string, any>,
  itemType: 'student' | 'lead' | 'class',
  summary: string,
  suggestedActions: KaiResponseAction[]
): KaiResponse {
  const confirmMessage = {
    student: `Opening student profile for ${item.name}…`,
    lead: `Opening lead profile for ${item.name}…`,
    class: `Opening class profile for ${item.name}…`,
  }[itemType];

  const card: KaiResponseCard = {
    type: itemType,
    title: item.name || item.title || 'Unnamed',
    subtitle: summary,
    data: item,
    actions: suggestedActions,
  };

  return {
    message: confirmMessage,
    cards: [card],
    actions: suggestedActions,
    nextSteps: `What would you like to do next?`,
    source: itemType === 'student' ? 'Students' : itemType === 'lead' ? 'Leads' : 'Classes',
  };
}

/**
 * Enforce Response Contract for clarifying questions
 */
export function respondWithClarifyingQuestion(
  question: string,
  options: Array<{ label: string; action: string }>
): KaiResponse {
  return {
    message: question,
    actions: options.slice(0, 2), // Max 2 quick-action buttons
    source: 'Operations',
  };
}

/**
 * Enforce Response Contract for ambiguous/missing data
 */
export function respondToAmbiguousData(
  context: string,
  clarifyingQuestion: string,
  suggestedActions: KaiResponseAction[]
): KaiResponse {
  return {
    message: `${context}\n\n${clarifyingQuestion}`,
    actions: suggestedActions.slice(0, 2),
    source: 'Operations',
  };
}

/**
 * Validate that a response follows the contract
 * Returns true if valid, throws error if not
 */
export function validateKaiResponse(response: KaiResponse): boolean {
  // Rule 1: Message must be non-empty and meaningful
  if (!response.message || response.message.trim().length < 10) {
    throw new Error('Response message is too short or empty. Must be a complete, helpful sentence.');
  }

  // Rule 2: Message must not be a single fragment (name, number, etc.)
  const fragmentPatterns = [
    /^[A-Z][a-z]+ [A-Z][a-z]+$/, // Just a name
    /^\d+$/, // Just a number
    /^[A-Z][a-z]+$/, // Single word
  ];

  if (fragmentPatterns.some((pattern) => pattern.test(response.message))) {
    throw new Error(
      'Response is a fragment. Must be a complete sentence with context and next steps.'
    );
  }

  // Rule 3: If showing records, must have cards
  if (
    response.message.includes('profile') ||
    response.message.includes('found') ||
    response.message.includes('student')
  ) {
    if (!response.cards || response.cards.length === 0) {
      // This is okay for some responses, but warn if it looks like it should have cards
      console.warn('Response mentions records but has no cards. Consider adding structured data.');
    }
  }

  // Rule 4: Must have next steps or actions (unless it's a simple value response)
  if (!response.nextSteps && (!response.actions || response.actions.length === 0)) {
    if (!response.message.includes('?')) {
      // If not a question, should have next steps
      console.warn('Response has no next steps or actions. Consider adding "Want me to…?"');
    }
  }

  return true;
}

/**
 * Format a student card for display
 */
export function formatStudentCard(student: Record<string, any>): KaiResponseCard {
  return {
    type: 'student',
    title: student.name,
    subtitle: `${student.rank || 'No rank'} • ${student.status || 'Active'}`,
    data: {
      rank: student.rank,
      status: student.status,
      joinDate: student.joinDate,
      lastCheckIn: student.lastCheckIn,
      attendanceStreak: student.attendanceStreak,
      membershipStatus: student.membershipStatus,
      alerts: student.alerts || [],
    },
    actions: [
      { label: 'Message parent', action: 'message_parent' },
      { label: 'Mark attendance', action: 'mark_attendance' },
      { label: 'Schedule intro', action: 'schedule_intro' },
      { label: 'Update notes', action: 'update_notes' },
    ],
  };
}

/**
 * Format a lead card for display
 */
export function formatLeadCard(lead: Record<string, any>): KaiResponseCard {
  return {
    type: 'lead',
    title: lead.name,
    subtitle: `${lead.status || 'New'} • ${lead.source || 'Unknown source'}`,
    data: {
      status: lead.status,
      source: lead.source,
      createdAt: lead.createdAt,
      lastContact: lead.lastContact,
      nextFollowUp: lead.nextFollowUp,
      notes: lead.notes,
    },
    actions: [
      { label: 'Schedule intro', action: 'schedule_intro' },
      { label: 'Send message', action: 'send_message' },
      { label: 'Update status', action: 'update_lead_status' },
      { label: 'Add notes', action: 'add_notes' },
    ],
  };
}

/**
 * Format a class card for display
 */
export function formatClassCard(cls: Record<string, any>): KaiResponseCard {
  const utilization = cls.enrolled && cls.capacity ? Math.round((cls.enrolled / cls.capacity) * 100) : 0;

  return {
    type: 'class',
    title: cls.name,
    subtitle: `${cls.level || 'All levels'} • ${cls.enrolled || 0}/${cls.capacity || '?'} students`,
    data: {
      level: cls.level,
      instructor: cls.instructor,
      schedule: cls.schedule,
      enrolled: cls.enrolled,
      capacity: cls.capacity,
      utilization: `${utilization}%`,
      nextClass: cls.nextClass,
    },
    actions: [
      { label: 'View roster', action: 'view_roster' },
      { label: 'Mark attendance', action: 'mark_attendance' },
      { label: 'Send message', action: 'send_class_message' },
    ],
  };
}

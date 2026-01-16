/**
 * Kai Dojo Brain
 * Domain intelligence layer for martial arts school operations.
 * Provides dojo-aware responses and guidance.
 */

export interface DojoBrainContext {
  organizationName?: string;
  userRole?: 'instructor' | 'manager' | 'admin' | 'parent';
}

/**
 * Detect if a question is about training and provide guidance
 */
export function handleTrainingQuestion(question: string, context?: DojoBrainContext): string {
  const trainingKeywords = [
    'technique',
    'form',
    'kata',
    'punch',
    'kick',
    'stance',
    'block',
    'injury',
    'pain',
    'warm up',
    'stretching',
    'conditioning',
    'strength',
    'flexibility',
    'sparring',
    'drill',
  ];

  const isTrainingQuestion = trainingKeywords.some((keyword) =>
    question.toLowerCase().includes(keyword)
  );

  if (!isTrainingQuestion) {
    return '';
  }

  // Check if it's about injuries or form (requires instructor supervision)
  const injuryKeywords = ['injury', 'pain', 'hurt', 'sore', 'ache', 'strain', 'sprain'];
  const formKeywords = ['form', 'technique', 'kata', 'punch', 'kick', 'stance', 'block'];

  if (injuryKeywords.some((kw) => question.toLowerCase().includes(kw))) {
    return `That's an important question. I'd recommend speaking with your instructor about that—they can assess your specific situation and provide personalized guidance. In the meantime, make sure to rest and avoid movements that cause pain.`;
  }

  if (formKeywords.some((kw) => question.toLowerCase().includes(kw))) {
    return `Great question! That's exactly the kind of thing your instructor can help you with. They'll be able to watch your form and give you real-time feedback to help you improve. Don't hesitate to ask them to demonstrate or work with you one-on-one.`;
  }

  return `That's a great training question. I'd recommend asking your instructor for personalized guidance—they know your level and can give you the best advice for your specific goals.`;
}

/**
 * Detect if a question is about curriculum and provide guidance
 */
export function handleCurriculumQuestion(question: string): string {
  const curriculumKeywords = [
    'belt',
    'rank',
    'promotion',
    'test',
    'requirement',
    'curriculum',
    'level',
    'progression',
    'advance',
    'white belt',
    'yellow belt',
    'orange belt',
    'green belt',
    'blue belt',
    'purple belt',
    'brown belt',
    'black belt',
  ];

  const isCurriculumQuestion = curriculumKeywords.some((keyword) =>
    question.toLowerCase().includes(keyword)
  );

  if (!isCurriculumQuestion) {
    return '';
  }

  return `Great question about our belt progression! Each belt level represents a journey of skill development, discipline, and personal growth. The path from white belt to black belt typically involves mastering specific techniques, building strength and flexibility, and developing the mental discipline that martial arts teaches. Your instructor can walk you through the specific requirements for your next belt level and help you create a training plan to get there.`;
}

/**
 * Detect if a question is about operations and provide guidance
 */
export function handleOperationsQuestion(question: string): string {
  const operationsKeywords = [
    'attendance',
    'retention',
    'student',
    'lead',
    'pipeline',
    'conversion',
    'billing',
    'payment',
    'membership',
    'enrollment',
    'schedule',
    'class',
    'intro',
    'trial',
    'follow up',
    'contact',
  ];

  const isOperationsQuestion = operationsKeywords.some((keyword) =>
    question.toLowerCase().includes(keyword)
  );

  return isOperationsQuestion ? 'operations' : '';
}

/**
 * Detect if a question is about safety and provide guidance
 */
export function handleSafetyQuestion(question: string): string {
  const safetyKeywords = [
    'safety',
    'safe',
    'injury prevention',
    'protective gear',
    'equipment',
    'sparring',
    'contact',
    'tap out',
    'injury',
    'emergency',
    'first aid',
    'concussion',
    'warm up',
    'cool down',
  ];

  const isSafetyQuestion = safetyKeywords.some((keyword) =>
    question.toLowerCase().includes(keyword)
  );

  if (!isSafetyQuestion) {
    return '';
  }

  // Check if it's about sparring safety
  if (question.toLowerCase().includes('sparring')) {
    return `For sparring safety, here are the key reminders: Always wear protective gear (headgear, mouthguard, gloves, shin guards). Start with light contact and gradually increase intensity. Tap out immediately if you feel any pain or discomfort. Stay hydrated and take breaks. Make sure an instructor is supervising. Remember, the goal is to learn and improve together, not to hurt each other.`;
  }

  // Check if it's about general safety
  if (question.toLowerCase().includes('safety') || question.toLowerCase().includes('injury')) {
    return `Safety is our top priority. Always warm up properly before training, use correct form to prevent injuries, wear appropriate protective gear, and listen to your body. If you feel pain (not just muscle fatigue), stop and tell an instructor. We're here to help you train smart and stay healthy.`;
  }

  return `That's an important safety question. Please discuss this with your instructor—they can provide specific guidance based on your situation and our school's protocols.`;
}

/**
 * Detect if a question is about retention and provide guidance
 */
export function handleRetentionQuestion(question: string): string {
  const retentionKeywords = [
    'retention',
    'keep',
    'stay',
    'quit',
    'leave',
    'drop out',
    'motivation',
    'interested',
    'engaged',
    'attendance',
    'progress',
  ];

  const isRetentionQuestion = retentionKeywords.some((keyword) =>
    question.toLowerCase().includes(keyword)
  );

  if (!isRetentionQuestion) {
    return '';
  }

  return `Retention is about creating an environment where students feel progress, community, and support. Key strategies include celebrating milestones (belt promotions), maintaining consistent attendance, personalizing feedback, building peer relationships, and helping students see the connection between training and personal growth. If a student is at risk, reach out early with encouragement and support.`;
}

/**
 * Detect if a question is about parent communication and provide guidance
 */
export function handleParentCommunicationQuestion(question: string): string {
  const parentKeywords = [
    'parent',
    'message',
    'communicate',
    'email',
    'contact',
    'update',
    'progress',
    'behavior',
    'attendance',
    'billing',
    'tuition',
  ];

  const isParentQuestion = parentKeywords.some((keyword) =>
    question.toLowerCase().includes(keyword)
  );

  if (!isParentQuestion) {
    return '';
  }

  return `Effective parent communication builds trust and engagement. Share progress updates regularly (especially after belt tests), celebrate achievements, address concerns early, and keep billing and scheduling information clear. A quick message like "Great work in class today!" or "Just checking in—how's training going?" goes a long way in keeping parents invested in their child's journey.`;
}

/**
 * Detect if a question is about intro conversions and provide guidance
 */
export function handleIntroConversionQuestion(question: string): string {
  const introKeywords = [
    'intro',
    'trial',
    'convert',
    'conversion',
    'new student',
    'onboard',
    'first class',
    'welcome',
    'enroll',
    'sign up',
  ];

  const isIntroQuestion = introKeywords.some((keyword) =>
    question.toLowerCase().includes(keyword)
  );

  if (!isIntroQuestion) {
    return '';
  }

  return `A great intro experience is key to conversion. Make sure new students feel welcomed, understand the basics, experience success early, and see the community. Follow up within 24 hours to answer questions and schedule their first real class. Personal attention during the intro builds confidence and excitement.`;
}

/**
 * Classify a question by domain and return appropriate guidance
 */
export function classifyQuestionDomain(
  question: string
): 'training' | 'curriculum' | 'operations' | 'safety' | 'retention' | 'parent' | 'intro' | 'general' {
  if (handleTrainingQuestion(question)) return 'training';
  if (handleCurriculumQuestion(question)) return 'curriculum';
  if (handleOperationsQuestion(question)) return 'operations';
  if (handleSafetyQuestion(question)) return 'safety';
  if (handleRetentionQuestion(question)) return 'retention';
  if (handleParentCommunicationQuestion(question)) return 'parent';
  if (handleIntroConversionQuestion(question)) return 'intro';
  return 'general';
}

/**
 * Get dojo-aware guidance for a question
 */
export function getDojoBrainGuidance(question: string, context?: DojoBrainContext): string {
  const domain = classifyQuestionDomain(question);

  switch (domain) {
    case 'training':
      return handleTrainingQuestion(question, context) || '';
    case 'curriculum':
      return handleCurriculumQuestion(question) || '';
    case 'operations':
      return handleOperationsQuestion(question) || '';
    case 'safety':
      return handleSafetyQuestion(question) || '';
    case 'retention':
      return handleRetentionQuestion(question) || '';
    case 'parent':
      return handleParentCommunicationQuestion(question) || '';
    case 'intro':
      return handleIntroConversionQuestion(question) || '';
    default:
      return '';
  }
}

/**
 * Belt rank progression (for curriculum guidance)
 */
export const BELT_PROGRESSION = [
  { rank: 'White', order: 0, description: 'Foundation and basics' },
  { rank: 'Yellow', order: 1, description: 'Building fundamentals' },
  { rank: 'Orange', order: 2, description: 'Developing technique' },
  { rank: 'Green', order: 3, description: 'Intermediate skills' },
  { rank: 'Blue', order: 4, description: 'Advanced techniques' },
  { rank: 'Purple', order: 5, description: 'Pre-advanced level' },
  { rank: 'Brown', order: 6, description: 'Near mastery' },
  { rank: 'Black', order: 7, description: 'Master level' },
];

/**
 * Get belt information
 */
export function getBeltInfo(rank: string): (typeof BELT_PROGRESSION)[0] | undefined {
  return BELT_PROGRESSION.find((b) => b.rank.toLowerCase() === rank.toLowerCase());
}

/**
 * Get next belt in progression
 */
export function getNextBelt(currentRank: string): (typeof BELT_PROGRESSION)[0] | undefined {
  const current = getBeltInfo(currentRank);
  if (!current) return undefined;
  return BELT_PROGRESSION[current.order + 1];
}

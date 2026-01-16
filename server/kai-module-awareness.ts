/**
 * Kai Module Awareness
 * Tracks current module context and provides module-aware responses
 */

export type KaiModule = 'students' | 'leads' | 'classes' | 'kiosk' | 'billing' | 'reports' | 'operations' | 'unknown';

export interface ModuleInfo {
  id: KaiModule;
  name: string;
  label: string;
  description: string;
  icon?: string;
  color?: string;
  suggestedQueries: string[];
}

export const MODULE_REGISTRY: Record<KaiModule, ModuleInfo> = {
  students: {
    id: 'students',
    name: 'Students',
    label: 'Student Management',
    description: 'View and manage student profiles, attendance, and progress',
    icon: 'users',
    color: 'blue',
    suggestedQueries: [
      'Find a student',
      'Who hasn\'t checked in for 14 days?',
      'Show me at-risk students',
      'List all active students',
    ],
  },
  leads: {
    id: 'leads',
    name: 'Leads',
    label: 'Lead Management',
    description: 'Track prospects and manage the sales pipeline',
    icon: 'target',
    color: 'green',
    suggestedQueries: [
      'Show me hot leads',
      'How many leads are in the pipeline?',
      'Which leads need follow-up?',
      'New leads this week',
    ],
  },
  classes: {
    id: 'classes',
    name: 'Classes',
    label: 'Class Management',
    description: 'View class schedules, rosters, and capacity',
    icon: 'calendar',
    color: 'purple',
    suggestedQueries: [
      'What classes are today?',
      'Show me class capacity',
      'Which classes are full?',
      'List all classes',
    ],
  },
  kiosk: {
    id: 'kiosk',
    name: 'Kiosk',
    label: 'Check-In Activity',
    description: 'View today\'s check-ins and visitor activity',
    icon: 'clipboard',
    color: 'orange',
    suggestedQueries: [
      'Today\'s attendance',
      'Who checked in today?',
      'New visitors this week',
      'Check-in statistics',
    ],
  },
  billing: {
    id: 'billing',
    name: 'Billing',
    label: 'Billing & Payments',
    description: 'Manage payments, invoices, and account status',
    icon: 'credit-card',
    color: 'red',
    suggestedQueries: [
      'Show me overdue accounts',
      'What is our revenue?',
      'Failed payments this month',
      'Billing summary',
    ],
  },
  reports: {
    id: 'reports',
    name: 'Reports',
    label: 'Analytics & Reports',
    description: 'View business metrics and performance reports',
    icon: 'chart-bar',
    color: 'indigo',
    suggestedQueries: [
      'Revenue summary',
      'Attendance trends',
      'Student retention rate',
      'Pipeline conversion',
    ],
  },
  operations: {
    id: 'operations',
    name: 'Operations',
    label: 'Operations Dashboard',
    description: 'Overall school operations and management',
    icon: 'cog',
    color: 'gray',
    suggestedQueries: [
      'School overview',
      'Key metrics',
      'What\'s happening today?',
      'Action items',
    ],
  },
  unknown: {
    id: 'unknown',
    name: 'Unknown',
    label: 'General',
    description: 'General assistance',
    icon: 'help',
    color: 'gray',
    suggestedQueries: [
      'Find a student',
      'Today\'s attendance',
      'Overdue accounts',
      'New leads this week',
    ],
  },
};

/**
 * Detect current module from context
 */
export function detectCurrentModule(
  pathname?: string,
  context?: Record<string, any>
): KaiModule {
  if (!pathname) return 'operations';

  const pathLower = pathname.toLowerCase();

  if (pathLower.includes('/students')) return 'students';
  if (pathLower.includes('/leads')) return 'leads';
  if (pathLower.includes('/classes')) return 'classes';
  if (pathLower.includes('/kiosk')) return 'kiosk';
  if (pathLower.includes('/billing')) return 'billing';
  if (pathLower.includes('/reports')) return 'reports';
  if (pathLower.includes('/operations')) return 'operations';

  return 'operations';
}

/**
 * Get module info
 */
export function getModuleInfo(module: KaiModule): ModuleInfo {
  return MODULE_REGISTRY[module] || MODULE_REGISTRY.unknown;
}

/**
 * Get suggested queries for current module
 */
export function getSuggestedQueries(module: KaiModule): string[] {
  return getModuleInfo(module).suggestedQueries;
}

/**
 * Route a question to the appropriate module
 */
export function routeQuestionToModule(question: string, currentModule: KaiModule): KaiModule {
  const questionLower = question.toLowerCase();

  // Student-related keywords
  if (
    questionLower.includes('student') ||
    questionLower.includes('check in') ||
    questionLower.includes('attendance') ||
    questionLower.includes('rank') ||
    questionLower.includes('belt') ||
    questionLower.includes('progress')
  ) {
    return 'students';
  }

  // Lead-related keywords
  if (
    questionLower.includes('lead') ||
    questionLower.includes('prospect') ||
    questionLower.includes('pipeline') ||
    questionLower.includes('conversion') ||
    questionLower.includes('intro')
  ) {
    return 'leads';
  }

  // Class-related keywords
  if (
    questionLower.includes('class') ||
    questionLower.includes('schedule') ||
    questionLower.includes('roster') ||
    questionLower.includes('capacity') ||
    questionLower.includes('session')
  ) {
    return 'classes';
  }

  // Kiosk-related keywords
  if (
    questionLower.includes('check in') ||
    questionLower.includes('visitor') ||
    questionLower.includes('today') ||
    questionLower.includes('activity')
  ) {
    return 'kiosk';
  }

  // Billing-related keywords
  if (
    questionLower.includes('billing') ||
    questionLower.includes('payment') ||
    questionLower.includes('invoice') ||
    questionLower.includes('revenue') ||
    questionLower.includes('overdue') ||
    questionLower.includes('account')
  ) {
    return 'billing';
  }

  // Reports-related keywords
  if (
    questionLower.includes('report') ||
    questionLower.includes('metric') ||
    questionLower.includes('analytics') ||
    questionLower.includes('trend')
  ) {
    return 'reports';
  }

  // Default to current module
  return currentModule;
}

/**
 * Format module source citation
 */
export function formatModuleSource(module: KaiModule): string {
  const info = getModuleInfo(module);
  return `From your ${info.name} database`;
}

/**
 * Get module routing message
 */
export function getModuleRoutingMessage(fromModule: KaiModule, toModule: KaiModule): string {
  if (fromModule === toModule) {
    return '';
  }

  const toInfo = getModuleInfo(toModule);
  return `Let me pull that from ${toInfo.name}…`;
}

/**
 * Quick-action suggestion chips for Kai chat
 */
export const KAI_QUICK_ACTION_CHIPS: Array<{
  label: string;
  query: string;
  module: KaiModule;
  icon?: string;
}> = [
  {
    label: 'Find a student',
    query: 'Find a student',
    module: 'students',
    icon: 'search',
  },
  {
    label: 'Today\'s attendance',
    query: 'Who checked in today?',
    module: 'kiosk',
    icon: 'clipboard',
  },
  {
    label: 'Overdue accounts',
    query: 'Show me overdue accounts',
    module: 'billing',
    icon: 'alert',
  },
  {
    label: 'New leads this week',
    query: 'How many new leads this week?',
    module: 'leads',
    icon: 'target',
  },
  {
    label: 'Today\'s classes',
    query: 'What classes are today?',
    module: 'classes',
    icon: 'calendar',
  },
];

/**
 * Get relevant quick-action chips for current module
 */
export function getRelevantQuickActions(module: KaiModule): typeof KAI_QUICK_ACTION_CHIPS {
  // Always show all chips, but prioritize current module
  return KAI_QUICK_ACTION_CHIPS.sort((a, b) => {
    if (a.module === module) return -1;
    if (b.module === module) return 1;
    return 0;
  });
}

/**
 * Format a response with module awareness
 */
export function formatModuleAwareResponse(
  message: string,
  module: KaiModule,
  includeSource: boolean = true
): string {
  if (!includeSource) return message;

  const source = formatModuleSource(module);
  return `${source}:\n\n${message}`;
}

/**
 * Kai Message Templates for Setup Wizard
 * Context-aware messages that respond to user selections
 */

import { getAvatarName } from '@/../../shared/utils';

export interface KaiMessage {
  text: string;
  trigger?: 'step' | 'selection' | 'completion';
}

/**
 * Welcome message when wizard loads
 * Always shows "Kai" for new users at the start of setup
 */
export function getWelcomeMessage(): KaiMessage {
  return {
    text: "Welcome to DojoFlow! I'm Kai, your AI business assistant. Click the button below to begin your journey.",
    trigger: 'step'
  };
}

// Legacy export for backward compatibility
export const WELCOME_MESSAGE: KaiMessage = {
  text: "Welcome to DojoFlow! I'm Kai, your AI business assistant. Click the button below to begin your journey.",
  trigger: 'step'
};

/**
 * Voice selection message
 */
export const VOICE_SELECTION_MESSAGE: KaiMessage = {
  text: "Now, let's personalize your experience. Would you like me to speak with a male or female voice? You can change this anytime in settings.",
  trigger: 'step'
};

/**
 * Disclaimer message
 * Always shows "Kai" for new users at the start of setup
 */
export function getDisclaimerMessage(): KaiMessage {
  return {
    text: "Hello! I'm Kai, your AI business assistant. Before we begin, I want to be transparent with you. I'm here to provide guidance based on industry best practices and data analysis, but I'm an artificial intelligence, not a human expert. My recommendations should be reviewed by qualified professionals like accountants or lawyers before implementation. All business decisions are ultimately yours to make. Please read through the terms and conditions, and when you're ready, check the box and let's get started on building your business together!",
    trigger: 'step'
  };
}

// Legacy export for backward compatibility
export const DISCLAIMER_MESSAGE: KaiMessage = {
  text: "Hello! I'm Kai, your AI business assistant. Before we begin, I want to be transparent with you. I'm here to provide guidance based on industry best practices and data analysis, but I'm an artificial intelligence, not a human expert. My recommendations should be reviewed by qualified professionals like accountants or lawyers before implementation. All business decisions are ultimately yours to make. Please read through the terms and conditions, and when you're ready, check the box and let's get started on building your business together!",
  trigger: 'step'
};

/**
 * Industry selection message
 */
export const INDUSTRY_SELECTION_MESSAGE: KaiMessage = {
  text: "Let's begin. Select your industry so I can optimize your environment.",
  trigger: 'step'
};

/**
 * Step 1: Industry Selection Messages
 */
export const INDUSTRY_MESSAGES = {
  step: {
    text: "Let's begin. Select your industry so I can optimize your environment.",
    trigger: 'step'
  },
  selections: {
    'martial-arts': {
      text: "Hi-yah! I see you've chosen martial arts. Excellent choice! Martial arts studios require discipline, structure, and strong community. I'll help you build a system that honors tradition while embracing modern management. Let's continue to brand setup.",
      trigger: 'selection'
    },
    'fitness-gym': {
      text: "Great choice! Fitness gyms are booming, and I'll help you create an environment where members achieve their goals. We'll set up programs, pricing, and automation to keep your gym running smoothly. Let's move to brand identity.",
      trigger: 'selection'
    },
    'yoga-studio': {
      text: "Namaste! Yoga is a wonderful practice that brings peace and wellness to your community. I'll help you create a serene management system that reflects your studio's values. Let's establish your brand next.",
      trigger: 'selection'
    },
    'pilates-barre': {
      text: "Excellent! Pilates and barre are growing fast, and I'll help you build a premium experience for your clients. We'll focus on class scheduling, instructor management, and member engagement. Let's set up your brand.",
      trigger: 'selection'
    },
    'other-studio': {
      text: "Perfect! Let's customize your experience. Whatever your specialty, I'll help you create a management system tailored to your unique needs. Let's start with your brand identity.",
      trigger: 'selection'
    }
  }
};

/**
 * Step 2: Brand Identity Messages
 */
export const BRAND_MESSAGES = {
  step: {
    text: "Great choice! Now let's establish your brand identity. Your brand is how the world will know you—make it memorable.",
    trigger: 'step'
  },
  completion: {
    text: "Fantastic! Your brand identity looks professional and inviting. Now let's set up your physical locations and operating hours.",
    trigger: 'completion'
  }
};

/**
 * Step 3: Locations Messages
 */
export const LOCATION_MESSAGES = {
  step: {
    text: "Tell me about your physical locations and operating hours. This helps members find you and know when you're open.",
    trigger: 'step'
  },
  completion: {
    text: "Perfect! Your locations are configured. Now let's define the programs and services you'll offer to your members.",
    trigger: 'completion'
  }
};

/**
 * Step 4: Programs Messages
 */
export const PROGRAM_MESSAGES = {
  step: {
    text: "What programs and services will you offer? Think about classes, training sessions, and membership tiers that fit your business model.",
    trigger: 'step'
  },
  completion: {
    text: "Excellent program lineup! Now let's set up your pricing structure and payment options to keep revenue flowing smoothly.",
    trigger: 'completion'
  }
};

/**
 * Step 5: Financials Messages
 */
export const FINANCIAL_MESSAGES = {
  step: {
    text: "Let's set up your pricing and payment options. Clear pricing builds trust, and flexible payment options increase conversions.",
    trigger: 'step'
  },
  completion: {
    text: "Great! Your financial structure is solid. Now let's add your team members and define their roles and permissions.",
    trigger: 'completion'
  }
};

/**
 * Step 6: Team Messages
 */
export const TEAM_MESSAGES = {
  step: {
    text: "Who's on your team? Define roles and permissions so everyone knows their responsibilities and has the right access.",
    trigger: 'step'
  },
  completion: {
    text: "Your team is ready! Now let's design the member journey—how I'll guide your members from signup to success.",
    trigger: 'completion'
  }
};

/**
 * Step 7: Member Journey Messages
 */
export const JOURNEY_MESSAGES = {
  step: {
    text: "How should I guide members through their journey? We'll set up automations for onboarding, engagement, and retention.",
    trigger: 'step'
  },
  completion: {
    text: "Brilliant! Your member journey is mapped out. Now let's review everything before we launch your system.",
    trigger: 'completion'
  }
};

/**
 * Step 8: Review & Launch Messages
 */
export const REVIEW_MESSAGES = {
  step: {
    text: "Perfect! Review your setup and let's launch. Take a moment to verify everything looks good, then we'll activate your system.",
    trigger: 'step'
  },
  completion: {
    text: "Congratulations! Your system is live! I'm excited to help you grow your business. You can now access your dashboard and start managing members, classes, and more. Welcome to DojoFlow!",
    trigger: 'completion'
  }
};

/**
 * Get message for specific step
 */
export function getStepMessage(step: number): string {
  const messages = [
    INDUSTRY_MESSAGES.step.text,
    BRAND_MESSAGES.step.text,
    LOCATION_MESSAGES.step.text,
    PROGRAM_MESSAGES.step.text,
    FINANCIAL_MESSAGES.step.text,
    TEAM_MESSAGES.step.text,
    JOURNEY_MESSAGES.step.text,
    REVIEW_MESSAGES.step.text
  ];
  return messages[step - 1] || '';
}

/**
 * Get industry-specific message
 */
export function getIndustryMessage(industry: string): string {
  const industryKey = industry.toLowerCase().replace(/\s+/g, '-');
  const message = INDUSTRY_MESSAGES.selections[industryKey as keyof typeof INDUSTRY_MESSAGES.selections];
  return message?.text || INDUSTRY_MESSAGES.step.text;
}

/**
 * Get completion message for step
 */
export function getCompletionMessage(step: number): string {
  const completionMessages = [
    '', // Step 1 uses industry-specific messages
    BRAND_MESSAGES.completion.text,
    LOCATION_MESSAGES.completion.text,
    PROGRAM_MESSAGES.completion.text,
    FINANCIAL_MESSAGES.completion.text,
    TEAM_MESSAGES.completion.text,
    JOURNEY_MESSAGES.completion.text,
    REVIEW_MESSAGES.completion.text
  ];
  return completionMessages[step - 1] || '';
}

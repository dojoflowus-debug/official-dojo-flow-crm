/**
 * Kai Contextual Training System — Tutorial Registry
 *
 * Defines every tutorial module, its steps, and the smart toolbar
 * command mappings. This is the single source of truth for all
 * guided walkthroughs across the app.
 */

export type TutorialModule =
  | "students"
  | "leads"
  | "classes"
  | "billing"
  | "kiosk";

export interface TutorialStep {
  /** Unique step id within the module */
  id: string;
  /** Short label shown in progress */
  label: string;
  /** Kai's message for this step — warm, brief, human */
  kaiMessage: string;
  /**
   * CSS selector or data-tutorial-id attribute to spotlight.
   * If null the step is purely conversational (no highlight).
   */
  targetSelector: string | null;
  /**
   * Where to position the tooltip relative to the target.
   * Defaults to "bottom".
   */
  tooltipPosition?: "top" | "bottom" | "left" | "right";
  /**
   * If true, Kai will auto-click the target after showing the tooltip.
   * Use sparingly — only for buttons that open forms.
   */
  autoClick?: boolean;
  /**
   * Optional action key that this step triggers.
   * Used by the smart toolbar command parser.
   */
  action?: string;
}

export interface TutorialDefinition {
  module: TutorialModule;
  /** Route prefix that activates this tutorial */
  routePrefix: string;
  title: string;
  /** Kai's intro message before the first step */
  introMessage: string;
  /** Kai's completion message after the last step */
  completionMessage: string;
  steps: TutorialStep[];
}

// ─── STUDENTS MODULE ──────────────────────────────────────────────────────────

const studentsTutorial: TutorialDefinition = {
  module: "students",
  routePrefix: "/students",
  title: "Students",
  introMessage:
    "Let's get your first student in — this takes about 10 seconds. I'll walk you through it.",
  completionMessage:
    "Done. Your student is in the system 🥋 Want to move on to leads or classes next?",
  steps: [
    {
      id: "students_open_add",
      label: "Add Student",
      kaiMessage:
        "See that '+ Add Student' button up top? Click it — I've got you.",
      targetSelector: "[data-tutorial-id='add-student-btn']",
      tooltipPosition: "bottom",
      autoClick: false,
      action: "create_student",
    },
    {
      id: "students_fill_name",
      label: "Enter Name",
      kaiMessage:
        "Type in their first and last name. Keep it simple for now — you can always edit later.",
      targetSelector: "[data-tutorial-id='student-name-field']",
      tooltipPosition: "right",
    },
    {
      id: "students_fill_contact",
      label: "Contact Info",
      kaiMessage:
        "Phone or email — just one is enough to get started. This is how you'll reach them.",
      targetSelector: "[data-tutorial-id='student-contact-field']",
      tooltipPosition: "right",
    },
    {
      id: "students_fill_belt",
      label: "Belt Level",
      kaiMessage:
        "Pick their current belt. White belt if they're brand new — no shame in that.",
      targetSelector: "[data-tutorial-id='student-belt-field']",
      tooltipPosition: "right",
    },
    {
      id: "students_submit",
      label: "Save",
      kaiMessage: "Hit Save. That's it. Student added.",
      targetSelector: "[data-tutorial-id='student-save-btn']",
      tooltipPosition: "top",
      action: "submit_student",
    },
  ],
};

// ─── LEADS MODULE ─────────────────────────────────────────────────────────────

const leadsTutorial: TutorialDefinition = {
  module: "leads",
  routePrefix: "/leads",
  title: "Leads",
  introMessage:
    "This is your pipeline — where new people become members. Let me show you how to add your first lead.",
  completionMessage:
    "Nice. That lead is in your pipeline. Want me to show you how to send a follow-up or convert them?",
  steps: [
    {
      id: "leads_open_add",
      label: "Add Lead",
      kaiMessage: "Hit '+ Add Lead' to get started. Takes 30 seconds.",
      targetSelector: "[data-tutorial-id='add-lead-btn']",
      tooltipPosition: "bottom",
      autoClick: false,
      action: "create_lead",
    },
    {
      id: "leads_fill_name",
      label: "Name & Contact",
      kaiMessage:
        "Name and phone number — that's all you need. Everything else is optional.",
      targetSelector: "[data-tutorial-id='lead-name-field']",
      tooltipPosition: "right",
    },
    {
      id: "leads_fill_source",
      label: "Lead Source",
      kaiMessage:
        "Where did they come from? Instagram, walk-in, referral? This helps you know what's working.",
      targetSelector: "[data-tutorial-id='lead-source-field']",
      tooltipPosition: "right",
    },
    {
      id: "leads_submit",
      label: "Save",
      kaiMessage: "Save it. They're in your pipeline now.",
      targetSelector: "[data-tutorial-id='lead-save-btn']",
      tooltipPosition: "top",
      action: "submit_lead",
    },
    {
      id: "leads_convert",
      label: "Convert Lead",
      kaiMessage:
        "When they're ready to enroll, hit 'Convert' on their card. Kai will walk you through it.",
      targetSelector: "[data-tutorial-id='lead-convert-btn']",
      tooltipPosition: "left",
      action: "convert_lead",
    },
  ],
};

// ─── CLASSES MODULE ───────────────────────────────────────────────────────────

const classesTutorial: TutorialDefinition = {
  module: "classes",
  routePrefix: "/classes",
  title: "Classes",
  introMessage:
    "Let's build your class schedule. I'll show you how to create your first class — it's fast.",
  completionMessage:
    "Your class is live. Students can now check in. Want to set up recurring classes or assign an instructor?",
  steps: [
    {
      id: "classes_open_add",
      label: "Create Class",
      kaiMessage: "Click '+ New Class' to get your schedule started.",
      targetSelector: "[data-tutorial-id='add-class-btn']",
      tooltipPosition: "bottom",
      autoClick: false,
      action: "create_class",
    },
    {
      id: "classes_fill_name",
      label: "Class Name",
      kaiMessage:
        "What's the class called? 'Beginner Karate', 'Kids BJJ', whatever fits your dojo.",
      targetSelector: "[data-tutorial-id='class-name-field']",
      tooltipPosition: "right",
    },
    {
      id: "classes_fill_time",
      label: "Day & Time",
      kaiMessage:
        "Pick the day and time. You can add recurring days after — one at a time for now.",
      targetSelector: "[data-tutorial-id='class-time-field']",
      tooltipPosition: "right",
    },
    {
      id: "classes_fill_instructor",
      label: "Instructor",
      kaiMessage:
        "Assign an instructor if you have one set up. You can skip this and add them later.",
      targetSelector: "[data-tutorial-id='class-instructor-field']",
      tooltipPosition: "right",
    },
    {
      id: "classes_submit",
      label: "Save",
      kaiMessage: "Save it. Class is on the schedule.",
      targetSelector: "[data-tutorial-id='class-save-btn']",
      tooltipPosition: "top",
      action: "submit_class",
    },
  ],
};

// ─── BILLING MODULE ───────────────────────────────────────────────────────────

const billingTutorial: TutorialDefinition = {
  module: "billing",
  routePrefix: "/billing",
  title: "Billing",
  introMessage:
    "Let's get your billing set up. I'll walk you through adding a payment method and charging a member.",
  completionMessage:
    "Billing is live. Your dojo is now collecting payments. Want to set up auto-billing for recurring members?",
  steps: [
    {
      id: "billing_payment_method",
      label: "Payment Method",
      kaiMessage:
        "First, let's connect your payment processor. Click 'Set Up Payments' to get started.",
      targetSelector: "[data-tutorial-id='billing-setup-btn']",
      tooltipPosition: "bottom",
      action: "setup_billing",
    },
    {
      id: "billing_add_plan",
      label: "Create a Plan",
      kaiMessage:
        "Create a billing plan — monthly, yearly, or drop-in. This is what your members will pay.",
      targetSelector: "[data-tutorial-id='billing-add-plan-btn']",
      tooltipPosition: "bottom",
      action: "create_billing_plan",
    },
    {
      id: "billing_charge_member",
      label: "Charge a Member",
      kaiMessage:
        "Find a student and assign them a plan. That's how you start collecting.",
      targetSelector: "[data-tutorial-id='billing-charge-btn']",
      tooltipPosition: "left",
      action: "charge_member",
    },
    {
      id: "billing_view_invoices",
      label: "View Invoices",
      kaiMessage:
        "Here's where all your invoices live. You can see paid, pending, and overdue at a glance.",
      targetSelector: "[data-tutorial-id='billing-invoices-tab']",
      tooltipPosition: "bottom",
    },
  ],
};

// ─── KIOSK MODULE ─────────────────────────────────────────────────────────────

const kioskTutorial: TutorialDefinition = {
  module: "kiosk",
  routePrefix: "/kiosk-studio",
  title: "Kiosk",
  introMessage:
    "Let's set up your check-in kiosk. Students will use this to sign in when they arrive.",
  completionMessage:
    "Kiosk is live. Students can now check in on their own. Want to set up a QR code for faster check-in?",
  steps: [
    {
      id: "kiosk_enable_checkin",
      label: "Enable Check-In",
      kaiMessage:
        "Turn on check-in for your location. This activates the kiosk for your dojo.",
      targetSelector: "[data-tutorial-id='kiosk-enable-btn']",
      tooltipPosition: "bottom",
      action: "enable_kiosk",
    },
    {
      id: "kiosk_assign_classes",
      label: "Assign Classes",
      kaiMessage:
        "Pick which classes show up on the kiosk. Students will check in to these.",
      targetSelector: "[data-tutorial-id='kiosk-classes-field']",
      tooltipPosition: "right",
      action: "assign_kiosk_classes",
    },
    {
      id: "kiosk_setup_qr",
      label: "QR Code",
      kaiMessage:
        "Generate a QR code. Students scan it with their phone — instant check-in.",
      targetSelector: "[data-tutorial-id='kiosk-qr-btn']",
      tooltipPosition: "bottom",
      action: "setup_qr",
    },
  ],
};

// ─── Registry ─────────────────────────────────────────────────────────────────

export const TUTORIAL_REGISTRY: Record<TutorialModule, TutorialDefinition> = {
  students: studentsTutorial,
  leads: leadsTutorial,
  classes: classesTutorial,
  billing: billingTutorial,
  kiosk: kioskTutorial,
};

/**
 * Detect which tutorial module is active based on a pathname.
 */
export function detectModule(pathname: string): TutorialModule | null {
  const entries = Object.values(TUTORIAL_REGISTRY);
  for (const def of entries) {
    if (pathname.startsWith(def.routePrefix)) return def.module;
  }
  return null;
}

// ─── Smart Command Map ────────────────────────────────────────────────────────

/**
 * Maps natural-language toolbar commands to action keys.
 * The action key is then matched against tutorial step actions.
 */
export const SMART_COMMANDS: Array<{
  patterns: string[];
  action: string;
  module: TutorialModule;
  label: string;
}> = [
  // Students
  {
    patterns: ["add student", "new student", "create student", "add member", "new member"],
    action: "create_student",
    module: "students",
    label: "Add a new student",
  },
  {
    patterns: ["edit student", "update student", "change student"],
    action: "edit_student",
    module: "students",
    label: "Edit a student",
  },
  {
    patterns: ["check attendance", "take attendance", "mark attendance"],
    action: "check_attendance",
    module: "students",
    label: "Check attendance",
  },
  // Leads
  {
    patterns: ["add lead", "new lead", "create lead", "add prospect"],
    action: "create_lead",
    module: "leads",
    label: "Add a new lead",
  },
  {
    patterns: ["convert lead", "enroll lead", "convert prospect"],
    action: "convert_lead",
    module: "leads",
    label: "Convert a lead to student",
  },
  {
    patterns: ["follow up", "send follow-up", "follow-up lead"],
    action: "followup_lead",
    module: "leads",
    label: "Send a follow-up",
  },
  // Classes
  {
    patterns: ["add class", "new class", "create class", "schedule class"],
    action: "create_class",
    module: "classes",
    label: "Create a new class",
  },
  {
    patterns: ["assign instructor", "set instructor"],
    action: "assign_instructor",
    module: "classes",
    label: "Assign an instructor",
  },
  {
    patterns: ["recurring class", "repeat class", "schedule recurring"],
    action: "recurring_class",
    module: "classes",
    label: "Set up a recurring class",
  },
  // Billing
  {
    patterns: ["add payment", "payment method", "set up billing", "setup billing"],
    action: "setup_billing",
    module: "billing",
    label: "Set up billing",
  },
  {
    patterns: ["charge member", "charge student", "bill member"],
    action: "charge_member",
    module: "billing",
    label: "Charge a member",
  },
  {
    patterns: ["view invoices", "show invoices", "billing history"],
    action: "view_invoices",
    module: "billing",
    label: "View invoices",
  },
  // Kiosk
  {
    patterns: ["enable kiosk", "set up kiosk", "kiosk check-in", "enable checkin"],
    action: "enable_kiosk",
    module: "kiosk",
    label: "Enable kiosk check-in",
  },
  {
    patterns: ["qr code", "setup qr", "generate qr"],
    action: "setup_qr",
    module: "kiosk",
    label: "Set up QR code",
  },
];

/**
 * Parse a toolbar input string and return the matching action + module, or null.
 */
export function parseSmartCommand(input: string): {
  action: string;
  module: TutorialModule;
  label: string;
} | null {
  const lower = input.toLowerCase().trim();
  for (const cmd of SMART_COMMANDS) {
    if (cmd.patterns.some((p) => lower.includes(p))) {
      return { action: cmd.action, module: cmd.module, label: cmd.label };
    }
  }
  return null;
}

import { int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).unique(),
  /** OAuth provider name (google, facebook, apple) */
  provider: varchar("provider", { length: 64 }),
  /** Provider-specific user ID (unique per provider) */
  providerId: varchar("providerId", { length: 255 }),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  /** Password hash for local authentication (bcrypt) */
  password: varchar("password", { length: 255 }),
  /** Password reset token */
  resetToken: varchar("resetToken", { length: 255 }),
  /** Password reset token expiry */
  resetTokenExpiry: timestamp("resetTokenExpiry"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "owner", "staff"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Staff PINs table for kiosk access control
 * Stores hashed PINs for staff members to access the CRM dashboard
 */
export const staffPins = mysqlTable("staff_pins", {
  id: int("id").autoincrement().primaryKey(),
  /** Staff member name for identification */
  name: varchar("name", { length: 255 }).notNull(),
  /** Hashed PIN (bcrypt) - never store plain text */
  pinHash: varchar("pinHash", { length: 255 }).notNull(),
  /** Whether this PIN is currently active */
  isActive: int("isActive").default(1).notNull(),
  /** Optional role for future role-based access */
  role: varchar("role", { length: 50 }).default("staff"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastUsed: timestamp("lastUsed"),
});

export type StaffPin = typeof staffPins.$inferSelect;
export type InsertStaffPin = typeof staffPins.$inferInsert;

/**
 * Students table - Core student information
 */
export const students = mysqlTable("students", {
  id: int("id").autoincrement().primaryKey(),
  firstName: varchar("firstName", { length: 255 }).notNull(),
  lastName: varchar("lastName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  dateOfBirth: timestamp("dateOfBirth"),
  age: int("age"), // Deprecated - kept for backward compatibility, use dateOfBirth instead
  beltRank: varchar("beltRank", { length: 100 }),
  status: mysqlEnum("status", ["Active", "Inactive", "On Hold"]).default("Active").notNull(),
  membershipStatus: varchar("membershipStatus", { length: 100 }),
  photoUrl: varchar("photoUrl", { length: 500 }),
  program: varchar("program", { length: 100 }),
  streetAddress: varchar("streetAddress", { length: 255 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zipCode: varchar("zipCode", { length: 20 }),
  // Geocoded coordinates for map display
  latitude: varchar("latitude", { length: 20 }),
  longitude: varchar("longitude", { length: 20 }),
  // Parent/Guardian information (for students under 18)
  guardianName: varchar("guardianName", { length: 255 }),
  guardianRelationship: varchar("guardianRelationship", { length: 50 }),
  guardianPhone: varchar("guardianPhone", { length: 20 }),
  guardianEmail: varchar("guardianEmail", { length: 320 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Student = typeof students.$inferSelect;
export type InsertStudent = typeof students.$inferInsert;

/**
 * Classes table - Martial arts classes schedule
 */
export const classes = mysqlTable("classes", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  time: varchar("time", { length: 50 }).notNull(),
  enrolled: int("enrolled").default(0).notNull(),
  capacity: int("capacity").default(20).notNull(),
  instructor: varchar("instructor", { length: 255 }), // Deprecated - kept for backward compatibility
  instructorId: int("instructorId"), // Foreign key to teamMembers table
  dayOfWeek: varchar("dayOfWeek", { length: 20 }),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Class = typeof classes.$inferSelect;
export type InsertClass = typeof classes.$inferInsert;

/**
 * Kiosk check-ins table - Track student attendance
 */
export const kioskCheckIns = mysqlTable("kiosk_check_ins", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId"),
  studentName: varchar("studentName", { length: 255 }).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type KioskCheckIn = typeof kioskCheckIns.$inferSelect;
export type InsertKioskCheckIn = typeof kioskCheckIns.$inferInsert;

/**
 * Kiosk visitors table - Track new visitors
 */
export const kioskVisitors = mysqlTable("kiosk_visitors", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type KioskVisitor = typeof kioskVisitors.$inferSelect;
export type InsertKioskVisitor = typeof kioskVisitors.$inferInsert;

/**
 * Kiosk waivers table - Track waiver sign-ups
 */
export const kioskWaivers = mysqlTable("kiosk_waivers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  signed: int("signed").default(1).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type KioskWaiver = typeof kioskWaivers.$inferSelect;
export type InsertKioskWaiver = typeof kioskWaivers.$inferInsert;

/**
 * Leads table - Track potential students
 */
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  firstName: varchar("firstName", { length: 255 }).notNull(),
  lastName: varchar("lastName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  status: mysqlEnum("status", [
    "New Lead",
    "Attempting Contact",
    "Contact Made",
    "Intro Scheduled",
    "Offer Presented",
    "Enrolled",
    "Nurture",
    "Lost/Winback"
  ]).default("New Lead").notNull(),
  source: varchar("source", { length: 100 }),
  notes: text("notes"),
  message: text("message"),
  // UTM tracking parameters
  utmSource: varchar("utmSource", { length: 255 }),
  utmMedium: varchar("utmMedium", { length: 255 }),
  utmCampaign: varchar("utmCampaign", { length: 255 }),
  utmContent: varchar("utmContent", { length: 255 }),
  utmTerm: varchar("utmTerm", { length: 255 }),
  // Address fields for map functionality
  address: varchar("address", { length: 255 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zipCode: varchar("zipCode", { length: 20 }),
  lat: varchar("lat", { length: 50 }),
  lng: varchar("lng", { length: 50 }),
  // Lead scoring
  leadScore: int("leadScore").default(50).notNull(),
  leadScoreUpdatedAt: timestamp("leadScoreUpdatedAt").defaultNow(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

/**
 * Lead Sources table - Track enabled/disabled lead capture sources
 */
export const leadSources = mysqlTable("lead_sources", {
  id: int("id").autoincrement().primaryKey(),
  /** Unique identifier for the source (e.g., 'website_form', 'chat_widget') */
  sourceKey: varchar("sourceKey", { length: 100 }).notNull().unique(),
  /** Display name for the source */
  name: varchar("name", { length: 255 }).notNull(),
  /** Icon name from lucide-react (e.g., 'Globe', 'MessageSquare') */
  icon: varchar("icon", { length: 100 }).notNull(),
  /** Whether this source is currently enabled */
  enabled: int("enabled").default(1).notNull(),
  /** Display order in settings UI */
  displayOrder: int("displayOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LeadSource = typeof leadSources.$inferSelect;
export type InsertLeadSource = typeof leadSources.$inferInsert;

/**
 * Dojo Settings table - Store school/dojo configuration
 * Single-row table (id=1) for global settings
 */
export const dojoSettings = mysqlTable("dojo_settings", {
  id: int("id").autoincrement().primaryKey(),
  
  // Step 1: Industry & Template
  industry: mysqlEnum("industry", ["martial_arts", "fitness", "yoga", "pilates", "other"]),
  businessModel: mysqlEnum("businessModel", ["inside_gym", "standalone", "mobile", "online_hybrid"]),
  usePreset: int("usePreset").default(1),
  
  // Step 2: Business Basics & Brand Identity
  businessName: varchar("businessName", { length: 255 }),
  dbaName: varchar("dbaName", { length: 255 }),
  operatorName: varchar("operatorName", { length: 255 }),
  preferredName: varchar("preferredName", { length: 255 }),
  pronounsTone: mysqlEnum("pronounsTone", ["formal", "casual", "energetic", "calm"]),
  timezone: varchar("timezone", { length: 100 }).default("America/New_York"),
  primaryColor: varchar("primaryColor", { length: 20 }),
  secondaryColor: varchar("secondaryColor", { length: 20 }),
  logoSquare: varchar("logoSquare", { length: 500 }),
  logoHorizontal: varchar("logoHorizontal", { length: 500 }),
  // Theme-aware logos
  logoDarkUrl: varchar("logoDarkUrl", { length: 500 }), // For light mode (dark logo on light bg)
  logoLightUrl: varchar("logoLightUrl", { length: 500 }), // For dark mode (light logo on dark bg)
  
  // Step 5: Money, Targets & Constraints
  monthlyRent: int("monthlyRent"),
  monthlyUtilities: int("monthlyUtilities"),
  monthlyPayroll: int("monthlyPayroll"),
  monthlyMarketing: int("monthlyMarketing"),
  currentMembers: int("currentMembers"),
  revenueGoal: int("revenueGoal"),
  maxClassSize: int("maxClassSize").default(20),
  nonNegotiables: text("nonNegotiables"),
  focusSlider: int("focusSlider").default(50), // 0=stability, 100=aggressive growth
  riskComfort: int("riskComfort").default(50), // 0=strict, 100=flexible
  
  // Legacy fields (kept for backward compatibility)
  schoolName: varchar("schoolName", { length: 255 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactPhone: varchar("contactPhone", { length: 20 }),
  website: varchar("website", { length: 500 }),
  instructorTitle: varchar("instructorTitle", { length: 50 }),
  instructorFirstName: varchar("instructorFirstName", { length: 255 }),
  instructorLastName: varchar("instructorLastName", { length: 255 }),
  martialArtsStyle: varchar("martialArtsStyle", { length: 100 }),
  addressLine1: varchar("addressLine1", { length: 255 }),
  addressLine2: varchar("addressLine2", { length: 255 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  zipCode: varchar("zipCode", { length: 20 }),
  country: varchar("country", { length: 100 }).default("United States"),
  weatherApiKey: varchar("weatherApiKey", { length: 255 }),
  enableWeatherAlerts: int("enableWeatherAlerts").default(1),
  hasOutdoorClasses: int("hasOutdoorClasses").default(0),
  heatIndexThreshold: int("heatIndexThreshold").default(95),
  airQualityThreshold: int("airQualityThreshold").default(150),
  paymentProvider: varchar("paymentProvider", { length: 50 }),
  stripeApiKey: varchar("stripeApiKey", { length: 255 }),
  stripePublishableKey: varchar("stripePublishableKey", { length: 255 }),
  stripeWebhookSecret: varchar("stripeWebhookSecret", { length: 255 }),
  squareAccessToken: varchar("squareAccessToken", { length: 255 }),
  squareLocationId: varchar("squareLocationId", { length: 255 }),
  
  // Step 9: Payment Processor Setup
  paymentProcessor: mysqlEnum("paymentProcessor", ["stripe", "square", "clover", "pc_bancard", "none"]).default("stripe"),
  paymentApiKey: varchar("paymentApiKey", { length: 500 }),
  paymentMerchantId: varchar("paymentMerchantId", { length: 500 }),
  paymentSetupLater: int("paymentSetupLater").default(0),
  
  // Communication Settings (Twilio SMS)
  twilioAccountSid: varchar("twilioAccountSid", { length: 255 }),
  twilioAuthToken: varchar("twilioAuthToken", { length: 255 }),
  twilioPhoneNumber: varchar("twilioPhoneNumber", { length: 20 }),
  enableSmsForLeads: int("enableSmsForLeads").default(0),
  
  // Communication Settings (Email)
  emailProvider: mysqlEnum("emailProvider", ["sendgrid", "smtp"]).default("sendgrid"),
  senderEmail: varchar("senderEmail", { length: 320 }),
  sendgridApiKey: varchar("sendgridApiKey", { length: 500 }),
  smtpHost: varchar("smtpHost", { length: 255 }),
  smtpPort: int("smtpPort"),
  smtpUser: varchar("smtpUser", { length: 255 }),
  smtpPassword: varchar("smtpPassword", { length: 500 }),
  enableEmailForLeads: int("enableEmailForLeads").default(0),
  
  // Staff Notification Settings
  notifyStaffOnNewLead: int("notifyStaffOnNewLead").default(1),
  staffNotificationMethod: mysqlEnum("staffNotificationMethod", ["sms", "email", "both"]).default("both"),
  staffNotificationPhone: varchar("staffNotificationPhone", { length: 20 }),
  staffNotificationEmail: varchar("staffNotificationEmail", { length: 320 }),
  
  // Lead Automation Settings
  autoSendSmsToLead: int("autoSendSmsToLead").default(1),
  autoSendEmailToLead: int("autoSendEmailToLead").default(1),
  autoUpdatePipelineStage: int("autoUpdatePipelineStage").default(1),
  bookingLink: varchar("bookingLink", { length: 500 }),
  
  // Kiosk Theme & Personalization
  kioskTheme: varchar("kioskTheme", { length: 50 }).default("default"),
  kioskAccentColor: varchar("kioskAccentColor", { length: 7 }),
  kioskLogoLight: varchar("kioskLogoLight", { length: 500 }),
  kioskLogoDark: varchar("kioskLogoDark", { length: 500 }),
  kioskWelcomeHeadline: varchar("kioskWelcomeHeadline", { length: 50 }),
  kioskWelcomeSubtext: varchar("kioskWelcomeSubtext", { length: 100 }),
  kioskBackgroundBlur: int("kioskBackgroundBlur").default(5),
  kioskBackgroundOpacity: int("kioskBackgroundOpacity").default(80),
  kioskScheduledThemeStartDate: timestamp("kioskScheduledThemeStartDate"),
  kioskScheduledThemeEndDate: timestamp("kioskScheduledThemeEndDate"),
  kioskRevertToTheme: varchar("kioskRevertToTheme", { length: 50 }),
  
  // Setup Completion
  setupCompleted: int("setupCompleted").default(0).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DojoSettings = typeof dojoSettings.$inferSelect;
export type InsertDojoSettings = typeof dojoSettings.$inferInsert;

/**
 * Locations table - Step 3: Locations & Schedule
 * Multiple locations with operating hours and time blocks
 */
export const locations = mysqlTable("locations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  address: varchar("address", { length: 500 }),
  insideFacility: int("insideFacility").default(0),
  facilityName: varchar("facilityName", { length: 255 }),
  operatingHours: text("operatingHours"), // JSON: {monday: {open: "09:00", close: "21:00"}, ...}
  timeBlocks: text("timeBlocks"), // JSON: [{name: "Kids Classes", start: "16:00", end: "18:00"}, ...]
  // Kiosk configuration
  kioskEnabled: int("kioskEnabled").default(0).notNull(),
  kioskSlug: varchar("kioskSlug", { length: 255 }),
  kioskSettings: text("kioskSettings"), // JSON: {theme, appearance, behavior}
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Location = typeof locations.$inferSelect;
export type InsertLocation = typeof locations.$inferInsert;

/**
 * Programs table - Membership tracks/tiers (REFACTORED)
 * Examples: Free Trial, Beginner Program, Black Belt Club, Leadership Team
 * Note: Pricing moved to membership_plans table
 */
export const programs = mysqlTable("programs", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  // Program characteristics
  termLength: int("termLength"), // In months (12, 24, 36, null for month-to-month)
  eligibility: mysqlEnum("eligibility", ["open", "invitation_only", "upgrade_only"]).default("open").notNull(),
  ageRange: varchar("ageRange", { length: 100 }),
  
  // Display & enrollment
  showOnKiosk: int("showOnKiosk").default(1).notNull(),
  showOnEnrollment: int("showOnEnrollment").default(1).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: int("isActive").default(1).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Program = typeof programs.$inferSelect;
export type InsertProgram = typeof programs.$inferInsert;

/**
 * Team Members table - Step 6: Team & Roles
 * Staff, instructors, coaches with permissions and focus areas
 */
export const teamMembers = mysqlTable("team_members", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["owner", "manager", "instructor", "front_desk", "coach", "trainer", "assistant"]).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  locationIds: text("locationIds"), // JSON: [1, 2, 3]
  addressAs: varchar("addressAs", { length: 255 }), // "Coach Sarah", "Professor João"
  focusAreas: text("focusAreas"), // JSON: ["kids", "advanced", "beginners", "sales"]
  photoUrl: varchar("photoUrl", { length: 500 }), // S3 URL for profile photo
  canViewFinancials: int("canViewFinancials").default(0),
  canEditSchedule: int("canEditSchedule").default(0),
  canManageLeads: int("canManageLeads").default(0),
  viewOnly: int("viewOnly").default(1),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;

/**
 * Member Journey Config table - Step 7: Member Journey & Automations
 * Single-row table (id=1) for automation settings
 */
export const memberJourneyConfig = mysqlTable("member_journey_config", {
  id: int("id").autoincrement().primaryKey(),
  
  // Lead Handling
  leadGreeting: text("leadGreeting"),
  contactPreference: mysqlEnum("contactPreference", ["sms", "email", "both"]).default("both"),
  responseSpeedMinutes: int("responseSpeedMinutes").default(15),
  trialOffer: varchar("trialOffer", { length: 255 }),
  
  // Trial / Intro
  trialType: mysqlEnum("trialType", ["free_class", "paid_intro", "free_week", "assessment"]),
  trialFollowUp: text("trialFollowUp"),
  
  // New Member Onboarding
  welcomeTone: mysqlEnum("welcomeTone", ["shorter", "detailed"]).default("detailed"),
  miss1ClassAction: varchar("miss1ClassAction", { length: 255 }),
  miss2WeeksAction: varchar("miss2WeeksAction", { length: 255 }),
  
  // Long-Term Retention
  absenceAlertThreshold: int("absenceAlertThreshold").default(3), // Number of absences
  renewalReminderWeeks: int("renewalReminderWeeks").default(2),
  
  // Industry-specific toggles
  autoBookingPrompts: int("autoBookingPrompts").default(0),
  encouragementMessages: int("encouragementMessages").default(1),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MemberJourneyConfig = typeof memberJourneyConfig.$inferSelect;
export type InsertMemberJourneyConfig = typeof memberJourneyConfig.$inferInsert;

/**
 * Billing Applications table - PC Bancard and Stripe applications
 * Stores merchant account applications with document tracking
 */
export const billingApplications = mysqlTable("billing_applications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // Link to user who submitted
  
  // Payment provider
  provider: mysqlEnum("provider", ["pcbancard", "stripe"]).notNull(),
  
  // Application status
  status: mysqlEnum("status", ["draft", "submitted", "under_review", "approved", "rejected", "requires_info"]).default("draft").notNull(),
  
  // PC Bancard specific fields
  businessName: varchar("businessName", { length: 255 }),
  dbaName: varchar("dbaName", { length: 255 }),
  businessAddress: text("businessAddress"),
  businessPhone: varchar("businessPhone", { length: 20 }),
  ownerName: varchar("ownerName", { length: 255 }),
  ownerCell: varchar("ownerCell", { length: 20 }),
  managerName: varchar("managerName", { length: 255 }),
  managerCell: varchar("managerCell", { length: 20 }),
  hoursOfOperation: varchar("hoursOfOperation", { length: 255 }),
  daysOfOperation: varchar("daysOfOperation", { length: 255 }),
  estimatedMonthlyVolume: int("estimatedMonthlyVolume"),
  specialInstructions: text("specialInstructions"),
  
  // Contact info for PC Bancard
  pcbancardRepName: varchar("pcbancardRepName", { length: 255 }).default("Randy Sinclair"),
  pcbancardRepPhone: varchar("pcbancardRepPhone", { length: 20 }).default("682-218-1669"),
  
  // Stripe specific fields (for future use)
  stripeAccountId: varchar("stripeAccountId", { length: 255 }),
  stripeOnboardingComplete: int("stripeOnboardingComplete").default(0),
  
  // Processing info
  submittedAt: timestamp("submittedAt"),
  reviewedAt: timestamp("reviewedAt"),
  approvedAt: timestamp("approvedAt"),
  rejectedAt: timestamp("rejectedAt"),
  rejectionReason: text("rejectionReason"),
  adminNotes: text("adminNotes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BillingApplication = typeof billingApplications.$inferSelect;
export type InsertBillingApplication = typeof billingApplications.$inferInsert;

/**
 * Billing Documents table - Store S3 URLs for uploaded documents
 * Links to billing applications with document type tracking
 */
export const billingDocuments = mysqlTable("billing_documents", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("applicationId").notNull(), // Foreign key to billing_applications
  
  // Document type
  documentType: mysqlEnum("documentType", [
    "drivers_license",
    "voided_check",
    "state_ein",
    "address_verification",
    "bank_letter"
  ]).notNull(),
  
  // S3 storage
  s3Key: varchar("s3Key", { length: 500 }).notNull(),
  s3Url: varchar("s3Url", { length: 1000 }).notNull(),
  
  // File metadata
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileSize: int("fileSize"), // In bytes
  mimeType: varchar("mimeType", { length: 100 }),
  
  // Verification status
  verified: int("verified").default(0).notNull(),
  verifiedAt: timestamp("verifiedAt"),
  verifiedBy: int("verifiedBy"), // Admin user ID
  verificationNotes: text("verificationNotes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BillingDocument = typeof billingDocuments.$inferSelect;
export type InsertBillingDocument = typeof billingDocuments.$inferInsert;

/**
 * Payment Methods table - Store configured payment processors
 * Tracks which payment methods are active for the dojo
 */
export const paymentMethods = mysqlTable("payment_methods", {
  id: int("id").autoincrement().primaryKey(),
  
  // Provider info
  provider: mysqlEnum("provider", ["pcbancard", "stripe", "square", "other"]).notNull(),
  providerName: varchar("providerName", { length: 255 }),
  
  // Account credentials (encrypted/hashed)
  merchantId: varchar("merchantId", { length: 255 }),
  apiKey: varchar("apiKey", { length: 500 }),
  apiSecret: varchar("apiSecret", { length: 500 }),
  webhookSecret: varchar("webhookSecret", { length: 500 }),
  
  // Status
  isActive: int("isActive").default(0).notNull(),
  isPrimary: int("isPrimary").default(0).notNull(),
  
  // Linked application
  applicationId: int("applicationId"), // Link to billing_applications if applicable
  
  // Configuration
  acceptedCardTypes: text("acceptedCardTypes"), // JSON: ["visa", "mastercard", "amex", "discover"]
  transactionFeePercent: int("transactionFeePercent"), // In basis points (e.g., 275 = 2.75%)
  transactionFeeFixed: int("transactionFeeFixed"), // In cents
  
  // Testing
  isTestMode: int("isTestMode").default(0).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = typeof paymentMethods.$inferInsert;

/**
 * Billing Transactions table - Track all payment transactions
 * Records all payments processed through any payment method
 */
export const billingTransactions = mysqlTable("billing_transactions", {
  id: int("id").autoincrement().primaryKey(),
  
  // Transaction identification
  transactionId: varchar("transactionId", { length: 255 }).notNull().unique(),
  paymentMethodId: int("paymentMethodId").notNull(), // Foreign key to payment_methods
  
  // Customer info
  studentId: int("studentId"), // Link to student if applicable
  customerName: varchar("customerName", { length: 255 }),
  customerEmail: varchar("customerEmail", { length: 320 }),
  
  // Transaction details
  amount: int("amount").notNull(), // In cents
  currency: varchar("currency", { length: 3 }).default("USD"),
  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded", "disputed"]).default("pending").notNull(),
  
  // Payment method details
  cardLast4: varchar("cardLast4", { length: 4 }),
  cardBrand: varchar("cardBrand", { length: 50 }),
  
  // Related records
  programId: int("programId"), // Link to program if applicable
  invoiceId: int("invoiceId"), // Link to invoice if applicable
  
  // Processing info
  processorResponse: text("processorResponse"), // JSON response from payment processor
  errorMessage: text("errorMessage"),
  
  // Timestamps
  processedAt: timestamp("processedAt"),
  refundedAt: timestamp("refundedAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BillingTransaction = typeof billingTransactions.$inferSelect;
export type InsertBillingTransaction = typeof billingTransactions.$inferInsert;

/**
 * Webhook Keys table - API keys for webhook authentication
 * Allows external systems to submit leads via webhook
 */
export const webhookKeys = mysqlTable("webhook_keys", {
  id: int("id").autoincrement().primaryKey(),
  /** Human-readable name for the key (e.g., "Wix Website", "WordPress Form") */
  name: varchar("name", { length: 255 }).notNull(),
  /** The actual API key (should be hashed or encrypted in production) */
  apiKey: varchar("apiKey", { length: 255 }).notNull().unique(),
  /** Whether this key is currently active */
  isActive: int("isActive").default(1).notNull(),
  /** Last time this key was used */
  lastUsedAt: timestamp("lastUsedAt"),
  /** Number of times this key has been used */
  usageCount: int("usageCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WebhookKey = typeof webhookKeys.$inferSelect;
export type InsertWebhookKey = typeof webhookKeys.$inferInsert;

/**
 * Campaigns table - SMS/Email marketing campaigns
 * Stores campaign configuration and metadata
 */
export const campaigns = mysqlTable("campaigns", {
  id: int("id").autoincrement().primaryKey(),
  /** Campaign name for internal reference */
  name: varchar("name", { length: 255 }).notNull(),
  /** Campaign type: sms or email */
  type: mysqlEnum("type", ["sms", "email"]).notNull(),
  /** Campaign status */
  status: mysqlEnum("status", ["draft", "scheduled", "sending", "sent", "cancelled"]).default("draft").notNull(),
  /** Message subject (for email) */
  subject: varchar("subject", { length: 500 }),
  /** Message body/content */
  message: text("message").notNull(),
  /** Target audience filter (JSON) - e.g., {type: "leads", status: ["New Lead", "Contacted"]} */
  audienceFilter: text("audienceFilter"),
  /** Total recipients count */
  recipientCount: int("recipientCount").default(0),
  /** Successfully sent count */
  sentCount: int("sentCount").default(0),
  /** Delivered count */
  deliveredCount: int("deliveredCount").default(0),
  /** Failed count */
  failedCount: int("failedCount").default(0),
  /** Opened count (email only) */
  openedCount: int("openedCount").default(0),
  /** Clicked count (email only) */
  clickedCount: int("clickedCount").default(0),
  /** Scheduled send time (null = send immediately) */
  scheduledAt: timestamp("scheduledAt"),
  /** Actual send start time */
  sentAt: timestamp("sentAt"),
  /** Send completion time */
  completedAt: timestamp("completedAt"),
  /** Created by user ID */
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;

/**
 * Campaign Recipients table - Track individual message delivery
 * Links campaigns to specific recipients with delivery status
 */
export const campaignRecipients = mysqlTable("campaign_recipients", {
  id: int("id").autoincrement().primaryKey(),
  /** Foreign key to campaigns */
  campaignId: int("campaignId").notNull(),
  /** Recipient type: lead or student */
  recipientType: mysqlEnum("recipientType", ["lead", "student"]).notNull(),
  /** Foreign key to leads or students table */
  recipientId: int("recipientId").notNull(),
  /** Recipient name */
  recipientName: varchar("recipientName", { length: 255 }).notNull(),
  /** Recipient contact (email or phone) */
  recipientContact: varchar("recipientContact", { length: 320 }).notNull(),
  /** Delivery status */
  status: mysqlEnum("status", ["pending", "sent", "delivered", "failed", "bounced", "opened", "clicked"]).default("pending").notNull(),
  /** External message ID from provider (Twilio/SendGrid) */
  externalMessageId: varchar("externalMessageId", { length: 255 }),
  /** Error message if failed */
  errorMessage: text("errorMessage"),
  /** Sent timestamp */
  sentAt: timestamp("sentAt"),
  /** Delivered timestamp */
  deliveredAt: timestamp("deliveredAt"),
  /** Opened timestamp (email only) */
  openedAt: timestamp("openedAt"),
  /** Clicked timestamp (email only) */
  clickedAt: timestamp("clickedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CampaignRecipient = typeof campaignRecipients.$inferSelect;
export type InsertCampaignRecipient = typeof campaignRecipients.$inferInsert;

/**
 * Automation Sequences table - Automated follow-up sequences
 * Defines multi-step automation workflows with triggers
 */
export const automationSequences = mysqlTable("automation_sequences", {
  id: int("id").autoincrement().primaryKey(),
  /** Sequence name */
  name: varchar("name", { length: 255 }).notNull(),
  /** Sequence description */
  description: text("description"),
  /** Trigger type - what starts this sequence */
  trigger: mysqlEnum("trigger", [
    "new_lead",
    "trial_scheduled",
    "trial_completed",
    "trial_no_show",
    "enrollment",
    "missed_class",
    "inactive_student",
    "renewal_due",
    "custom"
  ]).notNull(),
  /** Trigger conditions (JSON) - additional filters for trigger */
  triggerConditions: text("triggerConditions"),
  /** Whether sequence is active */
  isActive: int("isActive").default(1).notNull(),
  /** Total enrollments (people who entered this sequence) */
  enrollmentCount: int("enrollmentCount").default(0),
  /** Completed count */
  completedCount: int("completedCount").default(0),
  /** Created by user ID */
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AutomationSequence = typeof automationSequences.$inferSelect;
export type InsertAutomationSequence = typeof automationSequences.$inferInsert;

/**
 * Automation Steps table - Individual steps in automation sequences
 * Defines the actions and timing for each step
 */
export const automationSteps = mysqlTable("automation_steps", {
  id: int("id").autoincrement().primaryKey(),
  /** Foreign key to automation_sequences */
  sequenceId: int("sequenceId").notNull(),
  /** Step order in sequence */
  stepOrder: int("stepOrder").notNull(),
  /** Step type */
  stepType: mysqlEnum("stepType", ["wait", "send_sms", "send_email", "condition", "end"]).notNull(),
  /** Wait duration in minutes (for wait steps) */
  waitMinutes: int("waitMinutes"),
  /** Message subject (for email steps) */
  subject: varchar("subject", { length: 500 }),
  /** Message content (for send steps) */
  message: text("message"),
  /** Condition logic (JSON) - for conditional branching */
  condition: text("condition"),
  /** Next step ID if condition is true */
  nextStepIdTrue: int("nextStepIdTrue"),
  /** Next step ID if condition is false */
  nextStepIdFalse: int("nextStepIdFalse"),
  /** Step name for identification */
  name: varchar("name", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AutomationStep = typeof automationSteps.$inferSelect;
export type InsertAutomationStep = typeof automationSteps.$inferInsert;

/**
 * Automation Enrollments table - Track who is in which sequence
 * Links people to active automation sequences
 */
export const automationEnrollments = mysqlTable("automation_enrollments", {
  id: int("id").autoincrement().primaryKey(),
  /** Foreign key to automation_sequences */
  sequenceId: int("sequenceId").notNull(),
  /** Enrolled person type: lead or student */
  enrolledType: mysqlEnum("enrolledType", ["lead", "student"]).notNull(),
  /** Foreign key to leads or students table */
  enrolledId: int("enrolledId").notNull(),
  /** Current step ID in sequence */
  currentStepId: int("currentStepId"),
  /** Enrollment status */
  status: mysqlEnum("status", ["active", "paused", "completed", "cancelled"]).default("active").notNull(),
  /** When to execute next step */
  nextExecutionAt: timestamp("nextExecutionAt"),
  /** Enrollment start time */
  enrolledAt: timestamp("enrolledAt").defaultNow().notNull(),
  /** Completion time */
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AutomationEnrollment = typeof automationEnrollments.$inferSelect;
export type InsertAutomationEnrollment = typeof automationEnrollments.$inferInsert;

/**
 * Conversations table - Two-way SMS conversation threads
 * Tracks ongoing conversations with leads and students
 */
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  /** Participant type: lead or student */
  participantType: mysqlEnum("participantType", ["lead", "student"]).notNull(),
  /** Foreign key to leads or students table */
  participantId: int("participantId").notNull(),
  /** Participant name */
  participantName: varchar("participantName", { length: 255 }).notNull(),
  /** Participant phone number */
  participantPhone: varchar("participantPhone", { length: 20 }).notNull(),
  /** Conversation status */
  status: mysqlEnum("status", ["open", "closed", "archived"]).default("open").notNull(),
  /** Assigned to team member ID */
  assignedTo: int("assignedTo"),
  /** Last message preview */
  lastMessagePreview: text("lastMessagePreview"),
  /** Last message timestamp */
  lastMessageAt: timestamp("lastMessageAt"),
  /** Unread message count */
  unreadCount: int("unreadCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

/**
 * Messages table - Individual messages in conversations
 * Stores all SMS messages sent and received
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  /** Foreign key to conversations */
  conversationId: int("conversationId").notNull(),
  /** Message direction */
  direction: mysqlEnum("direction", ["inbound", "outbound"]).notNull(),
  /** Message content */
  content: text("content").notNull(),
  /** Sender type (for outbound: system, staff, automation) */
  senderType: mysqlEnum("senderType", ["system", "staff", "automation", "customer"]),
  /** Sender ID (team member ID for staff messages) */
  senderId: int("senderId"),
  /** Delivery status */
  status: mysqlEnum("status", ["pending", "sent", "delivered", "failed", "read"]).default("pending").notNull(),
  /** External message ID from Twilio */
  externalMessageId: varchar("externalMessageId", { length: 255 }),
  /** Error message if failed */
  errorMessage: text("errorMessage"),
  /** Sent timestamp */
  sentAt: timestamp("sentAt"),
  /** Delivered timestamp */
  deliveredAt: timestamp("deliveredAt"),
  /** Read timestamp */
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Message Templates table - Reusable message templates
 * Quick replies and standard messages for conversations
 */
export const messageTemplates = mysqlTable("message_templates", {
  id: int("id").autoincrement().primaryKey(),
  /** Template name */
  name: varchar("name", { length: 255 }).notNull(),
  /** Template category */
  category: mysqlEnum("category", ["greeting", "follow_up", "reminder", "confirmation", "general"]).notNull(),
  /** Template type */
  type: mysqlEnum("type", ["sms", "email"]).notNull(),
  /** Message subject (for email) */
  subject: varchar("subject", { length: 500 }),
  /** Message content with placeholders (e.g., {{firstName}}, {{trialDate}}) */
  content: text("content").notNull(),
  /** Whether this is a system template (not editable) */
  isSystem: int("isSystem").default(0).notNull(),
  /** Usage count */
  usageCount: int("usageCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MessageTemplate = typeof messageTemplates.$inferSelect;
export type InsertMessageTemplate = typeof messageTemplates.$inferInsert;

/**
 * Automation Templates table - Pre-built automation sequence templates
 * Library of ready-to-use automation workflows with variable placeholders
 */
export const automationTemplates = mysqlTable("automation_templates", {
  id: int("id").autoincrement().primaryKey(),
  /** Template name */
  name: varchar("name", { length: 255 }).notNull(),
  /** Template description */
  description: text("description").notNull(),
  /** Template category */
  category: mysqlEnum("category", ["welcome", "trial", "engagement", "celebration", "followup", "renewal"]).notNull(),
  /** Trigger type */
  trigger: mysqlEnum("trigger", [
    "new_lead",
    "trial_scheduled",
    "trial_completed",
    "trial_no_show",
    "enrollment",
    "missed_class",
    "inactive_student",
    "renewal_due",
    "custom"
  ]).notNull(),
  /** Trigger conditions (JSON) */
  triggerConditions: text("triggerConditions"),
  /** Steps configuration (JSON array of steps) */
  steps: text("steps").notNull(),
  /** Whether this is a system template */
  isSystem: int("isSystem").default(1).notNull(),
  /** Installation count */
  installCount: int("installCount").default(0),
  /** Preview image URL */
  previewImage: varchar("previewImage", { length: 500 }),
  /** Tags for filtering (JSON array) */
  tags: text("tags"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AutomationTemplate = typeof automationTemplates.$inferSelect;
export type InsertAutomationTemplate = typeof automationTemplates.$inferInsert;


/**
 * Kai Conversations table - AI chat conversations with Kai
 * Stores conversation metadata for the Kai Command interface
 */
export const kaiConversations = mysqlTable("kai_conversations", {
  id: int("id").autoincrement().primaryKey(),
  /** User who owns this conversation */
  userId: int("userId").notNull(),
  /** Conversation title (auto-generated from first message or user-set) */
  title: varchar("title", { length: 500 }).default("New Conversation").notNull(),
  /** Preview of last message */
  preview: text("preview"),
  /** Conversation status */
  status: mysqlEnum("status", ["active", "archived"]).default("active").notNull(),
  /** Category tag for organization */
  category: mysqlEnum("category", ["kai", "growth", "billing", "operations", "general"]).default("kai").notNull(),
  /** Priority/attention status */
  priority: mysqlEnum("priority", ["neutral", "attention", "urgent"]).default("neutral").notNull(),
  /** Last message timestamp */
  lastMessageAt: timestamp("lastMessageAt").defaultNow().notNull(),
  /** Soft delete timestamp - null means not deleted */
  deletedAt: timestamp("deletedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KaiConversation = typeof kaiConversations.$inferSelect;
export type InsertKaiConversation = typeof kaiConversations.$inferInsert;

/**
 * Kai Messages table - Messages within Kai conversations
 * Stores individual messages between user and Kai AI
 */
export const kaiMessages = mysqlTable("kai_messages", {
  id: int("id").autoincrement().primaryKey(),
  /** Foreign key to kai_conversations */
  conversationId: int("conversationId").notNull(),
  /** Message role (user or assistant) */
  role: mysqlEnum("role", ["user", "assistant", "system"]).notNull(),
  /** Message content */
  content: text("content").notNull(),
  /** Metadata (function calls, context, etc.) stored as JSON */
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type KaiMessage = typeof kaiMessages.$inferSelect;
export type InsertKaiMessage = typeof kaiMessages.$inferInsert;

/**
 * Class Enrollments table - Links students to classes they're enrolled in
 */
export const classEnrollments = mysqlTable("class_enrollments", {
  id: int("id").autoincrement().primaryKey(),
  /** Foreign key to students table */
  studentId: int("studentId").notNull(),
  /** Foreign key to classes table */
  classId: int("classId").notNull(),
  /** Whether student wants SMS reminders for this class */
  smsRemindersEnabled: int("smsRemindersEnabled").default(1).notNull(),
  /** Enrollment status */
  status: mysqlEnum("status", ["active", "paused", "cancelled"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClassEnrollment = typeof classEnrollments.$inferSelect;
export type InsertClassEnrollment = typeof classEnrollments.$inferInsert;

/**
 * Class Reminders table - Track sent SMS reminders to prevent duplicates
 */
export const classReminders = mysqlTable("class_reminders", {
  id: int("id").autoincrement().primaryKey(),
  /** Foreign key to students table */
  studentId: int("studentId").notNull(),
  /** Foreign key to classes table */
  classId: int("classId").notNull(),
  /** The specific class date this reminder is for */
  classDate: timestamp("classDate").notNull(),
  /** Phone number the reminder was sent to */
  phoneNumber: varchar("phoneNumber", { length: 20 }).notNull(),
  /** Twilio message SID for tracking */
  twilioMessageId: varchar("twilioMessageId", { length: 100 }),
  /** Reminder status */
  status: mysqlEnum("status", ["pending", "sent", "failed", "delivered"]).default("pending").notNull(),
  /** Error message if failed */
  errorMessage: text("errorMessage"),
  /** When the reminder was sent */
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ClassReminder = typeof classReminders.$inferSelect;
export type InsertClassReminder = typeof classReminders.$inferInsert;

/**
 * SMS Preferences table - Global SMS preferences for students
 */
export const smsPreferences = mysqlTable("sms_preferences", {
  id: int("id").autoincrement().primaryKey(),
  /** Foreign key to students table */
  studentId: int("studentId").notNull().unique(),
  /** Whether student has opted in to receive SMS */
  optedIn: int("optedIn").default(1).notNull(),
  /** Whether to receive class reminders */
  classReminders: int("classReminders").default(1).notNull(),
  /** Whether to receive billing reminders */
  billingReminders: int("billingReminders").default(1).notNull(),
  /** Whether to receive promotional messages */
  promotionalMessages: int("promotionalMessages").default(0).notNull(),
  /** Preferred reminder time (hours before class) */
  reminderHoursBefore: int("reminderHoursBefore").default(24).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SmsPreference = typeof smsPreferences.$inferSelect;
export type InsertSmsPreference = typeof smsPreferences.$inferInsert;


/**
 * Lead Activities table - Track all interactions with leads
 * Stores calls, emails, SMS, notes, and status changes for timeline display
 */
export const leadActivities = mysqlTable("lead_activities", {
  id: int("id").autoincrement().primaryKey(),
  /** Foreign key to leads table */
  leadId: int("leadId").notNull(),
  /** Activity type */
  type: mysqlEnum("type", ["call", "email", "sms", "note", "status_change", "meeting", "task"]).notNull(),
  /** Activity title/subject */
  title: varchar("title", { length: 255 }),
  /** Activity content/description */
  content: text("content"),
  /** Previous status (for status_change type) */
  previousStatus: varchar("previousStatus", { length: 100 }),
  /** New status (for status_change type) */
  newStatus: varchar("newStatus", { length: 100 }),
  /** Call duration in seconds (for call type) */
  callDuration: int("callDuration"),
  /** Call outcome (for call type) */
  callOutcome: mysqlEnum("callOutcome", ["answered", "voicemail", "no_answer", "busy", "wrong_number"]),
  /** Whether the activity was automated (vs manual) */
  isAutomated: int("isAutomated").default(0).notNull(),
  /** User who created this activity (null for automated) */
  createdById: int("createdById"),
  /** Name of the user who created this (denormalized for display) */
  createdByName: varchar("createdByName", { length: 255 }),
  /** Metadata (JSON) for additional type-specific data */
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LeadActivity = typeof leadActivities.$inferSelect;
export type InsertLeadActivity = typeof leadActivities.$inferInsert;


/**
 * Lead Scoring Rules table - Define point values for different activities
 * Used to automatically calculate lead scores based on engagement
 */
export const leadScoringRules = mysqlTable("lead_scoring_rules", {
  id: int("id").autoincrement().primaryKey(),
  /** Activity type that triggers this rule */
  activityType: varchar("activityType", { length: 100 }).notNull().unique(),
  /** Points to add/subtract for this activity */
  points: int("points").notNull(),
  /** Human-readable description */
  description: varchar("description", { length: 255 }),
  /** Whether this rule is active */
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LeadScoringRule = typeof leadScoringRules.$inferSelect;
export type InsertLeadScoringRule = typeof leadScoringRules.$inferInsert;


/**
 * Student Portal Accounts table - Student login credentials
 * Separate from main users table for student-specific authentication
 */
export const studentAccounts = mysqlTable("student_accounts", {
  id: int("id").autoincrement().primaryKey(),
  /** Foreign key to students table */
  studentId: int("studentId").notNull().unique(),
  /** Login email (may differ from student contact email) */
  email: varchar("email", { length: 320 }).notNull().unique(),
  /** Password hash (bcrypt) */
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  /** Password reset token */
  resetToken: varchar("resetToken", { length: 255 }),
  /** Password reset token expiry */
  resetTokenExpiry: timestamp("resetTokenExpiry"),
  /** Whether account is active */
  isActive: int("isActive").default(1).notNull(),
  /** Last login timestamp */
  lastLoginAt: timestamp("lastLoginAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StudentAccount = typeof studentAccounts.$inferSelect;
export type InsertStudentAccount = typeof studentAccounts.$inferInsert;

/**
 * Belt Progress table - Track student progress toward next belt
 * Records attendance, skills, and evaluation readiness
 */
export const beltProgress = mysqlTable("belt_progress", {
  id: int("id").autoincrement().primaryKey(),
  /** Foreign key to students table */
  studentId: int("studentId").notNull().unique(),
  /** Current belt rank */
  currentBelt: varchar("currentBelt", { length: 50 }).notNull().default("White"),
  /** Next belt to achieve */
  nextBelt: varchar("nextBelt", { length: 50 }).notNull().default("Yellow"),
  /** Progress percentage toward next belt (0-100) */
  progressPercent: int("progressPercent").default(0).notNull(),
  /** Qualified classes attended this cycle */
  qualifiedClasses: int("qualifiedClasses").default(0).notNull(),
  /** Total classes required for next belt */
  classesRequired: int("classesRequired").default(20).notNull(),
  /** Qualified attendance percentage (0-100) */
  qualifiedAttendance: int("qualifiedAttendance").default(0).notNull(),
  /** Minimum attendance required for belt eligibility (default 80%) */
  attendanceRequired: int("attendanceRequired").default(80).notNull(),
  /** Next evaluation date */
  nextEvaluationDate: timestamp("nextEvaluationDate"),
  /** Whether student is eligible for belt test */
  isEligible: int("isEligible").default(0).notNull(),
  /** Notes from instructor */
  instructorNotes: text("instructorNotes"),
  /** Last belt promotion date */
  lastPromotionDate: timestamp("lastPromotionDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BeltProgress = typeof beltProgress.$inferSelect;
export type InsertBeltProgress = typeof beltProgress.$inferInsert;

/**
 * Student Attendance table - Detailed attendance records
 * Tracks each class attendance with qualification status
 */
export const studentAttendance = mysqlTable("student_attendance", {
  id: int("id").autoincrement().primaryKey(),
  /** Foreign key to students table */
  studentId: int("studentId").notNull(),
  /** Foreign key to classes table */
  classId: int("classId"),
  /** Class name (denormalized for history) */
  className: varchar("className", { length: 255 }),
  /** Instructor name */
  instructorName: varchar("instructorName", { length: 255 }),
  /** Class date and time */
  classDate: timestamp("classDate").notNull(),
  /** Attendance status */
  status: mysqlEnum("status", ["attended", "missed", "excused", "upcoming"]).default("upcoming").notNull(),
  /** Whether this attendance counts toward belt qualification */
  isQualified: int("isQualified").default(1).notNull(),
  /** Check-in timestamp */
  checkedInAt: timestamp("checkedInAt"),
  /** Location */
  location: varchar("location", { length: 255 }),
  /** Belt requirement for this class */
  beltRequirement: varchar("beltRequirement", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StudentAttendance = typeof studentAttendance.$inferSelect;
export type InsertStudentAttendance = typeof studentAttendance.$inferInsert;


/**
 * Belt Tests table
 * Stores scheduled belt testing events that students can register for
 */
export const beltTests = mysqlTable("belt_tests", {
  id: int("id").autoincrement().primaryKey(),
  /** Name of the belt test event */
  name: varchar("name", { length: 255 }).notNull(),
  /** Belt level being tested for (e.g., "Yellow", "Orange", "Green") */
  beltLevel: varchar("beltLevel", { length: 50 }).notNull(),
  /** Date of the belt test */
  testDate: timestamp("testDate").notNull(),
  /** Start time of the test */
  startTime: varchar("startTime", { length: 10 }).notNull(),
  /** End time of the test */
  endTime: varchar("endTime", { length: 10 }),
  /** Location of the test */
  location: varchar("location", { length: 255 }).notNull(),
  /** Maximum number of students that can register */
  maxCapacity: int("maxCapacity").default(20).notNull(),
  /** Current number of registered students */
  currentRegistrations: int("currentRegistrations").default(0).notNull(),
  /** Lead instructor for the test */
  instructorId: int("instructorId"),
  /** Instructor name for display */
  instructorName: varchar("instructorName", { length: 255 }),
  /** Registration fee in cents */
  fee: int("fee").default(0),
  /** Test status: open, closed, completed, cancelled */
  status: mysqlEnum("status", ["open", "closed", "completed", "cancelled"]).default("open").notNull(),
  /** Additional notes or requirements */
  notes: text("notes"),
  /** Minimum attendance percentage required to register */
  minAttendanceRequired: int("minAttendanceRequired").default(80),
  /** Minimum qualified classes required to register */
  minClassesRequired: int("minClassesRequired").default(20),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BeltTest = typeof beltTests.$inferSelect;
export type InsertBeltTest = typeof beltTests.$inferInsert;

/**
 * Belt Test Registrations table
 * Tracks student registrations for belt tests
 */
export const beltTestRegistrations = mysqlTable("belt_test_registrations", {
  id: int("id").autoincrement().primaryKey(),
  /** Reference to the belt test */
  testId: int("testId").notNull(),
  /** Reference to the student */
  studentId: int("studentId").notNull(),
  /** Student name for display */
  studentName: varchar("studentName", { length: 255 }).notNull(),
  /** Current belt at time of registration */
  currentBelt: varchar("currentBelt", { length: 50 }).notNull(),
  /** Registration status: registered, cancelled, passed, failed, no_show */
  status: mysqlEnum("status", ["registered", "cancelled", "passed", "failed", "no_show"]).default("registered").notNull(),
  /** Attendance percentage at time of registration */
  attendanceAtRegistration: int("attendanceAtRegistration"),
  /** Qualified classes at time of registration */
  classesAtRegistration: int("classesAtRegistration"),
  /** Payment status: pending, paid, refunded */
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid", "refunded", "waived"]).default("pending"),
  /** Stripe checkout session ID */
  stripeSessionId: varchar("stripeSessionId", { length: 255 }),
  /** Stripe payment intent ID */
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  /** Amount paid in cents */
  amountPaid: int("amountPaid"),
  /** Instructor notes about the student's test */
  instructorNotes: text("instructorNotes"),
  /** Result notes after test completion */
  resultNotes: text("resultNotes"),
  registeredAt: timestamp("registeredAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BeltTestRegistration = typeof beltTestRegistrations.$inferSelect;
export type InsertBeltTestRegistration = typeof beltTestRegistrations.$inferInsert;


/**
 * Student Portal Messages table
 * Stores messages between students and instructors/staff
 */
export const studentMessages = mysqlTable("student_messages", {
  id: int("id").autoincrement().primaryKey(),
  /** Foreign key to students table - the student in the conversation */
  studentId: int("studentId").notNull(),
  /** Sender type: student or staff */
  senderType: mysqlEnum("senderType", ["student", "staff"]).notNull(),
  /** Sender ID - studentId if student, staffPinId or userId if staff */
  senderId: int("senderId").notNull(),
  /** Sender name for display */
  senderName: varchar("senderName", { length: 255 }).notNull(),
  /** Message subject */
  subject: varchar("subject", { length: 500 }),
  /** Message content */
  content: text("content").notNull(),
  /** Whether the message has been read */
  isRead: int("isRead").default(0).notNull(),
  /** Parent message ID for replies (thread support) */
  parentMessageId: int("parentMessageId"),
  /** Message priority */
  priority: mysqlEnum("priority", ["normal", "high", "urgent"]).default("normal").notNull(),
  /** Read timestamp */
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StudentMessage = typeof studentMessages.$inferSelect;
export type InsertStudentMessage = typeof studentMessages.$inferInsert;

/**
 * Student Message Attachments table
 * Stores file attachments for student messages
 */
export const studentMessageAttachments = mysqlTable("student_message_attachments", {
  id: int("id").autoincrement().primaryKey(),
  /** Foreign key to student_messages table */
  messageId: int("messageId").notNull(),
  /** File name */
  fileName: varchar("fileName", { length: 255 }).notNull(),
  /** File URL in S3 */
  fileUrl: varchar("fileUrl", { length: 500 }).notNull(),
  /** File MIME type */
  mimeType: varchar("mimeType", { length: 100 }),
  /** File size in bytes */
  fileSize: int("fileSize"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StudentMessageAttachment = typeof studentMessageAttachments.$inferSelect;
export type InsertStudentMessageAttachment = typeof studentMessageAttachments.$inferInsert;


/**
 * Student Password Reset Tokens table
 * Stores temporary tokens for password reset flow
 */
export const studentPasswordResetTokens = mysqlTable("student_password_reset_tokens", {
  id: int("id").autoincrement().primaryKey(),
  /** Student ID (foreign key to students table) */
  studentId: int("studentId").notNull(),
  /** Unique reset token (hashed) */
  token: varchar("token", { length: 255 }).notNull().unique(),
  /** Token expiration timestamp */
  expiresAt: timestamp("expiresAt").notNull(),
  /** Whether the token has been used */
  used: int("used").default(0).notNull(),
  /** When the token was used */
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StudentPasswordResetToken = typeof studentPasswordResetTokens.$inferSelect;
export type InsertStudentPasswordResetToken = typeof studentPasswordResetTokens.$inferInsert;

/**
 * Student Passwords table
 * Stores hashed passwords for student portal authentication
 */
export const studentPasswords = mysqlTable("student_passwords", {
  id: int("id").autoincrement().primaryKey(),
  /** Student ID (foreign key to students table) */
  studentId: int("studentId").notNull().unique(),
  /** Hashed password */
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  /** Last password change */
  lastChangedAt: timestamp("lastChangedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StudentPassword = typeof studentPasswords.$inferSelect;
export type InsertStudentPassword = typeof studentPasswords.$inferInsert;


/**
 * Directed Messages table - Messages created from @mentions
 * Polymorphic recipients: student, staff, or group (class)
 * Used for routing messages to appropriate inboxes
 */
export const directedMessages = mysqlTable("directed_messages", {
  id: int("id").autoincrement().primaryKey(),
  /** Recipient type: student, staff, or group */
  recipientType: mysqlEnum("recipientType", ["student", "staff", "group"]).notNull(),
  /** Recipient ID - studentId, staffId (team_members.id), or classId */
  recipientId: int("recipientId").notNull(),
  /** Sender user ID (from users table) */
  senderId: int("senderId").notNull(),
  /** Sender name for display */
  senderName: varchar("senderName", { length: 255 }).notNull(),
  /** Message content */
  content: text("content").notNull(),
  /** Optional subject line */
  subject: varchar("subject", { length: 500 }),
  /** Source conversation ID (kai_conversations.id) if from Kai Command */
  sourceConversationId: int("sourceConversationId"),
  /** Source message ID (kai_messages.id) if from Kai Command */
  sourceMessageId: int("sourceMessageId"),
  /** Whether @Kai was also mentioned (Kai should respond) */
  kaiMentioned: int("kaiMentioned").default(0).notNull(),
  /** Whether the message has been read */
  isRead: int("isRead").default(0).notNull(),
  /** Read timestamp */
  readAt: timestamp("readAt"),
  /** Message priority */
  priority: mysqlEnum("priority", ["normal", "high", "urgent"]).default("normal").notNull(),
  /** Message label for categorization */
  label: varchar("label", { length: 100 }).default("message"),
  /** Attachments JSON array [{url, name, type, size}] */
  attachments: text("attachments"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DirectedMessage = typeof directedMessages.$inferSelect;
export type InsertDirectedMessage = typeof directedMessages.$inferInsert;

/**
 * Staff Messages table - Messages in staff inbox
 * Similar to studentMessages but for staff members
 */
export const staffMessages = mysqlTable("staff_messages", {
  id: int("id").autoincrement().primaryKey(),
  /** Foreign key to team_members table - the staff member */
  staffId: int("staffId").notNull(),
  /** Sender type: staff, student, system */
  senderType: mysqlEnum("senderType", ["staff", "student", "system"]).notNull(),
  /** Sender ID - staffId, studentId, or null for system */
  senderId: int("senderId"),
  /** Sender name for display */
  senderName: varchar("senderName", { length: 255 }).notNull(),
  /** Message subject */
  subject: varchar("subject", { length: 500 }),
  /** Message content */
  content: text("content").notNull(),
  /** Whether the message has been read */
  isRead: int("isRead").default(0).notNull(),
  /** Parent message ID for replies (thread support) */
  parentMessageId: int("parentMessageId"),
  /** Message priority */
  priority: mysqlEnum("priority", ["normal", "high", "urgent"]).default("normal").notNull(),
  /** Read timestamp */
  readAt: timestamp("readAt"),
  /** Attachments JSON array */
  attachments: text("attachments"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StaffMessage = typeof staffMessages.$inferSelect;
export type InsertStaffMessage = typeof staffMessages.$inferInsert;


/**
 * Student Notes table - Notes attached to student profiles
 * Can be created manually or extracted from Kai conversations
 */
export const studentNotes = mysqlTable("student_notes", {
  id: int("id").autoincrement().primaryKey(),
  /** Student this note belongs to */
  studentId: int("studentId").notNull(),
  /** Note content */
  content: text("content").notNull(),
  /** Note type: manual, extraction, action_item, follow_up */
  noteType: mysqlEnum("noteType", ["manual", "extraction", "action_item", "follow_up"]).default("manual").notNull(),
  /** Priority for action items */
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium"),
  /** User who created the note */
  createdById: int("createdById"),
  /** User name for display */
  createdByName: varchar("createdByName", { length: 255 }),
  /** Source conversation ID if extracted from Kai */
  sourceConversationId: int("sourceConversationId"),
  /** Whether the note/action is completed */
  isCompleted: int("isCompleted").default(0).notNull(),
  /** Completion timestamp */
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StudentNote = typeof studentNotes.$inferSelect;
export type InsertStudentNote = typeof studentNotes.$inferInsert;

/**
 * Kiosk Theme Presets - Built-in themes that schools can apply
 */
export const kioskThemePresets = mysqlTable("kiosk_theme_presets", {
  id: int("id").autoincrement().primaryKey(),
  /** Theme name (e.g., "Default", "Light Minimal", "Winter Holiday") */
  name: varchar("name", { length: 100 }).notNull(),
  /** Theme type (preset, custom, holiday, event) */
  type: mysqlEnum("type", ["preset", "custom", "holiday", "event"]).default("preset").notNull(),
  /** Theme description */
  description: text("description"),
  /** Theme configuration as JSON */
  config: json("config").notNull(),
  /** Preview image URL */
  previewUrl: varchar("previewUrl", { length: 500 }),
  /** Whether this theme is active/available */
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KioskThemePreset = typeof kioskThemePresets.$inferSelect;
export type InsertKioskThemePreset = typeof kioskThemePresets.$inferInsert;

/**
 * Kiosk Settings - Per-school kiosk configuration and active theme
 */
export const kioskSettings = mysqlTable("kiosk_settings", {
  id: int("id").autoincrement().primaryKey(),
  /** School/location ID (default 1 for single-location) */
  schoolId: int("schoolId").default(1).notNull(),
  /** Active theme preset ID */
  activeThemeId: int("activeThemeId"),
  /** Custom theme configuration (overrides preset) */
  customConfig: json("customConfig"),
  /** Custom welcome headline */
  welcomeHeadline: varchar("welcomeHeadline", { length: 50 }),
  /** Custom welcome subtext */
  welcomeSubtext: varchar("welcomeSubtext", { length: 100 }),
  /** Custom accent color (hex) */
  accentColor: varchar("accentColor", { length: 7 }),
  /** Logo URL for light backgrounds */
  logoLight: varchar("logoLight", { length: 500 }),
  /** Logo URL for dark backgrounds */
  logoDark: varchar("logoDark", { length: 500 }),
  /** Background blur amount (0-100) */
  backgroundBlur: int("backgroundBlur").default(5),
  /** Background opacity (0-100) */
  backgroundOpacity: int("backgroundOpacity").default(80),
  /** Scheduled theme start date */
  scheduledThemeStartDate: timestamp("scheduledThemeStartDate"),
  /** Scheduled theme end date */
  scheduledThemeEndDate: timestamp("scheduledThemeEndDate"),
  /** Theme to revert to after scheduled theme ends */
  revertToThemeId: int("revertToThemeId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KioskSetting = typeof kioskSettings.$inferSelect;
export type InsertKioskSetting = typeof kioskSettings.$inferInsert;

/**
 * Enrollments table - Tracks student enrollment submissions from kiosk
 * Supports both Typeform-style and Kai-guided enrollment modes
 */
export const enrollments = mysqlTable("enrollments", {
  id: int("id").autoincrement().primaryKey(),
  /** Enrollment source: kai, form, staff */
  source: mysqlEnum("source", ["kai", "form", "staff"]).default("form").notNull(),
  /** Enrollment status: draft, submitted, approved, rejected */
  status: mysqlEnum("status", ["draft", "submitted", "approved", "rejected"]).default("draft").notNull(),
  
  // Student Information
  firstName: varchar("firstName", { length: 255 }).notNull(),
  lastName: varchar("lastName", { length: 255 }).notNull(),
  dateOfBirth: timestamp("dateOfBirth"),
  age: int("age"),
  
  // Contact Information
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  streetAddress: varchar("streetAddress", { length: 255 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zipCode: varchar("zipCode", { length: 20 }),
  
  // Parent/Guardian Information (if under 18)
  guardianName: varchar("guardianName", { length: 255 }),
  guardianRelationship: varchar("guardianRelationship", { length: 50 }),
  guardianPhone: varchar("guardianPhone", { length: 20 }),
  guardianEmail: varchar("guardianEmail", { length: 320 }),
  
  // Program Interest
  programInterest: varchar("programInterest", { length: 100 }),
  experienceLevel: mysqlEnum("experienceLevel", ["beginner", "intermediate", "advanced"]).default("beginner"),
  classType: varchar("classType", { length: 100 }),
  
  // Goals & Motivation
  goals: text("goals"),
  motivation: text("motivation"),
  
  // Medical Information
  allergies: text("allergies"),
  medicalConditions: text("medicalConditions"),
  emergencyContactName: varchar("emergencyContactName", { length: 255 }),
  emergencyContactPhone: varchar("emergencyContactPhone", { length: 20 }),
  
  // Pricing & Membership (optional)
  selectedMembershipPlan: varchar("selectedMembershipPlan", { length: 100 }),
  pricingNotes: text("pricingNotes"),
  
  // Waiver & Consent
  waiverSigned: int("waiverSigned").default(0).notNull(),
  waiverSignature: text("waiverSignature"), // Base64 signature image
  waiverSignedAt: timestamp("waiverSignedAt"),
  consentGiven: int("consentGiven").default(0).notNull(),
  
  // Kai Conversation Data (for Kai-guided enrollments)
  conversationId: int("conversationId"),
  conversationTranscript: text("conversationTranscript"),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  submittedAt: timestamp("submittedAt"),
});

export type Enrollment = typeof enrollments.$inferSelect;
export type InsertEnrollment = typeof enrollments.$inferInsert;


/**
 * ============================================================================
 * BILLING SYSTEM REFACTOR - Separated Concerns
 * ============================================================================
 * This section defines the new billing structure with clear separation between:
 * - Programs (membership tracks)
 * - Membership Plans (pricing tiers)
 * - Class Entitlements (access rules)
 * - One-time Fees
 * - Discounts
 * - Add-ons
 */

/**
 * Membership Plans - Pricing tiers and billing structure
 * Examples: $149/mo, $199/mo, $249/mo with different terms
 */
export const membershipPlans = mysqlTable("membership_plans", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  // Billing Frequency (new multi-frequency support)
  billingFrequency: mysqlEnum("billingFrequency", ["monthly", "weekly", "daily", "drop_in"]).default("monthly").notNull(),
  
  // Pricing (unified field for all frequencies)
  priceAmount: int("priceAmount").notNull(), // In cents - base price for the frequency
  monthlyAmount: int("monthlyAmount").notNull(), // In cents - DEPRECATED but kept for backward compatibility
  
  // Billing interval and anchor
  billingInterval: int("billingInterval").default(1), // 1 = every interval (weekly/daily)
  billingAnchorDayOfWeek: int("billingAnchorDayOfWeek"), // 0-6 for weekly billing (0=Sunday)
  
  // Term length (flexible units)
  termLength: int("termLength"), // DEPRECATED - kept for backward compatibility (months)
  termLengthUnits: mysqlEnum("termLengthUnits", ["months", "weeks", "days", "visits"]),
  termLengthValue: int("termLengthValue"),
  
  // Drop-in / Visit pack options
  perVisitPrice: int("perVisitPrice"), // In cents - for drop-in pricing
  visitPackSize: int("visitPackSize"), // e.g., 1, 5, 10, 20 visits
  visitPackExpiryDays: int("visitPackExpiryDays"), // Days until visit pack expires
  chargeOnAttendance: int("chargeOnAttendance").default(0), // Boolean - charge when student checks in
  
  // Billing cycle (legacy field for monthly plans)
  billingCycle: mysqlEnum("billingCycle", ["monthly", "biweekly", "weekly", "annual"]).default("monthly").notNull(),
  billingDays: varchar("billingDays", { length: 50 }), // "10,25" for 10th and 25th
  
  // Down payment / Registration
  downPayment: int("downPayment").default(0).notNull(),
  registrationFee: int("registrationFee").default(0).notNull(),
  
  // Contract terms
  autoRenew: int("autoRenew").default(1).notNull(),
  cancellationPolicy: text("cancellationPolicy"),
  
  // Display
  isPopular: int("isPopular").default(0).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: int("isActive").default(1).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MembershipPlan = typeof membershipPlans.$inferSelect;
export type InsertMembershipPlan = typeof membershipPlans.$inferInsert;

/**
 * Class Entitlements - What classes members can attend
 */
export const classEntitlements = mysqlTable("class_entitlements", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  // Class access rules
  classesPerWeek: int("classesPerWeek"), // null = unlimited
  classesPerMonth: int("classesPerMonth"),
  isUnlimited: int("isUnlimited").default(0).notNull(),
  
  // Class duration types allowed
  allowedDurations: varchar("allowedDurations", { length: 255 }), // "30,60"
  
  // Class categories/types allowed
  allowedCategories: text("allowedCategories"), // JSON array
  
  // Restrictions
  requiresAdvanceBooking: int("requiresAdvanceBooking").default(0).notNull(),
  bookingWindowDays: int("bookingWindowDays").default(7).notNull(),
  
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClassEntitlement = typeof classEntitlements.$inferSelect;
export type InsertClassEntitlement = typeof classEntitlements.$inferInsert;

/**
 * One-time Fees - Registration, certification, equipment
 */
export const oneTimeFees = mysqlTable("one_time_fees", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  amount: int("amount").notNull(), // In cents
  feeType: mysqlEnum("feeType", [
    "registration",
    "down_payment",
    "certification",
    "testing",
    "equipment",
    "uniform",
    "other"
  ]).notNull(),
  
  chargeWhen: mysqlEnum("chargeWhen", [
    "signup",
    "first_class",
    "certification_event",
    "testing_event",
    "manual"
  ]).default("signup").notNull(),
  
  applicableToPrograms: text("applicableToPrograms"), // JSON array
  applicableToPlans: text("applicableToPlans"), // JSON array
  
  isRequired: int("isRequired").default(0).notNull(),
  isActive: int("isActive").default(1).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OneTimeFee = typeof oneTimeFees.$inferSelect;
export type InsertOneTimeFee = typeof oneTimeFees.$inferInsert;

/**
 * Discounts - Rule-based offers
 */
export const discounts = mysqlTable("discounts", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  discountType: mysqlEnum("discountType", [
    "percentage",
    "fixed_amount",
    "waive_fee",
    "special_rate"
  ]).notNull(),
  
  discountValue: int("discountValue").notNull(),
  
  appliesTo: mysqlEnum("appliesTo", [
    "monthly_fee",
    "registration_fee",
    "down_payment",
    "all_fees"
  ]).notNull(),
  
  eligibilityRules: text("eligibilityRules"), // JSON
  applicableToPrograms: text("applicableToPrograms"), // JSON array
  applicableToPlans: text("applicableToPlans"), // JSON array
  
  validFrom: timestamp("validFrom"),
  validUntil: timestamp("validUntil"),
  maxUses: int("maxUses"),
  currentUses: int("currentUses").default(0).notNull(),
  
  requiresApproval: int("requiresApproval").default(0).notNull(),
  isActive: int("isActive").default(1).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Discount = typeof discounts.$inferSelect;
export type InsertDiscount = typeof discounts.$inferInsert;

/**
 * Add-ons - Seminars, tournaments, merchandise
 */
export const addOns = mysqlTable("add_ons", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  addOnType: mysqlEnum("addOnType", [
    "seminar",
    "workshop",
    "tournament",
    "camp",
    "merchandise",
    "equipment",
    "private_lesson",
    "other"
  ]).notNull(),
  
  price: int("price").notNull(),
  pricingType: mysqlEnum("pricingType", ["one_time", "per_session", "subscription"]).default("one_time").notNull(),
  
  availableFrom: timestamp("availableFrom"),
  availableUntil: timestamp("availableUntil"),
  maxCapacity: int("maxCapacity"),
  currentEnrollment: int("currentEnrollment").default(0).notNull(),
  
  requiresMembership: int("requiresMembership").default(0).notNull(),
  minimumBeltRank: varchar("minimumBeltRank", { length: 50 }),
  
  showOnKiosk: int("showOnKiosk").default(1).notNull(),
  showOnEnrollment: int("showOnEnrollment").default(1).notNull(),
  imageUrl: varchar("imageUrl", { length: 500 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: int("isActive").default(1).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AddOn = typeof addOns.$inferSelect;
export type InsertAddOn = typeof addOns.$inferInsert;

/**
 * Junction Tables
 */

// Programs can have multiple membership plans
export const programPlans = mysqlTable("program_plans", {
  id: int("id").autoincrement().primaryKey(),
  programId: int("programId").notNull(),
  planId: int("planId").notNull(),
  isDefault: int("isDefault").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProgramPlan = typeof programPlans.$inferSelect;
export type InsertProgramPlan = typeof programPlans.$inferInsert;

// Plans include class entitlements
export const planEntitlements = mysqlTable("plan_entitlements", {
  id: int("id").autoincrement().primaryKey(),
  planId: int("planId").notNull(),
  entitlementId: int("entitlementId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PlanEntitlement = typeof planEntitlements.$inferSelect;
export type InsertPlanEntitlement = typeof planEntitlements.$inferInsert;

// Student enrollments with new billing structure
export const studentEnrollments = mysqlTable("student_enrollments", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  programId: int("programId").notNull(),
  planId: int("planId").notNull(),
  entitlementId: int("entitlementId"),
  
  status: mysqlEnum("status", ["active", "paused", "cancelled", "completed"]).default("active").notNull(),
  
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
  nextBillingDate: timestamp("nextBillingDate"),
  
  appliedDiscounts: text("appliedDiscounts"), // JSON array
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StudentEnrollment = typeof studentEnrollments.$inferSelect;
export type InsertStudentEnrollment = typeof studentEnrollments.$inferInsert;

/**
 * Merchandise Items table - Uniforms, gear, and other merchandise
 * Tracks available merchandise items that can be issued to students
 */
export const merchandiseItems = mysqlTable("merchandise_items", {
  id: int("id").autoincrement().primaryKey(),
  /** Item name (e.g., "White Uniform", "Sparring Gloves") */
  name: varchar("name", { length: 255 }).notNull(),
  /** Item type/category */
  type: mysqlEnum("type", ["uniform", "gear", "belt", "equipment", "other"]).notNull(),
  /** Default price in cents (0 for free items) */
  defaultPrice: int("defaultPrice").default(0).notNull(),
  /** Whether this item requires size selection */
  requiresSize: int("requiresSize").default(0).notNull(),
  /** Available sizes (JSON array: ["XS", "S", "M", "L", "XL", "XXL"]) */
  sizeOptions: text("sizeOptions"),
  /** Item description */
  description: text("description"),
  /** Product image URL */
  imageUrl: varchar("imageUrl", { length: 500 }),
  /** Current stock quantity (null = unlimited/not tracked) */
  stockQuantity: int("stockQuantity"),
  /** Low stock alert threshold (null = no alerts) */
  lowStockThreshold: int("lowStockThreshold"),
  /** Reorder point - when to reorder (calculated from velocity × lead time + safety stock) */
  reorderPoint: int("reorderPoint"),
  /** Suggested reorder quantity (calculated from usage patterns) */
  reorderQuantity: int("reorderQuantity"),
  /** Average daily usage rate (items per day) */
  averageDailyUsage: varchar("averageDailyUsage", { length: 20 }),
  /** When reorder analytics were last calculated */
  lastCalculatedAt: timestamp("lastCalculatedAt"),
  /** Lead time in days (time from order to delivery) */
  leadTimeDays: int("leadTimeDays").default(7),
  /** Safety stock multiplier (1.5 = 150% of expected usage during lead time) */
  safetyStockMultiplier: varchar("safetyStockMultiplier", { length: 10 }).default("1.5"),
  /** Whether this item is currently available */
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MerchandiseItem = typeof merchandiseItems.$inferSelect;
export type InsertMerchandiseItem = typeof merchandiseItems.$inferInsert;

/**
 * Student Merchandise table - Tracks merchandise issued to students
 * Manages fulfillment lifecycle from pending to confirmed/disputed
 */
export const studentMerchandise = mysqlTable("student_merchandise", {
  id: int("id").autoincrement().primaryKey(),
  /** Student receiving the item */
  studentId: int("studentId").notNull(),
  /** Merchandise item being issued */
  itemId: int("itemId").notNull(),
  /** Selected size (if applicable) */
  size: varchar("size", { length: 20 }),
  /** Price paid in cents (may differ from default) */
  pricePaid: int("pricePaid").default(0).notNull(),
  /** Current fulfillment status */
  fulfillmentStatus: mysqlEnum("fulfillmentStatus", ["pending", "handed_out", "confirmed", "disputed"]).default("pending").notNull(),
  /** When item was marked as handed out */
  handedOutAt: timestamp("handedOutAt"),
  /** Staff member who handed out the item */
  handedOutBy: int("handedOutBy"),
  /** When parent confirmed receipt */
  confirmedAt: timestamp("confirmedAt"),
  /** How parent confirmed (sms, email, in_person) */
  confirmationMethod: mysqlEnum("confirmationMethod", ["sms", "email", "in_person"]),
  /** Confirmation token for public link */
  confirmationToken: varchar("confirmationToken", { length: 255 }),
  /** Token expiry timestamp */
  confirmationTokenExpiry: timestamp("confirmationTokenExpiry"),
  /** Reason if disputed */
  disputeReason: text("disputeReason"),
  /** When dispute was filed */
  disputedAt: timestamp("disputedAt"),
  /** Notes from staff */
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StudentMerchandise = typeof studentMerchandise.$inferSelect;
export type InsertStudentMerchandise = typeof studentMerchandise.$inferInsert;

/**
 * Stock Alerts table - Tracks low stock alerts for merchandise items
 */
export const stockAlerts = mysqlTable("stock_alerts", {
  id: int("id").autoincrement().primaryKey(),
  /** Reference to merchandise item */
  itemId: int("itemId").notNull(),
  /** Type of alert */
  alertType: mysqlEnum("alertType", ["low_stock", "out_of_stock"]).default("low_stock").notNull(),
  /** Stock quantity when alert was triggered */
  quantityAtAlert: int("quantityAtAlert").notNull(),
  /** Threshold that triggered the alert */
  threshold: int("threshold").notNull(),
  /** When the alert was last sent */
  lastAlertSent: timestamp("lastAlertSent").defaultNow().notNull(),
  /** Number of times this alert has been sent */
  alertCount: int("alertCount").default(1).notNull(),
  /** Whether the alert has been resolved (stock replenished) */
  isResolved: int("isResolved").default(0).notNull(),
  /** When the alert was resolved */
  resolvedAt: timestamp("resolvedAt"),
  /** Who resolved the alert */
  resolvedBy: int("resolvedBy"),
  /** Resolution notes */
  resolutionNotes: text("resolutionNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StockAlert = typeof stockAlerts.$inferSelect;
export type InsertStockAlert = typeof stockAlerts.$inferInsert;

/**
 * Alert Settings table - Configuration for stock alert notifications
 */
export const alertSettings = mysqlTable("alert_settings", {
  id: int("id").autoincrement().primaryKey(),
  /** Whether the alert system is enabled */
  isEnabled: int("isEnabled").default(1).notNull(),
  /** Whether to send email notifications */
  notifyEmail: int("notifyEmail").default(1).notNull(),
  /** Whether to send SMS notifications */
  notifySMS: int("notifySMS").default(0).notNull(),
  /** How often to check stock levels (in minutes) */
  checkIntervalMinutes: int("checkIntervalMinutes").default(360).notNull(), // Default: 6 hours
  /** Comma-separated list of email addresses to notify */
  recipientEmails: text("recipientEmails"),
  /** Comma-separated list of phone numbers to notify */
  recipientPhones: text("recipientPhones"),
  /** Minimum hours between repeat alerts for same item */
  alertCooldownHours: int("alertCooldownHours").default(24).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AlertSettings = typeof alertSettings.$inferSelect;
export type InsertAlertSettings = typeof alertSettings.$inferInsert;

/**
 * Stock Usage History table - Tracks all stock changes for analytics
 * Used to calculate consumption velocity and predict reorder needs
 */
export const stockUsageHistory = mysqlTable("stock_usage_history", {
  id: int("id").autoincrement().primaryKey(),
  /** Reference to merchandise item */
  itemId: int("itemId").notNull(),
  /** Quantity change (positive for additions, negative for usage) */
  quantityChange: int("quantityChange").notNull(),
  /** Type of change */
  changeType: mysqlEnum("changeType", [
    "fulfillment",      // Item handed out to student
    "bulk_assignment",  // Bulk assignment to multiple students
    "adjustment",       // Manual stock adjustment
    "received_shipment",// New inventory received
    "inventory_count",  // Physical inventory count correction
    "damage",           // Damaged/lost items
    "return",           // Item returned
    "other"             // Other changes
  ]).notNull(),
  /** Stock quantity after this change */
  quantityAfter: int("quantityAfter").notNull(),
  /** Optional notes about the change */
  notes: text("notes"),
  /** Who made the change (staff member ID) */
  changedBy: int("changedBy"),
  /** When the change occurred */
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type StockUsageHistory = typeof stockUsageHistory.$inferSelect;
export type InsertStockUsageHistory = typeof stockUsageHistory.$inferInsert;

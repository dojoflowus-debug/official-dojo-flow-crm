import { mysqlTable, int, varchar, text, timestamp, mysqlEnum } from "drizzle-orm/mysql-core";

/**
 * BILLING SCHEMA REFACTOR
 * ========================
 * This schema separates billing concerns into distinct entities:
 * 1. Programs (membership tracks like "Free Trial", "Black Belt Club")
 * 2. Membership Plans (pricing tiers: $149/mo, $199/mo, $249/mo)
 * 3. Class Entitlements (what classes members can attend)
 * 4. One-time Fees (registration, down payment, certification)
 * 5. Discounts (rule-based offers)
 * 6. Add-ons (seminars, tournaments, merch)
 */

/**
 * Programs - Membership tracks/tiers
 * Examples: Free Trial, Beginner Program, Black Belt Club, Leadership Team
 */
export const programs = mysqlTable("programs", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  // Program characteristics
  termLength: int("termLength"), // In months (12, 24, 36, null for month-to-month)
  eligibility: mysqlEnum("eligibility", ["open", "invitation_only", "upgrade_only"]).default("open").notNull(),
  ageRange: varchar("ageRange", { length: 100 }), // "4-6", "7-12", "13+"
  
  // Display & enrollment
  showOnKiosk: int("showOnKiosk").default(1).notNull(),
  showOnEnrollment: int("showOnEnrollment").default(1).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: int("isActive").default(1).notNull(),
  
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Program = typeof programs.$inferSelect;
export type InsertProgram = typeof programs.$inferInsert;

/**
 * Membership Plans - Pricing tiers and billing structure
 * Examples: $149/mo, $199/mo, $249/mo with different terms
 */
export const membershipPlans = mysqlTable("membership_plans", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // "$149/month - Basic"
  description: text("description"),
  
  // Pricing
  monthlyAmount: int("monthlyAmount").notNull(), // In cents
  termLength: int("termLength"), // In months (null for month-to-month)
  
  // Billing cycle
  billingCycle: mysqlEnum("billingCycle", ["monthly", "biweekly", "weekly", "annual"]).default("monthly").notNull(),
  billingDays: varchar("billingDays", { length: 50 }), // "10,25" for 10th and 25th
  
  // Down payment / Registration
  downPayment: int("downPayment").default(0).notNull(), // In cents
  registrationFee: int("registrationFee").default(0).notNull(), // In cents
  
  // Contract terms
  autoRenew: int("autoRenew").default(1).notNull(),
  cancellationPolicy: text("cancellationPolicy"),
  
  // Display
  isPopular: int("isPopular").default(0).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: int("isActive").default(1).notNull(),
  
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MembershipPlan = typeof membershipPlans.$inferSelect;
export type InsertMembershipPlan = typeof membershipPlans.$inferInsert;

/**
 * Class Entitlements - What classes members can attend
 * Defines access rules for different membership levels
 */
export const classEntitlements = mysqlTable("class_entitlements", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // "Unlimited Classes", "2x/week", "3x/week"
  description: text("description"),
  
  // Class access rules
  classesPerWeek: int("classesPerWeek"), // null = unlimited
  classesPerMonth: int("classesPerMonth"), // null = unlimited
  isUnlimited: int("isUnlimited").default(0).notNull(),
  
  // Class duration types allowed
  allowedDurations: varchar("allowedDurations", { length: 255 }), // "30,60" for 30min and 60min classes
  
  // Class categories/types allowed
  allowedCategories: text("allowedCategories"), // JSON array: ["kids", "adults", "sparring"]
  
  // Restrictions
  requiresAdvanceBooking: int("requiresAdvanceBooking").default(0).notNull(),
  bookingWindowDays: int("bookingWindowDays").default(7).notNull(),
  
  // Display
  isActive: int("isActive").default(1).notNull(),
  
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClassEntitlement = typeof classEntitlements.$inferSelect;
export type InsertClassEntitlement = typeof classEntitlements.$inferInsert;

/**
 * One-time Fees - Registration, down payments, certification fees
 */
export const oneTimeFees = mysqlTable("one_time_fees", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  // Fee details
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
  
  // When charged
  chargeWhen: mysqlEnum("chargeWhen", [
    "signup",
    "first_class",
    "certification_event",
    "testing_event",
    "manual"
  ]).default("signup").notNull(),
  
  // Applicability
  applicableToPrograms: text("applicableToPrograms"), // JSON array of program IDs
  applicableToPlans: text("applicableToPlans"), // JSON array of plan IDs
  
  // Display
  isRequired: int("isRequired").default(0).notNull(),
  isActive: int("isActive").default(1).notNull(),
  
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OneTimeFee = typeof oneTimeFees.$inferSelect;
export type InsertOneTimeFee = typeof oneTimeFees.$inferInsert;

/**
 * Discounts - Rule-based offers and promotions
 * Examples: LA Fitness match, family discount, paid-in-full waiver
 */
export const discounts = mysqlTable("discounts", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  // Discount type
  discountType: mysqlEnum("discountType", [
    "percentage",
    "fixed_amount",
    "waive_fee",
    "special_rate"
  ]).notNull(),
  
  // Discount value
  discountValue: int("discountValue").notNull(), // Percentage (0-100) or amount in cents
  
  // What it applies to
  appliesTo: mysqlEnum("appliesTo", [
    "monthly_fee",
    "registration_fee",
    "down_payment",
    "all_fees"
  ]).notNull(),
  
  // Eligibility rules (JSON)
  eligibilityRules: text("eligibilityRules"), // JSON: {"type": "competitor_match", "competitor": "LA Fitness", "proof_required": true}
  
  // Applicability
  applicableToPrograms: text("applicableToPrograms"), // JSON array of program IDs
  applicableToPlans: text("applicableToPlans"), // JSON array of plan IDs
  
  // Validity
  validFrom: timestamp("validFrom"),
  validUntil: timestamp("validUntil"),
  maxUses: int("maxUses"), // null = unlimited
  currentUses: int("currentUses").default(0).notNull(),
  
  // Display
  requiresApproval: int("requiresApproval").default(0).notNull(),
  isActive: int("isActive").default(1).notNull(),
  
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Discount = typeof discounts.$inferSelect;
export type InsertDiscount = typeof discounts.$inferInsert;

/**
 * Add-ons - Optional purchases (seminars, tournaments, merch, camps)
 */
export const addOns = mysqlTable("add_ons", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  // Add-on type
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
  
  // Pricing
  price: int("price").notNull(), // In cents
  pricingType: mysqlEnum("pricingType", ["one_time", "per_session", "subscription"]).default("one_time").notNull(),
  
  // Availability
  availableFrom: timestamp("availableFrom"),
  availableUntil: timestamp("availableUntil"),
  maxCapacity: int("maxCapacity"), // null = unlimited
  currentEnrollment: int("currentEnrollment").default(0).notNull(),
  
  // Requirements
  requiresMembership: int("requiresMembership").default(0).notNull(),
  minimumBeltRank: varchar("minimumBeltRank", { length: 50 }),
  
  // Display
  showOnKiosk: int("showOnKiosk").default(1).notNull(),
  showOnEnrollment: int("showOnEnrollment").default(1).notNull(),
  imageUrl: varchar("imageUrl", { length: 500 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: int("isActive").default(1).notNull(),
  
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AddOn = typeof addOns.$inferSelect;
export type InsertAddOn = typeof addOns.$inferInsert;

/**
 * Junction Tables - Link entities together
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

// Student enrollments - Track which program/plan/entitlements a student has
export const studentEnrollments = mysqlTable("student_enrollments", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  programId: int("programId").notNull(),
  planId: int("planId").notNull(),
  entitlementId: int("entitlementId"),
  
  // Enrollment status
  status: mysqlEnum("status", ["active", "paused", "cancelled", "completed"]).default("active").notNull(),
  
  // Dates
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
  nextBillingDate: timestamp("nextBillingDate"),
  
  // Applied discounts
  appliedDiscounts: text("appliedDiscounts"), // JSON array of discount IDs
  
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StudentEnrollment = typeof studentEnrollments.$inferSelect;
export type InsertStudentEnrollment = typeof studentEnrollments.$inferInsert;

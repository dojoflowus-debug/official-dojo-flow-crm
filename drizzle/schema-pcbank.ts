import { mysqlTable, int, varchar, text, timestamp, mysqlEnum, index, json } from "drizzle-orm/mysql-core";

/**
 * PC Bank Card Application Schema
 * Multi-tenant table to store payment processor onboarding applications
 * Each organization can have one application that progresses through stages
 */
export const pcBankApplications = mysqlTable("pc_bank_applications", {
  id: int().autoincrement().notNull().primaryKey(),
  organizationId: int().notNull(),
  userId: int().notNull(), // User who initiated the application
  
  // Application Status
  status: mysqlEnum(['draft', 'submitted', 'under_review', 'approved', 'rejected', 'action_required']).default('draft').notNull(),
  currentStep: int().default(1).notNull(), // 1-7 for wizard steps
  completionPercent: int().default(0).notNull(),
  
  // FillFaster Integration
  fillFasterSubmissionId: varchar({ length: 255 }), // ID from FillFaster API
  fillFasterApplicationUrl: varchar({ length: 500 }), // Direct link to view application
  lastSyncedAt: timestamp({ mode: 'string' }),
  
  // Step 1: Business Identity
  legalBusinessName: varchar({ length: 255 }),
  dbaName: varchar({ length: 255 }),
  businessEmail: varchar({ length: 255 }),
  businessPhone: varchar({ length: 50 }),
  website: varchar({ length: 500 }),
  dateBusinessStarted: varchar({ length: 50 }),
  
  // Step 2: Location Info
  businessAddress: varchar({ length: 500 }),
  businessCity: varchar({ length: 100 }),
  businessState: varchar({ length: 50 }),
  businessZip: varchar({ length: 20 }),
  businessCountry: varchar({ length: 100 }).default('USA'),
  
  // Step 3: Corporate/Tax
  ein: varchar({ length: 50 }),
  businessType: varchar({ length: 100 }), // LLC, Corporation, Sole Proprietor, etc.
  stateOfIncorporation: varchar({ length: 100 }),
  
  // Step 4: Owner/Principal
  ownerFirstName: varchar({ length: 100 }),
  ownerLastName: varchar({ length: 100 }),
  ownerTitle: varchar({ length: 100 }),
  ownerSSN: varchar({ length: 50 }), // Encrypted in production
  ownerDOB: varchar({ length: 50 }),
  ownerAddress: varchar({ length: 500 }),
  ownerCity: varchar({ length: 100 }),
  ownerState: varchar({ length: 50 }),
  ownerZip: varchar({ length: 20 }),
  ownerPhone: varchar({ length: 50 }),
  ownerEmail: varchar({ length: 255 }),
  ownerOwnershipPercent: varchar({ length: 10 }),
  
  // Step 5: Banking & Processing
  bankName: varchar({ length: 255 }),
  bankAccountNumber: varchar({ length: 100 }), // Encrypted in production
  bankRoutingNumber: varchar({ length: 50 }),
  averageMonthlyVolume: varchar({ length: 50 }),
  averageTicketSize: varchar({ length: 50 }),
  highestTicketSize: varchar({ length: 50 }),
  
  // Step 6: Uploads & Compliance (file URLs stored in JSON)
  uploadedDocuments: json(), // {voided_check: "url", drivers_license: "url", ...}
  
  // Step 7: Review & Submit
  agreeToTerms: int().default(0).notNull(),
  authorizedSignature: varchar({ length: 255 }),
  signatureDate: varchar({ length: 50 }),
  ipAddress: varchar({ length: 100 }),
  
  // Metadata
  submittedAt: timestamp({ mode: 'string' }),
  approvedAt: timestamp({ mode: 'string' }),
  rejectedAt: timestamp({ mode: 'string' }),
  rejectionReason: text(),
  actionRequiredNotes: text(),
  internalNotes: text(),
  
  createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
  index("idx_org_status").on(table.organizationId, table.status),
  index("idx_fillfaster_id").on(table.fillFasterSubmissionId),
]);

/**
 * PC Bank Application History
 * Audit trail of all status changes and updates
 */
export const pcBankApplicationHistory = mysqlTable("pc_bank_application_history", {
  id: int().autoincrement().notNull().primaryKey(),
  applicationId: int().notNull(),
  organizationId: int().notNull(),
  userId: int(), // User who made the change
  
  action: mysqlEnum(['created', 'updated', 'submitted', 'status_changed', 'webhook_received']).notNull(),
  previousStatus: varchar({ length: 50 }),
  newStatus: varchar({ length: 50 }),
  changes: json(), // JSON object of field changes
  notes: text(),
  
  createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
  index("idx_application").on(table.applicationId),
  index("idx_org_created").on(table.organizationId, table.createdAt),
]);

import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Students table for martial arts school management
 */
export const students = mysqlTable("students", {
  id: int("id").autoincrement().primaryKey(),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  dateOfBirth: timestamp("dateOfBirth"),
  
  // Address fields for map visualization
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zipCode: varchar("zipCode", { length: 20 }),
  latitude: varchar("latitude", { length: 20 }),
  longitude: varchar("longitude", { length: 20 }),
  
  // Martial arts specific
  beltRank: mysqlEnum("beltRank", ["white", "yellow", "orange", "green", "blue", "purple", "brown", "red", "black"]).default("white").notNull(),
  stripes: int("stripes").default(0).notNull(),
  program: varchar("program", { length: 100 }),
  
  // ABC categorization
  category: mysqlEnum("category", ["A", "B", "C"]).default("B").notNull(),
  
  // Status and billing
  status: mysqlEnum("status", ["active", "inactive", "trial", "frozen"]).default("active").notNull(),
  membershipType: varchar("membershipType", { length: 100 }),
  monthlyRate: int("monthlyRate").default(0),
  credits: int("credits").default(0),
  lastPaymentDate: timestamp("lastPaymentDate"),
  paymentStatus: mysqlEnum("paymentStatus", ["current", "late", "overdue"]).default("current"),
  
  // Guardian info (for minors)
  guardianName: varchar("guardianName", { length: 200 }),
  guardianPhone: varchar("guardianPhone", { length: 20 }),
  guardianEmail: varchar("guardianEmail", { length: 320 }),
  guardianRelation: varchar("guardianRelation", { length: 50 }),
  
  // Profile
  photoUrl: text("photoUrl"),
  notes: text("notes"),
  
  // Multi-location support
  locationId: int("locationId"),
  
  joinDate: timestamp("joinDate").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Student = typeof students.$inferSelect;
export type InsertStudent = typeof students.$inferInsert;

/**
 * Leads table for prospect management
 */
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  
  // Lead pipeline stage
  stage: mysqlEnum("stage", [
    "new",
    "contacted",
    "appointment_set",
    "trial_scheduled",
    "trial_completed",
    "proposal_sent",
    "negotiation",
    "won",
    "lost"
  ]).default("new").notNull(),
  
  // Lead source and interest
  source: varchar("source", { length: 100 }),
  interestedProgram: varchar("interestedProgram", { length: 100 }),
  notes: text("notes"),
  
  // Assignment
  assignedTo: int("assignedTo"),
  
  // Contact tracking
  lastContactDate: timestamp("lastContactDate"),
  nextFollowUpDate: timestamp("nextFollowUpDate"),
  
  // Multi-location support
  locationId: int("locationId"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

/**
 * Kai Command conversations
 */
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }),
  
  // Smart collections
  collection: varchar("collection", { length: 100 }),
  isPinned: boolean("isPinned").default(false),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

/**
 * Kai Command messages
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  
  // For file/image processing
  attachments: json("attachments"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Locations for multi-location support
 */
export const locations = mysqlTable("locations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zipCode: varchar("zipCode", { length: 20 }),
  phone: varchar("phone", { length: 20 }),
  latitude: varchar("latitude", { length: 20 }),
  longitude: varchar("longitude", { length: 20 }),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Location = typeof locations.$inferSelect;
export type InsertLocation = typeof locations.$inferInsert;

import { eq, desc, asc, and, like, sql, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  students, InsertStudent, Student,
  leads, InsertLead, Lead,
  conversations, InsertConversation,
  messages, InsertMessage,
  locations
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USER OPERATIONS ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ STUDENT OPERATIONS ============

export async function getAllStudents() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(students).orderBy(asc(students.lastName), asc(students.firstName));
}

export async function getStudentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(students).where(eq(students.id, id)).limit(1);
  return result[0];
}

export async function createStudent(student: InsertStudent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(students).values(student);
  return { id: result[0].insertId };
}

export async function updateStudent(id: number, data: Partial<InsertStudent>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(students).set(data).where(eq(students.id, id));
}

export async function deleteStudent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(students).where(eq(students.id, id));
}

export async function getStudentStats() {
  const db = await getDb();
  if (!db) return { total: 0, active: 0, trial: 0, inactive: 0, frozen: 0, latePayers: 0, categoryA: 0, categoryB: 0, categoryC: 0 };
  
  const allStudents = await db.select().from(students);
  
  return {
    total: allStudents.length,
    active: allStudents.filter(s => s.status === 'active').length,
    trial: allStudents.filter(s => s.status === 'trial').length,
    inactive: allStudents.filter(s => s.status === 'inactive').length,
    frozen: allStudents.filter(s => s.status === 'frozen').length,
    latePayers: allStudents.filter(s => s.paymentStatus === 'late' || s.paymentStatus === 'overdue').length,
    categoryA: allStudents.filter(s => s.category === 'A').length,
    categoryB: allStudents.filter(s => s.category === 'B').length,
    categoryC: allStudents.filter(s => s.category === 'C').length,
  };
}

export async function getBeltDistribution() {
  const db = await getDb();
  if (!db) return [];
  
  const allStudents = await db.select().from(students);
  const beltCounts: Record<string, number> = {};
  
  allStudents.forEach(s => {
    beltCounts[s.beltRank] = (beltCounts[s.beltRank] || 0) + 1;
  });
  
  return Object.entries(beltCounts).map(([belt, count]) => ({ belt, count }));
}

// ============ LEAD OPERATIONS ============

export async function getAllLeads() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leads).orderBy(desc(leads.createdAt));
}

export async function getLeadById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  return result[0];
}

export async function createLead(lead: InsertLead) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(leads).values(lead);
  return { id: result[0].insertId };
}

export async function updateLead(id: number, data: Partial<InsertLead>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(leads).set(data).where(eq(leads.id, id));
}

export async function deleteLead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(leads).where(eq(leads.id, id));
}

export async function getLeadsByStage() {
  const db = await getDb();
  if (!db) return {};
  
  const allLeads = await db.select().from(leads);
  const byStage: Record<string, Lead[]> = {};
  
  allLeads.forEach(lead => {
    if (!byStage[lead.stage]) byStage[lead.stage] = [];
    byStage[lead.stage].push(lead);
  });
  
  return byStage;
}

// ============ CONVERSATION OPERATIONS ============

export async function getConversationsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(conversations).where(eq(conversations.userId, userId)).orderBy(desc(conversations.updatedAt));
}

export async function createConversation(conv: InsertConversation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(conversations).values(conv);
  return { id: result[0].insertId };
}

export async function updateConversation(id: number, data: Partial<InsertConversation>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(conversations).set({ ...data, updatedAt: new Date() }).where(eq(conversations.id, id));
}

export async function deleteConversation(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(messages).where(eq(messages.conversationId, id));
  await db.delete(conversations).where(eq(conversations.id, id));
}

// ============ MESSAGE OPERATIONS ============

export async function getMessagesByConversation(conversationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(asc(messages.createdAt));
}

export async function createMessage(msg: InsertMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(messages).values(msg);
  
  // Update conversation timestamp
  await db.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, msg.conversationId));
  
  return { id: result[0].insertId };
}

// ============ LOCATION OPERATIONS ============

export async function getAllLocations() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(locations).orderBy(asc(locations.name));
}

// ============ KAI COMMAND DATA ACCESS ============

export async function getKaiDataSummary() {
  const db = await getDb();
  if (!db) return null;
  
  const allStudents = await db.select().from(students);
  const allLeads = await db.select().from(leads);
  
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  return {
    students: {
      total: allStudents.length,
      active: allStudents.filter(s => s.status === 'active').length,
      trial: allStudents.filter(s => s.status === 'trial').length,
      inactive: allStudents.filter(s => s.status === 'inactive').length,
      frozen: allStudents.filter(s => s.status === 'frozen').length,
    },
    billing: {
      latePayers: allStudents.filter(s => s.paymentStatus === 'late').length,
      overdue: allStudents.filter(s => s.paymentStatus === 'overdue').length,
      current: allStudents.filter(s => s.paymentStatus === 'current').length,
      totalMonthlyRevenue: allStudents.filter(s => s.status === 'active').reduce((sum, s) => sum + (s.monthlyRate || 0), 0),
    },
    categories: {
      A: allStudents.filter(s => s.category === 'A').length,
      B: allStudents.filter(s => s.category === 'B').length,
      C: allStudents.filter(s => s.category === 'C').length,
    },
    belts: {
      white: allStudents.filter(s => s.beltRank === 'white').length,
      yellow: allStudents.filter(s => s.beltRank === 'yellow').length,
      orange: allStudents.filter(s => s.beltRank === 'orange').length,
      green: allStudents.filter(s => s.beltRank === 'green').length,
      blue: allStudents.filter(s => s.beltRank === 'blue').length,
      purple: allStudents.filter(s => s.beltRank === 'purple').length,
      brown: allStudents.filter(s => s.beltRank === 'brown').length,
      red: allStudents.filter(s => s.beltRank === 'red').length,
      black: allStudents.filter(s => s.beltRank === 'black').length,
    },
    leads: {
      total: allLeads.length,
      new: allLeads.filter(l => l.stage === 'new').length,
      contacted: allLeads.filter(l => l.stage === 'contacted').length,
      trialScheduled: allLeads.filter(l => l.stage === 'trial_scheduled').length,
      won: allLeads.filter(l => l.stage === 'won').length,
      lost: allLeads.filter(l => l.stage === 'lost').length,
    },
    latePayerDetails: allStudents
      .filter(s => s.paymentStatus === 'late' || s.paymentStatus === 'overdue')
      .map(s => ({ id: s.id, name: `${s.firstName} ${s.lastName}`, status: s.paymentStatus, monthlyRate: s.monthlyRate })),
  };
}

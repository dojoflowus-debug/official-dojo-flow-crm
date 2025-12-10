import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, staffPins, InsertStaffPin } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
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

/**
 * Get all active staff PINs
 */
export async function getActiveStaffPins() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get staff PINs: database not available");
    return [];
  }

  const result = await db.select().from(staffPins).where(eq(staffPins.isActive, 1));
  return result;
}

/**
 * Get staff PIN by ID
 */
export async function getStaffPinById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get staff PIN: database not available");
    return undefined;
  }

  const result = await db.select().from(staffPins).where(eq(staffPins.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Update last used timestamp for a staff PIN
 */
export async function updateStaffPinLastUsed(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update staff PIN: database not available");
    return;
  }

  await db.update(staffPins)
    .set({ lastUsed: new Date() })
    .where(eq(staffPins.id, id));
}

/**
 * Create a new staff PIN
 */
export async function createStaffPin(pin: InsertStaffPin) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create staff PIN: database not available");
    return;
  }

  await db.insert(staffPins).values(pin);
}

/**
 * Get all staff PINs (active and inactive)
 */
export async function getAllStaffPins() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get staff PINs: database not available");
    return [];
  }

  const result = await db.select().from(staffPins);
  return result;
}

/**
 * Update a staff PIN
 */
export async function updateStaffPin(id: number, updates: Partial<InsertStaffPin>) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update staff PIN: database not available");
    return;
  }

  await db.update(staffPins)
    .set(updates)
    .where(eq(staffPins.id, id));
}

/**
 * Toggle staff PIN active status
 */
export async function toggleStaffPinActive(id: number, isActive: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot toggle staff PIN: database not available");
    return;
  }

  await db.update(staffPins)
    .set({ isActive })
    .where(eq(staffPins.id, id));
}

/**
 * Delete a staff PIN
 */
export async function deleteStaffPin(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete staff PIN: database not available");
    return;
  }

  await db.delete(staffPins).where(eq(staffPins.id, id));
}


/**
 * CRM Dashboard Helper Functions
 */

// Get dashboard statistics
export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return null;
  
  const { students, leads, classes } = await import("../drizzle/schema");
  const { eq, count } = await import("drizzle-orm");
  
  const totalStudents = await db.select({ count: count() }).from(students).where(eq(students.status, 'Active'));
  const totalLeads = await db.select({ count: count() }).from(leads);
  const todaysClasses = await db.select().from(classes).where(eq(classes.isActive, 1)).limit(10);
  
  return {
    total_students: totalStudents[0]?.count || 0,
    monthly_revenue: 12500, // TODO: Calculate from billing data
    total_leads: totalLeads[0]?.count || 0,
    todays_classes: todaysClasses.map(c => ({
      name: c.name,
      time: c.time,
      enrolled: c.enrolled
    }))
  };
}

// Get kiosk check-ins
export async function getKioskCheckIns() {
  const db = await getDb();
  if (!db) return [];
  
  const { kioskCheckIns } = await import("../drizzle/schema");
  const { gte } = await import("drizzle-orm");
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const checkIns = await db.select().from(kioskCheckIns).where(gte(kioskCheckIns.timestamp, today));
  return checkIns;
}

// Get kiosk visitors
export async function getKioskVisitors() {
  const db = await getDb();
  if (!db) return [];
  
  const { kioskVisitors } = await import("../drizzle/schema");
  const { gte } = await import("drizzle-orm");
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const visitors = await db.select().from(kioskVisitors).where(gte(kioskVisitors.timestamp, today));
  return visitors;
}

// Get kiosk waivers
export async function getKioskWaivers() {
  const db = await getDb();
  if (!db) return [];
  
  const { kioskWaivers } = await import("../drizzle/schema");
  const { gte } = await import("drizzle-orm");
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const waivers = await db.select().from(kioskWaivers).where(gte(kioskWaivers.timestamp, today));
  return waivers;
}

// Search students by name, phone, or email
export async function searchStudents(query: string) {
  const db = await getDb();
  if (!db) return [];
  
  const { students } = await import("../drizzle/schema");
  const { or, like } = await import("drizzle-orm");
  
  const searchPattern = `%${query}%`;
  const results = await db.select().from(students).where(
    or(
      like(students.firstName, searchPattern),
      like(students.lastName, searchPattern),
      like(students.email, searchPattern),
      like(students.phone, searchPattern)
    )
  ).limit(10);
  
  return results;
}

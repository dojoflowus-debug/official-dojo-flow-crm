import { getDb } from "./db";
import { ownerProfiles } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export type OwnerProfile = typeof ownerProfiles.$inferSelect;
export type InsertOwnerProfile = typeof ownerProfiles.$inferInsert;

/**
 * Get owner profile by organization ID
 */
export async function getOwnerProfileByOrgId(organizationId: number): Promise<OwnerProfile | null> {
  const db = await getDb();
  if (!db) return null;
  
  const [profile] = await db
    .select()
    .from(ownerProfiles)
    .where(eq(ownerProfiles.organizationId, organizationId))
    .limit(1);
  
  return profile || null;
}

/**
 * Create owner profile
 */
export async function createOwnerProfile(data: InsertOwnerProfile): Promise<OwnerProfile> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(ownerProfiles).values(data);
  
  // Fetch the created profile
  const [created] = await db
    .select()
    .from(ownerProfiles)
    .where(eq(ownerProfiles.organizationId, data.organizationId))
    .limit(1);
  
  return created;
}

/**
 * Update owner profile
 */
export async function updateOwnerProfile(
  organizationId: number,
  data: Partial<InsertOwnerProfile>
): Promise<OwnerProfile | null> {
  const db = await getDb();
  if (!db) return null;
  
  await db
    .update(ownerProfiles)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(ownerProfiles.organizationId, organizationId));
  
  return getOwnerProfileByOrgId(organizationId);
}

/**
 * Delete owner profile
 */
export async function deleteOwnerProfile(organizationId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db
    .delete(ownerProfiles)
    .where(eq(ownerProfiles.organizationId, organizationId));
}

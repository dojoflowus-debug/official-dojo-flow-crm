import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { schoolProfiles } from "../drizzle/schema";

export interface SchoolProfileData {
  schoolName: string;
  displayName?: string | null;
  tagline?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  addressStreet?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  addressPostal?: string | null;
  addressCountry?: string | null;
  logoLightUrl?: string | null;
  logoDarkUrl?: string | null;
  timezone?: string | null;
  currency?: string | null;
}

/**
 * Get school profile for an organization
 * Creates empty profile if none exists
 */
export async function getSchoolProfile(organizationId: number) {
  const db = getDb();
  
  const [profile] = await db
    .select()
    .from(schoolProfiles)
    .where(eq(schoolProfiles.organizationId, organizationId))
    .limit(1);
  
  if (!profile) {
    // Create default profile for the organization
    const [newProfile] = await db
      .insert(schoolProfiles)
      .values({
        organizationId,
        schoolName: "My Dojo",
      })
      .$returningId();
    
    // Fetch the newly created profile
    const [created] = await db
      .select()
      .from(schoolProfiles)
      .where(eq(schoolProfiles.id, newProfile.id))
      .limit(1);
    
    return created;
  }
  
  return profile;
}

/**
 * Upsert school profile for an organization
 */
export async function upsertSchoolProfile(
  organizationId: number,
  data: SchoolProfileData
) {
  const db = getDb();
  
  // Check if profile exists
  const [existing] = await db
    .select({ id: schoolProfiles.id })
    .from(schoolProfiles)
    .where(eq(schoolProfiles.organizationId, organizationId))
    .limit(1);
  
  if (existing) {
    // Update existing profile
    await db
      .update(schoolProfiles)
      .set({
        schoolName: data.schoolName,
        displayName: data.displayName,
        tagline: data.tagline,
        phone: data.phone,
        email: data.email,
        website: data.website,
        addressStreet: data.addressStreet,
        addressCity: data.addressCity,
        addressState: data.addressState,
        addressPostal: data.addressPostal,
        addressCountry: data.addressCountry,
        logoLightUrl: data.logoLightUrl,
        logoDarkUrl: data.logoDarkUrl,
        timezone: data.timezone,
        currency: data.currency,
      })
      .where(eq(schoolProfiles.organizationId, organizationId));
    
    // Return updated profile
    const [updated] = await db
      .select()
      .from(schoolProfiles)
      .where(eq(schoolProfiles.organizationId, organizationId))
      .limit(1);
    
    return updated;
  } else {
    // Insert new profile
    const [newProfile] = await db
      .insert(schoolProfiles)
      .values({
        organizationId,
        schoolName: data.schoolName,
        displayName: data.displayName,
        tagline: data.tagline,
        phone: data.phone,
        email: data.email,
        website: data.website,
        addressStreet: data.addressStreet,
        addressCity: data.addressCity,
        addressState: data.addressState,
        addressPostal: data.addressPostal,
        addressCountry: data.addressCountry,
        logoLightUrl: data.logoLightUrl,
        logoDarkUrl: data.logoDarkUrl,
        timezone: data.timezone,
        currency: data.currency,
      })
      .$returningId();
    
    // Fetch the newly created profile
    const [created] = await db
      .select()
      .from(schoolProfiles)
      .where(eq(schoolProfiles.id, newProfile.id))
      .limit(1);
    
    return created;
  }
}

/**
 * Update logo URL for a school profile
 */
export async function updateSchoolLogo(
  organizationId: number,
  type: "light" | "dark",
  url: string | null
) {
  const db = getDb();
  
  const updateData = type === "light" 
    ? { logoLightUrl: url }
    : { logoDarkUrl: url };
  
  await db
    .update(schoolProfiles)
    .set(updateData)
    .where(eq(schoolProfiles.organizationId, organizationId));
  
  // Return updated profile
  const [updated] = await db
    .select()
    .from(schoolProfiles)
    .where(eq(schoolProfiles.organizationId, organizationId))
    .limit(1);
  
  return updated;
}

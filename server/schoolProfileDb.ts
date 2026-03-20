import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { schoolProfiles } from "../drizzle/schema";

export interface SchoolProfileData {
  schoolName?: string;
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
  logoIconLightUrl?: string | null;
  logoIconDarkUrl?: string | null;
  logoLightData?: string | null;
  logoDarkData?: string | null;
  brandColorPrimary?: string | null;
  brandColorSecondary?: string | null;
  brandColorTertiary?: string | null;
  timezone?: string | null;
  currency?: string | null;
}

/**
 * Get school profile for an organization
 * Creates empty profile if none exists
 */
export async function getSchoolProfile(organizationId: number) {
  const db = await getDb();
  
  if (!db) {
    console.error('[SchoolProfile] Database not available');
    throw new Error('Database not available');
  }
  
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
  const db = await getDb();
  
  if (!db) {
    console.error('[SchoolProfile] Database not available');
    throw new Error('Database not available');
  }
  
  // Check if profile exists
  const [existing] = await db
    .select({ id: schoolProfiles.id })
    .from(schoolProfiles)
    .where(eq(schoolProfiles.organizationId, organizationId))
    .limit(1);
  
  if (existing) {
    // Update existing profile — only include fields that are explicitly provided
    const updateFields: Record<string, unknown> = {};
    if (data.schoolName !== undefined) updateFields.schoolName = data.schoolName;
    if (data.displayName !== undefined) updateFields.displayName = data.displayName;
    if (data.tagline !== undefined) updateFields.tagline = data.tagline;
    if (data.phone !== undefined) updateFields.phone = data.phone;
    if (data.email !== undefined) updateFields.email = data.email;
    if (data.website !== undefined) updateFields.website = data.website;
    if (data.addressStreet !== undefined) updateFields.addressStreet = data.addressStreet;
    if (data.addressCity !== undefined) updateFields.addressCity = data.addressCity;
    if (data.addressState !== undefined) updateFields.addressState = data.addressState;
    if (data.addressPostal !== undefined) updateFields.addressPostal = data.addressPostal;
    if (data.addressCountry !== undefined) updateFields.addressCountry = data.addressCountry;
    if (data.logoLightUrl !== undefined) updateFields.logoLightUrl = data.logoLightUrl;
    if (data.logoDarkUrl !== undefined) updateFields.logoDarkUrl = data.logoDarkUrl;
    if (data.logoIconLightUrl !== undefined) updateFields.logoIconLightUrl = data.logoIconLightUrl;
    if (data.logoIconDarkUrl !== undefined) updateFields.logoIconDarkUrl = data.logoIconDarkUrl;
    if (data.logoLightData !== undefined) updateFields.logoLightData = data.logoLightData;
    if (data.logoDarkData !== undefined) updateFields.logoDarkData = data.logoDarkData;
    if (data.brandColorPrimary !== undefined) updateFields.brandColorPrimary = data.brandColorPrimary;
    if (data.brandColorSecondary !== undefined) updateFields.brandColorSecondary = data.brandColorSecondary;
    if (data.brandColorTertiary !== undefined) updateFields.brandColorTertiary = data.brandColorTertiary;
    if (data.timezone !== undefined) updateFields.timezone = data.timezone;
    if (data.currency !== undefined) updateFields.currency = data.currency;
    
    if (Object.keys(updateFields).length > 0) {
      await db
        .update(schoolProfiles)
        .set(updateFields as any)
        .where(eq(schoolProfiles.organizationId, organizationId));
    }
    
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
        logoIconLightUrl: data.logoIconLightUrl,
        logoIconDarkUrl: data.logoIconDarkUrl,
        logoLightData: data.logoLightData,
        logoDarkData: data.logoDarkData,
        brandColorPrimary: data.brandColorPrimary,
        brandColorSecondary: data.brandColorSecondary,
        brandColorTertiary: data.brandColorTertiary,
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
  type: "light" | "dark" | "icon-light" | "icon-dark",
  url: string | null
) {
  const db = await getDb();
  
  if (!db) {
    console.error('[SchoolProfile] Database not available');
    throw new Error('Database not available');
  }
  
  const updateData = 
    type === "light" ? { logoLightUrl: url } :
    type === "dark" ? { logoDarkUrl: url } :
    type === "icon-light" ? { logoIconLightUrl: url } :
    { logoIconDarkUrl: url };
  
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

/**
 * Trial Management Service
 * 
 * Handles trial account creation, expiration checking, and trial-related operations.
 * Manages 7-day trial periods for new organizations.
 */

import { getDb } from '../db';
import { organizations, users, aiCreditBalance } from '../../drizzle/schema';
import { eq, and, lt, gt } from 'drizzle-orm';

export interface TrialCreationData {
  organizationName: string;
  ownerEmail: string;
  ownerName: string;
  businessType?: string;
  studentCount?: string;
  locationCount?: string;
  timezone?: string;
}

export interface TrialStatus {
  isTrialing: boolean;
  trialEndsAt?: string;
  daysRemaining?: number;
  isExpired: boolean;
}

export interface TrialCreationResult {
  success: boolean;
  message: string;
  organizationId?: number;
  userId?: number;
  trialEndsAt?: string;
  error?: string;
}

/**
 * Calculate trial end date (7 days from now)
 */
export function calculateTrialEndDate(): Date {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 7);
  return endDate;
}

/**
 * Create a new trial organization and user account
 */
export async function createTrialAccount(data: TrialCreationData): Promise<TrialCreationResult> {
  const db = await getDb();
  if (!db) return { success: false, message: 'Database not available', error: 'DB_UNAVAILABLE' };

  try {
    // Calculate trial end date
    const trialEndsAt = calculateTrialEndDate();

    // Create organization with trial status
    const orgResult = await db.insert(organizations).values({
      name: data.organizationName,
      timezone: data.timezone || 'America/New_York',
      subscriptionStatus: 'trial',
      trialEndsAt: trialEndsAt.toISOString(),
      onboardingStatus: 'in_progress',
      onboardingProfile: JSON.stringify({
        businessType: data.businessType,
        studentCount: data.studentCount,
        locationCount: data.locationCount,
      }),
    });

    const organizationId = orgResult.insertId;

    // Create user account for organization owner
    const userResult = await db.insert(users).values({
      email: data.ownerEmail,
      name: data.ownerName,
      organizationId: organizationId,
      role: 'owner',
      emailVerified: 0, // Email not verified yet
      isActive: 1,
    });

    const userId = userResult.insertId;

    // Initialize credit balance for trial organization (1000 starter credits)
    await db.insert(aiCreditBalance).values({
      organizationId: organizationId,
      balance: 1000, // 1000 starter credits for trial
      periodAllowance: 1000,
      periodUsed: 0,
      totalPurchased: 0,
      totalUsed: 0,
    });

    return {
      success: true,
      message: 'Trial account created successfully',
      organizationId,
      userId,
      trialEndsAt: trialEndsAt.toISOString(),
    };
  } catch (error) {
    console.error('Error creating trial account:', error);
    return {
      success: false,
      message: 'Failed to create trial account',
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Get trial status for an organization
 */
export async function getTrialStatus(organizationId: number): Promise<TrialStatus> {
  const db = await getDb();
  if (!db) return { isTrialing: false, isExpired: false };

  try {
    const org = await db
      .select({
        subscriptionStatus: organizations.subscriptionStatus,
        trialEndsAt: organizations.trialEndsAt,
      })
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);

    if (org.length === 0) {
      return { isTrialing: false, isExpired: false };
    }

    const orgData = org[0];
    const isTrialing = orgData.subscriptionStatus === 'trial';

    if (!isTrialing || !orgData.trialEndsAt) {
      return { isTrialing: false, isExpired: false };
    }

    const trialEndDate = new Date(orgData.trialEndsAt);
    const now = new Date();
    const isExpired = now > trialEndDate;
    const daysRemaining = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      isTrialing: true,
      trialEndsAt: orgData.trialEndsAt,
      daysRemaining: Math.max(0, daysRemaining),
      isExpired,
    };
  } catch (error) {
    console.error('Error getting trial status:', error);
    return { isTrialing: false, isExpired: false };
  }
}

/**
 * Check if trial has expired and update organization status if needed
 */
export async function checkAndUpdateTrialExpiration(organizationId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const org = await db
      .select({
        subscriptionStatus: organizations.subscriptionStatus,
        trialEndsAt: organizations.trialEndsAt,
      })
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);

    if (org.length === 0 || org[0].subscriptionStatus !== 'trial' || !org[0].trialEndsAt) {
      return false;
    }

    const trialEndDate = new Date(org[0].trialEndsAt);
    const now = new Date();

    if (now > trialEndDate) {
      // Trial has expired, update organization status
      await db
        .update(organizations)
        .set({ subscriptionStatus: 'inactive' })
        .where(eq(organizations.id, organizationId));

      return true; // Trial expired
    }

    return false; // Trial still active
  } catch (error) {
    console.error('Error checking trial expiration:', error);
    return false;
  }
}

/**
 * Extend trial period by specified days
 */
export async function extendTrial(organizationId: number, additionalDays: number = 7): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const org = await db
      .select({ trialEndsAt: organizations.trialEndsAt })
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);

    if (org.length === 0 || !org[0].trialEndsAt) {
      return false;
    }

    const currentEndDate = new Date(org[0].trialEndsAt);
    const newEndDate = new Date(currentEndDate.getTime() + additionalDays * 24 * 60 * 60 * 1000);

    await db
      .update(organizations)
      .set({ trialEndsAt: newEndDate.toISOString() })
      .where(eq(organizations.id, organizationId));

    return true;
  } catch (error) {
    console.error('Error extending trial:', error);
    return false;
  }
}

/**
 * Convert trial to paid subscription
 */
export async function convertTrialToPaid(organizationId: number, planId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db
      .update(organizations)
      .set({
        subscriptionStatus: 'active',
        planId: planId,
        trialEndsAt: null,
      })
      .where(eq(organizations.id, organizationId));

    return true;
  } catch (error) {
    console.error('Error converting trial to paid:', error);
    return false;
  }
}

/**
 * Get all expiring trials (within specified days)
 */
export async function getExpiringTrials(withinDays: number = 1): Promise<Array<{ organizationId: number; organizationName: string; trialEndsAt: string; daysRemaining: number }>> {
  const db = await getDb();
  if (!db) return [];

  try {
    const now = new Date();
    const futureDate = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);

    const expiringOrgs = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        trialEndsAt: organizations.trialEndsAt,
      })
      .from(organizations)
      .where(
        and(
          eq(organizations.subscriptionStatus, 'trial'),
          gt(organizations.trialEndsAt, now.toISOString()),
          lt(organizations.trialEndsAt, futureDate.toISOString())
        )
      );

    return expiringOrgs.map((org) => ({
      organizationId: org.id,
      organizationName: org.name,
      trialEndsAt: org.trialEndsAt || '',
      daysRemaining: Math.ceil((new Date(org.trialEndsAt || '').getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    }));
  } catch (error) {
    console.error('Error getting expiring trials:', error);
    return [];
  }
}

/**
 * Get trial statistics
 */
export async function getTrialStatistics(): Promise<{
  totalTrials: number;
  activeTrials: number;
  expiredTrials: number;
  expiringWithin7Days: number;
}> {
  const db = await getDb();
  if (!db) return { totalTrials: 0, activeTrials: 0, expiredTrials: 0, expiringWithin7Days: 0 };

  try {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const allTrials = await db
      .select({ trialEndsAt: organizations.trialEndsAt })
      .from(organizations)
      .where(eq(organizations.subscriptionStatus, 'trial'));

    const activeTrials = allTrials.filter((org) => org.trialEndsAt && new Date(org.trialEndsAt) > now).length;
    const expiredTrials = allTrials.filter((org) => org.trialEndsAt && new Date(org.trialEndsAt) <= now).length;
    const expiringWithin7Days = allTrials.filter(
      (org) => org.trialEndsAt && new Date(org.trialEndsAt) > now && new Date(org.trialEndsAt) <= sevenDaysFromNow
    ).length;

    return {
      totalTrials: allTrials.length,
      activeTrials,
      expiredTrials,
      expiringWithin7Days,
    };
  } catch (error) {
    console.error('Error getting trial statistics:', error);
    return { totalTrials: 0, activeTrials: 0, expiredTrials: 0, expiringWithin7Days: 0 };
  }
}

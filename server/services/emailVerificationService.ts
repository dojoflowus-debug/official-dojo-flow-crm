/**
 * Email Verification Service
 * 
 * Handles email verification token generation, validation, and management
 * for trial sign-ups and account verification.
 */

import crypto from 'crypto';
import { getDb } from '../db';
import { emailVerificationTokens, users } from '../../drizzle/schema';
import { eq, and, lt, gt } from 'drizzle-orm';

interface VerificationTokenData {
  userId: number;
  email: string;
  expiresInHours?: number;
}

interface VerificationResult {
  success: boolean;
  message: string;
  userId?: number;
  email?: string;
}

/**
 * Generate a verification token for email verification
 */
export async function generateVerificationToken(data: VerificationTokenData): Promise<{ token: string; tokenHash: string; expiresAt: string }> {
  const expiresInHours = data.expiresInHours || 24;
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expiresInHours);
  
  return {
    token,
    tokenHash,
    expiresAt: expiresAt.toISOString(),
  };
}

/**
 * Create a new verification token record
 */
export async function createVerificationToken(data: VerificationTokenData): Promise<{ token: string; tokenHash: string; expiresAt: string }> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const tokenData = await generateVerificationToken(data);
  
  // Delete any existing tokens for this user
  await db
    .delete(emailVerificationTokens)
    .where(eq(emailVerificationTokens.userId, data.userId));
  
  // Create new token
  await db.insert(emailVerificationTokens).values({
    userId: data.userId,
    email: data.email,
    token: tokenData.token,
    tokenHash: tokenData.tokenHash,
    expiresAt: tokenData.expiresAt,
  });
  
  return tokenData;
}

/**
 * Verify an email verification token
 */
export async function verifyEmailToken(token: string): Promise<VerificationResult> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  
  // Find the token record
  const tokenRecord = await db
    .select()
    .from(emailVerificationTokens)
    .where(
      and(
        eq(emailVerificationTokens.tokenHash, tokenHash),
        eq(emailVerificationTokens.verifiedAt, null),
        gt(emailVerificationTokens.expiresAt, new Date().toISOString())
      )
    )
    .limit(1);
  
  if (tokenRecord.length === 0) {
    return {
      success: false,
      message: 'Invalid or expired verification token',
    };
  }
  
  const record = tokenRecord[0];
  
  // Check attempt limit
  if (record.attempts >= record.maxAttempts) {
    return {
      success: false,
      message: 'Maximum verification attempts exceeded. Please request a new verification link.',
    };
  }
  
  // Mark token as verified
  await db
    .update(emailVerificationTokens)
    .set({
      verifiedAt: new Date().toISOString(),
      attempts: record.attempts + 1,
    })
    .where(eq(emailVerificationTokens.id, record.id));
  
  // Update user emailVerified flag
  await db
    .update(users)
    .set({ emailVerified: 1 })
    .where(eq(users.id, record.userId));
  
  return {
    success: true,
    message: 'Email verified successfully',
    userId: record.userId,
    email: record.email,
  };
}

/**
 * Check if an email is verified
 */
export async function isEmailVerified(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const user = await db
    .select({ emailVerified: users.emailVerified })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  return user.length > 0 && user[0].emailVerified === 1;
}

/**
 * Get pending verification token for user
 */
export async function getPendingVerificationToken(userId: number): Promise<{ token: string; expiresAt: string } | null> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const tokenRecord = await db
    .select()
    .from(emailVerificationTokens)
    .where(
      and(
        eq(emailVerificationTokens.userId, userId),
        eq(emailVerificationTokens.verifiedAt, null),
        gt(emailVerificationTokens.expiresAt, new Date().toISOString())
      )
    )
    .limit(1);
  
  if (tokenRecord.length === 0) return null;
  
  return {
    token: tokenRecord[0].token,
    expiresAt: tokenRecord[0].expiresAt,
  };
}

/**
 * Resend verification token (creates new token if old one expired)
 */
export async function resendVerificationToken(userId: number, email: string): Promise<{ token: string; expiresAt: string }> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  // Check if user already has a valid pending token
  const existingToken = await getPendingVerificationToken(userId);
  if (existingToken) {
    return existingToken;
  }
  
  // Create new token
  return await createVerificationToken({
    userId,
    email,
    expiresInHours: 24,
  });
}

/**
 * Clean up expired verification tokens (scheduled task)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const result = await db
    .delete(emailVerificationTokens)
    .where(
      and(
        lt(emailVerificationTokens.expiresAt, new Date().toISOString()),
        eq(emailVerificationTokens.verifiedAt, null)
      )
    );
  
  return result.rowsAffected || 0;
}

/**
 * Get verification status for user
 */
export async function getVerificationStatus(userId: number): Promise<{
  isVerified: boolean;
  hasPendingToken: boolean;
  tokenExpiresAt?: string;
  attempts?: number;
}> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const user = await db
    .select({ emailVerified: users.emailVerified })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  if (user.length === 0) {
    return { isVerified: false, hasPendingToken: false };
  }
  
  const isVerified = user[0].emailVerified === 1;
  
  const pendingToken = await db
    .select()
    .from(emailVerificationTokens)
    .where(
      and(
        eq(emailVerificationTokens.userId, userId),
        eq(emailVerificationTokens.verifiedAt, null),
        gt(emailVerificationTokens.expiresAt, new Date().toISOString())
      )
    )
    .limit(1);
  
  if (pendingToken.length === 0) {
    return { isVerified, hasPendingToken: false };
  }
  
  return {
    isVerified,
    hasPendingToken: true,
    tokenExpiresAt: pendingToken[0].expiresAt,
    attempts: pendingToken[0].attempts,
  };
}

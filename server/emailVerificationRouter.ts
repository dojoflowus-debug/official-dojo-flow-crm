/**
 * Email Verification Router
 * 
 * TRPC routes for email verification operations including token generation,
 * verification, and status checking.
 */

import { router, protectedProcedure, publicProcedure } from './_core/trpc';
import { z } from 'zod';
import {
  createVerificationToken,
  verifyEmailToken,
  isEmailVerified,
  getPendingVerificationToken,
  resendVerificationToken,
  getVerificationStatus,
} from './services/emailVerificationService';
import { sendVerificationEmail } from './_core/email';

export const emailVerificationRouter = router({
  /**
   * Send verification email to user
   */
  sendVerificationEmail: protectedProcedure
    .input(z.object({
      email: z.string().email('Invalid email address'),
      userId: z.number().int().positive(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Create verification token
        const tokenData = await createVerificationToken({
          userId: input.userId,
          email: input.email,
          expiresInHours: 24,
        });

        // Send verification email
        const verificationLink = `${process.env.FRONTEND_URL || 'https://app.dojoflow.ai'}/verify-email?token=${tokenData.token}`;
        
        await sendVerificationEmail({
          to: input.email,
          verificationLink,
          expiresInHours: 24,
        });

        return {
          success: true,
          message: 'Verification email sent successfully',
          expiresAt: tokenData.expiresAt,
        };
      } catch (error) {
        console.error('Failed to send verification email:', error);
        return {
          success: false,
          message: 'Failed to send verification email. Please try again.',
        };
      }
    }),

  /**
   * Verify email with token
   */
  verifyEmail: publicProcedure
    .input(z.object({
      token: z.string().min(64, 'Invalid verification token'),
    }))
    .mutation(async ({ input }) => {
      try {
        const result = await verifyEmailToken(input.token);
        return result;
      } catch (error) {
        console.error('Email verification error:', error);
        return {
          success: false,
          message: 'An error occurred during email verification',
        };
      }
    }),

  /**
   * Check if user's email is verified
   */
  isEmailVerified: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const verified = await isEmailVerified(ctx.userId);
        return {
          isVerified: verified,
        };
      } catch (error) {
        console.error('Error checking email verification status:', error);
        return {
          isVerified: false,
        };
      }
    }),

  /**
   * Get verification status for current user
   */
  getVerificationStatus: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const status = await getVerificationStatus(ctx.userId);
        return status;
      } catch (error) {
        console.error('Error getting verification status:', error);
        return {
          isVerified: false,
          hasPendingToken: false,
        };
      }
    }),

  /**
   * Resend verification email
   */
  resendVerificationEmail: protectedProcedure
    .input(z.object({
      email: z.string().email('Invalid email address'),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Check if already verified
        const isVerified = await isEmailVerified(ctx.userId);
        if (isVerified) {
          return {
            success: false,
            message: 'Email is already verified',
          };
        }

        // Create new token
        const tokenData = await resendVerificationToken(ctx.userId, input.email);

        // Send verification email
        const verificationLink = `${process.env.FRONTEND_URL || 'https://app.dojoflow.ai'}/verify-email?token=${tokenData.token}`;
        
        await sendVerificationEmail({
          to: input.email,
          verificationLink,
          expiresInHours: 24,
        });

        return {
          success: true,
          message: 'Verification email resent successfully',
          expiresAt: tokenData.expiresAt,
        };
      } catch (error) {
        console.error('Failed to resend verification email:', error);
        return {
          success: false,
          message: 'Failed to resend verification email. Please try again.',
        };
      }
    }),

  /**
   * Get pending verification token (for testing/debugging)
   */
  getPendingToken: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const token = await getPendingVerificationToken(ctx.userId);
        if (!token) {
          return {
            hasPendingToken: false,
          };
        }
        return {
          hasPendingToken: true,
          token: token.token,
          expiresAt: token.expiresAt,
        };
      } catch (error) {
        console.error('Error getting pending token:', error);
        return {
          hasPendingToken: false,
        };
      }
    }),
});

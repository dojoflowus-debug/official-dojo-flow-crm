import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc.js";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcrypt";
import { getDb } from "./db.js";
import { users, organizations, organizationUsers, onboardingProgress } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";

/**
 * Kai Hero Onboarding Router
 * Handles quick signup flow from the Kai Command hero section
 */

export const kaiOnboardingRouter = router({
  /**
   * Quick signup from Kai hero cards
   * Creates account, organization, and logs user in
   */
  quickSignup: publicProcedure
    .input(
      z.object({
        // Step 1: School Information
        schoolName: z.string().min(1, "School name is required"),
        
        // Step 2: Owner Details
        ownerName: z.string().min(1, "Owner name is required"),
        ownerEmail: z.string().email("Valid email is required"),
        
        // Step 3: School Profile
        locationCount: z.enum(["1", "2-5", "6+"]),
        programs: z.array(z.string()).min(1, "At least one program is required"),
        
        // Step 4: Current Status
        studentCount: z.enum(["0-50", "51-100", "101-200", "201-500", "500+"]),
        
        // Category from selected card
        category: z.enum(["growth", "health", "billing", "retention"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      // Check if email already exists
      const existingUser = await db.select().from(users).where(eq(users.email, input.ownerEmail)).limit(1);
      
      if (existingUser.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists. Please sign in instead.",
        });
      }

      // Generate a temporary password (user will be prompted to set one later)
      const tempPassword = Math.random().toString(36).slice(-12);
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      // Create user record
      const [newUser] = await db.insert(users).values({
        name: input.ownerName,
        email: input.ownerEmail,
        password: passwordHash,
        role: "owner",
        loginMethod: "password",
      });

      const userId = newUser.insertId;

      // Create organization
      const [newOrg] = await db.insert(organizations).values({
        name: input.schoolName,
        timezone: "America/New_York", // Default timezone
        programs: JSON.stringify(input.programs),
        estimatedStudents: parseStudentCount(input.studentCount),
        planId: 1, // Default to Starter plan
        subscriptionStatus: "trial",
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
      });

      const organizationId = newOrg.insertId;

      // Link user to organization as owner
      await db.insert(organizationUsers).values({
        userId,
        organizationId,
        role: "owner",
        isPrimary: 1,
      });

      // Create onboarding progress record with category tag
      await db.insert(onboardingProgress).values({
        userId,
        currentStep: 5, // Completed
        isVerified: 1,
        isCompleted: 1,
        completedAt: new Date(),
        accountData: JSON.stringify({
          name: input.ownerName,
          email: input.ownerEmail,
        }),
        schoolData: JSON.stringify({
          schoolName: input.schoolName,
          locationCount: input.locationCount,
          programs: input.programs,
          studentCount: input.studentCount,
          category: input.category, // Store category for post-onboarding customization
        }),
      });

      return {
        success: true,
        userId,
        organizationId,
        category: input.category,
        message: "Account created successfully",
      };
    }),
});

/**
 * Helper: Parse student count range to estimated number
 */
function parseStudentCount(range: string): number {
  switch (range) {
    case "0-50":
      return 25;
    case "51-100":
      return 75;
    case "101-200":
      return 150;
    case "201-500":
      return 350;
    case "500+":
      return 750;
    default:
      return 50;
  }
}

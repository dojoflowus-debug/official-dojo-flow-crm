import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc.js";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcrypt";
import { getDb } from "./db.js";
import { users, organizations, organizationUsers, onboardingProgress } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";

/**
 * Kai Hero Onboarding Router
 * Handles the conversational onboarding flow from the Kai Command hero section
 */

export const kaiOnboardingRouter = router({
  /**
   * Quick signup from Kai conversational onboarding flow
   * Creates account, organization, and logs user in
   */
  quickSignup: publicProcedure
    .input(
      z.object({
        // Account credentials
        email: z.string().email("Valid email is required"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        schoolName: z.string().optional(),
        
        // Onboarding data from conversational flow
        businessType: z.enum(["martial_arts", "fitness", "yoga_dance", "personal_trainer", "other"]),
        locationCount: z.enum(["1", "2-5", "6+"]),
        studentCount: z.enum(["under_100", "100-300", "300+"]),
        focus: z.enum(["leads", "retention", "automation", "scaling"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      // Check if email already exists
      const existingUser = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      
      if (existingUser.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists. Please sign in instead.",
        });
      }

      // Hash the password
      const passwordHash = await bcrypt.hash(input.password, 10);

      // Create user record
      const [newUser] = await db.insert(users).values({
        name: input.schoolName || "New User",
        email: input.email,
        password: passwordHash,
        role: "owner",
        loginMethod: "password",
      });

      const userId = newUser.insertId;

      // Determine default school name based on business type
      const defaultSchoolName = getDefaultSchoolName(input.businessType);
      const schoolName = input.schoolName || defaultSchoolName;

      // Determine programs based on business type
      const programs = getDefaultPrograms(input.businessType);

      // Create organization
      const [newOrg] = await db.insert(organizations).values({
        name: schoolName,
        timezone: "America/New_York", // Default timezone
        programs: JSON.stringify(programs),
        estimatedStudents: parseStudentCount(input.studentCount),
        planId: 1, // Default to Starter plan
        subscriptionStatus: "trial",
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days trial
      });

      const organizationId = newOrg.insertId;

      // Link user to organization as owner
      await db.insert(organizationUsers).values({
        userId,
        organizationId,
        role: "owner",
        isPrimary: 1,
      });

      // Create onboarding progress record
      await db.insert(onboardingProgress).values({
        userId,
        currentStep: 1, // Start at step 1 for post-signup setup
        isVerified: 0,
        isCompleted: 0,
        accountData: JSON.stringify({
          email: input.email,
        }),
        schoolData: JSON.stringify({
          schoolName,
          businessType: input.businessType,
          locationCount: input.locationCount,
          studentCount: input.studentCount,
          focus: input.focus,
          programs,
        }),
      });

      return {
        success: true,
        userId,
        organizationId,
        businessType: input.businessType,
        message: "Account created successfully",
      };
    }),

  /**
   * Legacy quick signup (for backward compatibility with old hero cards)
   */
  legacyQuickSignup: publicProcedure
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
        estimatedStudents: parseLegacyStudentCount(input.studentCount),
        planId: 1, // Default to Starter plan
        subscriptionStatus: "trial",
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days trial
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
        completedAt:new Date().toISOString(),
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
 * Helper: Get default school name based on business type
 */
function getDefaultSchoolName(businessType: string): string {
  switch (businessType) {
    case "martial_arts":
      return "My Dojo";
    case "fitness":
      return "My Fitness Center";
    case "yoga_dance":
      return "My Studio";
    case "personal_trainer":
      return "My Training Business";
    default:
      return "My Business";
  }
}

/**
 * Helper: Get default programs based on business type
 */
function getDefaultPrograms(businessType: string): string[] {
  switch (businessType) {
    case "martial_arts":
      return ["Karate", "Kids Classes", "Adult Classes"];
    case "fitness":
      return ["Group Fitness", "Personal Training", "Cardio"];
    case "yoga_dance":
      return ["Yoga", "Dance", "Pilates"];
    case "personal_trainer":
      return ["Personal Training", "Group Sessions"];
    default:
      return ["General"];
  }
}

/**
 * Helper: Parse student count range to estimated number (new format)
 */
function parseStudentCount(range: string): number {
  switch (range) {
    case "under_100":
      return 50;
    case "100-300":
      return 200;
    case "300+":
      return 500;
    default:
      return 50;
  }
}

/**
 * Helper: Parse student count range to estimated number (legacy format)
 */
function parseLegacyStudentCount(range: string): number {
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

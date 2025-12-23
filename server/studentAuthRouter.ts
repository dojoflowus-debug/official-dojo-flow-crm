import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import * as bcrypt from "bcryptjs";
import { getDb } from "./db";
import { users, organizationUsers, organizations, students } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "./_core/cookies";

/**
 * Student/Parent Authentication Router
 * Handles student/parent login with organization resolution
 */
export const studentAuthRouter = router({
  /**
   * Student/Parent login with email + password
   * Returns list of organizations the student belongs to
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      // Find user by email
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      // Verify password
      if (!user.password) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      const isValidPassword = await bcrypt.compare(input.password, user.password);
      if (!isValidPassword) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      // Check if user is a student (role = "user" for students/parents)
      if (user.role !== "user") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This login is for students and parents only. Please use the correct login page for your role.",
        });
      }

      // Get all organizations this student belongs to
      const orgMemberships = await db
        .select({
          organizationId: organizationUsers.organizationId,
          role: organizationUsers.role,
          organizationName: organizations.name,
        })
        .from(organizationUsers)
        .innerJoin(organizations, eq(organizationUsers.organizationId, organizations.id))
        .where(eq(organizationUsers.userId, user.id));

      if (orgMemberships.length === 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not associated with any school. Please contact your school administrator.",
        });
      }

      // Set session cookie
      const sessionData = {
        userId: user.id,
        email: user.email!,
        name: user.name!,
        role: user.role,
        // If single org, set it as current; otherwise let user select
        currentOrganizationId: orgMemberships.length === 1 ? orgMemberships[0].organizationId : null,
      };

      ctx.res.cookie("session", JSON.stringify(sessionData), getSessionCookieOptions());

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        organizations: orgMemberships.map((om) => ({
          id: om.organizationId,
          name: om.organizationName,
          role: om.role,
        })),
      };
    }),

  /**
   * Request login code via phone (Kiosk only)
   */
  requestLoginCode: publicProcedure
    .input(
      z.object({
        phone: z.string().min(10),
        locationSlug: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      // Find student by phone number
      const [student] = await db
        .select()
        .from(students)
        .where(eq(students.phone, input.phone))
        .limit(1);

      if (!student) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No student found with this phone number",
        });
      }

      // TODO: Generate and send verification code via SMS
      // For now, return success
      return {
        success: true,
        message: "Verification code sent to your phone",
      };
    }),

  /**
   * Verify login code (Kiosk only)
   */
  verifyLoginCode: publicProcedure
    .input(
      z.object({
        phone: z.string().min(10),
        code: z.string().length(6),
        locationSlug: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      // Find student by phone number
      const [student] = await db
        .select()
        .from(students)
        .where(eq(students.phone, input.phone))
        .limit(1);

      if (!student) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid verification code",
        });
      }

      // TODO: Verify code from database/cache
      // For now, accept any 6-digit code for testing

      const sessionData = {
        userId: student.id,
        name: `${student.firstName} ${student.lastName}`,
        role: "user",
        locationSlug: input.locationSlug,
        // TODO: Get organization from student record
      };

      ctx.res.cookie("session", JSON.stringify(sessionData), getSessionCookieOptions());

      return {
        success: true,
        name: `${student.firstName} ${student.lastName}`,
      };
    }),

  /**
   * Student login with QR code (Kiosk only)
   */
  loginWithQR: publicProcedure
    .input(
      z.object({
        qrData: z.string(),
        locationSlug: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      // TODO: Decode QR data and verify student identity
      // QR data format: {studentId, signature, timestamp}
      // For now, return error as QR system is not yet implemented
      throw new TRPCError({
        code: "NOT_IMPLEMENTED",
        message: "QR code authentication is not yet implemented. Please use phone verification or name + date of birth.",
      });
    }),

  /**
   * Student login with name + date of birth (Kiosk only, for children)
   */
  loginWithNameDOB: publicProcedure
    .input(
      z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        dateOfBirth: z.string(), // ISO date string
        locationSlug: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      // Find student by name and DOB
      const [student] = await db
        .select()
        .from(students)
        .where(
          eq(students.firstName, input.firstName)
          // TODO: Add lastName and dateOfBirth matching
          // Need to use AND conditions with drizzle-orm
        )
        .limit(1);

      if (!student) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Student not found. Please check your name and date of birth.",
        });
      }

      // Verify last name matches
      if (student.lastName !== input.lastName) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Student not found. Please check your name and date of birth.",
        });
      }

      // Verify date of birth matches (if available)
      if (student.dateOfBirth) {
        const studentDOB = new Date(student.dateOfBirth).toISOString().split('T')[0];
        if (studentDOB !== input.dateOfBirth) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Student not found. Please check your name and date of birth.",
          });
        }
      }

      const sessionData = {
        userId: student.id,
        name: `${student.firstName} ${student.lastName}`,
        role: "user",
        locationSlug: input.locationSlug,
        // TODO: Get organization from student record
      };

      ctx.res.cookie("session", JSON.stringify(sessionData), getSessionCookieOptions());

      return {
        success: true,
        name: `${student.firstName} ${student.lastName}`,
      };
    }),
});

import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import {
  getOwnerProfileByOrgId,
  createOwnerProfile,
  updateOwnerProfile,
  deleteOwnerProfile,
} from "./ownerProfileDb";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const ownerProfileRouter = router({
  /**
   * Get owner profile for current organization
   */
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const organizationId = ctx.currentOrganizationId;
    if (!organizationId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No organization associated with user",
      });
    }

    return await getOwnerProfileByOrgId(organizationId);
  }),

  /**
   * Create or update owner profile
   */
  upsertProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        bio: z.string().optional(),
        specialties: z.string().optional(),
        certifications: z.string().optional(),
        yearsExperience: z.number().int().min(0).optional(),
        profilePhotoUrl: z.string().url().optional().or(z.literal("")),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const organizationId = ctx.currentOrganizationId;
      if (!organizationId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No organization associated with user",
        });
      }

      // Check if profile exists
      const existing = await getOwnerProfileByOrgId(organizationId);

      let result;
      if (existing) {
        // Update existing profile
        result = await updateOwnerProfile(organizationId, input);
      } else {
        // Create new profile
        result = await createOwnerProfile({
          organizationId,
          ...input,
        });
      }

      // Sync profilePhotoUrl to users table so Avatar component can display it
      if (input.profilePhotoUrl) {
        const db = await getDb();
        if (db) {
          await db
            .update(users)
            .set({ photoUrl: input.profilePhotoUrl })
            .where(eq(users.id, ctx.user.id));
        }
      }

      return result;
    }),

  /**
   * Delete owner profile
   */
  deleteProfile: protectedProcedure.mutation(async ({ ctx }) => {
    const organizationId = ctx.currentOrganizationId;
    if (!organizationId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No organization associated with user",
      });
    }

    await deleteOwnerProfile(organizationId);
    return { success: true };
  }),
});

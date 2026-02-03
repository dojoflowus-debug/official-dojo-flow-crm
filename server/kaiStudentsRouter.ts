import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { searchStudentsForKai, getStudentCardForKai, getStudentDetailsForKai } from "./db";

/**
 * Kai Students Router
 * Provides rich student data for Kai chat interactions
 */
export const kaiStudentsRouter = router({
  // Search students for Kai (returns top matches)
  search: protectedProcedure
    .input(z.object({
      query: z.string(),
      locationId: z.number().optional().nullable(),
    }))
    .query(async ({ input, ctx }) => {
      const orgId = ctx.currentOrganizationId;
      if (!orgId) {
        throw new Error("Organization ID is required");
      }
      
      const results = await searchStudentsForKai(input.query, orgId, input.locationId);
      return results;
    }),
  
  // Get student card data for Kai (rich card payload)
  getCard: protectedProcedure
    .input(z.object({
      studentId: z.number(),
      locationId: z.number().optional().nullable(),
    }))
    .query(async ({ input, ctx }) => {
      const orgId = ctx.currentOrganizationId;
      if (!orgId) {
        throw new Error("Organization ID is required");
      }
      
      const card = await getStudentCardForKai(input.studentId, orgId, input.locationId);
      if (!card) {
        throw new Error("Student not found");
      }
      
      return card;
    }),
  
  // Get full student details for third column panel
  getDetails: protectedProcedure
    .input(z.object({
      studentId: z.number(),
      locationId: z.number().optional().nullable(),
    }))
    .query(async ({ input, ctx }) => {
      const orgId = ctx.currentOrganizationId;
      if (!orgId) {
        throw new Error("Organization ID is required");
      }
      
      const details = await getStudentDetailsForKai(input.studentId, orgId, input.locationId);
      if (!details) {
        throw new Error("Student not found");
      }
      
      return details;
    }),
});

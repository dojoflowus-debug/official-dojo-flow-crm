import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { floorPlans, floorPlanSpots, classSessions, sessionSpotAssignments, students } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * Floor Plans Router
 * Handles floor plan management, spot generation, and spot assignments
 */

// Template type enum for validation
const templateTypeSchema = z.enum(["kickboxing_bags", "yoga_grid", "karate_lines"]);

// Spot generation algorithms
function generateKickboxingSpots(
  floorPlanId: number,
  lengthFeet: number,
  widthFeet: number,
  safetySpacing: number
): Array<{
  floorPlanId: number;
  spotNumber: number;
  spotLabel: string;
  positionX: number;
  positionY: number;
  spotType: "bag" | "mat" | "rank_position";
  isAvailable: number;
}> {
  const spots = [];
  
  // Calculate how many bags fit with spacing
  // Assume each bag needs 4ft width + spacing
  const bagWidth = 4;
  const bagsPerRow = Math.floor(widthFeet / (bagWidth + safetySpacing));
  const rowSpacing = 6; // 6ft between rows
  const rows = Math.floor(lengthFeet / (rowSpacing + safetySpacing));
  
  let spotNumber = 1;
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < bagsPerRow; col++) {
      // Calculate position as percentage (0-100)
      const positionY = Math.floor(((row * (rowSpacing + safetySpacing)) / lengthFeet) * 100);
      const positionX = Math.floor(((col * (bagWidth + safetySpacing)) / widthFeet) * 100);
      
      spots.push({
        floorPlanId,
        spotNumber,
        spotLabel: `Bag ${spotNumber}`,
        positionX,
        positionY,
        spotType: "bag",
        isAvailable: 1,
      });
      
      spotNumber++;
    }
  }
  
  return spots;
}

function generateYogaSpots(
  floorPlanId: number,
  lengthFeet: number,
  widthFeet: number,
  safetySpacing: number
): Array<{
  floorPlanId: number;
  spotNumber: number;
  spotLabel: string;
  positionX: number;
  positionY: number;
  spotType: "bag" | "mat" | "rank_position";
  isAvailable: number;
}> {
  const spots = [];
  
  const matWidth = 3;
  const matLength = 6;
  const matsPerRow = Math.floor(widthFeet / (matWidth + safetySpacing));
  const rows = Math.floor(lengthFeet / (matLength + safetySpacing));
  
  let spotNumber = 1;
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < matsPerRow; col++) {
      const positionY = Math.floor(((row * (matLength + safetySpacing)) / lengthFeet) * 100);
      const positionX = Math.floor(((col * (matWidth + safetySpacing)) / widthFeet) * 100);
      
      spots.push({
        floorPlanId,
        spotNumber,
        spotLabel: `Mat ${spotNumber}`,
        positionX,
        positionY,
        spotType: "mat",
        isAvailable: 1,
      });
      
      spotNumber++;
    }
  }
  
  return spots;
}

function generateKarateSpots(
  floorPlanId: number,
  lengthFeet: number,
  widthFeet: number,
  safetySpacing: number
): Array<{
  floorPlanId: number;
  spotNumber: number;
  spotLabel: string;
  positionX: number;
  positionY: number;
  spotType: "bag" | "mat" | "rank_position";
  isAvailable: number;
}> {
  const spots = [];
  
  const positionWidth = 2.5;
  const positionsPerRow = Math.floor(widthFeet / (positionWidth + safetySpacing));
  const rows = Math.floor(lengthFeet / (positionWidth + safetySpacing));
  
  let spotNumber = 1;
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < positionsPerRow; col++) {
      const positionY = Math.floor(((row * (positionWidth + safetySpacing)) / lengthFeet) * 100);
      const positionX = Math.floor(((col * (positionWidth + safetySpacing)) / widthFeet) * 100);
      
      spots.push({
        floorPlanId,
        spotNumber,
        spotLabel: `Position ${spotNumber}`,
        positionX,
        positionY,
        spotType: "rank_position",
        isAvailable: 1,
      });
      
      spotNumber++;
    }
  }
  
  return spots;
}

export const floorPlansRouter = router({
  list: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.select().from(floorPlans);
  }),

  getAll: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.select().from(floorPlans);
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [plan] = await db
        .select()
        .from(floorPlans)
        .where(eq(floorPlans.id, input.id));
      
      const spots = await db
        .select()
        .from(floorPlanSpots)
        .where(eq(floorPlanSpots.floorPlanId, input.id));
      
      return { ...plan, spots };
    }),

  create: protectedProcedure
    .input(
      z.object({
        roomName: z.string(),
        lengthFeet: z.number(),
        widthFeet: z.number(),
        templateType: templateTypeSchema,
        safetySpacing: z.number().default(3),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [plan] = await db
        .insert(floorPlans)
        .values({
          roomName: input.roomName,
          lengthFeet: input.lengthFeet,
          widthFeet: input.widthFeet,
          squareFeet: input.lengthFeet * input.widthFeet,
          templateType: input.templateType,
        })
        .$returningId();
      
      // Generate spots based on template
      let spots: Array<{
        floorPlanId: number;
        spotNumber: number;
        spotLabel: string;
        positionX: number;
        positionY: number;
        spotType: "bag" | "mat" | "rank_position";
        isAvailable: number;
      }> = [];
      
      if (input.templateType === "kickboxing_bags") {
        spots = generateKickboxingSpots(plan.id, input.lengthFeet, input.widthFeet, input.safetySpacing);
      } else if (input.templateType === "yoga_grid") {
        spots = generateYogaSpots(plan.id, input.lengthFeet, input.widthFeet, input.safetySpacing);
      } else if (input.templateType === "karate_lines") {
        spots = generateKarateSpots(plan.id, input.lengthFeet, input.widthFeet, input.safetySpacing);
      }
      
      if (spots.length > 0) {
        await db.insert(floorPlanSpots).values(spots);
      }
      
      return { ...plan, spots };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        roomName: z.string().optional(),
        lengthFeet: z.number().optional(),
        widthFeet: z.number().optional(),
        templateType: templateTypeSchema.optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const updateData: any = {};
      if (input.roomName) updateData.roomName = input.roomName;
      if (input.lengthFeet) {
        updateData.lengthFeet = input.lengthFeet;
        updateData.squareFeet = input.lengthFeet * (input.widthFeet || 40);
      }
      if (input.widthFeet) {
        updateData.widthFeet = input.widthFeet;
        updateData.squareFeet = (input.lengthFeet || 30) * input.widthFeet;
      }
      if (input.templateType) updateData.templateType = input.templateType;
      
      await db.update(floorPlans).set(updateData).where(eq(floorPlans.id, input.id));
      
      const [updated] = await db.select().from(floorPlans).where(eq(floorPlans.id, input.id));
      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.delete(floorPlanSpots).where(eq(floorPlanSpots.floorPlanId, input.id));
      await db.delete(floorPlans).where(eq(floorPlans.id, input.id));
      
      return { success: true };
    }),

  // Get spots for a floor plan
  getSpots: protectedProcedure
    .input(z.object({ floorPlanId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      return db
        .select()
        .from(floorPlanSpots)
        .where(eq(floorPlanSpots.floorPlanId, input.floorPlanId));
    }),

  // Update a single spot position
  updateSpotPosition: protectedProcedure
    .input(
      z.object({
        spotId: z.number(),
        positionX: z.number(),
        positionY: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db
        .update(floorPlanSpots)
        .set({
          positionX: input.positionX,
          positionY: input.positionY,
        })
        .where(eq(floorPlanSpots.id, input.spotId));
      
      return { success: true };
    }),

  // Batch update spot positions (for layout presets)
  batchUpdateSpots: protectedProcedure
    .input(
      z.object({
        floorPlanId: z.number(),
        spots: z.array(
          z.object({
            spotId: z.number(),
            positionX: z.number(),
            positionY: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Update each spot's position
      for (const spot of input.spots) {
        await db
          .update(floorPlanSpots)
          .set({
            positionX: spot.positionX,
            positionY: spot.positionY,
          })
          .where(
            and(
              eq(floorPlanSpots.id, spot.spotId),
              eq(floorPlanSpots.floorPlanId, input.floorPlanId)
            )
          );
      }

      return { success: true, updatedCount: input.spots.length };
    }),

  // Get student assignments for a session
  getSessionAssignments: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      return db
        .select()
        .from(sessionSpotAssignments)
        .where(eq(sessionSpotAssignments.sessionId, input.sessionId));
    }),

  // Assign student to spot
  assignStudentToSpot: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        studentId: z.number(),
        spotId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.insert(sessionSpotAssignments).values({
        sessionId: input.sessionId,
        studentId: input.studentId,
        spotId: input.spotId,
        assignmentMethod: "manual",
      });
      
      return { success: true };
    }),

  // Swap students between spots
  swapStudents: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        student1Id: z.number(),
        student2Id: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      // Get both assignments
      const [assignment1] = await db
        .select()
        .from(sessionSpotAssignments)
        .where(
          and(
            eq(sessionSpotAssignments.sessionId, input.sessionId),
            eq(sessionSpotAssignments.studentId, input.student1Id)
          )
        );
      
      const [assignment2] = await db
        .select()
        .from(sessionSpotAssignments)
        .where(
          and(
            eq(sessionSpotAssignments.sessionId, input.sessionId),
            eq(sessionSpotAssignments.studentId, input.student2Id)
          )
        );
      
      if (!assignment1 || !assignment2) {
        throw new Error("One or both assignments not found");
      }
      
      // Swap spots
      await db
        .update(sessionSpotAssignments)
        .set({ spotId: assignment2.spotId, assignmentMethod: "manual" })
        .where(eq(sessionSpotAssignments.id, assignment1.id));
      
      await db
        .update(sessionSpotAssignments)
        .set({ spotId: assignment1.spotId, assignmentMethod: "manual" })
        .where(eq(sessionSpotAssignments.id, assignment2.id));
      
      return { success: true };
    }),
});

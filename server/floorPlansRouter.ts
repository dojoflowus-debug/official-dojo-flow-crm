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
        locationId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db
        .insert(floorPlans)
        .values({
          roomName: input.roomName,
          lengthFeet: input.lengthFeet,
          widthFeet: input.widthFeet,
          squareFeet: input.lengthFeet * input.widthFeet,
          templateType: input.templateType,
          locationId: input.locationId,
          bagsInstalled: 0,
          defaultLayout: 'grid',
        });
      
      // Get the created plan
      const [plan] = await db
        .select()
        .from(floorPlans)
        .where(eq(floorPlans.roomName, input.roomName))
        .orderBy(desc(floorPlans.createdAt))
        .limit(1);
      
      if (!plan) throw new Error("Failed to create floor plan");
      
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
        bagsOnHand: z.number().optional(),
        bagsInstalled: z.number().optional(),
        defaultLayout: z.enum(['grid', 'staggered', 'perimeter', 'wall']).optional(),
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
      if (input.bagsOnHand !== undefined) updateData.bagsOnHand = input.bagsOnHand;
      if (input.bagsInstalled !== undefined) updateData.bagsInstalled = input.bagsInstalled;
      if (input.defaultLayout !== undefined) updateData.defaultLayout = input.defaultLayout;
      
      await db.update(floorPlans).set(updateData).where(eq(floorPlans.id, input.id));
      
      // If bags were updated, regenerate stations
      if (input.bagsInstalled !== undefined && input.bagsInstalled > 0) {
        const [plan] = await db.select().from(floorPlans).where(eq(floorPlans.id, input.id));
        
        // Delete existing spots
        await db.delete(floorPlanSpots).where(eq(floorPlanSpots.floorPlanId, input.id));
        
        // Generate new spots
        const spots = generateStationsForLayout(
          input.id,
          input.bagsInstalled,
          input.defaultLayout || 'grid',
          plan.lengthFeet || 40,
          plan.widthFeet || 30
        );
        
        if (spots.length > 0) {
          await db.insert(floorPlanSpots).values(spots);
        }
      }
      
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

  // Generate stations based on equipment setup
  generateStations: protectedProcedure
    .input(
      z.object({
        floorPlanId: z.number(),
        bagsInstalled: z.number().min(1),
        layout: z.enum(["grid", "staggered", "perimeter", "wall"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get the floor plan to access dimensions
      const [plan] = await db
        .select()
        .from(floorPlans)
        .where(eq(floorPlans.id, input.floorPlanId));

      if (!plan) throw new Error("Floor plan not found");

      // Delete existing spots for this floor plan
      await db.delete(floorPlanSpots).where(eq(floorPlanSpots.floorPlanId, input.floorPlanId));

      // Generate new spots based on layout
      const spots = generateStationsForLayout(
        input.floorPlanId,
        input.bagsInstalled,
        input.layout,
        plan.lengthFeet || 50,
        plan.widthFeet || 30
      );

      // Insert new spots
      if (spots.length > 0) {
        await db.insert(floorPlanSpots).values(spots);
      }

      // Update floor plan with bagsInstalled and defaultLayout
      await db
        .update(floorPlans)
        .set({
          bagsInstalled: input.bagsInstalled,
          defaultLayout: input.layout,
        })
        .where(eq(floorPlans.id, input.floorPlanId));

      return { success: true, generatedCount: spots.length };
    }),
});

// Helper function to generate stations based on layout
function generateStationsForLayout(
  floorPlanId: number,
  count: number,
  layout: "grid" | "staggered" | "perimeter" | "wall",
  lengthFeet: number,
  widthFeet: number
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
  const padding = 10; // 10% padding from walls
  const usableWidth = 100 - 2 * padding;
  const usableLength = 100 - 2 * padding - 10; // Extra space for stage

  if (layout === "grid") {
    // Grid layout: arrange in rows and columns
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    const cellWidth = usableWidth / cols;
    const cellHeight = usableLength / rows;

    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      spots.push({
        floorPlanId,
        spotNumber: i + 1,
        spotLabel: `Bag ${i + 1}`,
        positionX: Math.round(padding + col * cellWidth + cellWidth / 2),
        positionY: Math.round(padding + 10 + row * cellHeight + cellHeight / 2),
        spotType: "bag",
        isAvailable: 1,
      });
    }
  } else if (layout === "staggered") {
    // Staggered: offset every other row
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    const cellWidth = usableWidth / cols;
    const cellHeight = usableLength / rows;

    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const offsetX = row % 2 === 1 ? cellWidth / 2 : 0;
      spots.push({
        floorPlanId,
        spotNumber: i + 1,
        spotLabel: `Bag ${i + 1}`,
        positionX: Math.round(padding + offsetX + col * cellWidth + cellWidth / 2),
        positionY: Math.round(padding + 10 + row * cellHeight + cellHeight / 2),
        spotType: "bag",
        isAvailable: 1,
      });
    }
  } else if (layout === "perimeter") {
    // Perimeter: arrange around the walls
    const perimeter = 2 * (usableWidth + usableLength);
    const spacing = perimeter / count;
    let distance = 0;

    for (let i = 0; i < count; i++) {
      let x, y;
      const pos = (i * spacing) % perimeter;

      if (pos < usableWidth) {
        // Top wall
        x = padding + pos;
        y = padding + 10;
      } else if (pos < usableWidth + usableLength) {
        // Right wall
        x = padding + usableWidth;
        y = padding + 10 + (pos - usableWidth);
      } else if (pos < 2 * usableWidth + usableLength) {
        // Bottom wall
        x = padding + usableWidth - (pos - usableWidth - usableLength);
        y = padding + 10 + usableLength;
      } else {
        // Left wall
        x = padding;
        y = padding + 10 + usableLength - (pos - 2 * usableWidth - usableLength);
      }

      spots.push({
        floorPlanId,
        spotNumber: i + 1,
        spotLabel: `Bag ${i + 1}`,
        positionX: Math.round(x),
        positionY: Math.round(y),
        spotType: "bag",
        isAvailable: 1,
      });
    }
  } else if (layout === "wall") {
    // Bag Wall: single row at front
    const spacing = usableWidth / count;
    for (let i = 0; i < count; i++) {
      spots.push({
        floorPlanId,
        spotNumber: i + 1,
        spotLabel: `Bag ${i + 1}`,
        positionX: Math.round(padding + (i + 0.5) * spacing),
        positionY: Math.round(padding + 15),
        spotType: "bag",
        isAvailable: 1,
      });
    }
  }

  return spots;
}

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
        spotType: "bag" as const,
        isAvailable: 1,
      });
      
      spotNumber++;
    }
  }
  
  return spots;
}

function generateYogaGridSpots(
  floorPlanId: number,
  lengthFeet: number,
  widthFeet: number,
  safetySpacing: number,
  matRotation: "horizontal" | "vertical" = "horizontal"
): Array<{
  floorPlanId: number;
  spotNumber: number;
  spotLabel: string;
  positionX: number;
  positionY: number;
  rowIdentifier: string;
  columnIdentifier: string;
  spotType: "bag" | "mat" | "rank_position";
  isAvailable: number;
}> {
  const spots = [];
  
  // Calculate mat grid
  // Assume each mat is 2ft x 6ft + spacing
  // Rotation swaps dimensions: horizontal = 6ft wide x 2ft tall, vertical = 2ft wide x 6ft tall
  const matWidth = matRotation === "horizontal" ? 6 : 2;
  const matHeight = matRotation === "horizontal" ? 2 : 6;
  const matsPerRow = Math.floor(widthFeet / (matWidth + safetySpacing));
  const rows = Math.floor(lengthFeet / (matHeight + safetySpacing));
  
  let spotNumber = 1;
  const rowLabels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < matsPerRow; col++) {
      const rowLabel = rowLabels[row] || `R${row + 1}`;
      const colLabel = String(col + 1);
      
      // Calculate position as percentage (0-100)
      const positionY = Math.floor(((row * (matHeight + safetySpacing)) / lengthFeet) * 100);
      const positionX = Math.floor(((col * (matWidth + safetySpacing)) / widthFeet) * 100);
      
      spots.push({
        floorPlanId,
        spotNumber,
        spotLabel: `Mat ${rowLabel}${colLabel}`,
        positionX,
        positionY,
        rowIdentifier: rowLabel,
        columnIdentifier: colLabel,
        spotType: "mat" as const,
        isAvailable: 1,
      });
      
      spotNumber++;
    }
  }
  
  return spots;
}

function generateKarateLineSpots(
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
  rowIdentifier: string;
  columnIdentifier: string;
  spotType: "bag" | "mat" | "rank_position";
  isAvailable: number;
}> {
  const spots = [];
  
  // Calculate lineup formation
  // Assume 3ft per person width + spacing
  const personWidth = 3;
  const spotsPerLine = Math.floor(widthFeet / (personWidth + safetySpacing));
  const lineSpacing = 4; // 4ft between lines
  const lines = Math.floor(lengthFeet / (lineSpacing + safetySpacing));
  
  let spotNumber = 1;
  
  for (let line = 0; line < lines; line++) {
    for (let spot = 0; spot < spotsPerLine; spot++) {
      // Calculate position as percentage (0-100)
      const positionY = Math.floor(((line * (lineSpacing + safetySpacing)) / lengthFeet) * 100);
      const positionX = Math.floor(((spot * (personWidth + safetySpacing)) / widthFeet) * 100);
      
      spots.push({
        floorPlanId,
        spotNumber,
        spotLabel: `Line ${line + 1} Spot ${spot + 1}`,
        positionX,
        positionY,
        rowIdentifier: `Line ${line + 1}`,
        columnIdentifier: String(spot + 1),
        spotType: "rank_position" as const,
        isAvailable: 1,
      });
      
      spotNumber++;
    }
  }
  
  return spots;
}

export const floorPlansRouter = router({
  /**
   * List all floor plans
   */
  list: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const plans = await db.select().from(floorPlans).orderBy(desc(floorPlans.createdAt));
    return plans;
  }),

  /**
   * Get all floor plans (alias for list)
   */
  getAll: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const plans = await db.select().from(floorPlans).orderBy(desc(floorPlans.createdAt));
    return plans;
  }),

  /**
   * Get a single floor plan with its spots
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [plan] = await db.select().from(floorPlans).where(eq(floorPlans.id, input.id));
      
      if (!plan) {
        throw new Error("Floor plan not found");
      }
      
      const spots = await db
        .select()
        .from(floorPlanSpots)
        .where(eq(floorPlanSpots.floorPlanId, input.id))
        .orderBy(floorPlanSpots.spotNumber);
      
      return { ...plan, spots };
    }),

  /**
   * Create a new floor plan and generate spots
   */
  create: protectedProcedure
    .input(
      z.object({
        roomName: z.string().min(1),
        locationId: z.number().optional(),
        lengthFeet: z.number().nullable().optional(),
        widthFeet: z.number().nullable().optional(),
        squareFeet: z.number().nullable().optional(),
        safetySpacingFeet: z.number().default(3),
        templateType: templateTypeSchema,
        matRotation: z.enum(["horizontal", "vertical"]).default("horizontal"),
        notes: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      console.log('[FloorPlans Create] Received input:', JSON.stringify(input));
      // Validate dimensions
      if (input.lengthFeet == null || input.widthFeet == null) {
        if (input.squareFeet == null) {
          throw new Error("Must provide either length/width or square footage");
        }
        // Estimate dimensions from square footage (assume square room)
        const side = Math.sqrt(input.squareFeet);
        input.lengthFeet = Math.floor(side);
        input.widthFeet = Math.floor(side);
      }
      
      // Generate spots based on template
      let generatedSpots: any[] = [];
      
      switch (input.templateType) {
        case "kickboxing_bags":
          generatedSpots = generateKickboxingSpots(
            0, // placeholder, will be updated
            input.lengthFeet,
            input.widthFeet,
            input.safetySpacingFeet
          );
          break;
        case "yoga_grid":
          generatedSpots = generateYogaGridSpots(
            0,
            input.lengthFeet,
            input.widthFeet,
            input.safetySpacingFeet,
            input.matRotation
          );
          break;
        case "karate_lines":
          generatedSpots = generateKarateLineSpots(
            0,
            input.lengthFeet,
            input.widthFeet,
            input.safetySpacingFeet
          );
          break;
      }
      
      const maxCapacity = generatedSpots.length;
      
      // Create floor plan
      const [newPlan] = await db.insert(floorPlans).values({
        roomName: input.roomName,
        locationId: input.locationId,
        lengthFeet: input.lengthFeet,
        widthFeet: input.widthFeet,
        squareFeet: input.squareFeet || input.lengthFeet * input.widthFeet,
        safetySpacingFeet: input.safetySpacingFeet,
        templateType: input.templateType,
        matRotation: input.matRotation,
        maxCapacity,
        notes: input.notes,
        isActive: 1,
      });
      
      const planId = newPlan.insertId;
      
      // Update spots with correct floor plan ID
      const spotsToInsert = generatedSpots.map((spot) => ({
        ...spot,
        floorPlanId: planId,
      }));
      
      // Insert spots
      if (spotsToInsert.length > 0) {
        await db.insert(floorPlanSpots).values(spotsToInsert);
      }
      
      return { id: planId, maxCapacity, spotsGenerated: spotsToInsert.length };
    }),

  /**
   * Update a floor plan (regenerates spots if dimensions change)
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        roomName: z.string().min(1).optional(),
        lengthFeet: z.number().nullable().optional(),
        widthFeet: z.number().nullable().optional(),
        squareFeet: z.number().nullable().optional(),
        safetySpacingFeet: z.number().optional(),
        matRotation: z.enum(["horizontal", "vertical"]).optional(),
        notes: z.string().nullable().optional(),
        isActive: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { id, ...updates } = input;
      
      // Get existing plan
      const [existingPlan] = await db.select().from(floorPlans).where(eq(floorPlans.id, id));
      
      if (!existingPlan) {
        throw new Error("Floor plan not found");
      }
      
      // Check if dimensions or rotation changed
      const dimensionsChanged =
        (updates.lengthFeet && updates.lengthFeet !== existingPlan.lengthFeet) ||
        (updates.widthFeet && updates.widthFeet !== existingPlan.widthFeet) ||
        (updates.safetySpacingFeet && updates.safetySpacingFeet !== existingPlan.safetySpacingFeet);
      
      const rotationChanged =
        updates.matRotation &&
        existingPlan.templateType === "yoga_grid" &&
        updates.matRotation !== existingPlan.matRotation;
      
      const needsRegeneration = dimensionsChanged || rotationChanged;
      
      if (needsRegeneration) {
        // Regenerate spots
        const lengthFeet = updates.lengthFeet || existingPlan.lengthFeet || 30;
        const widthFeet = updates.widthFeet || existingPlan.widthFeet || 30;
        const safetySpacing = updates.safetySpacingFeet || existingPlan.safetySpacingFeet || 3;
        
        let generatedSpots: any[] = [];
        
        switch (existingPlan.templateType) {
          case "kickboxing_bags":
            generatedSpots = generateKickboxingSpots(id, lengthFeet, widthFeet, safetySpacing);
            break;
        case "yoga_grid":
          generatedSpots = generateYogaGridSpots(
            id,
            lengthFeet,
            widthFeet,
            safetySpacing,
            updates.matRotation || existingPlan.matRotation || "horizontal"
          );
          break;
          case "karate_lines":
            generatedSpots = generateKarateLineSpots(id, lengthFeet, widthFeet, safetySpacing);
            break;
        }
        
        // Delete old spots
        await db.delete(floorPlanSpots).where(eq(floorPlanSpots.floorPlanId, id));
        
        // Insert new spots
        if (generatedSpots.length > 0) {
          await db.insert(floorPlanSpots).values(generatedSpots);
        }
        
        // Update max capacity
        updates.squareFeet = lengthFeet * widthFeet;
        (updates as any).maxCapacity = generatedSpots.length;
      }
      
      // Update floor plan
      await db.update(floorPlans).set(updates).where(eq(floorPlans.id, id));
      
      return { success: true };
    }),

  /**
   * Delete a floor plan
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      // Delete spots first
      await db.delete(floorPlanSpots).where(eq(floorPlanSpots.floorPlanId, input.id));
      
      // Delete floor plan
      await db.delete(floorPlans).where(eq(floorPlans.id, input.id));
      
      return { success: true };
    }),

  /**
   * Assign a student to a spot during check-in
   */
  assignSpot: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        studentId: z.number(),
        spotId: z.number().optional(), // If not provided, auto-assign
        assignmentMethod: z.enum(["auto", "manual", "student_choice"]).default("auto"),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      // Get session and floor plan
      const [session] = await db
        .select()
        .from(classSessions)
        .where(eq(classSessions.id, input.sessionId));
      
      if (!session || !session.floorPlanId) {
        throw new Error("Session or floor plan not found");
      }
      
      // Check if student already has a spot assignment
      const existingAssignment = await db
        .select()
        .from(sessionSpotAssignments)
        .where(
          and(
            eq(sessionSpotAssignments.sessionId, input.sessionId),
            eq(sessionSpotAssignments.studentId, input.studentId)
          )
        );
      
      if (existingAssignment.length > 0) {
        // Student already assigned, return existing assignment
        return { spotId: existingAssignment[0].spotId, alreadyAssigned: true };
      }
      
      let spotId = input.spotId;
      
      // Auto-assign if no spot specified
      if (!spotId) {
        // Get all spots for this floor plan
        const allSpots = await db
          .select()
          .from(floorPlanSpots)
          .where(eq(floorPlanSpots.floorPlanId, session.floorPlanId))
          .orderBy(floorPlanSpots.spotNumber);
        
        // Get already assigned spots
        const assignedSpots = await db
          .select()
          .from(sessionSpotAssignments)
          .where(eq(sessionSpotAssignments.sessionId, input.sessionId));
        
        const assignedSpotIds = new Set(assignedSpots.map((a) => a.spotId));
        
        // Find first available spot
        const availableSpot = allSpots.find((spot) => !assignedSpotIds.has(spot.id));
        
        if (!availableSpot) {
          throw new Error("No available spots");
        }
        
        spotId = availableSpot.id;
      }
      
      // Create assignment
      await db.insert(sessionSpotAssignments).values({
        sessionId: input.sessionId,
        studentId: input.studentId,
        spotId,
        assignmentMethod: input.assignmentMethod,
        attended: 1,
      });
      
      return { spotId, alreadyAssigned: false };
    }),

  /**
   * Get session roster with spot assignments
   */
  getSessionRoster: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      // Get session
      const [session] = await db
        .select()
        .from(classSessions)
        .where(eq(classSessions.id, input.sessionId));
      
      if (!session) {
        throw new Error("Session not found");
      }
      
      // Get assignments with student and spot info
      const assignments = await db
        .select({
          assignmentId: sessionSpotAssignments.id,
          studentId: sessionSpotAssignments.studentId,
          spotId: sessionSpotAssignments.spotId,
          assignedAt: sessionSpotAssignments.assignedAt,
          assignmentMethod: sessionSpotAssignments.assignmentMethod,
          attended: sessionSpotAssignments.attended,
          studentFirstName: students.firstName,
          studentLastName: students.lastName,
          studentBeltRank: students.beltRank,
          studentPhotoUrl: students.photoUrl,
          spotNumber: floorPlanSpots.spotNumber,
          spotLabel: floorPlanSpots.spotLabel,
        })
        .from(sessionSpotAssignments)
        .leftJoin(students, eq(sessionSpotAssignments.studentId, students.id))
        .leftJoin(floorPlanSpots, eq(sessionSpotAssignments.spotId, floorPlanSpots.id))
        .where(eq(sessionSpotAssignments.sessionId, input.sessionId))
        .orderBy(floorPlanSpots.spotNumber);
      
      return { session, assignments };
    }),

  /**
   * Swap spot assignments between two students
   */
  swapSpots: protectedProcedure
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

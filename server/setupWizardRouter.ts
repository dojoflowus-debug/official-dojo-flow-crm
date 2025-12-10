import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";

/**
 * Setup Wizard Router - 8-Step Configuration
 * Handles all setup wizard steps for comprehensive dojo configuration
 */
export const setupWizardRouter = router({
  // Step 1: Industry & Template
  getIndustry: publicProcedure.query(async () => {
    const { getDb } = await import("./db");
    const { dojoSettings } = await import("../drizzle/schema");
    
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    const result = await db.select().from(dojoSettings).limit(1);
    
    if (result.length === 0) {
      return {
        industry: null,
        businessModel: null,
        usePreset: 1,
      };
    }
    
    return {
      industry: result[0].industry,
      businessModel: result[0].businessModel,
      usePreset: result[0].usePreset,
    };
  }),
  
  updateIndustry: publicProcedure
    .input(z.object({
      industry: z.enum(["martial_arts", "fitness", "yoga", "pilates", "other"]),
      businessModel: z.enum(["inside_gym", "standalone", "mobile", "online_hybrid"]),
      usePreset: z.number().min(0).max(1),
    }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("./db");
      const { dojoSettings } = await import("../drizzle/schema");
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const existing = await db.select().from(dojoSettings).limit(1);
      
      if (existing.length === 0) {
        await db.insert(dojoSettings).values({
          industry: input.industry,
          businessModel: input.businessModel,
          usePreset: input.usePreset,
          setupCompleted: 0,
        });
      } else {
        await db.update(dojoSettings).set({
          industry: input.industry,
          businessModel: input.businessModel,
          usePreset: input.usePreset,
          updatedAt: new Date(),
        });
      }
      
      return { success: true };
    }),
  
  // Step 2: Business Basics & Brand Identity
  getBrand: publicProcedure.query(async () => {
    const { getDb } = await import("./db");
    const { dojoSettings } = await import("../drizzle/schema");
    
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    const result = await db.select().from(dojoSettings).limit(1);
    
    if (result.length === 0) {
      return {
        businessName: '',
        dbaName: '',
        operatorName: '',
        preferredName: '',
        pronounsTone: null,
        timezone: 'America/New_York',
        primaryColor: '#3b82f6',
        secondaryColor: '#8b5cf6',
        logoSquare: '',
        logoHorizontal: '',
      };
    }
    
    return {
      businessName: result[0].businessName,
      dbaName: result[0].dbaName,
      operatorName: result[0].operatorName,
      preferredName: result[0].preferredName,
      pronounsTone: result[0].pronounsTone,
      timezone: result[0].timezone,
      primaryColor: result[0].primaryColor,
      secondaryColor: result[0].secondaryColor,
      logoSquare: result[0].logoSquare,
      logoHorizontal: result[0].logoHorizontal,
    };
  }),
  
  updateBrand: publicProcedure
    .input(z.object({
      businessName: z.string().optional(),
      dbaName: z.string().optional(),
      operatorName: z.string().optional(),
      preferredName: z.string().optional(),
      pronounsTone: z.enum(["formal", "casual", "energetic", "calm"]).optional(),
      timezone: z.string().optional(),
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
      logoSquare: z.string().optional(),
      logoHorizontal: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("./db");
      const { dojoSettings } = await import("../drizzle/schema");
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const existing = await db.select().from(dojoSettings).limit(1);
      
      if (existing.length === 0) {
        await db.insert(dojoSettings).values({
          ...input,
          setupCompleted: 0,
        });
      } else {
        await db.update(dojoSettings).set({
          ...input,
          updatedAt: new Date(),
        });
      }
      
      return { success: true };
    }),
  
  // Step 3: Locations & Schedule
  getLocations: publicProcedure.query(async () => {
    const { getDb } = await import("./db");
    const { locations } = await import("../drizzle/schema");
    
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    const result = await db.select().from(locations);
    return result;
  }),
  
  createLocation: publicProcedure
    .input(z.object({
      name: z.string().min(1),
      address: z.string().optional(),
      insideFacility: z.number().min(0).max(1),
      facilityName: z.string().optional(),
      operatingHours: z.string().optional(), // JSON string
      timeBlocks: z.string().optional(), // JSON string
    }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("./db");
      const { locations } = await import("../drizzle/schema");
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      await db.insert(locations).values({
        ...input,
        isActive: 1,
      });
      
      return { success: true };
    }),
  
  updateLocation: publicProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      address: z.string().optional(),
      insideFacility: z.number().min(0).max(1).optional(),
      facilityName: z.string().optional(),
      operatingHours: z.string().optional(),
      timeBlocks: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("./db");
      const { locations } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const { id, ...updates } = input;
      
      await db.update(locations)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(locations.id, id));
      
      return { success: true };
    }),
  
  deleteLocation: publicProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("./db");
      const { locations } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      await db.delete(locations).where(eq(locations.id, input.id));
      
      return { success: true };
    }),
  
  // Step 4: Programs & Services
  getPrograms: publicProcedure.query(async () => {
    const { getDb } = await import("./db");
    const { programs } = await import("../drizzle/schema");
    
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    const result = await db.select().from(programs);
    return result;
  }),
  
  createProgram: publicProcedure
    .input(z.object({
      name: z.string().min(1),
      type: z.enum(["membership", "class_pack", "drop_in", "private"]),
      ageRange: z.string().optional(),
      billing: z.enum(["monthly", "weekly", "per_session", "one_time"]).optional(),
      price: z.number().optional(),
      contractLength: z.string().optional(),
      maxSize: z.number().optional(),
      isCoreProgram: z.number().min(0).max(1).optional(),
      showOnKiosk: z.number().min(0).max(1).optional(),
      allowAutopilot: z.number().min(0).max(1).optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("./db");
      const { programs } = await import("../drizzle/schema");
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      await db.insert(programs).values({
        ...input,
        isActive: 1,
      });
      
      return { success: true };
    }),
  
  updateProgram: publicProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      type: z.enum(["membership", "class_pack", "drop_in", "private"]).optional(),
      ageRange: z.string().optional(),
      billing: z.enum(["monthly", "weekly", "per_session", "one_time"]).optional(),
      price: z.number().optional(),
      contractLength: z.string().optional(),
      maxSize: z.number().optional(),
      isCoreProgram: z.number().min(0).max(1).optional(),
      showOnKiosk: z.number().min(0).max(1).optional(),
      allowAutopilot: z.number().min(0).max(1).optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("./db");
      const { programs } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const { id, ...updates } = input;
      
      await db.update(programs)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(programs.id, id));
      
      return { success: true };
    }),
  
  deleteProgram: publicProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("./db");
      const { programs } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      await db.delete(programs).where(eq(programs.id, input.id));
      
      return { success: true };
    }),
  
  // Load industry preset programs
  loadPresetPrograms: publicProcedure
    .input(z.object({
      industry: z.enum(["martial_arts", "fitness", "yoga", "pilates", "other"]),
    }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("./db");
      const { programs } = await import("../drizzle/schema");
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // Define preset programs for each industry
      const presets: Record<string, any[]> = {
        martial_arts: [
          {
            name: "Little Ninjas",
            type: "membership",
            ageRange: "3-5 years",
            billing: "monthly",
            price: 9900, // $99
            contractLength: "month-to-month",
            maxSize: 15,
            isCoreProgram: 1,
            showOnKiosk: 1,
            allowAutopilot: 1,
            description: "Fun martial arts program for preschoolers",
            isActive: 1,
          },
          {
            name: "Kids / Youth Program",
            type: "membership",
            ageRange: "6-12 years",
            billing: "monthly",
            price: 14900, // $149
            contractLength: "month-to-month",
            maxSize: 20,
            isCoreProgram: 1,
            showOnKiosk: 1,
            allowAutopilot: 1,
            description: "Core martial arts training for kids",
            isActive: 1,
          },
          {
            name: "Teens / Adults",
            type: "membership",
            ageRange: "13+ years",
            billing: "monthly",
            price: 16900, // $169
            contractLength: "month-to-month",
            maxSize: 25,
            isCoreProgram: 1,
            showOnKiosk: 1,
            allowAutopilot: 1,
            description: "Advanced martial arts for teens and adults",
            isActive: 1,
          },
          {
            name: "Fitness Kickboxing",
            type: "membership",
            ageRange: "18+ years",
            billing: "monthly",
            price: 12900, // $129
            contractLength: "month-to-month",
            maxSize: 30,
            isCoreProgram: 0,
            showOnKiosk: 1,
            allowAutopilot: 1,
            description: "High-energy cardio kickboxing classes",
            isActive: 1,
          },
        ],
        fitness: [
          {
            name: "All-Access Membership",
            type: "membership",
            ageRange: "18+ years",
            billing: "monthly",
            price: 7900, // $79
            contractLength: "month-to-month",
            maxSize: 50,
            isCoreProgram: 1,
            showOnKiosk: 1,
            allowAutopilot: 1,
            description: "Unlimited access to all gym facilities",
            isActive: 1,
          },
          {
            name: "Class Pack (10 classes)",
            type: "class_pack",
            ageRange: "18+ years",
            billing: "one_time",
            price: 15000, // $150
            contractLength: "3 months validity",
            maxSize: 25,
            isCoreProgram: 0,
            showOnKiosk: 1,
            allowAutopilot: 1,
            description: "10 group fitness classes",
            isActive: 1,
          },
          {
            name: "Personal Training",
            type: "private",
            ageRange: "All ages",
            billing: "per_session",
            price: 8000, // $80
            contractLength: "per session",
            maxSize: 1,
            isCoreProgram: 0,
            showOnKiosk: 1,
            allowAutopilot: 0,
            description: "One-on-one personal training session",
            isActive: 1,
          },
        ],
        yoga: [
          {
            name: "Unlimited Yoga",
            type: "membership",
            ageRange: "All ages",
            billing: "monthly",
            price: 12900, // $129
            contractLength: "month-to-month",
            maxSize: 20,
            isCoreProgram: 1,
            showOnKiosk: 1,
            allowAutopilot: 1,
            description: "Unlimited yoga classes",
            isActive: 1,
          },
          {
            name: "Drop-In Class",
            type: "drop_in",
            ageRange: "All ages",
            billing: "per_session",
            price: 2500, // $25
            contractLength: "single class",
            maxSize: 20,
            isCoreProgram: 0,
            showOnKiosk: 1,
            allowAutopilot: 1,
            description: "Single yoga class",
            isActive: 1,
          },
          {
            name: "Private Session",
            type: "private",
            ageRange: "All ages",
            billing: "per_session",
            price: 9000, // $90
            contractLength: "per session",
            maxSize: 1,
            isCoreProgram: 0,
            showOnKiosk: 1,
            allowAutopilot: 0,
            description: "One-on-one yoga instruction",
            isActive: 1,
          },
        ],
        pilates: [
          {
            name: "Unlimited Pilates",
            type: "membership",
            ageRange: "All ages",
            billing: "monthly",
            price: 14900, // $149
            contractLength: "month-to-month",
            maxSize: 15,
            isCoreProgram: 1,
            showOnKiosk: 1,
            allowAutopilot: 1,
            description: "Unlimited Pilates and Barre classes",
            isActive: 1,
          },
          {
            name: "Class Pack (8 classes)",
            type: "class_pack",
            ageRange: "All ages",
            billing: "one_time",
            price: 16000, // $160
            contractLength: "2 months validity",
            maxSize: 15,
            isCoreProgram: 0,
            showOnKiosk: 1,
            allowAutopilot: 1,
            description: "8 Pilates or Barre classes",
            isActive: 1,
          },
          {
            name: "Private Reformer Session",
            type: "private",
            ageRange: "All ages",
            billing: "per_session",
            price: 10000, // $100
            contractLength: "per session",
            maxSize: 1,
            isCoreProgram: 0,
            showOnKiosk: 1,
            allowAutopilot: 0,
            description: "One-on-one reformer Pilates",
            isActive: 1,
          },
        ],
        other: [
          {
            name: "Standard Membership",
            type: "membership",
            ageRange: "All ages",
            billing: "monthly",
            price: 9900, // $99
            contractLength: "month-to-month",
            maxSize: 20,
            isCoreProgram: 1,
            showOnKiosk: 1,
            allowAutopilot: 1,
            description: "Monthly membership",
            isActive: 1,
          },
        ],
      };
      
      const programsToCreate = presets[input.industry] || presets.other;
      
      // Insert all preset programs
      for (const program of programsToCreate) {
        await db.insert(programs).values(program);
      }
      
      return { success: true, count: programsToCreate.length };
    }),
  
  // Step 5: Money, Targets & Constraints
  getFinancials: publicProcedure.query(async () => {
    const { getDb } = await import("./db");
    const { dojoSettings } = await import("../drizzle/schema");
    
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    const result = await db.select().from(dojoSettings).limit(1);
    
    if (result.length === 0) {
      return {
        monthlyRent: 0,
        monthlyUtilities: 0,
        monthlyPayroll: 0,
        monthlyMarketing: 0,
        currentMembers: 0,
        revenueGoal: 0,
        maxClassSize: 20,
        nonNegotiables: '',
        focusSlider: 50,
        riskComfort: 50,
      };
    }
    
    return {
      monthlyRent: result[0].monthlyRent,
      monthlyUtilities: result[0].monthlyUtilities,
      monthlyPayroll: result[0].monthlyPayroll,
      monthlyMarketing: result[0].monthlyMarketing,
      currentMembers: result[0].currentMembers,
      revenueGoal: result[0].revenueGoal,
      maxClassSize: result[0].maxClassSize,
      nonNegotiables: result[0].nonNegotiables,
      focusSlider: result[0].focusSlider,
      riskComfort: result[0].riskComfort,
    };
  }),
  
  updateFinancials: publicProcedure
    .input(z.object({
      monthlyRent: z.number().optional(),
      monthlyUtilities: z.number().optional(),
      monthlyPayroll: z.number().optional(),
      monthlyMarketing: z.number().optional(),
      currentMembers: z.number().optional(),
      revenueGoal: z.number().optional(),
      maxClassSize: z.number().optional(),
      nonNegotiables: z.string().optional(),
      focusSlider: z.number().min(0).max(100).optional(),
      riskComfort: z.number().min(0).max(100).optional(),
    }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("./db");
      const { dojoSettings } = await import("../drizzle/schema");
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const existing = await db.select().from(dojoSettings).limit(1);
      
      if (existing.length === 0) {
        await db.insert(dojoSettings).values({
          ...input,
          setupCompleted: 0,
        });
      } else {
        await db.update(dojoSettings).set({
          ...input,
          updatedAt: new Date(),
        });
      }
      
      return { success: true };
    }),
  
  // Step 6: Team & Roles
  getTeamMembers: publicProcedure.query(async () => {
    const { getDb } = await import("./db");
    const { teamMembers } = await import("../drizzle/schema");
    
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    const result = await db.select().from(teamMembers);
    return result;
  }),
  
  createTeamMember: publicProcedure
    .input(z.object({
      name: z.string().min(1),
      role: z.enum(["owner", "manager", "instructor", "front_desk", "coach", "trainer", "assistant"]),
      email: z.string().optional(),
      phone: z.string().optional(),
      locationIds: z.string().optional(), // JSON string
      addressAs: z.string().optional(),
      focusAreas: z.string().optional(), // JSON string
      canViewFinancials: z.number().min(0).max(1).optional(),
      canEditSchedule: z.number().min(0).max(1).optional(),
      canManageLeads: z.number().min(0).max(1).optional(),
      viewOnly: z.number().min(0).max(1).optional(),
    }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("./db");
      const { teamMembers } = await import("../drizzle/schema");
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      await db.insert(teamMembers).values({
        ...input,
        isActive: 1,
      });
      
      return { success: true };
    }),
  
  updateTeamMember: publicProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      role: z.enum(["owner", "manager", "instructor", "front_desk", "coach", "trainer", "assistant"]).optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      locationIds: z.string().optional(),
      addressAs: z.string().optional(),
      focusAreas: z.string().optional(),
      canViewFinancials: z.number().min(0).max(1).optional(),
      canEditSchedule: z.number().min(0).max(1).optional(),
      canManageLeads: z.number().min(0).max(1).optional(),
      viewOnly: z.number().min(0).max(1).optional(),
    }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("./db");
      const { teamMembers } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const { id, ...updates } = input;
      
      await db.update(teamMembers)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(teamMembers.id, id));
      
      return { success: true };
    }),
  
  deleteTeamMember: publicProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("./db");
      const { teamMembers } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      await db.delete(teamMembers).where(eq(teamMembers.id, input.id));
      
      return { success: true };
    }),
  
  // Step 7: Member Journey & Automations
  getMemberJourney: publicProcedure.query(async () => {
    const { getDb } = await import("./db");
    const { memberJourneyConfig } = await import("../drizzle/schema");
    
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    const result = await db.select().from(memberJourneyConfig).limit(1);
    
    if (result.length === 0) {
      return {
        leadGreeting: '',
        contactPreference: 'both',
        responseSpeedMinutes: 15,
        trialOffer: '',
        trialType: null,
        trialFollowUp: '',
        welcomeTone: 'detailed',
        miss1ClassAction: '',
        miss2WeeksAction: '',
        absenceAlertThreshold: 3,
        renewalReminderWeeks: 2,
        autoBookingPrompts: 0,
        encouragementMessages: 1,
      };
    }
    
    return result[0];
  }),
  
  updateMemberJourney: publicProcedure
    .input(z.object({
      leadGreeting: z.string().optional(),
      contactPreference: z.enum(["sms", "email", "both"]).optional(),
      responseSpeedMinutes: z.number().optional(),
      trialOffer: z.string().optional(),
      trialType: z.enum(["free_class", "paid_intro", "free_week", "assessment"]).optional(),
      trialFollowUp: z.string().optional(),
      welcomeTone: z.enum(["shorter", "detailed"]).optional(),
      miss1ClassAction: z.string().optional(),
      miss2WeeksAction: z.string().optional(),
      absenceAlertThreshold: z.number().optional(),
      renewalReminderWeeks: z.number().optional(),
      autoBookingPrompts: z.number().min(0).max(1).optional(),
      encouragementMessages: z.number().min(0).max(1).optional(),
    }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("./db");
      const { memberJourneyConfig } = await import("../drizzle/schema");
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const existing = await db.select().from(memberJourneyConfig).limit(1);
      
      if (existing.length === 0) {
        await db.insert(memberJourneyConfig).values(input);
      } else {
        await db.update(memberJourneyConfig).set({
          ...input,
          updatedAt: new Date(),
        });
      }
      
      return { success: true };
    }),
  
  // Step 8: Complete Setup
  completeSetup: publicProcedure
    .mutation(async () => {
      const { getDb } = await import("./db");
      const { dojoSettings, automationTemplates, automationSequences, automationSteps } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // Get current settings to determine industry
      const [settings] = await db.select().from(dojoSettings).limit(1);
      const industry = settings?.industry || 'martial_arts';
      
      // Mark setup as completed
      await db.update(dojoSettings).set({
        setupCompleted: 1,
        updatedAt: new Date(),
      });
      
      // Auto-install industry-specific automation templates
      try {
        // Get all templates for the selected industry
        const templates = await db.select()
          .from(automationTemplates)
          .where(eq(automationTemplates.industry, industry));
        
        let installedCount = 0;
        
        // Install each template as an automation sequence
        for (const template of templates) {
          // Create the automation sequence
          const [sequence] = await db.insert(automationSequences)
            .values({
              name: template.name,
              description: template.description,
              trigger: template.trigger,
              isActive: 0, // Start as inactive - user can activate when ready
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .returning();
          
          // Parse template steps and create automation steps
          const templateSteps = JSON.parse(template.steps);
          
          for (const step of templateSteps) {
            await db.insert(automationSteps).values({
              sequenceId: sequence.id,
              stepOrder: step.stepOrder,
              stepType: step.stepType,
              waitDuration: step.waitDuration || null,
              waitUnit: step.waitUnit || null,
              messageContent: step.messageContent || null,
              emailSubject: step.emailSubject || null,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
          
          installedCount++;
        }
        
        console.log(`Auto-installed ${installedCount} automation templates for industry: ${industry}`);
      } catch (error) {
        console.error('Error auto-installing templates:', error);
        // Don't fail the entire setup if template installation fails
      }
      
      return { success: true };
    }),
  
  // Logo upload endpoint
  uploadLogo: publicProcedure
    .input(z.object({
      mode: z.enum(["light", "dark"]),
      fileData: z.string(), // base64 data URL
      fileName: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { storagePut } = await import("./storage");
      
      // Extract base64 data from data URL (e.g., "data:image/png;base64,iVBORw...")
      const base64Match = input.fileData.match(/^data:image\/\w+;base64,(.+)$/);
      if (!base64Match) {
        throw new Error('Invalid image data format');
      }
      
      const base64Data = base64Match[1];
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Generate unique filename with timestamp
      const timestamp = Date.now();
      const extension = input.fileName.split('.').pop() || 'png';
      const key = `logos/${input.mode}-${timestamp}.${extension}`;
      
      // Upload to S3
      const result = await storagePut(key, buffer, 'image/png');
      
      // Update dojo_settings with the logo URL
      const { getDb } = await import("./db");
      const { dojoSettings } = await import("../drizzle/schema");
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const existing = await db.select().from(dojoSettings).limit(1);
      
      const updateData = input.mode === 'light' 
        ? { logoSquare: result.url } 
        : { logoHorizontal: result.url };
      
      if (existing.length === 0) {
        await db.insert(dojoSettings).values({
          ...updateData,
          setupCompleted: 0,
        });
      } else {
        await db.update(dojoSettings).set({
          ...updateData,
          updatedAt: new Date(),
        });
      }
      
      return { url: result.url, key: result.key };
    }),

  // Step 9: Payment Processor Setup
  getPaymentProcessor: publicProcedure.query(async () => {
    const { getDb } = await import("./db");
    const { dojoSettings } = await import("../drizzle/schema");
    
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    const result = await db.select().from(dojoSettings).limit(1);
    
    if (result.length === 0) {
      return {
        processor: 'stripe',
        apiKey: '',
        merchantId: '',
        setupLater: false,
      };
    }
    
    return {
      processor: result[0].paymentProcessor || 'stripe',
      apiKey: result[0].paymentApiKey || '',
      merchantId: result[0].paymentMerchantId || '',
      setupLater: result[0].paymentSetupLater === 1,
    };
  }),
  
  updatePaymentProcessor: publicProcedure
    .input(z.object({
      processor: z.enum(["stripe", "square", "clover", "none"]),
      apiKey: z.string().optional(),
      merchantId: z.string().optional(),
      setupLater: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("./db");
      const { dojoSettings } = await import("../drizzle/schema");
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const existing = await db.select().from(dojoSettings).limit(1);
      
      const updateData = {
        paymentProcessor: input.processor,
        paymentApiKey: input.apiKey || '',
        paymentMerchantId: input.merchantId || '',
        paymentSetupLater: input.setupLater ? 1 : 0,
      };
      
      if (existing.length === 0) {
        await db.insert(dojoSettings).values({
          ...updateData,
          setupCompleted: 0,
        });
      } else {
        await db.update(dojoSettings).set({
          ...updateData,
          updatedAt: new Date(),
        });
      }
      
      return { success: true };
    }),

  // Get all setup data for review (Step 9)
  getAllSetupData: publicProcedure.query(async () => {
    const { getDb } = await import("./db");
    const { dojoSettings, locations, programs, teamMembers, memberJourneyConfig } = await import("../drizzle/schema");
    
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    const settings = await db.select().from(dojoSettings).limit(1);
    const locationsData = await db.select().from(locations);
    const programsData = await db.select().from(programs);
    const teamData = await db.select().from(teamMembers);
    const journeyData = await db.select().from(memberJourneyConfig).limit(1);
    
    return {
      settings: settings[0] || null,
      locations: locationsData,
      programs: programsData,
      team: teamData,
      memberJourney: journeyData[0] || null,
    };
  }),
});

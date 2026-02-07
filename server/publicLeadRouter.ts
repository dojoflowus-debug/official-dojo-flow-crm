import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as bcrypt from "bcryptjs";

/**
 * Public Lead Router
 * 
 * This router provides public API endpoints for website lead submissions.
 * Websites authenticate using email/password and submit leads that get
 * routed to their organization's lead pipeline.
 */
export const publicLeadRouter = router({
  /**
   * Submit a lead from a website
   * 
   * Authentication: Email + Password (from the dojo account)
   * Returns: Lead ID and confirmation
   * 
   * Lead Categorization:
   * - If appointment is set → "Intro Scheduled" status
   * - If no appointment → "New Lead" status
   */
  submitLead: publicProcedure
    .input(z.object({
      // Authentication
      email: z.string().email('Invalid email format'),
      password: z.string().min(1, 'Password is required'),
      
      // Lead Information
      firstName: z.string().min(1, 'First name is required'),
      lastName: z.string().min(1, 'Last name is required'),
      phone: z.string().min(1, 'Phone number is required'),
      programInterest: z.string().min(1, 'Program interest is required'),
      
      // Appointment (optional)
      appointmentDate: z.string().optional(), // ISO 8601 format: YYYY-MM-DDTHH:mm:ss
      appointmentTime: z.string().optional(), // HH:mm format
      
      // Additional info
      message: z.string().optional(),
      source: z.string().default('Website Chatbot'),
    }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("./db");
      const { users, leads } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // Step 1: Authenticate user with email/password
      const [user] = await db.select().from(users).where(eq(users.email, input.email));
      
      if (!user) {
        throw new Error('Invalid email or password');
      }
      
      // Verify password
      const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash || '');
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }
      
      // Step 2: Get user's organization
      const { organization_users } = await import("../drizzle/schema");
      const [orgUser] = await db.select().from(organization_users)
        .where(eq(organization_users.userId, user.id));
      
      if (!orgUser) {
        throw new Error('User does not have an associated organization');
      }
      
      const organizationId = orgUser.organizationId;
      
      // Step 3: Determine lead status based on appointment
      let leadStatus = 'New Lead';
      let appointmentDateTime: string | null = null;
      
      if (input.appointmentDate && input.appointmentTime) {
        leadStatus = 'Intro Scheduled';
        // Combine date and time into ISO format
        appointmentDateTime = `${input.appointmentDate}T${input.appointmentTime}:00`;
      }
      
      // Step 4: Create the lead
      const leadNotes = [
        input.message ? `Message: ${input.message}` : null,
        input.appointmentDate && input.appointmentTime ? `Appointment: ${input.appointmentDate} at ${input.appointmentTime}` : null,
      ].filter(Boolean).join('\n');
      
      const result = await db.insert(leads).values({
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        status: leadStatus,
        source: input.source,
        interestedProgram: input.programInterest,
        notes: leadNotes || null,
        organizationId: organizationId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        leadScore: 50, // Default lead score
      });
      
      const leadId = result.insertId;
      
      // Step 5: If appointment is set, store the appointment datetime
      // (This would be stored in a separate appointments table if you have one)
      // For now, we're storing it in the notes field
      
      // Step 6: Trigger automation for new lead (async, don't wait)
      if (leadId) {
        const { triggerAutomation } = await import("./services/automationEngine");
        triggerAutomation("new_lead", "lead", Number(leadId)).catch((err) => {
          console.error('[Public Lead] Automation trigger error:', err);
        });
      }
      
      return {
        success: true,
        leadId: leadId,
        status: leadStatus,
        message: leadStatus === 'Intro Scheduled' 
          ? `Lead created successfully. Appointment scheduled for ${input.appointmentDate} at ${input.appointmentTime}`
          : 'Lead created successfully. Your inquiry has been received.',
      };
    }),

  /**
   * Get available appointment slots for a program
   * 
   * This endpoint returns available time slots from the dojo's calendar
   * for a specific program, allowing the chatbot to show available times.
   */
  getAvailableSlots: publicProcedure
    .input(z.object({
      email: z.string().email('Invalid email format'),
      password: z.string().min(1, 'Password is required'),
      programId: z.number().optional(),
      date: z.string().optional(), // YYYY-MM-DD format
    }))
    .query(async ({ input }) => {
      const { getDb } = await import("./db");
      const { users, classes } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // Authenticate user
      const [user] = await db.select().from(users).where(eq(users.email, input.email));
      
      if (!user) {
        throw new Error('Invalid email or password');
      }
      
      const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash || '');
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }
      
      // Get user's organization
      const { organization_users } = await import("../drizzle/schema");
      const [orgUser] = await db.select().from(organization_users)
        .where(eq(organization_users.userId, user.id));
      
      if (!orgUser) {
        throw new Error('User does not have an associated organization');
      }
      
      // Get available classes/slots for the organization
      // This is a simplified version - you may need to adjust based on your actual schema
      const organizationId = orgUser.organizationId;
      
      // For now, return a default set of available times
      // In a real implementation, you would query the classes table and find available slots
      const availableSlots = [
        { time: '09:00', label: '9:00 AM' },
        { time: '10:00', label: '10:00 AM' },
        { time: '14:00', label: '2:00 PM' },
        { time: '16:00', label: '4:00 PM' },
        { time: '18:00', label: '6:00 PM' },
        { time: '19:00', label: '7:00 PM' },
      ];
      
      return {
        success: true,
        slots: availableSlots,
        message: 'Available appointment slots retrieved successfully',
      };
    }),

  /**
   * Validate credentials (for chatbot to verify authentication)
   */
  validateCredentials: publicProcedure
    .input(z.object({
      email: z.string().email('Invalid email format'),
      password: z.string().min(1, 'Password is required'),
    }))
    .query(async ({ input }) => {
      const { getDb } = await import("./db");
      const { users } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      try {
        const [user] = await db.select().from(users).where(eq(users.email, input.email));
        
        if (!user) {
          return { valid: false, message: 'Invalid email or password' };
        }
        
        const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash || '');
        if (!isPasswordValid) {
          return { valid: false, message: 'Invalid email or password' };
        }
        
        // Verify organization exists
        const { organization_users } = await import("../drizzle/schema");
        const [orgUser] = await db.select().from(organization_users)
          .where(eq(organization_users.userId, user.id));
        
        if (!orgUser) {
          return { valid: false, message: 'User does not have an associated organization' };
        }
        
        return {
          valid: true,
          message: 'Credentials are valid',
          organizationId: orgUser.organizationId,
        };
      } catch (error) {
        console.error('[Public Lead] Validation error:', error);
        return { valid: false, message: 'An error occurred during validation' };
      }
    }),
});

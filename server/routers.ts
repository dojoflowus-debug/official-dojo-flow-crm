import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { setupWizardRouter } from "./setupWizardRouter";
import { billingRouter } from "./billingRouter";
import { webhookRouter } from "./webhookRouter";
import { campaignsRouter } from "./campaignsRouter";
import { automationRouter } from "./automationRouter";
import { conversationsRouter } from "./conversationsRouter";
import { authRouter } from "./authRouter";
import { smsReminderRouter } from "./smsReminderRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as bcrypt from "bcryptjs";
import { getActiveStaffPins, updateStaffPinLastUsed, createStaffPin, getAllStaffPins, updateStaffPin, toggleStaffPinActive, deleteStaffPin } from "./db";

// Helper functions for CRM queries
async function executeCRMFunction(name: string, args: any) {
  const { getDashboardStats, searchStudents, getKioskCheckIns, getKioskVisitors, getKioskWaivers } = await import("./db");
  
  switch (name) {
    case 'get_student_count':
      const stats = await getDashboardStats();
      return { count: stats?.total_students || 0, status: args.status || 'all' };
    
    case 'find_student':
      const students = await searchStudents(args.query);
      if (students.length > 0) {
        const student = students[0];
        return {
          type: 'student_lookup',
          student: {
            first_name: student.firstName,
            last_name: student.lastName,
            belt_rank: student.beltRank,
            status: student.status,
            email: student.email,
            phone: student.phone,
            age: student.age,
            membership_status: student.membershipStatus,
          }
        };
      }
      return { error: 'Student not found' };
    
    case 'get_revenue':
      const revenueStats = await getDashboardStats();
      return { revenue: revenueStats?.monthly_revenue || 0, period: args.period || 'month' };
    
    case 'get_leads':
      const leadStats = await getDashboardStats();
      return { count: leadStats?.total_leads || 0, status: args.status || 'all' };
    
    case 'find_lead':
      const { getDb } = await import("./db");
      const { leads } = await import("../drizzle/schema");
      const { like, or } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) return { error: 'Database not available' };
      
      // Search leads by name
      const searchResults = await db.select().from(leads)
        .where(
          or(
            like(leads.firstName, `%${args.query}%`),
            like(leads.lastName, `%${args.query}%`)
          )
        )
        .limit(1);
      
      if (searchResults.length > 0) {
        const lead = searchResults[0];
        return {
          type: 'lead_lookup',
          lead: {
            first_name: lead.firstName,
            last_name: lead.lastName,
            email: lead.email,
            phone: lead.phone,
            status: lead.status,
            source: lead.source,
            notes: lead.notes,
          }
        };
      }
      return { error: 'Lead not found' };
    
    case 'get_checkins':
      const checkIns = await getKioskCheckIns();
      return { count: checkIns?.length || 0, period: args.period || 'today' };
    
    case 'get_classes':
      return {
        classes: [
          { time: '4:00 PM', name: 'Kids Karate', ages: '6-12' },
          { time: '5:30 PM', name: 'Teen Martial Arts', ages: '13-17' },
          { time: '7:00 PM', name: 'Adult Kickboxing', ages: '18+' },
        ],
        date: args.date || 'today'
      };
    
    case 'get_inactive_students':
      // TODO: Implement actual inactive student query
      return { count: 0, days: args.days, message: 'Feature coming soon' };
    
    default:
      return { error: 'Unknown function' };
  }
}

function formatFunctionResults(results: any[]): string {
  if (results.length === 0) return 'No results found.';
  
  const result = results[0];
  
  if (result.error) {
    return `I couldn't find that information: ${result.error}`;
  }
  
  if (result.type === 'student_lookup') {
    const s = result.student;
    return `Found ${s.first_name} ${s.last_name}: ${s.belt_rank} belt, ${s.status}, ${s.membership_status} membership.`;
  }
  
  if (result.count !== undefined) {
    return `Found ${result.count} results.`;
  }
  
  if (result.revenue !== undefined) {
    return `Revenue: $${result.revenue}`;
  }
  
  return JSON.stringify(result);
}

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  
  // Profile management for Edit Profile Mode
  profile: router({
    // Get current user's profile
    me: protectedProcedure
      .query(async ({ ctx }) => {
        const { getDb } = await import("./db");
        const { users } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db || !ctx.user?.id) {
          return null;
        }
        
        const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
        
        if (!user) return null;
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          displayName: user.displayName,
          preferredName: user.preferredName,
          phone: user.phone,
          bio: user.bio,
          photoUrl: user.photoUrl,
          photoUrlSmall: user.photoUrlSmall,
          role: user.role,
          staffId: user.staffId,
          locationIds: user.locationIds ? JSON.parse(user.locationIds) : [],
          createdAt: user.createdAt,
        };
      }),
    
    // Update current user's profile
    update: protectedProcedure
      .input(z.object({
        name: z.string().max(255).optional(),
        displayName: z.string().max(255).optional(),
        preferredName: z.string().max(255).optional(),
        phone: z.string().max(20).nullable().optional(),
        bio: z.string().max(160).nullable().optional(),
        avatarUrl: z.string().nullable().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { users } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db || !ctx.user?.id) {
          throw new Error('Not authenticated');
        }
        
        const updateData: Record<string, any> = {};
        if (input.name !== undefined) updateData.name = input.name;
        if (input.displayName !== undefined) updateData.displayName = input.displayName;
        if (input.preferredName !== undefined) updateData.preferredName = input.preferredName;
        if (input.phone !== undefined) updateData.phone = input.phone;
        if (input.bio !== undefined) updateData.bio = input.bio;
        if (input.avatarUrl !== undefined) {
          updateData.photoUrl = input.avatarUrl;
          updateData.photoUrlSmall = input.avatarUrl;
        }
        
        if (Object.keys(updateData).length > 0) {
          await db.update(users)
            .set(updateData)
            .where(eq(users.id, ctx.user.id));
        }
        
        return { success: true };
      }),
    
    // Upload profile photo
    uploadPhoto: protectedProcedure
      .input(z.object({
        fileData: z.string(), // base64 data URL
        fileType: z.string(), // MIME type
        fileSize: z.number(), // Size in bytes
      }))
      .mutation(async ({ input, ctx }) => {
        const { storagePut } = await import("./storage");
        const { getDb } = await import("./db");
        const { users } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (input.fileSize > maxSize) {
          throw new Error('File size exceeds 10MB limit');
        }
        
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(input.fileType)) {
          throw new Error('File type not supported. Allowed: jpg, png, webp');
        }
        
        // Extract base64 data
        const base64Match = input.fileData.match(/^data:[^;]+;base64,(.+)$/);
        if (!base64Match) {
          throw new Error('Invalid file data format');
        }
        
        const buffer = Buffer.from(base64Match[1], 'base64');
        
        // Generate unique key
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const userId = ctx.user?.id || 'anonymous';
        const ext = input.fileType.split('/')[1] || 'jpg';
        const key = `profile-photos/${userId}/${timestamp}-${randomSuffix}.${ext}`;
        
        // Upload to S3
        const result = await storagePut(key, buffer, input.fileType);
        
        // Update user record
        const db = await getDb();
        if (db && ctx.user?.id) {
          await db.update(users)
            .set({
              photoUrl: result.url,
              photoUrlSmall: result.url, // TODO: Generate resized version
            })
            .where(eq(users.id, ctx.user.id));
        }
        
        return {
          success: true,
          url: result.url,
        };
      }),
    
    // Admin: Get any user's profile
    getUser: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input, ctx }) => {
        // Only admins can view other profiles
        if (ctx.user?.role !== 'admin' && ctx.user?.role !== 'owner') {
          throw new Error('Unauthorized');
        }
        
        const { getDb } = await import("./db");
        const { users } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) return null;
        
        const [user] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
        
        if (!user) return null;
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          displayName: user.displayName,
          preferredName: user.preferredName,
          phone: user.phone,
          bio: user.bio,
          photoUrl: user.photoUrl,
          photoUrlSmall: user.photoUrlSmall,
          role: user.role,
          staffId: user.staffId,
          locationIds: user.locationIds ? JSON.parse(user.locationIds) : [],
          createdAt: user.createdAt,
        };
      }),
    
    // Admin: Update any user's profile
    updateUser: protectedProcedure
      .input(z.object({
        userId: z.number(),
        displayName: z.string().max(255).optional(),
        preferredName: z.string().max(255).optional(),
        phone: z.string().max(20).optional(),
        bio: z.string().max(160).optional(),
        role: z.enum(['user', 'admin', 'owner', 'staff']).optional(),
        locationIds: z.array(z.number()).optional(),
        staffId: z.string().max(50).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Only admins can update other profiles
        if (ctx.user?.role !== 'admin' && ctx.user?.role !== 'owner') {
          throw new Error('Unauthorized');
        }
        
        const { getDb } = await import("./db");
        const { users } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) {
          throw new Error('Database not available');
        }
        
        await db.update(users)
          .set({
            displayName: input.displayName,
            preferredName: input.preferredName,
            phone: input.phone,
            bio: input.bio,
            role: input.role,
            locationIds: input.locationIds ? JSON.stringify(input.locationIds) : undefined,
            staffId: input.staffId,
          })
          .where(eq(users.id, input.userId));
        
        return { success: true };
      }),
  }),
  
  // File upload for attachments
  upload: router({
    // Upload a file attachment (image or document)
    uploadAttachment: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileData: z.string(), // base64 data URL
        fileType: z.string(), // MIME type
        fileSize: z.number(), // Size in bytes
        context: z.enum(['kai-command', 'message', 'general']).default('general'),
      }))
      .mutation(async ({ input, ctx }) => {
        const { storagePut } = await import("./storage");
        
        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (input.fileSize > maxSize) {
          throw new Error('File size exceeds 10MB limit');
        }
        
        // Validate file type
        const allowedTypes = [
          // Images
          'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
          // Documents
          'application/pdf', 
          'application/msword', 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
        ];
        
        if (!allowedTypes.includes(input.fileType)) {
          throw new Error('File type not supported. Allowed: images (jpg, png, gif, webp) and documents (pdf, doc, docx, txt)');
        }
        
        // Extract base64 data from data URL
        const base64Match = input.fileData.match(/^data:[^;]+;base64,(.+)$/);
        if (!base64Match) {
          throw new Error('Invalid file data format');
        }
        
        const buffer = Buffer.from(base64Match[1], 'base64');
        
        // Generate unique key with timestamp and random suffix
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const sanitizedFileName = input.fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const userId = ctx.user?.id || 'anonymous';
        const key = `attachments/${input.context}/${userId}/${timestamp}-${randomSuffix}-${sanitizedFileName}`;
        
        // Upload to S3
        const result = await storagePut(key, buffer, input.fileType);
        
        // Create document record in database
        const { getDb } = await import("./db");
        const { documents } = await import("../drizzle/schema");
        const db = await getDb();
        
        let docId: number | undefined;
        if (db) {
          try {
            const [doc] = await db.insert(documents).values({
              ownerType: 'staff',
              ownerId: ctx.user?.id || 0,
              source: 'chat_upload',
              filename: input.fileName,
              mimeType: input.fileType,
              sizeBytes: input.fileSize,
              storageUrl: result.url,
              uploadedById: ctx.user?.id,
              uploadedByName: ctx.user?.name || 'Unknown',
            });
            docId = doc.insertId;
          } catch (err) {
            console.error('Failed to create document record:', err);
          }
        }
        
        return {
          success: true,
          url: result.url,
          key: result.key,
          fileName: input.fileName,
          fileType: input.fileType,
          fileSize: input.fileSize,
          docId,
        };
      }),
    
    // Get allowed file types
    getAllowedTypes: publicProcedure
      .query(() => {
        return {
          images: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
          documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
          maxSize: 10 * 1024 * 1024, // 10MB
          maxSizeLabel: '10MB',
        };
      }),
  }),
  
  // Documents library router
  documents: router({
    // Get documents for a student
    getStudentDocuments: protectedProcedure
      .input(z.object({
        studentId: z.number(),
        source: z.enum(['all', 'chat_upload', 'waiver', 'invoice', 'onboarding', 'manual_upload', 'receipt']).default('all'),
      }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const { documents } = await import("../drizzle/schema");
        const { eq, or, desc } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) return { documents: [] };
        
        let query = db.select().from(documents)
          .where(or(
            eq(documents.linkedStudentId, input.studentId),
            eq(documents.ownerId, input.studentId)
          ))
          .orderBy(desc(documents.createdAt));
        
        const docs = await query;
        
        // Filter by source if not 'all'
        const filteredDocs = input.source === 'all' 
          ? docs 
          : docs.filter(d => d.source === input.source);
        
        return { documents: filteredDocs };
      }),
    
    // Get documents for a thread
    getThreadDocuments: protectedProcedure
      .input(z.object({
        threadId: z.number(),
      }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const { documents } = await import("../drizzle/schema");
        const { eq, desc } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) return { documents: [] };
        
        const docs = await db.select().from(documents)
          .where(eq(documents.threadId, input.threadId))
          .orderBy(desc(documents.createdAt));
        
        return { documents: docs };
      }),
    
    // Link document to student
    linkToStudent: protectedProcedure
      .input(z.object({
        docId: z.number(),
        studentId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { documents } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) return { success: false };
        
        await db.update(documents)
          .set({ linkedStudentId: input.studentId })
          .where(eq(documents.id, input.docId));
        
        return { success: true };
      }),
    
    // Link document to thread/message
    linkToThread: protectedProcedure
      .input(z.object({
        docId: z.number(),
        threadId: z.number(),
        messageId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { documents } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) return { success: false };
        
        await db.update(documents)
          .set({ 
            threadId: input.threadId,
            messageId: input.messageId,
          })
          .where(eq(documents.id, input.docId));
        
        return { success: true };
      }),
    
    // Upload document directly to student
    uploadToStudent: protectedProcedure
      .input(z.object({
        studentId: z.number(),
        fileName: z.string(),
        fileData: z.string(),
        fileType: z.string(),
        fileSize: z.number(),
        description: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { storagePut } = await import("./storage");
        const { getDb } = await import("./db");
        const { documents } = await import("../drizzle/schema");
        
        // Extract base64 data
        const base64Match = input.fileData.match(/^data:[^;]+;base64,(.+)$/);
        if (!base64Match) throw new Error('Invalid file data format');
        
        const buffer = Buffer.from(base64Match[1], 'base64');
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const sanitizedFileName = input.fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const key = `documents/student/${input.studentId}/${timestamp}-${randomSuffix}-${sanitizedFileName}`;
        
        const result = await storagePut(key, buffer, input.fileType);
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const [doc] = await db.insert(documents).values({
          ownerType: 'staff',
          ownerId: ctx.user?.id || 0,
          linkedStudentId: input.studentId,
          source: 'manual_upload',
          filename: input.fileName,
          mimeType: input.fileType,
          sizeBytes: input.fileSize,
          storageUrl: result.url,
          description: input.description,
          tags: input.tags ? JSON.stringify(input.tags) : null,
          uploadedById: ctx.user?.id,
          uploadedByName: ctx.user?.name || 'Unknown',
        });
        
        return { success: true, docId: doc.insertId, url: result.url };
      }),
    
    // Delete document
    deleteDocument: protectedProcedure
      .input(z.object({ docId: z.number() }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { documents } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) return { success: false };
        
        await db.delete(documents).where(eq(documents.id, input.docId));
        return { success: true };
      }),
  }),
  
  setupWizard: setupWizardRouter,
  billing: billingRouter,
  webhook: webhookRouter,
  campaigns: campaignsRouter,
  automation: automationRouter,
  conversations: conversationsRouter,
  smsReminders: smsReminderRouter,
  auth: router({
    // User profile endpoint
    getCurrentUser: authRouter.getCurrentUser,
    
    // Legacy endpoints
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Staff PIN validation for kiosk access
  staff: router({
    validatePin: publicProcedure
      .input(z.object({
        pin: z.string().length(4).regex(/^\d{4}$/, "PIN must be 4 digits"),
      }))
      .mutation(async ({ input }) => {
        const { pin } = input;
        
        // Get all active staff PINs from database
        const staffPins = await getActiveStaffPins();
        
        if (staffPins.length === 0) {
          // No PINs in database - allow default PIN 1234 for initial setup
          if (pin === "1234") {
            return {
              valid: true,
              staffName: "Default Admin",
              message: "Using default PIN. Please create staff PINs in settings."
            };
          }
          return {
            valid: false,
            message: "Invalid PIN"
          };
        }
        
        // Check PIN against all active staff PINs
        for (const staffPin of staffPins) {
          const isMatch = await bcrypt.compare(pin, staffPin.pinHash);
          if (isMatch) {
            // Update last used timestamp
            await updateStaffPinLastUsed(staffPin.id);
            
            return {
              valid: true,
              staffName: staffPin.name,
              role: staffPin.role,
              message: "Access granted"
            };
          }
        }
        
        return {
          valid: false,
          message: "Invalid PIN"
        };
      }),
    
    createPin: publicProcedure
      .input(z.object({
        name: z.string().min(1, "Name is required"),
        pin: z.string().length(4).regex(/^\d{4}$/, "PIN must be 4 digits"),
        role: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { name, pin, role } = input;
        
        // Hash the PIN before storing
        const pinHash = await bcrypt.hash(pin, 10);
        
        await createStaffPin({
          name,
          pinHash,
          role: role || "staff",
          isActive: 1,
        });
        
        return {
          success: true,
          message: `PIN created for ${name}`
        };
      }),
    
    listPins: publicProcedure
      .query(async () => {
        const pins = await getAllStaffPins();
        // Remove pinHash from response for security
        return pins.map(({ pinHash, ...pin }) => pin);
      }),
    
    updatePin: publicProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1, "Name is required"),
        pin: z.string().length(4).regex(/^\d{4}$/, "PIN must be 4 digits").optional(),
        role: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, name, pin, role } = input;
        
        const updates: any = { name, role };
        
        // Only update PIN if provided
        if (pin) {
          updates.pinHash = await bcrypt.hash(pin, 10);
        }
        
        await updateStaffPin(id, updates);
        
        return {
          success: true,
          message: `PIN updated for ${name}`
        };
      }),
    
    toggleActive: publicProcedure
      .input(z.object({
        id: z.number(),
        isActive: z.number().min(0).max(1),
      }))
      .mutation(async ({ input }) => {
        const { id, isActive } = input;
        
        await toggleStaffPinActive(id, isActive);
        
        return {
          success: true,
          message: isActive ? "PIN activated" : "PIN deactivated"
        };
      }),
    
    deletePin: publicProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { id } = input;
        
        await deleteStaffPin(id);
        
        return {
          success: true,
          message: "PIN deleted successfully"
        };
      }),
    
    // Get all staff members for mention dropdown
    getAll: publicProcedure
      .input(z.object({
        search: z.string().optional(),
        limit: z.number().optional().default(10),
      }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const { teamMembers } = await import("../drizzle/schema");
        const { eq, like, or, sql } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) return { staff: [] };
        
        let query = db.select().from(teamMembers).where(eq(teamMembers.isActive, 1));
        
        if (input.search && input.search.length > 0) {
          const searchPattern = `%${input.search}%`;
          query = db.select().from(teamMembers).where(
            sql`${teamMembers.isActive} = 1 AND (${teamMembers.name} LIKE ${searchPattern} OR ${teamMembers.addressAs} LIKE ${searchPattern} OR ${teamMembers.role} LIKE ${searchPattern})`
          );
        }
        
        const staff = await query.limit(input.limit);
        
        return {
          staff: staff.map(s => ({
            id: s.id,
            name: s.addressAs || s.name,
            fullName: s.name,
            role: s.role.charAt(0).toUpperCase() + s.role.slice(1).replace('_', ' '),
            email: s.email,
            photoUrl: s.photoUrl || null,
          }))
        };
      }),
    
    // Update staff member photo
    updatePhoto: publicProcedure
      .input(z.object({
        id: z.number(),
        photoUrl: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { teamMembers } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        await db.update(teamMembers)
          .set({ photoUrl: input.photoUrl })
          .where(eq(teamMembers.id, input.id));
        
        return { success: true };
      }),
    
    // Get single staff member by ID
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const { teamMembers } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) return null;
        
        const [staff] = await db.select().from(teamMembers).where(eq(teamMembers.id, input.id));
        if (!staff) return null;
        
        return {
          id: staff.id,
          name: staff.name,
          addressAs: staff.addressAs,
          role: staff.role,
          email: staff.email,
          phone: staff.phone,
          photoUrl: staff.photoUrl,
          focusAreas: staff.focusAreas,
          isActive: staff.isActive,
        };
      }),
  }),

  // Messaging router for @mentions and directed messages
  messaging: router({
    // Get classes for mention dropdown (bulk messaging)
    getClassesForMention: publicProcedure
      .input(z.object({
        search: z.string().optional(),
        limit: z.number().optional().default(5),
      }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const { classes, classEnrollments } = await import("../drizzle/schema");
        const { eq, like, sql } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) return { classes: [] };
        
        // Get classes with student counts
        let query;
        if (input.search && input.search.length > 0) {
          const searchPattern = `%${input.search}%`;
          query = db.select({
            id: classes.id,
            name: classes.name,
            schedule: classes.schedule,
            studentCount: sql<number>`(SELECT COUNT(*) FROM class_enrollments WHERE class_enrollments.classId = ${classes.id})`,
          }).from(classes).where(like(classes.name, searchPattern));
        } else {
          query = db.select({
            id: classes.id,
            name: classes.name,
            schedule: classes.schedule,
            studentCount: sql<number>`(SELECT COUNT(*) FROM class_enrollments WHERE class_enrollments.classId = ${classes.id})`,
          }).from(classes);
        }
        
        const result = await query.limit(input.limit);
        
        return {
          classes: result.map(c => ({
            id: c.id,
            name: c.name,
            schedule: c.schedule || '',
            studentCount: Number(c.studentCount) || 0,
          }))
        };
      }),
    
    // Send a directed message from @mention
    sendDirectedMessage: protectedProcedure
      .input(z.object({
        recipientType: z.enum(['student', 'staff', 'group']),
        recipientId: z.number(),
        content: z.string().min(1),
        subject: z.string().optional(),
        sourceConversationId: z.number().optional(),
        sourceMessageId: z.number().optional(),
        kaiMentioned: z.boolean().default(false),
        attachments: z.array(z.object({
          url: z.string(),
          name: z.string(),
          type: z.string(),
          size: z.number(),
        })).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { directedMessages, studentMessages, staffMessages } = await import("../drizzle/schema");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const senderName = ctx.user?.name || 'Unknown';
        const senderId = ctx.user?.id || 0;
        
        // Create the directed message record
        const [directedMsg] = await db.insert(directedMessages).values({
          recipientType: input.recipientType,
          recipientId: input.recipientId,
          senderId,
          senderName,
          content: input.content,
          subject: input.subject,
          sourceConversationId: input.sourceConversationId,
          sourceMessageId: input.sourceMessageId,
          kaiMentioned: input.kaiMentioned ? 1 : 0,
          attachments: input.attachments ? JSON.stringify(input.attachments) : null,
          label: 'message',
        }).$returningId();
        
        // Also create a record in the appropriate inbox table
        if (input.recipientType === 'student') {
          await db.insert(studentMessages).values({
            studentId: input.recipientId,
            senderType: 'staff',
            senderId,
            senderName,
            subject: input.subject || 'New Message',
            content: input.content,
          });
        } else if (input.recipientType === 'staff') {
          await db.insert(staffMessages).values({
            staffId: input.recipientId,
            senderType: 'staff',
            senderId,
            senderName,
            subject: input.subject || 'New Message',
            content: input.content,
            attachments: input.attachments ? JSON.stringify(input.attachments) : null,
          });
        }
        
        return {
          success: true,
          messageId: directedMsg.id,
          kaiShouldRespond: input.kaiMentioned,
        };
      }),
    
    // Get staff inbox messages
    getStaffInbox: protectedProcedure
      .input(z.object({
        staffId: z.number().optional(),
        limit: z.number().optional().default(50),
        offset: z.number().optional().default(0),
      }))
      .query(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { staffMessages } = await import("../drizzle/schema");
        const { eq, desc } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) return { messages: [], total: 0 };
        
        // Use provided staffId or try to get from user context
        const staffId = input.staffId;
        if (!staffId) return { messages: [], total: 0 };
        
        const messages = await db.select()
          .from(staffMessages)
          .where(eq(staffMessages.staffId, staffId))
          .orderBy(desc(staffMessages.createdAt))
          .limit(input.limit)
          .offset(input.offset);
        
        return {
          messages,
          total: messages.length,
        };
      }),
    
    // Mark staff message as read
    markStaffMessageRead: protectedProcedure
      .input(z.object({
        messageId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { staffMessages } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        await db.update(staffMessages)
          .set({ isRead: 1, readAt: new Date() })
          .where(eq(staffMessages.id, input.messageId));
        
        return { success: true };
      }),
  }),

  // CRM Dashboard APIs
  dashboard: router({
    stats: publicProcedure.query(async () => {
      const { getDashboardStats } = await import("./db");
      const stats = await getDashboardStats();
      return stats || {
        total_students: 0,
        monthly_revenue: 0,
        total_leads: 0,
        todays_classes: []
      };
    }),
    
    getLeads: publicProcedure.query(async () => {
      const { getDb } = await import("./db");
      const { leads } = await import("../drizzle/schema");
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // Get all leads
      const allLeads = await db.select().from(leads);
      return allLeads;
    }),
  }),

  leadSources: router({
    list: publicProcedure.query(async () => {
      const { getDb } = await import("./db");
      const { leadSources } = await import("../drizzle/schema");
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // Get all lead sources ordered by displayOrder
      const sources = await db.select().from(leadSources).orderBy(leadSources.displayOrder);
      return sources;
    }),
    
    toggle: publicProcedure
      .input(z.object({
        id: z.number(),
        enabled: z.number().min(0).max(1),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { leadSources } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        await db.update(leadSources)
          .set({ enabled: input.enabled })
          .where(eq(leadSources.id, input.id));
        
        return { success: true };
      }),
  }),

  leads: router({
    getByStatus: publicProcedure.query(async () => {
      const { getDb } = await import("./db");
      const { leads } = await import("../drizzle/schema");
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // Get all leads
      const allLeads = await db.select().from(leads);
      
      // Group by status (map database enum values to frontend keys)
      const grouped = {
        new_lead: [],
        attempting_contact: [],
        contact_made: [],
        intro_scheduled: [],
        offer_presented: [],
        enrolled: [],
        nurture: [],
        lost_winback: [],
      };
      
      allLeads.forEach(lead => {
        const statusKey = lead.status.toLowerCase().replace(/\s+/g, '_').replace(/\//g, '_');
        if (grouped[statusKey]) {
          grouped[statusKey].push({
            id: lead.id,
            first_name: lead.firstName,
            last_name: lead.lastName,
            email: lead.email,
            phone: lead.phone,
            status: statusKey,
            source: lead.source,
            notes: lead.notes,
            lead_score: lead.leadScore,
            created_at: lead.createdAt,
            updated_at: lead.updatedAt,
          });
        }
      });
      
      return grouped;
    }),
    
    create: publicProcedure
      .input(z.object({
        firstName: z.string(),
        lastName: z.string(),
        email: z.string().optional(),
        phone: z.string().optional(),
        source: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { leads } = await import("../drizzle/schema");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const result = await db.insert(leads).values({
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone,
          source: input.source,
          notes: input.notes,
          status: "New Lead",
        });
        
        const newLeadId = result.insertId;
        
        // Trigger automation for new lead (async, don't wait)
        const { triggerAutomation } = await import("./services/automationEngine");
        triggerAutomation("new_lead", "lead", newLeadId).catch((err) => {
          console.error('[Leads] Automation trigger error:', err);
        });
        
        return { success: true, id: newLeadId };
      }),
    
    updateStatus: publicProcedure
      .input(z.object({
        id: z.number(),
        status: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { leads } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Map frontend key to database enum value
        const statusMap = {
          'new_lead': 'New Lead',
          'attempting_contact': 'Attempting Contact',
          'contact_made': 'Contact Made',
          'intro_scheduled': 'Intro Scheduled',
          'offer_presented': 'Offer Presented',
          'enrolled': 'Enrolled',
          'nurture': 'Nurture',
          'lost_winback': 'Lost/Winback',
        };
        
        const dbStatus = statusMap[input.status] || input.status;
        
        await db.update(leads)
          .set({ status: dbStatus })
          .where(eq(leads.id, input.id));
        
        return { success: true };
      }),
    
    delete: publicProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { leads } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        await db.delete(leads).where(eq(leads.id, input.id));
        
        return { success: true };
      }),
    
    // Lead Activities - Timeline
    getActivities: publicProcedure
      .input(z.object({
        leadId: z.number(),
        limit: z.number().optional().default(50),
      }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const { leadActivities } = await import("../drizzle/schema");
        const { eq, desc } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const activities = await db.select()
          .from(leadActivities)
          .where(eq(leadActivities.leadId, input.leadId))
          .orderBy(desc(leadActivities.createdAt))
          .limit(input.limit);
        
        return activities;
      }),
    
    addActivity: publicProcedure
      .input(z.object({
        leadId: z.number(),
        type: z.enum(["call", "email", "sms", "note", "status_change", "meeting", "task"]),
        title: z.string().optional(),
        content: z.string().optional(),
        previousStatus: z.string().optional(),
        newStatus: z.string().optional(),
        callDuration: z.number().optional(),
        callOutcome: z.enum(["answered", "voicemail", "no_answer", "busy", "wrong_number"]).optional(),
        isAutomated: z.boolean().optional().default(false),
        createdByName: z.string().optional(),
        metadata: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { leadActivities } = await import("../drizzle/schema");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const result = await db.insert(leadActivities).values({
          leadId: input.leadId,
          type: input.type,
          title: input.title,
          content: input.content,
          previousStatus: input.previousStatus,
          newStatus: input.newStatus,
          callDuration: input.callDuration,
          callOutcome: input.callOutcome,
          isAutomated: input.isAutomated ? 1 : 0,
          createdByName: input.createdByName || "System",
          metadata: input.metadata,
        });
        
        // Update lead score after adding activity
        const { updateLeadScore } = await import("./leadScoring");
        await updateLeadScore(input.leadId);
        
        return { success: true, id: result.insertId };
      }),
    
    // Lead Scoring
    getScore: publicProcedure
      .input(z.object({
        leadId: z.number(),
      }))
      .query(async ({ input }) => {
        const { calculateLeadScore, getScoreColor, getScoreLabel } = await import("./leadScoring");
        
        const score = await calculateLeadScore(input.leadId);
        return {
          score,
          color: getScoreColor(score),
          label: getScoreLabel(score),
        };
      }),
    
    recalculateScore: publicProcedure
      .input(z.object({
        leadId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { updateLeadScore, getScoreColor, getScoreLabel } = await import("./leadScoring");
        
        const score = await updateLeadScore(input.leadId);
        return {
          success: true,
          score,
          color: getScoreColor(score),
          label: getScoreLabel(score),
        };
      }),
    
    recalculateAllScores: publicProcedure
      .mutation(async () => {
        const { recalculateAllLeadScores } = await import("./leadScoring");
        
        const result = await recalculateAllLeadScores();
        return {
          success: true,
          ...result,
        };
      }),
    
    // Get all leads with scores for sorting
    getAllWithScores: publicProcedure
      .input(z.object({
        sortBy: z.enum(["score", "created", "updated"]).optional().default("created"),
        sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
      }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const { leads } = await import("../drizzle/schema");
        const { desc, asc } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        let orderBy;
        const orderFn = input.sortOrder === "asc" ? asc : desc;
        
        switch (input.sortBy) {
          case "score":
            orderBy = orderFn(leads.leadScore);
            break;
          case "updated":
            orderBy = orderFn(leads.updatedAt);
            break;
          default:
            orderBy = orderFn(leads.createdAt);
        }
        
        const allLeads = await db.select().from(leads).orderBy(orderBy);
        
        return allLeads.map(lead => ({
          id: lead.id,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: lead.phone,
          status: lead.status,
          source: lead.source,
          leadScore: lead.leadScore,
          leadScoreUpdatedAt: lead.leadScoreUpdatedAt,
          createdAt: lead.createdAt,
          updatedAt: lead.updatedAt,
        }));
      }),
  }),

  kiosk: router({
    checkIns: publicProcedure.query(async () => {
      const { getKioskCheckIns } = await import("./db");
      const data = await getKioskCheckIns();
      return { data };
    }),
    
    visitors: publicProcedure.query(async () => {
      const { getKioskVisitors } = await import("./db");
      const data = await getKioskVisitors();
      return { data };
    }),
    
    waivers: publicProcedure.query(async () => {
      const { getKioskWaivers } = await import("./db");
      const data = await getKioskWaivers();
      return { data };
    }),
    
    // Submit a waiver and send email confirmation
    submitWaiver: publicProcedure
      .input(z.object({
        name: z.string(),
        email: z.string().email(),
        studentId: z.number().optional(),
        signatureData: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { kioskWaivers, documents, dojoSettings } = await import("../drizzle/schema");
        const { storagePut } = await import("./storage");
        const { sendEmail } = await import("./_core/sendgrid");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Record waiver signature
        await db.insert(kioskWaivers).values({
          name: input.name,
          email: input.email,
          timestamp: new Date(),
        });
        
        // If signature data provided, save as document
        let waiverDocUrl: string | undefined;
        if (input.signatureData && input.studentId) {
          try {
            const base64Match = input.signatureData.match(/^data:[^;]+;base64,(.+)$/);
            if (base64Match) {
              const buffer = Buffer.from(base64Match[1], 'base64');
              const timestamp = Date.now();
              const key = `waivers/${input.studentId}/${timestamp}-signed-waiver.png`;
              const result = await storagePut(key, buffer, 'image/png');
              waiverDocUrl = result.url;
              
              // Create document record
              await db.insert(documents).values({
                ownerType: 'student',
                ownerId: input.studentId,
                linkedStudentId: input.studentId,
                source: 'waiver',
                filename: `Signed Waiver - ${input.name}.png`,
                mimeType: 'image/png',
                sizeBytes: buffer.length,
                storageUrl: result.url,
                uploadedByName: input.name,
              });
            }
          } catch (err) {
            console.error('Failed to save waiver signature:', err);
          }
        }
        
        // Get dojo settings for email
        const settings = await db.select().from(dojoSettings).limit(1);
        const dojoName = settings[0]?.dojoName || 'Our Dojo';
        
        // Send confirmation email to signer
        try {
          await sendEmail({
            to: { email: input.email, name: input.name },
            subject: `Waiver Signed - ${dojoName}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #E53935;">Waiver Confirmation</h2>
                <p>Hi ${input.name},</p>
                <p>Thank you for signing the waiver for <strong>${dojoName}</strong>.</p>
                <p>This email confirms that your waiver was successfully submitted on ${new Date().toLocaleDateString()}.</p>
                ${waiverDocUrl ? `<p>You can view your signed waiver <a href="${waiverDocUrl}">here</a>.</p>` : ''}
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="color: #666; font-size: 12px;">This is an automated message from ${dojoName}.</p>
              </div>
            `,
          });
        } catch (err) {
          console.error('Failed to send waiver confirmation email:', err);
        }
        
        return {
          success: true,
          message: 'Waiver submitted successfully. A confirmation email has been sent.',
          documentUrl: waiverDocUrl,
        };
      }),
    
    recordCheckIn: publicProcedure
      .input(z.object({
        studentId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { students, kioskCheckIns } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Get student info
        const student = await db.select().from(students).where(eq(students.id, input.studentId)).limit(1);
        
        if (student.length === 0) {
          return {
            success: false,
            message: 'Student not found'
          };
        }
        
        // Record check-in
        const fullName = `${student[0].firstName} ${student[0].lastName}`;
        await db.insert(kioskCheckIns).values({
          studentId: input.studentId,
          studentName: fullName,
          timestamp: new Date(),
        });
        
        return {
          success: true,
          student: {
            ...student[0],
            name: fullName
          },
          message: `Welcome, ${fullName}!`
        };
      }),
  }),
  
  students: router({
    list: publicProcedure
      .query(async () => {
        const { getDb } = await import("./db");
        const { students } = await import("../drizzle/schema");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Get all students
        const allStudents = await db.select().from(students);
        return allStudents;
      }),
    
    lookupByPhone: publicProcedure
      .input(z.object({
        phone: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { students } = await import("../drizzle/schema");
        const { eq, like } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Search for student by phone
        const result = await db.select().from(students).where(like(students.phone, `%${input.phone}%`)).limit(1);
        
        if (result.length > 0) {
          return {
            student: result[0]
          };
        }
        
        return {
          student: null,
          message: 'Student not found'
        };
      }),
      
    searchStudents: publicProcedure
      .input(z.object({
        query: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { searchStudents } = await import("./db");
        const students = await searchStudents(input.query);
        
        return {
          students
        };
      }),
    
    stats: publicProcedure
      .query(async () => {
        const { getDashboardStats } = await import("./db");
        const stats = await getDashboardStats();
        return {
          total: stats?.total_students || 0,
          active: stats?.total_students || 0,
          overdue: 0,
          newThisMonth: 0
        };
      }),
    
    create: publicProcedure
      .input(z.object({
        firstName: z.string(),
        lastName: z.string(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        dateOfBirth: z.date().optional(),
        age: z.number().optional(),
        beltRank: z.string().optional(),
        status: z.string().optional(),
        membershipStatus: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { students } = await import("../drizzle/schema");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const newStudent = await db.insert(students).values({
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email || null,
          phone: input.phone || null,
          dateOfBirth: input.dateOfBirth || null,
          age: input.age || null,
          beltRank: input.beltRank || 'White',
          status: input.status || 'Active',
          membershipStatus: input.membershipStatus || 'Active',
        });
        
        return { success: true, id: newStudent.insertId };
      }),
    
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().email().optional().nullable(),
        phone: z.string().optional().nullable(),
        dateOfBirth: z.date().optional().nullable(),
        age: z.number().optional().nullable(),
        beltRank: z.string().optional().nullable(),
        status: z.string().optional(),
        membershipStatus: z.string().optional().nullable(),
        program: z.string().optional().nullable(),
        // Address fields
        streetAddress: z.string().optional().nullable(),
        city: z.string().optional().nullable(),
        state: z.string().optional().nullable(),
        zipCode: z.string().optional().nullable(),
        // Geocoded coordinates
        latitude: z.string().optional().nullable(),
        longitude: z.string().optional().nullable(),
        // Parent/Guardian fields
        guardianName: z.string().optional().nullable(),
        guardianRelationship: z.string().optional().nullable(),
        guardianPhone: z.string().optional().nullable(),
        guardianEmail: z.string().email().optional().nullable(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { students } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const { geocodeAddress } = await import("./geocoding");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const { id, ...updateData } = input;
        
        // Filter out undefined values to avoid overwriting with null
        const cleanedData: Record<string, any> = {};
        for (const [key, value] of Object.entries(updateData)) {
          if (value !== undefined) {
            cleanedData[key] = value;
          }
        }
        
        // Check if address fields are being updated and geocode if needed
        const hasAddressUpdate = 
          updateData.streetAddress !== undefined ||
          updateData.city !== undefined ||
          updateData.state !== undefined ||
          updateData.zipCode !== undefined;
        
        if (hasAddressUpdate) {
          // Get current student data to merge with new address
          const [currentStudent] = await db.select().from(students).where(eq(students.id, id));
          
          if (currentStudent) {
            const addressToGeocode = {
              streetAddress: updateData.streetAddress ?? currentStudent.streetAddress ?? undefined,
              city: updateData.city ?? currentStudent.city ?? undefined,
              state: updateData.state ?? currentStudent.state ?? undefined,
              zipCode: updateData.zipCode ?? currentStudent.zipCode ?? undefined,
            };
            
            // Only geocode if we have enough address info
            if (addressToGeocode.city || addressToGeocode.zipCode) {
              console.log('[Student Update] Geocoding address:', addressToGeocode);
              const geocodeResult = await geocodeAddress(addressToGeocode);
              
              if (geocodeResult) {
                cleanedData.latitude = geocodeResult.latitude;
                cleanedData.longitude = geocodeResult.longitude;
                console.log('[Student Update] Geocoded to:', geocodeResult.latitude, geocodeResult.longitude);
              }
            }
          }
        }
        
        await db.update(students).set(cleanedData).where(eq(students.id, id));
        
        return { success: true, geocoded: hasAddressUpdate };
      }),
    
    delete: publicProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { students } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        await db.delete(students).where(eq(students.id, input.id));
        
        return { success: true };
      }),
    
    // Add a note to a student's profile
    addNote: protectedProcedure
      .input(z.object({
        studentId: z.number(),
        content: z.string(),
        noteType: z.enum(['manual', 'extraction', 'action_item', 'follow_up']).default('manual'),
        priority: z.enum(['low', 'medium', 'high']).optional(),
        sourceConversationId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { studentNotes, students } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Verify student exists
        const student = await db.select().from(students).where(eq(students.id, input.studentId)).limit(1);
        if (student.length === 0) {
          throw new Error('Student not found');
        }
        
        // Insert the note
        const result = await db.insert(studentNotes).values({
          studentId: input.studentId,
          content: input.content,
          noteType: input.noteType,
          priority: input.priority || 'medium',
          createdById: ctx.user.id,
          createdByName: ctx.user.name || 'Unknown',
          sourceConversationId: input.sourceConversationId || null,
        });
        
        return { 
          success: true, 
          noteId: result.insertId,
          studentName: `${student[0].firstName} ${student[0].lastName}`
        };
      }),
    
    // Get notes for a student
    getNotes: publicProcedure
      .input(z.object({
        studentId: z.number(),
      }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const { studentNotes } = await import("../drizzle/schema");
        const { eq, desc } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const notes = await db.select()
          .from(studentNotes)
          .where(eq(studentNotes.studentId, input.studentId))
          .orderBy(desc(studentNotes.createdAt));
        
        return notes;
      }),
    
    // Mark a note as completed
    completeNote: protectedProcedure
      .input(z.object({
        noteId: z.number(),
        isCompleted: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { studentNotes } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        await db.update(studentNotes)
          .set({ 
            isCompleted: input.isCompleted ? 1 : 0,
            completedAt: input.isCompleted ? new Date() : null
          })
          .where(eq(studentNotes.id, input.noteId));
        
        return { success: true };
      }),
  }),

  kai: router({
    // Get all conversations for the current user (excludes soft-deleted)
    getConversations: protectedProcedure
      .query(async ({ ctx }) => {
        const { getDb } = await import("./db");
        const { kaiConversations } = await import("../drizzle/schema");
        const { eq, desc, and, isNull } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Filter out soft-deleted conversations (deletedAt is null)
        const conversations = await db.select()
          .from(kaiConversations)
          .where(and(
            eq(kaiConversations.userId, ctx.user.id),
            isNull(kaiConversations.deletedAt)
          ))
          .orderBy(desc(kaiConversations.lastMessageAt));
        
        return conversations;
      }),

    // Get messages for a specific conversation
    getMessages: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { kaiConversations, kaiMessages } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Verify user owns this conversation
        const [conversation] = await db.select()
          .from(kaiConversations)
          .where(and(
            eq(kaiConversations.id, input.conversationId),
            eq(kaiConversations.userId, ctx.user.id)
          ))
          .limit(1);
        
        if (!conversation) throw new Error("Conversation not found");
        
        const messages = await db.select()
          .from(kaiMessages)
          .where(eq(kaiMessages.conversationId, input.conversationId))
          .orderBy(kaiMessages.createdAt);
        
        // Parse attachments JSON for each message
        return messages.map(msg => ({
          ...msg,
          attachments: msg.attachments ? JSON.parse(msg.attachments) : [],
        }));
      }),

    // Create a new conversation
    createConversation: protectedProcedure
      .input(z.object({
        title: z.string().optional(),
        threadType: z.enum(["kai_direct", "group"]).optional(),
      }).optional())
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { kaiConversations, threadParticipants } = await import("../drizzle/schema");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const threadType = input?.threadType || "kai_direct";
        
        const [result] = await db.insert(kaiConversations).values({
          userId: ctx.user.id,
          title: input?.title || "New Conversation",
          threadType,
        });
        
        // For group conversations, add the creator as owner participant
        if (threadType === "group") {
          await db.insert(threadParticipants).values({
            conversationId: result.insertId,
            participantType: "staff",
            participantId: ctx.user.id,
            participantName: ctx.user.name || "Unknown",
            role: "owner",
            addedById: ctx.user.id,
            addedByName: ctx.user.name || "Unknown",
          });
        }
        
        return { id: result.insertId, threadType };
      }),

    // Get conversation participants
    getParticipants: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { kaiConversations, threadParticipants } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Verify user has access to this conversation
        const [conversation] = await db.select()
          .from(kaiConversations)
          .where(and(
            eq(kaiConversations.id, input.conversationId),
            eq(kaiConversations.userId, ctx.user.id)
          ))
          .limit(1);
        
        if (!conversation) throw new Error("Conversation not found");
        
        const participants = await db.select()
          .from(threadParticipants)
          .where(and(
            eq(threadParticipants.conversationId, input.conversationId),
            eq(threadParticipants.isActive, 1)
          ));
        
        return participants;
      }),

    // Add participant to conversation
    addParticipant: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        participantType: z.enum(["staff", "student", "system"]),
        participantId: z.number().optional(),
        participantName: z.string(),
        role: z.enum(["owner", "member", "viewer"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { kaiConversations, threadParticipants } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Verify user owns this conversation
        const [conversation] = await db.select()
          .from(kaiConversations)
          .where(and(
            eq(kaiConversations.id, input.conversationId),
            eq(kaiConversations.userId, ctx.user.id)
          ))
          .limit(1);
        
        if (!conversation) throw new Error("Conversation not found");
        
        // Check if participant already exists
        const [existing] = await db.select()
          .from(threadParticipants)
          .where(and(
            eq(threadParticipants.conversationId, input.conversationId),
            eq(threadParticipants.participantType, input.participantType),
            eq(threadParticipants.participantId, input.participantId || 0)
          ))
          .limit(1);
        
        if (existing) {
          // Reactivate if previously removed
          if (!existing.isActive) {
            await db.update(threadParticipants)
              .set({ isActive: 1 })
              .where(eq(threadParticipants.id, existing.id));
          }
          return { id: existing.id, reactivated: !existing.isActive };
        }
        
        // Insert new participant
        const [result] = await db.insert(threadParticipants).values({
          conversationId: input.conversationId,
          participantType: input.participantType,
          participantId: input.participantId,
          participantName: input.participantName,
          role: input.role || "member",
          addedById: ctx.user.id,
          addedByName: ctx.user.name || "Unknown",
        });
        
        // If adding to a kai_direct conversation, convert to group
        if (conversation.threadType === "kai_direct") {
          await db.update(kaiConversations)
            .set({ threadType: "group" })
            .where(eq(kaiConversations.id, input.conversationId));
        }
        
        return { id: result.insertId, reactivated: false };
      }),

    // Remove participant from conversation
    removeParticipant: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        participantId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { kaiConversations, threadParticipants } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Verify user owns this conversation
        const [conversation] = await db.select()
          .from(kaiConversations)
          .where(and(
            eq(kaiConversations.id, input.conversationId),
            eq(kaiConversations.userId, ctx.user.id)
          ))
          .limit(1);
        
        if (!conversation) throw new Error("Conversation not found");
        
        // Soft-remove participant (set isActive = 0)
        await db.update(threadParticipants)
          .set({ isActive: 0 })
          .where(and(
            eq(threadParticipants.conversationId, input.conversationId),
            eq(threadParticipants.id, input.participantId)
          ));
        
        return { success: true };
      }),

    // Add a message to a conversation
    addMessage: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        role: z.enum(["user", "assistant", "system"]),
        content: z.string(),
        metadata: z.string().optional(),
        attachments: z.array(z.object({
          id: z.string(),
          url: z.string(),
          fileName: z.string(),
          fileType: z.string(),
          fileSize: z.number(),
        })).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { kaiConversations, kaiMessages } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Verify user owns this conversation
        const [conversation] = await db.select()
          .from(kaiConversations)
          .where(and(
            eq(kaiConversations.id, input.conversationId),
            eq(kaiConversations.userId, ctx.user.id)
          ))
          .limit(1);
        
        if (!conversation) throw new Error("Conversation not found");
        
        // Insert the message with attachments
        const [result] = await db.insert(kaiMessages).values({
          conversationId: input.conversationId,
          role: input.role,
          content: input.content,
          metadata: input.metadata,
          attachments: input.attachments ? JSON.stringify(input.attachments) : null,
        });
        
        // Update conversation with preview and timestamp
        const preview = input.attachments && input.attachments.length > 0 && !input.content.trim()
          ? `Attachments: [${input.attachments.map(a => a.fileName).join(', ')}]`
          : input.content.substring(0, 200);
        await db.update(kaiConversations)
          .set({
            preview,
            lastMessageAt: new Date(),
            // Auto-update title from first user message if still "New Conversation"
            ...(conversation.title === "New Conversation" && input.role === "user" 
              ? { title: input.attachments && input.attachments.length > 0 
                  ? `Attachments: [${input.attachments[0].fileName}]`
                  : input.content.substring(0, 50) + (input.content.length > 50 ? "..." : "") }
              : {}),
          })
          .where(eq(kaiConversations.id, input.conversationId));
        
        return { id: result.insertId };
      }),

    // Update conversation (title, status, category, priority)
    updateConversation: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        status: z.enum(["active", "archived"]).optional(),
        category: z.enum(["kai", "growth", "billing", "operations", "general"]).optional(),
        priority: z.enum(["neutral", "attention", "urgent"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { kaiConversations } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const { id, ...updates } = input;
        
        await db.update(kaiConversations)
          .set(updates)
          .where(and(
            eq(kaiConversations.id, id),
            eq(kaiConversations.userId, ctx.user.id)
          ));
        
        return { success: true };
      }),

    // Soft-delete a conversation (sets deletedAt timestamp)
    deleteConversation: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { kaiConversations } = await import("../drizzle/schema");
        const { eq, and, isNull } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Verify user owns this conversation and it's not already deleted
        const [conversation] = await db.select()
          .from(kaiConversations)
          .where(and(
            eq(kaiConversations.id, input.id),
            eq(kaiConversations.userId, ctx.user.id),
            isNull(kaiConversations.deletedAt)
          ))
          .limit(1);
        
        if (!conversation) {
          throw new Error("Conversation not found or already deleted");
        }
        
        // Soft-delete by setting deletedAt timestamp
        await db.update(kaiConversations)
          .set({ deletedAt: new Date() })
          .where(and(
            eq(kaiConversations.id, input.id),
            eq(kaiConversations.userId, ctx.user.id)
          ));
        
        return { success: true, id: input.id };
      }),

    // Archive a conversation (sets status to 'archived')
    archiveConversation: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { kaiConversations } = await import("../drizzle/schema");
        const { eq, and, isNull } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Verify user owns this conversation and it's not deleted
        const [conversation] = await db.select()
          .from(kaiConversations)
          .where(and(
            eq(kaiConversations.id, input.id),
            eq(kaiConversations.userId, ctx.user.id),
            isNull(kaiConversations.deletedAt)
          ))
          .limit(1);
        
        if (!conversation) {
          throw new Error("Conversation not found or deleted");
        }
        
        // Archive by setting status to 'archived'
        await db.update(kaiConversations)
          .set({ status: 'archived' })
          .where(and(
            eq(kaiConversations.id, input.id),
            eq(kaiConversations.userId, ctx.user.id)
          ));
        
        return { success: true, id: input.id };
      }),

    // Unarchive a conversation (sets status back to 'active')
    unarchiveConversation: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { kaiConversations } = await import("../drizzle/schema");
        const { eq, and, isNull } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Verify user owns this conversation and it's not deleted
        const [conversation] = await db.select()
          .from(kaiConversations)
          .where(and(
            eq(kaiConversations.id, input.id),
            eq(kaiConversations.userId, ctx.user.id),
            isNull(kaiConversations.deletedAt)
          ))
          .limit(1);
        
        if (!conversation) {
          throw new Error("Conversation not found or deleted");
        }
        
        // Unarchive by setting status back to 'active'
        await db.update(kaiConversations)
          .set({ status: 'active' })
          .where(and(
            eq(kaiConversations.id, input.id),
            eq(kaiConversations.userId, ctx.user.id)
          ));
        
        return { success: true, id: input.id };
      }),

    // Rename a conversation
    renameConversation: protectedProcedure
      .input(z.object({ id: z.number(), title: z.string().min(1).max(500) }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { kaiConversations } = await import("../drizzle/schema");
        const { eq, and, isNull } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Verify user owns this conversation and it's not deleted
        const [conversation] = await db.select()
          .from(kaiConversations)
          .where(and(
            eq(kaiConversations.id, input.id),
            eq(kaiConversations.userId, ctx.user.id),
            isNull(kaiConversations.deletedAt)
          ))
          .limit(1);
        
        if (!conversation) {
          throw new Error("Conversation not found or deleted");
        }
        
        // Update the title
        await db.update(kaiConversations)
          .set({ title: input.title.trim() })
          .where(and(
            eq(kaiConversations.id, input.id),
            eq(kaiConversations.userId, ctx.user.id)
          ));
        
        return { success: true, id: input.id, title: input.title.trim() };
      }),

    // Summarize a conversation using AI
    summarizeConversation: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { kaiConversations, kaiMessages } = await import("../drizzle/schema");
        const { eq, and, isNull } = await import("drizzle-orm");
        const { invokeLLM } = await import("./_core/llm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Verify user owns this conversation
        const [conversation] = await db.select()
          .from(kaiConversations)
          .where(and(
            eq(kaiConversations.id, input.conversationId),
            eq(kaiConversations.userId, ctx.user.id),
            isNull(kaiConversations.deletedAt)
          ))
          .limit(1);
        
        if (!conversation) {
          throw new Error("Conversation not found");
        }
        
        // Get all messages in the conversation
        const messages = await db.select()
          .from(kaiMessages)
          .where(eq(kaiMessages.conversationId, input.conversationId))
          .orderBy(kaiMessages.createdAt);
        
        if (messages.length === 0) {
          throw new Error("No messages to summarize");
        }
        
        // Format messages for LLM
        const messageHistory = messages.map(m => `${m.role === 'user' ? 'User' : 'Kai'}: ${m.content}`).join('\n\n');
        
        // Generate summary using LLM
        const response = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: `You are an executive assistant for a martial arts dojo. Generate a concise executive summary of the following conversation. Focus on:
- Key topics discussed
- Important decisions or conclusions
- Action items mentioned
- Any concerns or issues raised

Format the summary with clear sections and bullet points where appropriate. Keep it professional and actionable.`
            },
            {
              role: 'user',
              content: `Please summarize this conversation:\n\n${messageHistory}`
            }
          ]
        });
        
        const summary = response.choices[0]?.message?.content || 'Unable to generate summary';
        
        // Save summary as a Kai message in the conversation
        const [savedMessage] = await db.insert(kaiMessages).values({
          conversationId: input.conversationId,
          role: 'assistant',
          content: `## 📋 Conversation Summary\n\n${summary}`,
          metadata: JSON.stringify({ type: 'summary', generatedAt: new Date().toISOString() })
        });
        
        // Update conversation last message
        await db.update(kaiConversations)
          .set({ 
            preview: 'Conversation Summary generated',
            lastMessageAt: new Date()
          })
          .where(eq(kaiConversations.id, input.conversationId));
        
        return { 
          success: true, 
          summary,
          messageId: savedMessage.insertId
        };
      }),

    // Extract structured data from a conversation using AI
    extractConversation: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { kaiConversations, kaiMessages } = await import("../drizzle/schema");
        const { eq, and, isNull } = await import("drizzle-orm");
        const { invokeLLM } = await import("./_core/llm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Verify user owns this conversation
        const [conversation] = await db.select()
          .from(kaiConversations)
          .where(and(
            eq(kaiConversations.id, input.conversationId),
            eq(kaiConversations.userId, ctx.user.id),
            isNull(kaiConversations.deletedAt)
          ))
          .limit(1);
        
        if (!conversation) {
          throw new Error("Conversation not found");
        }
        
        // Get all messages in the conversation
        const messages = await db.select()
          .from(kaiMessages)
          .where(eq(kaiMessages.conversationId, input.conversationId))
          .orderBy(kaiMessages.createdAt);
        
        if (messages.length === 0) {
          throw new Error("No messages to extract from");
        }
        
        // Format messages for LLM
        const messageHistory = messages.map(m => `${m.role === 'user' ? 'User' : 'Kai'}: ${m.content}`).join('\n\n');
        
        // Extract structured data using LLM with JSON schema
        const response = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: `You are an executive assistant for a martial arts dojo. Extract structured data from the conversation. Identify and categorize:

1. **Action Items**: Tasks that need to be completed
2. **Follow-ups**: Items that require follow-up communication or checking
3. **Decisions**: Any decisions that were made during the conversation
4. **Mentioned Students**: Names of any students mentioned (with context)
5. **Mentioned Staff**: Names of any staff/instructors mentioned (with context)
6. **Key Dates/Deadlines**: Any dates or deadlines mentioned
7. **Financial Items**: Any billing, payment, or financial matters discussed

Return the data as a structured JSON object.`
            },
            {
              role: 'user',
              content: `Please extract structured data from this conversation:\n\n${messageHistory}`
            }
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'conversation_extraction',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  actionItems: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        task: { type: 'string' },
                        priority: { type: 'string', enum: ['high', 'medium', 'low'] },
                        assignee: { type: 'string' }
                      },
                      required: ['task', 'priority', 'assignee'],
                      additionalProperties: false
                    }
                  },
                  followUps: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        item: { type: 'string' },
                        deadline: { type: 'string' }
                      },
                      required: ['item', 'deadline'],
                      additionalProperties: false
                    }
                  },
                  decisions: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                  mentionedStudents: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        context: { type: 'string' }
                      },
                      required: ['name', 'context'],
                      additionalProperties: false
                    }
                  },
                  mentionedStaff: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        context: { type: 'string' }
                      },
                      required: ['name', 'context'],
                      additionalProperties: false
                    }
                  },
                  keyDates: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        date: { type: 'string' },
                        description: { type: 'string' }
                      },
                      required: ['date', 'description'],
                      additionalProperties: false
                    }
                  },
                  financialItems: {
                    type: 'array',
                    items: { type: 'string' }
                  }
                },
                required: ['actionItems', 'followUps', 'decisions', 'mentionedStudents', 'mentionedStaff', 'keyDates', 'financialItems'],
                additionalProperties: false
              }
            }
          }
        });
        
        let extractedData;
        try {
          extractedData = JSON.parse(response.choices[0]?.message?.content || '{}');
        } catch {
          extractedData = {
            actionItems: [],
            followUps: [],
            decisions: [],
            mentionedStudents: [],
            mentionedStaff: [],
            keyDates: [],
            financialItems: []
          };
        }
        
        // Format extracted data as readable message
        let formattedContent = '## 📊 Conversation Extraction\n\n';
        
        if (extractedData.actionItems?.length > 0) {
          formattedContent += '### ✅ Action Items\n';
          extractedData.actionItems.forEach((item: any) => {
            const priorityEmoji = item.priority === 'high' ? '🔴' : item.priority === 'medium' ? '🟡' : '🟢';
            formattedContent += `- ${priorityEmoji} **${item.task}** (Assigned: ${item.assignee})\n`;
          });
          formattedContent += '\n';
        }
        
        if (extractedData.followUps?.length > 0) {
          formattedContent += '### 📞 Follow-ups\n';
          extractedData.followUps.forEach((item: any) => {
            formattedContent += `- ${item.item} (Due: ${item.deadline})\n`;
          });
          formattedContent += '\n';
        }
        
        if (extractedData.decisions?.length > 0) {
          formattedContent += '### 🎯 Decisions\n';
          extractedData.decisions.forEach((item: string) => {
            formattedContent += `- ${item}\n`;
          });
          formattedContent += '\n';
        }
        
        if (extractedData.mentionedStudents?.length > 0) {
          formattedContent += '### 👤 Mentioned Students\n';
          
          // Look up student IDs for each mentioned student
          const { students } = await import("../drizzle/schema");
          const { like, or } = await import("drizzle-orm");
          
          for (const item of extractedData.mentionedStudents) {
            // Try to find the student in the database
            const nameParts = item.name.trim().split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';
            
            let studentId = null;
            let studentMatch = null;
            
            if (firstName) {
              const matchingStudents = await db.select()
                .from(students)
                .where(or(
                  like(students.firstName, `%${firstName}%`),
                  like(students.lastName, `%${lastName || firstName}%`)
                ))
                .limit(1);
              
              if (matchingStudents.length > 0) {
                studentMatch = matchingStudents[0];
                studentId = studentMatch.id;
              }
            }
            
            // Add to formatted content with student ID for Save to Card button
            if (studentId) {
              formattedContent += `- **${item.name}** [STUDENT_ID:${studentId}]: ${item.context}\n`;
              // Store the student ID in the extracted data for frontend use
              item.studentId = studentId;
              item.fullName = `${studentMatch?.firstName} ${studentMatch?.lastName}`;
            } else {
              formattedContent += `- **${item.name}**: ${item.context}\n`;
            }
          }
          formattedContent += '\n';
        }
        
        if (extractedData.mentionedStaff?.length > 0) {
          formattedContent += '### 👥 Mentioned Staff\n';
          extractedData.mentionedStaff.forEach((item: any) => {
            formattedContent += `- **${item.name}**: ${item.context}\n`;
          });
          formattedContent += '\n';
        }
        
        if (extractedData.keyDates?.length > 0) {
          formattedContent += '### 📅 Key Dates\n';
          extractedData.keyDates.forEach((item: any) => {
            formattedContent += `- **${item.date}**: ${item.description}\n`;
          });
          formattedContent += '\n';
        }
        
        if (extractedData.financialItems?.length > 0) {
          formattedContent += '### 💰 Financial Items\n';
          extractedData.financialItems.forEach((item: string) => {
            formattedContent += `- ${item}\n`;
          });
          formattedContent += '\n';
        }
        
        // Check if anything was extracted
        const hasContent = Object.values(extractedData).some((arr: any) => arr?.length > 0);
        if (!hasContent) {
          formattedContent += '_No structured data could be extracted from this conversation._\n';
        }
        
        // Save extraction as a Kai message in the conversation
        const [savedMessage] = await db.insert(kaiMessages).values({
          conversationId: input.conversationId,
          role: 'assistant',
          content: formattedContent,
          metadata: JSON.stringify({ 
            type: 'extraction', 
            extractedData,
            generatedAt: new Date().toISOString() 
          })
        });
        
        // Update conversation last message
        await db.update(kaiConversations)
          .set({ 
            preview: 'Conversation data extracted',
            lastMessageAt: new Date()
          })
          .where(eq(kaiConversations.id, input.conversationId));
        
        return { 
          success: true, 
          extractedData,
          formattedContent,
          messageId: savedMessage.insertId
        };
      }),

    chat: publicProcedure
      .input(z.object({
        message: z.string(),
        avatarName: z.string().optional(),
        conversation_id: z.string().optional(),
        context: z.any().optional(),
        conversationHistory: z.array(z.object({
          role: z.enum(['user', 'assistant', 'system']),
          content: z.string(),
        })).optional(),
      }))
      .mutation(async ({ input }) => {
        const { message, avatarName = 'Kai', conversationHistory = [] } = input;
        
        // Use OpenAI GPT-4 for conversational AI
        const { chatWithKai } = await import("./services/openai");
        
        try {
          const aiResponse = await chatWithKai(message, conversationHistory, avatarName);
          
          // If GPT-4 wants to call functions, execute them
          if (aiResponse.functionCalls && aiResponse.functionCalls.length > 0) {
            const functionResults: any[] = [];
            
            for (const call of aiResponse.functionCalls) {
              const result = await executeCRMFunction(call.name, call.arguments);
              functionResults.push(result);
            }
            
            // Return the AI response with function results
            return {
              response: aiResponse.response || formatFunctionResults(functionResults),
              action_result: functionResults[0], // For backwards compatibility
            };
          }
          
          return {
            response: aiResponse.response,
          };
        } catch (error) {
          console.error('[Kai Chat] Error:', error);
          // Fallback to keyword-based parsing if OpenAI fails
          const lowerMessage = message.toLowerCase();
        
        // Student lookup
        if (lowerMessage.includes('find') || lowerMessage.includes('lookup') || lowerMessage.includes('search')) {
          const { searchStudents } = await import("./db");
          
          // Extract potential name from message
          const words = message.split(' ');
          const nameQuery = words.slice(1).join(' '); // Skip first word (find/lookup/search)
          
          const students = await searchStudents(nameQuery);
          
          if (students.length > 0) {
            const student = students[0];
            return {
              response: `I found ${student.firstName} ${student.lastName}'s information. Here are the details:`,
              action_result: {
                type: "student_lookup",
                student: {
                  first_name: student.firstName,
                  last_name: student.lastName,
                  belt_rank: student.beltRank,
                  status: student.status,
                  email: student.email,
                  phone: student.phone,
                  age: student.age,
                  membership_status: student.membershipStatus,
                }
              }
            };
          } else {
            return {
              response: `I couldn't find any students matching "${nameQuery}". Please try a different name or check the spelling.`
            };
          }
        }
        
        // Stats queries
        if (lowerMessage.includes('how many students') || lowerMessage.includes('total students')) {
          const { getDashboardStats } = await import("./db");
          const stats = await getDashboardStats();
          return {
            response: `You currently have ${stats?.total_students || 0} active students in your dojo.`
          };
        }
        
        if (lowerMessage.includes('revenue') || lowerMessage.includes('money')) {
          const { getDashboardStats } = await import("./db");
          const stats = await getDashboardStats();
          return {
            response: `Your monthly revenue is $${stats?.monthly_revenue || 0}.`
          };
        }
        
        if (lowerMessage.includes('leads')) {
          const { getDashboardStats } = await import("./db");
          const stats = await getDashboardStats();
          return {
            response: `You have ${stats?.total_leads || 0} active leads in your pipeline.`
          };
        }
        
        // Kiosk check-ins
        if (lowerMessage.includes('check-in') || lowerMessage.includes('checkin') || lowerMessage.includes('check in')) {
          const { getKioskCheckIns } = await import("./db");
          const checkIns = await getKioskCheckIns();
          return {
            response: `There have been ${checkIns?.length || 0} check-ins today at the kiosk.`
          };
        }
        
        // Kiosk visitors
        if (lowerMessage.includes('visitor') || lowerMessage.includes('new visitor')) {
          const { getKioskVisitors } = await import("./db");
          const visitors = await getKioskVisitors();
          return {
            response: `You have ${visitors?.length || 0} new visitors today.`
          };
        }
        
        // Waivers
        if (lowerMessage.includes('waiver')) {
          const { getKioskWaivers } = await import("./db");
          const waivers = await getKioskWaivers();
          return {
            response: `${waivers?.length || 0} waivers have been signed today.`
          };
        }
        
        // Classes
        if (lowerMessage.includes('class') && (lowerMessage.includes('today') || lowerMessage.includes('schedule'))) {
          return {
            response: "Today's class schedule: 4:00 PM - Kids Karate (Ages 6-12), 5:30 PM - Teen Martial Arts, 7:00 PM - Adult Kickboxing. Would you like more details about any class?"
          };
        }
        
        // Greeting responses
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi ') || lowerMessage === 'hi' || lowerMessage.includes('hey')) {
          return {
            response: `Hello! I'm ${avatarName}, your AI dojo assistant. I can help you check student information, view statistics, manage check-ins, and more. What would you like to know?`
          };
        }
        
        // Default response
        return {
          response: `I'm ${avatarName}, your AI assistant. I can help you with:\n• Finding student information\n• Checking statistics (students, revenue, leads)\n• Viewing today's check-ins and visitors\n• Checking class schedules\n• Managing waivers\n\nWhat would you like to know?`
        };
        }
      }),
    
    // Extract schedule from uploaded file using LLM
    extractSchedule: protectedProcedure
      .input(z.object({
        fileUrl: z.string(),
        fileType: z.string(),
        fileName: z.string(),
        additionalContext: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { extractScheduleFromImage, extractScheduleFromText } = await import("./scheduleExtraction");
        
        const isImage = input.fileType.startsWith('image/');
        
        if (isImage) {
          // Use vision model for images
          return await extractScheduleFromImage(input.fileUrl, input.additionalContext);
        } else {
          // For PDFs and documents, we'd need to extract text first
          // For now, return a message that text extraction is coming soon
          return {
            success: false,
            classes: [],
            confidence: 0,
            error: "PDF text extraction coming soon. Please upload an image of your schedule for now.",
          };
        }
      }),
    
    // Create classes from extracted schedule data
    createClassesFromSchedule: protectedProcedure
      .input(z.object({
        classes: z.array(z.object({
          name: z.string(),
          dayOfWeek: z.string(),
          startTime: z.string(),
          endTime: z.string(),
          instructor: z.string().optional(),
          location: z.string().optional(),
          level: z.string().optional(),
          maxCapacity: z.number().optional(),
          notes: z.string().optional(),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { classes } = await import("../drizzle/schema");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const createdClasses = [];
        
        for (const classData of input.classes) {
          // Format schedule string
          const scheduleStr = `${classData.dayOfWeek} ${classData.startTime}-${classData.endTime}`;
          
          const [newClass] = await db.insert(classes).values({
            name: classData.name,
            schedule: scheduleStr,
            description: classData.notes || '',
            maxCapacity: classData.maxCapacity || 20,
            currentEnrollment: 0,
            instructorId: null, // Would need to match instructor name to ID
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
          }).returning();
          
          createdClasses.push(newClass);
        }
        
        return {
          success: true,
          createdCount: createdClasses.length,
          classes: createdClasses,
        };
      }),
    
    // Extract roster from uploaded file using LLM
    extractRoster: protectedProcedure
      .input(z.object({
        fileUrl: z.string(),
        fileType: z.string(),
        fileName: z.string(),
        additionalContext: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { extractRosterFromImage, extractRosterFromText, parseCSVToText } = await import("./rosterExtraction");
        
        const isImage = input.fileType.startsWith('image/');
        const isCSV = input.fileType === 'text/csv' || input.fileName.endsWith('.csv');
        
        if (isImage) {
          // Use vision model for images
          return await extractRosterFromImage(input.fileUrl, input.additionalContext);
        } else if (isCSV) {
          // For CSV files, fetch and parse the content
          try {
            const response = await fetch(input.fileUrl);
            const csvContent = await response.text();
            const parsedText = parseCSVToText(csvContent);
            return await extractRosterFromText(parsedText, input.additionalContext);
          } catch (error) {
            return {
              success: false,
              students: [],
              confidence: 0,
              totalFound: 0,
              error: "Failed to read CSV file: " + (error instanceof Error ? error.message : "Unknown error"),
            };
          }
        } else {
          // For PDFs and other documents
          return {
            success: false,
            students: [],
            confidence: 0,
            totalFound: 0,
            error: "PDF text extraction coming soon. Please upload an image or CSV file for now.",
          };
        }
      }),
    
    // Create students from extracted roster data
    createStudentsFromRoster: protectedProcedure
      .input(z.object({
        students: z.array(z.object({
          firstName: z.string(),
          lastName: z.string(),
          email: z.string().optional(),
          phone: z.string().optional(),
          dateOfBirth: z.string().optional(),
          beltRank: z.string().optional(),
          program: z.string().optional(),
          guardianName: z.string().optional(),
          guardianPhone: z.string().optional(),
          guardianEmail: z.string().optional(),
          address: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          zipCode: z.string().optional(),
          notes: z.string().optional(),
          membershipStatus: z.string().optional(),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { students } = await import("../drizzle/schema");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const createdStudents = [];
        const errors: string[] = [];
        
        for (const studentData of input.students) {
          try {
            const [newStudent] = await db.insert(students).values({
              firstName: studentData.firstName,
              lastName: studentData.lastName,
              email: studentData.email || null,
              phone: studentData.phone || null,
              dateOfBirth: studentData.dateOfBirth ? new Date(studentData.dateOfBirth) : null,
              beltRank: studentData.beltRank || 'White',
              program: studentData.program || 'Adults',
              guardianName: studentData.guardianName || null,
              guardianPhone: studentData.guardianPhone || null,
              guardianEmail: studentData.guardianEmail || null,
              address: studentData.address || null,
              city: studentData.city || null,
              state: studentData.state || null,
              zipCode: studentData.zipCode || null,
              notes: studentData.notes || null,
              status: studentData.membershipStatus === 'Inactive' ? 'inactive' : 'active',
              createdAt: new Date(),
              updatedAt: new Date(),
            }).returning();
            
            createdStudents.push(newStudent);
          } catch (error) {
            errors.push(`Failed to create ${studentData.firstName} ${studentData.lastName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
        
        return {
          success: createdStudents.length > 0,
          createdCount: createdStudents.length,
          students: createdStudents,
          errors: errors.length > 0 ? errors : undefined,
        };
      }),
  }),

  // Subscription and credits management
  // Dojo Settings API
  settings: router({
    getSettings: publicProcedure
      .query(async () => {
        const { getDb } = await import("./db");
        const { dojoSettings } = await import("../drizzle/schema");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Get settings (single row with id=1)
        const result = await db.select().from(dojoSettings).limit(1);
        
        if (result.length === 0) {
          // Return default empty settings if none exist
          return {
            schoolName: '',
            contactEmail: '',
            contactPhone: '',
            website: '',
            timezone: 'America/New_York',
            instructorTitle: '',
            instructorFirstName: '',
            instructorLastName: '',
            martialArtsStyle: '',
            addressLine1: '',
            addressLine2: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'United States',
            weatherApiKey: '',
            enableWeatherAlerts: 1,
            hasOutdoorClasses: 0,
            heatIndexThreshold: 95,
            airQualityThreshold: 150,
            paymentProvider: '',
            stripeApiKey: '',
            stripePublishableKey: '',
            stripeWebhookSecret: '',
            squareAccessToken: '',
            squareLocationId: '',
            setupCompleted: 0,
          };
        }
        
        return result[0];
      }),
    
    // Alias for getSettings (used by auth system)
    getDojoSettings: publicProcedure
      .query(async () => {
        const { getDb } = await import("./db");
        const { dojoSettings } = await import("../drizzle/schema");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Get settings (single row with id=1)
        const result = await db.select().from(dojoSettings).limit(1);
        
        if (result.length === 0) {
          return { setupCompleted: 0 };
        }
        
        return result[0];
      }),
    
    updateSettings: publicProcedure
      .input(z.object({
        schoolName: z.string().optional(),
        contactEmail: z.string().optional(),
        contactPhone: z.string().optional(),
        website: z.string().optional(),
        timezone: z.string().optional(),
        instructorTitle: z.string().optional(),
        instructorFirstName: z.string().optional(),
        instructorLastName: z.string().optional(),
        martialArtsStyle: z.string().optional(),
        addressLine1: z.string().optional(),
        addressLine2: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        country: z.string().optional(),
        weatherApiKey: z.string().optional(),
        enableWeatherAlerts: z.number().optional(),
        hasOutdoorClasses: z.number().optional(),
        heatIndexThreshold: z.number().optional(),
        airQualityThreshold: z.number().optional(),
        paymentProvider: z.string().optional(),
        stripeApiKey: z.string().optional(),
        stripePublishableKey: z.string().optional(),
        stripeWebhookSecret: z.string().optional(),
        squareAccessToken: z.string().optional(),
        squareLocationId: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { dojoSettings } = await import("../drizzle/schema");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Check if settings exist
        const existing = await db.select().from(dojoSettings).limit(1);
        
        if (existing.length === 0) {
          // Create new settings row
          await db.insert(dojoSettings).values({
            ...input,
            setupCompleted: 0,
          });
        } else {
          // Update existing settings
          await db.update(dojoSettings)
            .set({
              ...input,
              updatedAt: new Date(),
            });
        }
        
        return {
          success: true,
          message: 'Settings updated successfully'
        };
      }),
    
    completeSetup: publicProcedure
      .mutation(async () => {
        const { getDb } = await import("./db");
        const { dojoSettings } = await import("../drizzle/schema");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Mark setup as completed
        await db.update(dojoSettings)
          .set({
            setupCompleted: 1,
            updatedAt: new Date(),
          });
        
        return {
          success: true,
          message: 'Setup completed successfully'
        };
      }),
    
    getSetupStatus: publicProcedure
      .query(async () => {
        const { getDb } = await import("./db");
        const { dojoSettings } = await import("../drizzle/schema");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const result = await db.select().from(dojoSettings).limit(1);
        
        if (result.length === 0) {
          return { completed: false };
        }
        
        return { completed: result[0].setupCompleted === 1 };
      }),
  }),

  subscription: router({
    creditsBalance: publicProcedure
      .query(async () => {
        // TODO: Implement actual credit tracking in database
        // For now, return mock data to remove the connection error
        return {
          current_balance: 10000,
          monthly_allocation: 15000,
          usage_this_month: 5000,
          reset_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
        };
      }),
  }),

  // Student Portal Router
  studentPortal: router({
    // Request password reset
    requestPasswordReset: publicProcedure
      .input(z.object({
        email: z.string().email(),
      }))
      .mutation(async ({ input }) => {
        const { getStudentByEmail, createPasswordResetToken, getStudentById } = await import("./db");
        
        // Find student by email
        const studentData = await getStudentByEmail(input.email);
        if (!studentData || !studentData.student) {
          // Don't reveal if email exists for security
          return { success: true, message: "If an account exists with this email, you will receive a password reset link." };
        }
        
        // Create reset token
        const tokenData = await createPasswordResetToken(studentData.student.id);
        if (!tokenData) {
          return { success: false, error: "Failed to create reset token" };
        }
        
        // In production, send email here. For demo, return the token.
        // The token would be sent via email with a link like:
        // /student-reset-password?token=xxx
        console.log(`Password reset token for ${input.email}: ${tokenData.token}`);
        
        return {
          success: true,
          message: "If an account exists with this email, you will receive a password reset link.",
          // For demo purposes only - remove in production
          _demoToken: tokenData.token,
          _demoExpiresAt: tokenData.expiresAt,
        };
      }),

    // Validate reset token
    validateResetToken: publicProcedure
      .input(z.object({
        token: z.string(),
      }))
      .query(async ({ input }) => {
        const { validateResetToken, getStudentById } = await import("./db");
        
        const validation = await validateResetToken(input.token);
        if (!validation.valid || !validation.studentId) {
          return { valid: false, error: validation.error };
        }
        
        // Get student info for display
        const student = await getStudentById(validation.studentId);
        
        return {
          valid: true,
          studentEmail: student?.email,
          studentName: student?.firstName,
        };
      }),

    // Reset password with token
    resetPassword: publicProcedure
      .input(z.object({
        token: z.string(),
        newPassword: z.string().min(8, "Password must be at least 8 characters"),
      }))
      .mutation(async ({ input }) => {
        const { resetStudentPassword } = await import("./db");
        return await resetStudentPassword(input.token, input.newPassword);
      }),

    // Login endpoint
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const { verifyStudentLogin } = await import("./db");
        return await verifyStudentLogin(input.email, input.password);
      }),

    // Get student dashboard data
    getDashboardData: publicProcedure
      .input(z.object({
        studentId: z.number(),
      }))
      .query(async ({ input }) => {
        const { getStudentPortalData } = await import("./db");
        const data = await getStudentPortalData(input.studentId);
        if (!data) {
          throw new Error('Student not found');
        }
        return data;
      }),

    // Get student by email (for login lookup)
    getByEmail: publicProcedure
      .input(z.object({
        email: z.string().email(),
      }))
      .query(async ({ input }) => {
        const { getStudentByEmail } = await import("./db");
        return await getStudentByEmail(input.email);
      }),

    // Get attendance history
    getAttendanceHistory: publicProcedure
      .input(z.object({
        studentId: z.number(),
        limit: z.number().optional().default(30),
      }))
      .query(async ({ input }) => {
        const { getStudentAttendanceHistory } = await import("./db");
        return await getStudentAttendanceHistory(input.studentId, input.limit);
      }),

    // Get upcoming classes for a student
    getUpcomingClasses: publicProcedure
      .input(z.object({
        studentId: z.number(),
      }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const { classEnrollments, classes } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const enrollments = await db.select({
          enrollment: classEnrollments,
          class: classes
        })
          .from(classEnrollments)
          .leftJoin(classes, eq(classEnrollments.classId, classes.id))
          .where(and(
            eq(classEnrollments.studentId, input.studentId),
            eq(classEnrollments.status, 'active')
          ));
        
        return enrollments.map(e => ({
          id: e.class?.id,
          name: e.class?.name,
          time: e.class?.time,
          dayOfWeek: e.class?.dayOfWeek,
          instructor: e.class?.instructor,
          enrollmentId: e.enrollment.id
        })).filter(c => c.id);
      }),

    // Record check-in and update belt progress
    checkIn: publicProcedure
      .input(z.object({
        studentId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { getDb, updateBeltProgressAfterCheckIn } = await import("./db");
        const { students, kioskCheckIns } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Get student info
        const student = await db.select().from(students).where(eq(students.id, input.studentId)).limit(1);
        
        if (student.length === 0) {
          return { success: false, message: 'Student not found' };
        }
        
        // Record check-in
        const fullName = `${student[0].firstName} ${student[0].lastName}`;
        await db.insert(kioskCheckIns).values({
          studentId: input.studentId,
          studentName: fullName,
          timestamp: new Date(),
        });
        
        // Update belt progress
        await updateBeltProgressAfterCheckIn(input.studentId);
        
        return {
          success: true,
          message: `Checked in ${fullName}`,
          student: student[0]
        };
      }),

    // Create student account
    createAccount: publicProcedure
      .input(z.object({
        studentId: z.number(),
        email: z.string().email(),
        password: z.string().min(6),
      }))
      .mutation(async ({ input }) => {
        const { createStudentAccount } = await import("./db");
        const bcrypt = await import("bcryptjs");
        
        const passwordHash = await bcrypt.hash(input.password, 10);
        return await createStudentAccount(input.studentId, input.email, passwordHash);
      }),

    // ============================================
    // Belt Test Procedures
    // ============================================

    // Get upcoming belt tests for student's next belt level
    getUpcomingBeltTests: publicProcedure
      .input(z.object({
        studentId: z.number(),
      }))
      .query(async ({ input }) => {
        const { getDb, getUpcomingBeltTests } = await import("./db");
        const { beltProgress } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) return { tests: [], nextBelt: null };
        
        // Get student's next belt
        const progress = await db.select().from(beltProgress).where(eq(beltProgress.studentId, input.studentId)).limit(1);
        if (progress.length === 0) {
          return { tests: [], nextBelt: null };
        }
        
        const nextBelt = progress[0].nextBelt;
        const tests = await getUpcomingBeltTests(nextBelt);
        
        return { tests, nextBelt, currentProgress: progress[0] };
      }),

    // Check eligibility for a specific belt test
    checkBeltTestEligibility: publicProcedure
      .input(z.object({
        studentId: z.number(),
        testId: z.number(),
      }))
      .query(async ({ input }) => {
        const { checkBeltTestEligibility } = await import("./db");
        return await checkBeltTestEligibility(input.studentId, input.testId);
      }),

    // Register for a belt test
    registerForBeltTest: publicProcedure
      .input(z.object({
        studentId: z.number(),
        testId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { registerForBeltTest } = await import("./db");
        return await registerForBeltTest(input.studentId, input.testId);
      }),

    // Cancel belt test registration
    cancelBeltTestRegistration: publicProcedure
      .input(z.object({
        studentId: z.number(),
        testId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { cancelBeltTestRegistration } = await import("./db");
        return await cancelBeltTestRegistration(input.studentId, input.testId);
      }),

    // Get student's belt test registrations
    getMyBeltTestRegistrations: publicProcedure
      .input(z.object({
        studentId: z.number(),
      }))
      .query(async ({ input }) => {
        const { getStudentBeltTestRegistrations } = await import("./db");
        return await getStudentBeltTestRegistrations(input.studentId);
      }),

    // Create Stripe checkout session for belt test payment
    createBeltTestPayment: publicProcedure
      .input(z.object({
        studentId: z.number(),
        testId: z.number(),
        successUrl: z.string(),
        cancelUrl: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { checkBeltTestEligibility, getDb } = await import("./db");
        const { createBeltTestCheckoutSession } = await import("./stripe");
        const { students, beltTests, beltProgress, beltTestRegistrations } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        
        // Check eligibility first
        const eligibility = await checkBeltTestEligibility(input.studentId, input.testId);
        if (!eligibility.eligible) {
          return { success: false, error: eligibility.reason };
        }
        
        const db = await getDb();
        if (!db) return { success: false, error: 'Database not available' };
        
        // Get student info
        const studentResult = await db.select().from(students).where(eq(students.id, input.studentId)).limit(1);
        if (studentResult.length === 0) {
          return { success: false, error: 'Student not found' };
        }
        const student = studentResult[0];
        
        // Get test info
        const testResult = await db.select().from(beltTests).where(eq(beltTests.id, input.testId)).limit(1);
        if (testResult.length === 0) {
          return { success: false, error: 'Belt test not found' };
        }
        const test = testResult[0];
        
        // Get belt progress
        const progressResult = await db.select().from(beltProgress).where(eq(beltProgress.studentId, input.studentId)).limit(1);
        const progress = progressResult[0];
        
        // Check if test is free
        if (!test.fee || test.fee === 0) {
          // Free registration - register directly
          await db.insert(beltTestRegistrations).values({
            testId: input.testId,
            studentId: input.studentId,
            studentName: `${student.firstName} ${student.lastName}`,
            currentBelt: progress?.currentBelt || 'White',
            attendanceAtRegistration: progress?.qualifiedAttendance || 0,
            classesAtRegistration: progress?.qualifiedClasses || 0,
            status: 'registered',
            paymentStatus: 'waived',
            amountPaid: 0,
          });
          
          // Update test registration count
          await db.update(beltTests)
            .set({ 
              currentRegistrations: test.currentRegistrations + 1,
              updatedAt: new Date()
            })
            .where(eq(beltTests.id, input.testId));
          
          return { success: true, free: true };
        }
        
        // Create Stripe checkout session
        try {
          const session = await createBeltTestCheckoutSession({
            testId: input.testId,
            testName: test.name,
            studentId: input.studentId,
            studentName: `${student.firstName} ${student.lastName}`,
            studentEmail: student.email || '',
            amount: test.fee,
            successUrl: input.successUrl,
            cancelUrl: input.cancelUrl,
          });
          
          // Create pending registration
          await db.insert(beltTestRegistrations).values({
            testId: input.testId,
            studentId: input.studentId,
            studentName: `${student.firstName} ${student.lastName}`,
            currentBelt: progress?.currentBelt || 'White',
            attendanceAtRegistration: progress?.qualifiedAttendance || 0,
            classesAtRegistration: progress?.qualifiedClasses || 0,
            status: 'registered',
            paymentStatus: 'pending',
            stripeSessionId: session.id,
            amountPaid: test.fee,
          });
          
          // Update test registration count
          await db.update(beltTests)
            .set({ 
              currentRegistrations: test.currentRegistrations + 1,
              updatedAt: new Date()
            })
            .where(eq(beltTests.id, input.testId));
          
          return { 
            success: true, 
            checkoutUrl: session.url,
            sessionId: session.id
          };
        } catch (error: any) {
          console.error('Stripe checkout error:', error);
          return { success: false, error: error.message || 'Payment processing failed' };
        }
      }),

    // Verify payment completion
    verifyBeltTestPayment: publicProcedure
      .input(z.object({
        sessionId: z.string(),
      }))
      .query(async ({ input }) => {
        const { getCheckoutSession } = await import("./stripe");
        const { getDb } = await import("./db");
        const { beltTestRegistrations } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        try {
          const session = await getCheckoutSession(input.sessionId);
          
          if (session.payment_status === 'paid') {
            // Update registration payment status
            const db = await getDb();
            if (db) {
              await db.update(beltTestRegistrations)
                .set({ 
                  paymentStatus: 'paid',
                  stripePaymentIntentId: session.payment_intent as string,
                  updatedAt: new Date()
                })
                .where(eq(beltTestRegistrations.stripeSessionId, input.sessionId));
            }
            
            return { success: true, paid: true };
          }
          
          return { success: true, paid: false, status: session.payment_status };
        } catch (error: any) {
          console.error('Payment verification error:', error);
          return { success: false, error: error.message };
        }
      }),

    // ============================================
    // Messaging Procedures
    // ============================================

    // Get all messages for a student
    getMessages: publicProcedure
      .input(z.object({
        studentId: z.number(),
      }))
      .query(async ({ input }) => {
        const { getStudentMessages } = await import("./db");
        return await getStudentMessages(input.studentId);
      }),

    // Get a single message with thread
    getMessage: publicProcedure
      .input(z.object({
        messageId: z.number(),
        studentId: z.number(),
      }))
      .query(async ({ input }) => {
        const { getStudentMessageById, getMessageThread, markMessageAsRead } = await import("./db");
        
        // Mark as read
        await markMessageAsRead(input.messageId, input.studentId);
        
        // Get message and thread
        const message = await getStudentMessageById(input.messageId, input.studentId);
        const thread = await getMessageThread(input.messageId, input.studentId);
        
        return { message, thread };
      }),

    // Send a message (from student)
    sendMessage: publicProcedure
      .input(z.object({
        studentId: z.number(),
        subject: z.string().optional(),
        content: z.string().min(1),
        parentMessageId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { sendStudentMessage } = await import("./db");
        return await sendStudentMessage(input);
      }),

    // Get unread message count
    getUnreadCount: publicProcedure
      .input(z.object({
        studentId: z.number(),
      }))
      .query(async ({ input }) => {
        const { getUnreadMessageCount } = await import("./db");
        return await getUnreadMessageCount(input.studentId);
      }),

    // Mark message as read
    markAsRead: publicProcedure
      .input(z.object({
        messageId: z.number(),
        studentId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { markMessageAsRead } = await import("./db");
        return await markMessageAsRead(input.messageId, input.studentId);
      }),

    // Delete a message (only student's own messages)
    deleteMessage: publicProcedure
      .input(z.object({
        messageId: z.number(),
        studentId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { deleteStudentMessage } = await import("./db");
        return await deleteStudentMessage(input.messageId, input.studentId);
      }),
  }),
});

export type AppRouter = typeof appRouter;

import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { campaigns, campaignRecipients, leads, students } from "../drizzle/schema";
import { eq, and, inArray, or, like } from "drizzle-orm";

export const campaignsRouter = router({
  // Get all campaigns
  getAll: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const allCampaigns = await db.select().from(campaigns).orderBy(campaigns.createdAt);
      return allCampaigns;
    }),

  // Get single campaign with stats
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const campaign = await db.select().from(campaigns).where(eq(campaigns.id, input.id)).limit(1);
      if (!campaign.length) throw new Error("Campaign not found");
      
      return campaign[0];
    }),

  // Get campaign recipients
  getRecipients: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const recipients = await db.select()
        .from(campaignRecipients)
        .where(eq(campaignRecipients.campaignId, input.campaignId))
        .orderBy(campaignRecipients.createdAt);
      
      return recipients;
    }),

  // Create campaign
  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      type: z.enum(["sms", "email"]),
      subject: z.string().optional(),
      message: z.string(),
      audienceFilter: z.object({
        type: z.enum(["leads", "students", "both"]),
        statuses: z.array(z.string()).optional(),
        sources: z.array(z.string()).optional(),
      }),
      scheduledAt: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Calculate recipients based on audience filter
      let recipientsList: Array<{
        type: "lead" | "student";
        id: number;
        name: string;
        contact: string;
      }> = [];
      
      // Get leads if included
      if (input.audienceFilter.type === "leads" || input.audienceFilter.type === "both") {
        let leadsQuery = db.select().from(leads);
        
        // Apply status filter if provided
        if (input.audienceFilter.statuses && input.audienceFilter.statuses.length > 0) {
          leadsQuery = leadsQuery.where(inArray(leads.status, input.audienceFilter.statuses as any));
        }
        
        const leadsData = await leadsQuery;
        
        leadsData.forEach(lead => {
          const contact = input.type === "sms" ? lead.phone : lead.email;
          if (contact) {
            recipientsList.push({
              type: "lead",
              id: lead.id,
              name: `${lead.firstName} ${lead.lastName}`,
              contact,
            });
          }
        });
      }
      
      // Get students if included
      if (input.audienceFilter.type === "students" || input.audienceFilter.type === "both") {
        let studentsQuery = db.select().from(students);
        
        // Apply status filter if provided
        if (input.audienceFilter.statuses && input.audienceFilter.statuses.length > 0) {
          studentsQuery = studentsQuery.where(inArray(students.status, input.audienceFilter.statuses as any));
        }
        
        const studentsData = await studentsQuery;
        
        studentsData.forEach(student => {
          const contact = input.type === "sms" ? student.phone : student.email;
          if (contact) {
            recipientsList.push({
              type: "student",
              id: student.id,
              name: `${student.firstName} ${student.lastName}`,
              contact,
            });
          }
        });
      }
      
      // Create campaign
      const [campaign] = await db.insert(campaigns).values({
        name: input.name,
        type: input.type,
        subject: input.subject,
        message: input.message,
        audienceFilter: JSON.stringify(input.audienceFilter),
        recipientCount: recipientsList.length,
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
        status: input.scheduledAt ? "scheduled" : "draft",
        createdBy: ctx.user.id,
      });
      
      // Create recipient records
      if (recipientsList.length > 0) {
        await db.insert(campaignRecipients).values(
          recipientsList.map(recipient => ({
            campaignId: campaign.insertId,
            recipientType: recipient.type,
            recipientId: recipient.id,
            recipientName: recipient.name,
            recipientContact: recipient.contact,
            status: "pending" as const,
          }))
        );
      }
      
      return { id: campaign.insertId, recipientCount: recipientsList.length };
    }),

  // Update campaign
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      subject: z.string().optional(),
      message: z.string().optional(),
      scheduledAt: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const updateData: any = {};
      if (input.name) updateData.name = input.name;
      if (input.subject !== undefined) updateData.subject = input.subject;
      if (input.message) updateData.message = input.message;
      if (input.scheduledAt !== undefined) {
        updateData.scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;
      }
      
      await db.update(campaigns)
        .set(updateData)
        .where(eq(campaigns.id, input.id));
      
      return { success: true };
    }),

  // Send campaign
  send: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Update campaign status to sending
      await db.update(campaigns)
        .set({
          status: "sending",
          sentAt: new Date(),
        })
        .where(eq(campaigns.id, input.id));
      
      // Get campaign details
      const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, input.id));
      
      // Get recipients
      const recipients = await db.select()
        .from(campaignRecipients)
        .where(and(
          eq(campaignRecipients.campaignId, input.id),
          eq(campaignRecipients.status, "pending")
        ));
      
      // TODO: Integrate with Twilio/SendGrid to actually send messages
      // For now, just mark as sent
      let sentCount = 0;
      let failedCount = 0;
      
      for (const recipient of recipients) {
        try {
          // Simulate sending (replace with actual Twilio/SendGrid integration)
          await db.update(campaignRecipients)
            .set({
              status: "sent",
              sentAt: new Date(),
            })
            .where(eq(campaignRecipients.id, recipient.id));
          
          sentCount++;
        } catch (error) {
          await db.update(campaignRecipients)
            .set({
              status: "failed",
              errorMessage: error instanceof Error ? error.message : "Unknown error",
            })
            .where(eq(campaignRecipients.id, recipient.id));
          
          failedCount++;
        }
      }
      
      // Update campaign with final stats
      await db.update(campaigns)
        .set({
          status: "sent",
          sentCount,
          failedCount,
          completedAt: new Date(),
        })
        .where(eq(campaigns.id, input.id));
      
      return { sentCount, failedCount };
    }),

  // Delete campaign
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Delete recipients first
      await db.delete(campaignRecipients).where(eq(campaignRecipients.campaignId, input.id));
      
      // Delete campaign
      await db.delete(campaigns).where(eq(campaigns.id, input.id));
      
      return { success: true };
    }),

  // Get campaign statistics
  getStats: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const allCampaigns = await db.select().from(campaigns);
      
      const stats = {
        total: allCampaigns.length,
        draft: allCampaigns.filter(c => c.status === "draft").length,
        scheduled: allCampaigns.filter(c => c.status === "scheduled").length,
        sent: allCampaigns.filter(c => c.status === "sent").length,
        totalRecipients: allCampaigns.reduce((sum, c) => sum + (c.recipientCount || 0), 0),
        totalSent: allCampaigns.reduce((sum, c) => sum + (c.sentCount || 0), 0),
        totalDelivered: allCampaigns.reduce((sum, c) => sum + (c.deliveredCount || 0), 0),
      };
      
      return stats;
    }),
});

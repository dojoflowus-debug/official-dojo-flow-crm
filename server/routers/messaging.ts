import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { getDb } from '../db';
import { emailTemplates, smsCampaigns } from '../../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';
import { sendEmail, replaceTemplateVariables } from '../lib/sendgrid';

// Default email templates that every school gets
const DEFAULT_EMAIL_TEMPLATES = [
  {
    name: 'Welcome New Student',
    subject: 'Welcome to {{school_name}}!',
    category: 'onboarding',
    bodyHtml: `
      <h1>Welcome to {{school_name}}, {{student_name}}!</h1>
      <p>We're excited to have you join our martial arts family.</p>
      <p>Your first class is scheduled for {{first_class_date}}.</p>
      <p>What to bring:</p>
      <ul>
        <li>Comfortable workout clothes</li>
        <li>Water bottle</li>
        <li>Positive attitude!</li>
      </ul>
      <p>See you on the mat!</p>
      <p>{{instructor_name}}</p>
    `,
    bodyText: 'Welcome to {{school_name}}, {{student_name}}! We\'re excited to have you join our martial arts family.',
    variables: JSON.stringify(['school_name', 'student_name', 'first_class_date', 'instructor_name'])
  },
  {
    name: 'Belt Promotion Congratulations',
    subject: 'Congratulations on your {{new_belt}} promotion!',
    category: 'achievements',
    bodyHtml: `
      <h1>Congratulations, {{student_name}}!</h1>
      <p>We're proud to announce your promotion to {{new_belt}}!</p>
      <p>Your dedication and hard work have paid off. This is a significant milestone in your martial arts journey.</p>
      <p>Your next belt ceremony will be on {{ceremony_date}}.</p>
      <p>Keep training hard!</p>
      <p>{{instructor_name}}</p>
    `,
    bodyText: 'Congratulations, {{student_name}}! You\'ve been promoted to {{new_belt}}!',
    variables: JSON.stringify(['student_name', 'new_belt', 'ceremony_date', 'instructor_name'])
  },
  {
    name: 'Class Reminder',
    subject: 'Reminder: {{class_name}} class tomorrow',
    category: 'reminders',
    bodyHtml: `
      <h2>Class Reminder</h2>
      <p>Hi {{student_name}},</p>
      <p>This is a friendly reminder about your upcoming class:</p>
      <ul>
        <li><strong>Class:</strong> {{class_name}}</li>
        <li><strong>Date:</strong> {{class_date}}</li>
        <li><strong>Time:</strong> {{class_time}}</li>
        <li><strong>Location:</strong> {{location}}</li>
      </ul>
      <p>See you there!</p>
    `,
    bodyText: 'Hi {{student_name}}, reminder about your {{class_name}} class on {{class_date}} at {{class_time}}.',
    variables: JSON.stringify(['student_name', 'class_name', 'class_date', 'class_time', 'location'])
  },
  {
    name: 'Payment Due Reminder',
    subject: 'Payment reminder for {{school_name}}',
    category: 'billing',
    bodyHtml: `
      <h2>Payment Reminder</h2>
      <p>Hi {{student_name}},</p>
      <p>This is a friendly reminder that your payment of {{amount}} is due on {{due_date}}.</p>
      <p>You can make a payment online at: {{payment_link}}</p>
      <p>If you've already paid, please disregard this message.</p>
      <p>Thank you!</p>
    `,
    bodyText: 'Hi {{student_name}}, your payment of {{amount}} is due on {{due_date}}. Pay online at {{payment_link}}',
    variables: JSON.stringify(['student_name', 'amount', 'due_date', 'payment_link'])
  }
];

export const messagingRouter = router({
  // Email Templates
  getEmailTemplates: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const templates = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.orgId, ctx.currentOrganizationId))
        .orderBy(emailTemplates.category, emailTemplates.name);
      
      return templates;
    }),

  getEmailTemplate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const [template] = await db
        .select()
        .from(emailTemplates)
        .where(
          and(
            eq(emailTemplates.id, input.id),
            eq(emailTemplates.orgId, ctx.currentOrganizationId)
          )
        )
        .limit(1);
      
      return template;
    }),

  createEmailTemplate: protectedProcedure
    .input(z.object({
      name: z.string(),
      subject: z.string(),
      body_html: z.string(),
      body_text: z.string().optional(),
      category: z.string().optional(),
      variables: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const [result] = await db
        .insert(emailTemplates)
        .values({
          orgId: ctx.currentOrganizationId,
          name: input.name,
          subject: input.subject,
          bodyHtml: input.body_html,
          bodyText: input.body_text || '',
          category: input.category || 'general',
          variables: JSON.stringify(input.variables || []),
          createdBy: ctx.user.id,
        })
        .$returningId();
      
      return { id: result.id };
    }),

  updateEmailTemplate: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string(),
      subject: z.string(),
      body_html: z.string(),
      body_text: z.string().optional(),
      category: z.string().optional(),
      variables: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      await db
        .update(emailTemplates)
        .set({
          name: input.name,
          subject: input.subject,
          bodyHtml: input.body_html,
          bodyText: input.body_text || '',
          category: input.category || 'general',
          variables: JSON.stringify(input.variables || []),
        })
        .where(
          and(
            eq(emailTemplates.id, input.id),
            eq(emailTemplates.orgId, ctx.currentOrganizationId)
          )
        );
      
      return { success: true };
    }),

  deleteEmailTemplate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      await db
        .delete(emailTemplates)
        .where(
          and(
            eq(emailTemplates.id, input.id),
            eq(emailTemplates.orgId, ctx.currentOrganizationId),
            eq(emailTemplates.isDefault, 0)
          )
        );
      
      return { success: true };
    }),

  resetToDefaultTemplate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // Get the template
      const [template] = await db
        .select()
        .from(emailTemplates)
        .where(
          and(
            eq(emailTemplates.id, input.id),
            eq(emailTemplates.orgId, ctx.currentOrganizationId)
          )
        )
        .limit(1);
      
      if (!template) {
        throw new Error('Template not found');
      }

      // Find matching default template
      const defaultTemplate = DEFAULT_EMAIL_TEMPLATES.find(t => t.name === template.name);
      if (!defaultTemplate) {
        throw new Error('No default template found for this template');
      }

      // Reset to default
      await db
        .update(emailTemplates)
        .set({
          subject: defaultTemplate.subject,
          bodyHtml: defaultTemplate.bodyHtml,
          bodyText: defaultTemplate.bodyText,
          variables: defaultTemplate.variables,
        })
        .where(
          and(
            eq(emailTemplates.id, input.id),
            eq(emailTemplates.orgId, ctx.currentOrganizationId)
          )
        );

      return { success: true };
    }),

  sendEmail: protectedProcedure
    .input(z.object({
      templateId: z.number(),
      to: z.union([z.string().email(), z.array(z.string().email())]),
      variables: z.record(z.any()).optional(),
      from: z.string().email().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // Get the template
      const [template] = await db
        .select()
        .from(emailTemplates)
        .where(
          and(
            eq(emailTemplates.id, input.templateId),
            eq(emailTemplates.orgId, ctx.currentOrganizationId)
          )
        )
        .limit(1);
      
      if (!template) {
        throw new Error('Template not found');
      }

      // Replace variables in subject and body
      const variables = input.variables || {};
      const subject = replaceTemplateVariables(template.subject, variables);
      const html = replaceTemplateVariables(template.bodyHtml, variables);
      const text = template.bodyText ? replaceTemplateVariables(template.bodyText, variables) : undefined;

      // Send the email
      await sendEmail({
        to: input.to,
        from: input.from,
        subject,
        html,
        text,
      });

      return { success: true, message: 'Email sent successfully' };
    }),

  installDefaultTemplates: protectedProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // Check if templates already exist
      const existing = await db
        .select()
        .from(emailTemplates)
        .where(
          and(
            eq(emailTemplates.orgId, ctx.currentOrganizationId),
            eq(emailTemplates.isDefault, 1)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return { message: 'Default templates already installed', count: 0 };
      }

      // Install default templates
      let installed = 0;
      for (const template of DEFAULT_EMAIL_TEMPLATES) {
        await db
          .insert(emailTemplates)
          .values({
            orgId: ctx.currentOrganizationId,
            name: template.name,
            subject: template.subject,
            bodyHtml: template.bodyHtml,
            bodyText: template.bodyText,
            category: template.category,
            variables: template.variables,
            isDefault: 1,
            createdBy: ctx.user.id,
          });
        installed++;
      }

      return { message: 'Default templates installed', count: installed };
    }),

  // SMS Campaigns
  getSMSCampaigns: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const campaigns = await db
        .select()
        .from(smsCampaigns)
        .where(eq(smsCampaigns.orgId, ctx.currentOrganizationId))
        .orderBy(desc(smsCampaigns.createdAt));
      
      return campaigns;
    }),

  getSMSCampaign: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const [campaign] = await db
        .select()
        .from(smsCampaigns)
        .where(
          and(
            eq(smsCampaigns.id, input.id),
            eq(smsCampaigns.orgId, ctx.currentOrganizationId)
          )
        )
        .limit(1);
      
      return campaign;
    }),

  createSMSCampaign: protectedProcedure
    .input(z.object({
      name: z.string(),
      message: z.string().max(160),
      scheduled_at: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const [result] = await db
        .insert(smsCampaigns)
        .values({
          orgId: ctx.currentOrganizationId,
          name: input.name,
          message: input.message,
          status: 'draft',
          scheduledAt: input.scheduled_at || null,
          createdBy: ctx.user.id,
        })
        .$returningId();
      
      return { id: result.id };
    }),

  updateSMSCampaign: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string(),
      message: z.string().max(160),
      scheduled_at: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      await db
        .update(smsCampaigns)
        .set({
          name: input.name,
          message: input.message,
          scheduledAt: input.scheduled_at || null,
        })
        .where(
          and(
            eq(smsCampaigns.id, input.id),
            eq(smsCampaigns.orgId, ctx.currentOrganizationId),
            eq(smsCampaigns.status, 'draft')
          )
        );
      
      return { success: true };
    }),

  sendSMSCampaign: protectedProcedure
    .input(z.object({
      id: z.number(),
      recipient_ids: z.array(z.number()),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // Update campaign status
      await db
        .update(smsCampaigns)
        .set({
          status: 'sent',
          recipientCount: input.recipient_ids.length,
        })
        .where(
          and(
            eq(smsCampaigns.id, input.id),
            eq(smsCampaigns.orgId, ctx.currentOrganizationId)
          )
        );

      // TODO: Integrate with SMS provider (Twilio, etc.)
      // For now, just mark as sent
      
      return { 
        success: true, 
        message: 'SMS campaign sent successfully',
        recipient_count: input.recipient_ids.length 
      };
    }),

  deleteSMSCampaign: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      await db
        .delete(smsCampaigns)
        .where(
          and(
            eq(smsCampaigns.id, input.id),
            eq(smsCampaigns.orgId, ctx.currentOrganizationId),
            eq(smsCampaigns.status, 'draft')
          )
        );
      
      return { success: true };
    }),
});

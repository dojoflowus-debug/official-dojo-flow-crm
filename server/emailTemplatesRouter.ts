import { router, protectedProcedure } from './_core/trpc';
import { z } from 'zod';
import { getDb } from './db';
import { emailTemplates, emailTemplateRevisions } from '../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';
import { defaultEmailTemplates, replaceVariables, extractVariables, validateVariables } from './lib/defaultEmailTemplates';

/**
 * Email Templates Router
 * 
 * Provides API endpoints for managing email templates with:
 * - Multi-tenancy (templates scoped by organization)
 * - Versioning (revision history with revert capability)
 * - Variable validation (detect missing/unknown variables)
 * - Preview (render template with sample data)
 * - Audit logging (track who edited what and when)
 */

export const emailTemplatesRouter = router({
  /**
   * List all templates for the current organization
   * Returns both custom templates and available default templates
   */
  list: protectedProcedure
    .input(z.object({
      category: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const orgId = ctx.user.activeOrgId;
      
      // Get organization's custom templates
      const db = await getDb();
      const customTemplates = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.orgId, orgId))
        .orderBy(emailTemplates.category, emailTemplates.name);
      
      // Get default templates that aren't customized
      const customizedTypes = new Set(
        customTemplates
          .filter(t => t.isCustom === 1)
          .map(t => t.templateType)
      );
      
      const availableDefaults = defaultEmailTemplates
        .filter(t => !customizedTypes.has(t.templateType))
        .map(t => ({
          id: 0, // Placeholder ID for defaults
          orgId: 0,
          name: t.name,
          templateType: t.templateType,
          subject: t.subject,
          bodyHtml: t.bodyHtml,
          bodyText: t.bodyText,
          category: t.category,
          isDefault: 1,
          isCustom: 0,
          variables: JSON.stringify(t.variables),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: null,
        }));
      
      const allTemplates = [...customTemplates, ...availableDefaults];
      
      // Filter by category if provided
      if (input?.category) {
        return allTemplates.filter(t => t.category === input.category);
      }
      
      return allTemplates;
    }),
  
  /**
   * Get a specific template by ID or type
   */
  get: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      templateType: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const orgId = ctx.user.activeOrgId;
      
      if (input.id) {
        // Get by ID
        const db = await getDb();
        const template = await db
          .select()
          .from(emailTemplates)
          .where(and(
            eq(emailTemplates.id, input.id),
            eq(emailTemplates.orgId, orgId)
          ))
          .limit(1);
        
        return template[0] || null;
      }
      
      if (input.templateType) {
        // Try to find custom template first
        const db = await getDb();
        const customTemplate = await db
          .select()
          .from(emailTemplates)
          .where(and(
            eq(emailTemplates.orgId, orgId),
            eq(emailTemplates.templateType, input.templateType)
          ))
          .limit(1);
        
        if (customTemplate.length > 0) {
          return customTemplate[0];
        }
        
        // Fall back to default template
        const defaultTemplate = defaultEmailTemplates.find(
          t => t.templateType === input.templateType
        );
        
        if (defaultTemplate) {
          return {
            id: 0,
            orgId: 0,
            name: defaultTemplate.name,
            templateType: defaultTemplate.templateType,
            subject: defaultTemplate.subject,
            bodyHtml: defaultTemplate.bodyHtml,
            bodyText: defaultTemplate.bodyText,
            category: defaultTemplate.category,
            isDefault: 1,
            isCustom: 0,
            variables: JSON.stringify(defaultTemplate.variables),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: null,
          };
        }
      }
      
      return null;
    }),
  
  /**
   * Create or update a template
   * Automatically creates a revision entry
   */
  update: protectedProcedure
    .input(z.object({
      id: z.number().optional(), // If provided, update existing; otherwise create new
      templateType: z.string(),
      name: z.string().min(1),
      subject: z.string().min(1),
      bodyHtml: z.string().min(1),
      bodyText: z.string().optional(),
      category: z.string().optional(),
      changeNote: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.user.activeOrgId;
      const userId = ctx.user.id;
      const db = await getDb();
      
      // Validate variables in template
      const subjectVars = extractVariables(input.subject);
      const bodyVars = extractVariables(input.bodyHtml);
      const allVars = Array.from(new Set([...subjectVars, ...bodyVars]));
      
      const templateData = {
        orgId,
        name: input.name,
        templateType: input.templateType,
        subject: input.subject,
        bodyHtml: input.bodyHtml,
        bodyText: input.bodyText || '',
        category: input.category || 'custom',
        isDefault: 0,
        isCustom: 1, // Mark as customized
        variables: JSON.stringify(allVars),
        createdBy: userId,
      };
      
      let templateId: number;
      let version = 1;
      
      if (input.id) {
        // Update existing template
        await db
          .update(emailTemplates)
          .set({
            ...templateData,
            updatedAt: new Date().toISOString(),
          })
          .where(and(
            eq(emailTemplates.id, input.id),
            eq(emailTemplates.orgId, orgId)
          ));
        
        templateId = input.id;
        
        // Get next version number
        const latestRevision = await db
          .select()
          .from(emailTemplateRevisions)
          .where(eq(emailTemplateRevisions.templateId, templateId))
          .orderBy(desc(emailTemplateRevisions.version))
          .limit(1);
        
        version = latestRevision.length > 0 ? latestRevision[0].version + 1 : 1;
      } else {
        // Create new template
        const result = await db.insert(emailTemplates).values(templateData);
        templateId = Number(result.insertId);
      }
      
      // Create revision entry
      await db.insert(emailTemplateRevisions).values({
        templateId,
        version,
        name: input.name,
        subject: input.subject,
        bodyHtml: input.bodyHtml,
        bodyText: input.bodyText || '',
        variables: JSON.stringify(allVars),
        changeNote: input.changeNote || null,
        createdBy: userId,
      });
      
      console.log(`[EmailTemplates] Template ${templateId} updated to version ${version} by user ${userId}`);
      
      return {
        success: true,
        templateId,
        version,
      };
    }),
  
  /**
   * Get revision history for a template
   */
  getRevisions: protectedProcedure
    .input(z.object({
      templateId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const orgId = ctx.user.activeOrgId;
      const db = await getDb();
      
      // Verify template belongs to this organization
      const template = await db
        .select()
        .from(emailTemplates)
        .where(and(
          eq(emailTemplates.id, input.templateId),
          eq(emailTemplates.orgId, orgId)
        ))
        .limit(1);
      
      if (template.length === 0) {
        throw new Error('Template not found or access denied');
      }
      
      // Get all revisions
      const revisions = await db
        .select()
        .from(emailTemplateRevisions)
        .where(eq(emailTemplateRevisions.templateId, input.templateId))
        .orderBy(desc(emailTemplateRevisions.version));
      
      return revisions;
    }),
  
  /**
   * Revert template to a specific version
   */
  revertToVersion: protectedProcedure
    .input(z.object({
      templateId: z.number(),
      version: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.user.activeOrgId;
      const userId = ctx.user.id;
      const db = await getDb();
      
      // Verify template belongs to this organization
      const template = await db
        .select()
        .from(emailTemplates)
        .where(and(
          eq(emailTemplates.id, input.templateId),
          eq(emailTemplates.orgId, orgId)
        ))
        .limit(1);
      
      if (template.length === 0) {
        throw new Error('Template not found or access denied');
      }
      
      // Get the revision to revert to
      const revision = await db
        .select()
        .from(emailTemplateRevisions)
        .where(and(
          eq(emailTemplateRevisions.templateId, input.templateId),
          eq(emailTemplateRevisions.version, input.version)
        ))
        .limit(1);
      
      if (revision.length === 0) {
        throw new Error('Revision not found');
      }
      
      const rev = revision[0];
      
      // Update template with revision data
      await db
        .update(emailTemplates)
        .set({
          name: rev.name,
          subject: rev.subject,
          bodyHtml: rev.bodyHtml,
          bodyText: rev.bodyText,
          variables: rev.variables,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(emailTemplates.id, input.templateId));
      
      // Create new revision entry for the revert
      const latestRevision = await db
        .select()
        .from(emailTemplateRevisions)
        .where(eq(emailTemplateRevisions.templateId, input.templateId))
        .orderBy(desc(emailTemplateRevisions.version))
        .limit(1);
      
      const newVersion = latestRevision[0].version + 1;
      
      await db.insert(emailTemplateRevisions).values({
        templateId: input.templateId,
        version: newVersion,
        name: rev.name,
        subject: rev.subject,
        bodyHtml: rev.bodyHtml,
        bodyText: rev.bodyText,
        variables: rev.variables,
        changeNote: `Reverted to version ${input.version}`,
        createdBy: userId,
      });
      
      console.log(`[EmailTemplates] Template ${input.templateId} reverted to version ${input.version} by user ${userId}`);
      
      return {
        success: true,
        newVersion,
      };
    }),
  
  /**
   * Revert template to default (system template)
   */
  revertToDefault: protectedProcedure
    .input(z.object({
      templateType: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.user.activeOrgId;
      const db = await getDb();
      
      // Find the default template
      const defaultTemplate = defaultEmailTemplates.find(
        t => t.templateType === input.templateType
      );
      
      if (!defaultTemplate) {
        throw new Error('Default template not found');
      }
      
      // Delete custom template if it exists
      await db
        .delete(emailTemplates)
        .where(and(
          eq(emailTemplates.orgId, orgId),
          eq(emailTemplates.templateType, input.templateType)
        ));
      
      console.log(`[EmailTemplates] Template ${input.templateType} reverted to default for org ${orgId}`);
      
      return {
        success: true,
        message: 'Template reverted to default',
      };
    }),
  
  /**
   * Preview template with sample data
   * Renders the template with provided sample data
   */
  preview: protectedProcedure
    .input(z.object({
      templateId: z.number().optional(),
      templateType: z.string().optional(),
      subject: z.string().optional(),
      bodyHtml: z.string().optional(),
      sampleData: z.record(z.any()),
    }))
    .mutation(async ({ ctx, input }) => {
      let subject = input.subject;
      let bodyHtml = input.bodyHtml;
      
      // If templateId or templateType provided, fetch template
      if (input.templateId || input.templateType) {
        const orgId = ctx.user.activeOrgId;
        const db = await getDb();
        
        let template;
        
        if (input.templateId) {
          const result = await db
            .select()
            .from(emailTemplates)
            .where(and(
              eq(emailTemplates.id, input.templateId),
              eq(emailTemplates.orgId, orgId)
            ))
            .limit(1);
          
          template = result[0];
        } else if (input.templateType) {
          // Try custom template first
          const customResult = await db
            .select()
            .from(emailTemplates)
            .where(and(
              eq(emailTemplates.orgId, orgId),
              eq(emailTemplates.templateType, input.templateType)
            ))
            .limit(1);
          
          if (customResult.length > 0) {
            template = customResult[0];
          } else {
            // Fall back to default
            const defaultTemplate = defaultEmailTemplates.find(
              t => t.templateType === input.templateType
            );
            
            if (defaultTemplate) {
              template = {
                subject: defaultTemplate.subject,
                bodyHtml: defaultTemplate.bodyHtml,
              };
            }
          }
        }
        
        if (!template) {
          throw new Error('Template not found');
        }
        
        subject = template.subject;
        bodyHtml = template.bodyHtml;
      }
      
      if (!subject || !bodyHtml) {
        throw new Error('Subject and bodyHtml are required');
      }
      
      // Replace variables with sample data
      const renderedSubject = replaceVariables(subject, input.sampleData);
      const renderedBodyHtml = replaceVariables(bodyHtml, input.sampleData);
      
      // Validate variables
      const missingVars = validateVariables(subject + bodyHtml, input.sampleData);
      
      // Log substitutions for debugging
      const substitutions = Object.entries(input.sampleData).map(([key, value]) => ({
        variable: key,
        value: String(value),
      }));
      
      console.log(`[EmailTemplates] Preview rendered with ${substitutions.length} substitutions`);
      
      return {
        subject: renderedSubject,
        bodyHtml: renderedBodyHtml,
        missingVariables: missingVars,
        substitutions,
      };
    }),
  
  /**
   * Validate template variables
   * Returns missing variables and warnings for unknown variables
   */
  validateTemplate: protectedProcedure
    .input(z.object({
      subject: z.string(),
      bodyHtml: z.string(),
      sampleData: z.record(z.any()).optional(),
    }))
    .mutation(async ({ input }) => {
      const subjectVars = extractVariables(input.subject);
      const bodyVars = extractVariables(input.bodyHtml);
      const allVars = Array.from(new Set([...subjectVars, ...bodyVars]));
      
      const sampleData = input.sampleData || {};
      const missingVars = validateVariables(input.subject + input.bodyHtml, sampleData);
      
      // Known variables (for validation)
      const knownVars = [
        'studentName', 'firstName', 'lastName', 'email', 'phone', 'beltRank', 'membershipType',
        'dojoName', 'schoolName', 'dojoAddress', 'dojoPhone', 'dojoEmail', 'dojoWebsite',
        'amount', 'currency', 'paymentMethod', 'transactionId', 'invoiceUrl', 'receiptUrl',
        'className', 'classDate', 'classTime', 'classLocation', 'instructorName',
        'itemName', 'itemSize', 'quantity', 'confirmationUrl',
        'currentDate', 'currentYear', 'resetPasswordUrl', 'loginUrl'
      ];
      
      const unknownVars = allVars.filter(v => !knownVars.includes(v));
      
      return {
        valid: missingVars.length === 0 && unknownVars.length === 0,
        variables: allVars,
        missingVariables: missingVars,
        unknownVariables: unknownVars,
        warnings: unknownVars.length > 0 
          ? [`Unknown variables detected: ${unknownVars.join(', ')}`]
          : [],
      };
    }),
});

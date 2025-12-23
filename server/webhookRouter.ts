import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { leads, webhookKeys } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Webhook Router - Public API for lead creation
 * Allows external systems to submit leads via webhook
 */

// Validation schema for webhook lead creation
const createLeadWebhookSchema = z.object({
  // Required fields
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required").optional(),
  phone: z.string().min(1, "Phone is required").optional(),
  
  // Optional fields
  source: z.string().default("Website Form"),
  message: z.string().optional(),
  
  // UTM parameters
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_content: z.string().optional(),
  utm_term: z.string().optional(),
  
  // Optional API key for authentication
  api_key: z.string().optional(),
}).refine(
  (data) => data.email || data.phone,
  {
    message: "Either email or phone is required",
    path: ["email"],
  }
);

export const webhookRouter = router({
  /**
   * Public endpoint for creating leads via webhook
   * POST /api/webhook/leads/create
   * 
   * Example payload:
   * {
   *   "name": "John Doe",
   *   "email": "john@example.com",
   *   "phone": "+1234567890",
   *   "source": "Website Form",
   *   "message": "Interested in kids martial arts classes",
   *   "utm_source": "google",
   *   "utm_medium": "cpc",
   *   "utm_campaign": "summer_2024",
   *   "api_key": "optional_api_key_for_validation"
   * }
   */
  createLead: publicProcedure
    .input(createLeadWebhookSchema)
    .mutation(async ({ input }) => {
      const db = await getDb();
      
      // Optional API key validation
      if (input.api_key) {
        const [keyRecord] = await db
          .select()
          .from(webhookKeys)
          .where(eq(webhookKeys.apiKey, input.api_key))
          .limit(1);
        
        if (!keyRecord) {
          throw new Error("Invalid API key");
        }
        
        if (!keyRecord.isActive) {
          throw new Error("API key is inactive");
        }
        
        // Update usage stats
        await db
          .update(webhookKeys)
          .set({
            lastUsedAt: new Date(),
            usageCount: keyRecord.usageCount + 1,
          })
          .where(eq(webhookKeys.id, keyRecord.id));
      }
      
      // Parse name into firstName and lastName
      const nameParts = input.name.trim().split(/\s+/);
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ") || firstName;
      
      // Check for duplicate leads (by email or phone)
      if (input.email && db) {
        const [existingLead] = await db
          .select()
          .from(leads)
          .where(eq(leads.email, input.email))
          .limit(1);
        
        if (existingLead && db) {
          // Update existing lead instead of creating duplicate
          await db
            .update(leads)
            .set({
              firstName,
              lastName,
              phone: input.phone || existingLead.phone,
              source: input.source,
              message: input.message,
              utmSource: input.utm_source,
              utmMedium: input.utm_medium,
              utmCampaign: input.utm_campaign,
              utmContent: input.utm_content,
              utmTerm: input.utm_term,
              updatedAt: new Date(),
            })
            .where(eq(leads.id, existingLead.id));
          
          return {
            success: true,
            lead_id: existingLead.id,
            message: "Lead updated successfully",
          };
        }
      }
      
      // Create new lead
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }
      const [newLead] = await db
        .insert(leads)
        .values({
          firstName,
          lastName,
          email: input.email,
          phone: input.phone,
          source: input.source,
          message: input.message,
          utmSource: input.utm_source,
          utmMedium: input.utm_medium,
          utmCampaign: input.utm_campaign,
          utmContent: input.utm_content,
          utmTerm: input.utm_term,
          status: "New Lead",
        })
        .$returningId();
      
      // Trigger notifications asynchronously (don't wait)
      const { notifyNewLead } = await import("./services/notifications.js");
      notifyNewLead({
        id: newLead.id,
        firstName,
        lastName,
        email: input.email,
        phone: input.phone,
        source: input.source,
      }).catch((err) => {
        console.error('[Webhook] Notification error:', err);
      });
      
      return {
        success: true,
        lead_id: newLead.id,
        message: "Lead created successfully",
      };
    }),
  
  /**
   * Health check endpoint
   * GET /api/webhook/health
   */
  health: publicProcedure
    .query(async () => {
      return {
        status: "ok",
        timestamp: new Date().toISOString(),
        service: "DojoFlow Webhook API",
      };
    }),
});

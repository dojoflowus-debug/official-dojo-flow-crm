import { router, protectedProcedure } from './_core/trpc'
import { z } from 'zod'
import { getDb } from './db'
import { paymentProcessorApplication, paymentProcessorApplicationFile } from '../drizzle/schema'
import { eq, and } from 'drizzle-orm'
import { storagePut } from './storage'

export const pcBankCardRouter = router({
  // Get existing application or create draft
  getApplication: protectedProcedure.query(async ({ ctx }) => {
    const orgId = ctx.user.activeOrgId || 0
    const db = await getDb()
    if (!db) throw new Error('Database not available')
    
    const existing = await db
      .select()
      .from(paymentProcessorApplication)
      .where(
        and(
          eq(paymentProcessorApplication.organizationId, orgId),
          eq(paymentProcessorApplication.processor, 'PC_BANK_CARD')
        )
      )
      .limit(1)
    
    if (existing.length > 0) {
      return existing[0]
    }
    
    // Create new draft
    const [newApp] = await db.insert(paymentProcessorApplication).values({
      organizationId: orgId,
      processor: 'PC_BANK_CARD',
      status: 'DRAFT',
      currentStep: 1,
      dataJson: {},
    })
    
    return await db
      .select()
      .from(paymentProcessorApplication)
      .where(eq(paymentProcessorApplication.id, newApp.insertId))
      .limit(1)
      .then(rows => rows[0])
  }),

  // Save draft
  saveDraft: protectedProcedure
    .input(z.object({
      currentStep: z.number(),
      dataJson: z.any(),
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.user.activeOrgId || 0
      const db = await getDb()
      if (!db) throw new Error('Database not available')
      
      const existing = await db
        .select()
        .from(paymentProcessorApplication)
        .where(
          and(
            eq(paymentProcessorApplication.organizationId, orgId),
            eq(paymentProcessorApplication.processor, 'PC_BANK_CARD')
          )
        )
        .limit(1)
      
      if (existing.length === 0) {
        throw new Error('Application not found')
      }
      
      await db
        .update(paymentProcessorApplication)
        .set({
          currentStep: input.currentStep,
          dataJson: input.dataJson,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(paymentProcessorApplication.id, existing[0].id))
      
      return { success: true }
    }),

  // Get application status
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const orgId = ctx.user.activeOrgId || 0
    const db = await getDb()
    if (!db) throw new Error('Database not available')
    
    const app = await db
      .select()
      .from(paymentProcessorApplication)
      .where(
        and(
          eq(paymentProcessorApplication.organizationId, orgId),
          eq(paymentProcessorApplication.processor, 'PC_BANK_CARD')
        )
      )
      .limit(1)
    
    if (app.length === 0) {
      return { status: 'DRAFT', currentStep: 1 }
    }
    
    return {
      status: app[0].status,
      currentStep: app[0].currentStep,
      submittedAt: app[0].submittedAt,
      reviewNotes: app[0].reviewNotes,
    }
  }),

  // Upload file
  uploadFile: protectedProcedure
    .input(z.object({
      fileType: z.enum(['OWNER_ID', 'VOIDED_CHECK', 'STATEMENTS', 'BUSINESS_LICENSE', 'GOV_ID', 'ADDITIONAL']),
      fileName: z.string(),
      fileData: z.string(), // base64
      mimeType: z.string(),
      size: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.user.activeOrgId || 0
      const db = await getDb()
      if (!db) throw new Error('Database not available')
      
      // Get application
      const app = await db
        .select()
        .from(paymentProcessorApplication)
        .where(
          and(
            eq(paymentProcessorApplication.organizationId, orgId),
            eq(paymentProcessorApplication.processor, 'PC_BANK_CARD')
          )
        )
        .limit(1)
      
      if (app.length === 0) {
        throw new Error('Application not found')
      }
      
      // Upload to S3
      const buffer = Buffer.from(input.fileData, 'base64')
      const key = `pc-bank-card/${orgId}/${input.fileType}/${Date.now()}-${input.fileName}`
      const { url } = await storagePut(key, buffer, input.mimeType)
      
      // Save file metadata
      const [fileRecord] = await db.insert(paymentProcessorApplicationFile).values({
        applicationId: app[0].id,
        fileType: input.fileType,
        fileName: input.fileName,
        fileUrl: url,
        mimeType: input.mimeType,
        size: input.size,
      })
      
      return {
        id: fileRecord.insertId,
        fileName: input.fileName,
        fileUrl: url,
        fileType: input.fileType,
      }
    }),

  // Get uploaded files
  getFiles: protectedProcedure.query(async ({ ctx }) => {
    const orgId = ctx.user.activeOrgId || 0
    const db = await getDb()
    if (!db) throw new Error('Database not available')
    
    const app = await db
      .select()
      .from(paymentProcessorApplication)
      .where(
        and(
          eq(paymentProcessorApplication.organizationId, orgId),
          eq(paymentProcessorApplication.processor, 'PC_BANK_CARD')
        )
      )
      .limit(1)
    
    if (app.length === 0) {
      return []
    }
    
    return await db
      .select()
      .from(paymentProcessorApplicationFile)
      .where(eq(paymentProcessorApplicationFile.applicationId, app[0].id))
  }),
})

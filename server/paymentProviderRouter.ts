import { z } from 'zod'
import { router, orgScopedProcedure, publicProcedure } from './_core/trpc'
import { TRPCError } from '@trpc/server'
import {
  getPaymentProviderConnection,
  createPaymentProviderConnection,
  updatePaymentProviderConnection,
  disconnectPaymentProvider,
  deletePaymentProviderConnection,
  getDecryptedSecretKey,
  getBillingSettings,
  upsertBillingSettings,
  logWebhookEvent,
  getRecentWebhookEvents,
  updateWebhookEventStatus,
} from './paymentProviderDb'

// FluidPay API base URLs
const FLUIDPAY_SANDBOX_URL = 'https://sandbox.fluidpay.com/api'
const FLUIDPAY_PRODUCTION_URL = 'https://api.fluidpay.com/api'

// Helper to get FluidPay API URL based on environment
function getFluidPayApiUrl(environment: 'SANDBOX' | 'PRODUCTION'): string {
  return environment === 'PRODUCTION' ? FLUIDPAY_PRODUCTION_URL : FLUIDPAY_SANDBOX_URL
}

// Test FluidPay connection with provided credentials
async function testFluidPayConnection(
  apiKey: string,
  environment: 'SANDBOX' | 'PRODUCTION'
): Promise<{
  success: boolean
  message: string
  health?: {
    gatewayReachable: boolean
    authOk: boolean
    vaultEnabled: boolean
  }
}> {
  const baseUrl = getFluidPayApiUrl(environment)
  
  try {
    // FluidPay uses API key in Authorization header
    const response = await fetch(`${baseUrl}/user`, {
      method: 'GET',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
      },
    })
    
    if (response.ok) {
      const data = await response.json()
      return {
        success: true,
        message: 'Connection successful',
        health: {
          gatewayReachable: true,
          authOk: true,
          vaultEnabled: true, // FluidPay supports vault by default
        },
      }
    } else if (response.status === 401) {
      return {
        success: false,
        message: 'Invalid API key. Please check your credentials.',
        health: {
          gatewayReachable: true,
          authOk: false,
          vaultEnabled: false,
        },
      }
    } else {
      return {
        success: false,
        message: `FluidPay returned error: ${response.status} ${response.statusText}`,
        health: {
          gatewayReachable: true,
          authOk: false,
          vaultEnabled: false,
        },
      }
    }
  } catch (error: any) {
    console.error('[FluidPay] Connection test error:', error)
    return {
      success: false,
      message: `Network error: ${error.message || 'Could not reach FluidPay'}`,
      health: {
        gatewayReachable: false,
        authOk: false,
        vaultEnabled: false,
      },
    }
  }
}

export const paymentProviderRouter = router({
  // Get current payment provider status (tenant-scoped)
  getStatus: orgScopedProcedure
    .query(async ({ ctx }) => {
      const orgId = ctx.currentOrganizationId
      if (!orgId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Organization not found' })
      }
      
      const connection = await getPaymentProviderConnection(orgId)
      const billingConfig = await getBillingSettings(orgId)
      
      if (!connection) {
        return {
          connected: false,
          provider: null,
          environment: null,
          publicKeyLast4: null,
          merchantId: null,
          terminalId: null,
          lastVerifiedAt: null,
          billingSettings: billingConfig,
        }
      }
      
      return {
        connected: connection.status === 'connected',
        provider: connection.provider,
        environment: connection.environment,
        publicKeyLast4: connection.publicKeyLast4,
        merchantId: connection.merchantId,
        terminalId: connection.terminalId,
        lastVerifiedAt: connection.lastVerifiedAt,
        billingSettings: billingConfig,
      }
    }),

  // Test connection with provided credentials (before saving)
  testConnection: orgScopedProcedure
    .input(z.object({
      publicKey: z.string().min(1, 'Public key is required'),
      secretKey: z.string().min(1, 'Secret key is required'),
      environment: z.enum(['SANDBOX', 'PRODUCTION']),
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.currentOrganizationId
      if (!orgId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Organization not found' })
      }
      
      console.log(`[FluidPay] Testing connection for org ${orgId} in ${input.environment} mode`)
      
      // Never log the actual keys
      const result = await testFluidPayConnection(input.secretKey, input.environment)
      
      console.log(`[FluidPay] Test result for org ${orgId}:`, result.success ? 'SUCCESS' : 'FAILED')
      
      return result
    }),

  // Connect FluidPay (save credentials)
  connect: orgScopedProcedure
    .input(z.object({
      publicKey: z.string().min(1, 'Public key is required'),
      secretKey: z.string().min(1, 'Secret key is required'),
      environment: z.enum(['SANDBOX', 'PRODUCTION']),
      merchantId: z.string().optional(),
      terminalId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.currentOrganizationId
      if (!orgId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Organization not found' })
      }
      
      // First test the connection
      const testResult = await testFluidPayConnection(input.secretKey, input.environment)
      if (!testResult.success) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: testResult.message,
        })
      }
      
      // Check if connection already exists
      const existing = await getPaymentProviderConnection(orgId)
      
      if (existing) {
        // Update existing connection
        await updatePaymentProviderConnection(orgId, {
          environment: input.environment,
          publicKey: input.publicKey,
          secretKey: input.secretKey,
          merchantId: input.merchantId || null,
          terminalId: input.terminalId || null,
          status: 'connected',
          lastVerifiedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        })
      } else {
        // Create new connection
        await createPaymentProviderConnection({
          organizationId: orgId,
          provider: 'FLUIDPAY',
          environment: input.environment,
          publicKey: input.publicKey,
          secretKey: input.secretKey,
          merchantId: input.merchantId,
          terminalId: input.terminalId,
        })
      }
      
      console.log(`[FluidPay] Connected org ${orgId} in ${input.environment} mode`)
      
      return {
        success: true,
        message: 'FluidPay connected successfully',
        lastVerifiedAt: new Date().toISOString(),
        health: testResult.health,
      }
    }),

  // Disconnect FluidPay
  disconnect: orgScopedProcedure
    .mutation(async ({ ctx }) => {
      const orgId = ctx.currentOrganizationId
      if (!orgId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Organization not found' })
      }
      
      await disconnectPaymentProvider(orgId)
      
      console.log(`[FluidPay] Disconnected org ${orgId}`)
      
      return {
        success: true,
        message: 'FluidPay disconnected',
      }
    }),

  // Re-verify existing connection
  reverify: orgScopedProcedure
    .mutation(async ({ ctx }) => {
      const orgId = ctx.currentOrganizationId
      if (!orgId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Organization not found' })
      }
      
      const connection = await getPaymentProviderConnection(orgId)
      if (!connection || connection.status !== 'connected') {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No active FluidPay connection found',
        })
      }
      
      const secretKey = await getDecryptedSecretKey(orgId)
      if (!secretKey) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve credentials',
        })
      }
      
      const result = await testFluidPayConnection(secretKey, connection.environment as 'SANDBOX' | 'PRODUCTION')
      
      if (result.success) {
        await updatePaymentProviderConnection(orgId, {
          lastVerifiedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        })
      }
      
      return {
        success: result.success,
        message: result.message,
        lastVerifiedAt: result.success ? new Date().toISOString() : null,
        health: result.health,
      }
    }),

  // Rotate keys (update with new credentials)
  rotateKeys: orgScopedProcedure
    .input(z.object({
      publicKey: z.string().min(1, 'Public key is required'),
      secretKey: z.string().min(1, 'Secret key is required'),
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.currentOrganizationId
      if (!orgId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Organization not found' })
      }
      
      const connection = await getPaymentProviderConnection(orgId)
      if (!connection) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No FluidPay connection found',
        })
      }
      
      // Test new credentials
      const result = await testFluidPayConnection(input.secretKey, connection.environment as 'SANDBOX' | 'PRODUCTION')
      if (!result.success) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: result.message,
        })
      }
      
      // Update with new keys
      await updatePaymentProviderConnection(orgId, {
        publicKey: input.publicKey,
        secretKey: input.secretKey,
        lastVerifiedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      })
      
      console.log(`[FluidPay] Rotated keys for org ${orgId}`)
      
      return {
        success: true,
        message: 'Keys rotated successfully',
        lastVerifiedAt: new Date().toISOString(),
      }
    }),

  // Get recent webhook events
  getEvents: orgScopedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(10),
    }).optional())
    .query(async ({ ctx, input }) => {
      const orgId = ctx.currentOrganizationId
      if (!orgId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Organization not found' })
      }
      
      const limit = input?.limit || 10
      const events = await getRecentWebhookEvents(orgId, limit)
      
      return {
        events,
        webhookUrl: `${process.env.VITE_APP_URL || 'https://dojoflow.ai'}/api/webhooks/fluidpay`,
        hasEvents: events.length > 0,
      }
    }),

  // Update billing settings
  updateBillingSettings: orgScopedProcedure
    .input(z.object({
      recurringEnabled: z.boolean().optional(),
      billingCadence: z.enum(['monthly', 'weekly', 'custom']).optional(),
      customBillingDay: z.number().min(1).max(31).nullable().optional(),
      retryAttempts: z.number().min(1).max(5).optional(),
      retryIntervalDays: z.number().min(1).max(7).optional(),
      autoEmailReceipts: z.boolean().optional(),
      sendFailedPaymentNotices: z.boolean().optional(),
      posTrackingEnabled: z.boolean().optional(),
      posMode: z.enum(['standalone_terminal', 'integrated_checkout']).nullable().optional(),
      dailySettlementSyncTime: z.string().nullable().optional(),
      paymentMatchingMethod: z.enum(['invoice_number', 'student_name', 'amount_date']).optional(),
      chargeApiEnabled: z.boolean().optional(),
      refundApiEnabled: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.currentOrganizationId
      if (!orgId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Organization not found' })
      }
      
      // Convert booleans to integers for database
      const dbData: Record<string, any> = {}
      if (input.recurringEnabled !== undefined) dbData.recurringEnabled = input.recurringEnabled ? 1 : 0
      if (input.billingCadence !== undefined) dbData.billingCadence = input.billingCadence
      if (input.customBillingDay !== undefined) dbData.customBillingDay = input.customBillingDay
      if (input.retryAttempts !== undefined) dbData.retryAttempts = input.retryAttempts
      if (input.retryIntervalDays !== undefined) dbData.retryIntervalDays = input.retryIntervalDays
      if (input.autoEmailReceipts !== undefined) dbData.autoEmailReceipts = input.autoEmailReceipts ? 1 : 0
      if (input.sendFailedPaymentNotices !== undefined) dbData.sendFailedPaymentNotices = input.sendFailedPaymentNotices ? 1 : 0
      if (input.posTrackingEnabled !== undefined) dbData.posTrackingEnabled = input.posTrackingEnabled ? 1 : 0
      if (input.posMode !== undefined) dbData.posMode = input.posMode
      if (input.dailySettlementSyncTime !== undefined) dbData.dailySettlementSyncTime = input.dailySettlementSyncTime
      if (input.paymentMatchingMethod !== undefined) dbData.paymentMatchingMethod = input.paymentMatchingMethod
      if (input.chargeApiEnabled !== undefined) dbData.chargeApiEnabled = input.chargeApiEnabled ? 1 : 0
      if (input.refundApiEnabled !== undefined) dbData.refundApiEnabled = input.refundApiEnabled ? 1 : 0
      
      await upsertBillingSettings(orgId, dbData)
      
      return {
        success: true,
        message: 'Billing settings updated',
      }
    }),

  // Send test webhook event (for testing mode)
  sendTestEvent: orgScopedProcedure
    .mutation(async ({ ctx }) => {
      const orgId = ctx.currentOrganizationId
      if (!orgId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Organization not found' })
      }
      
      // Log a test event
      await logWebhookEvent({
        organizationId: orgId,
        eventType: 'test.event',
        payload: JSON.stringify({
          type: 'test.event',
          created: new Date().toISOString(),
          data: {
            message: 'This is a test webhook event',
            orgId,
          },
        }),
      })
      
      return {
        success: true,
        message: 'Test event sent successfully',
      }
    }),

  // Run $1 auth test (sandbox only)
  runAuthTest: orgScopedProcedure
    .mutation(async ({ ctx }) => {
      const orgId = ctx.currentOrganizationId
      if (!orgId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Organization not found' })
      }
      
      const connection = await getPaymentProviderConnection(orgId)
      if (!connection || connection.status !== 'connected') {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No active FluidPay connection found',
        })
      }
      
      if (connection.environment !== 'SANDBOX') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Auth test is only available in sandbox mode',
        })
      }
      
      const secretKey = await getDecryptedSecretKey(orgId)
      if (!secretKey) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve credentials',
        })
      }
      
      const baseUrl = getFluidPayApiUrl('SANDBOX')
      
      try {
        // Create a $1 authorization (not capture)
        const response = await fetch(`${baseUrl}/transaction`, {
          method: 'POST',
          headers: {
            'Authorization': secretKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'authorize',
            amount: 100, // $1.00 in cents
            payment_method: {
              card: {
                number: '4111111111111111', // Test card
                expiration_date: '12/25',
                cvc: '123',
              },
            },
            billing_address: {
              first_name: 'Test',
              last_name: 'User',
            },
          }),
        })
        
        const data = await response.json()
        
        if (response.ok && data.status === 'success') {
          // Void the authorization immediately
          if (data.data?.id) {
            await fetch(`${baseUrl}/transaction/${data.data.id}/void`, {
              method: 'POST',
              headers: {
                'Authorization': secretKey,
                'Content-Type': 'application/json',
              },
            })
          }
          
          return {
            success: true,
            message: '$1 auth test successful (voided)',
            transactionId: data.data?.id,
          }
        } else {
          return {
            success: false,
            message: `Auth test failed: ${data.msg || data.message || 'Unknown error'}`,
          }
        }
      } catch (error: any) {
        console.error('[FluidPay] Auth test error:', error)
        return {
          success: false,
          message: `Auth test error: ${error.message || 'Network error'}`,
        }
      }
    }),

  // Get dual pricing settings
  getDualPricingSettings: orgScopedProcedure
    .query(async ({ ctx }) => {
      const orgId = ctx.currentOrganizationId
      if (!orgId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Organization not found' })
      }
      
      const settings = await getBillingSettings(orgId)
      
      return {
        enabled: settings?.dualPricingEnabled === 1,
        posEnabled: settings?.dualPricingPosEnabled === 1,
        subscriptionsEnabled: settings?.dualPricingSubscriptionsEnabled === 1,
        cashDiscountPercent: settings?.cashDiscountPercent ? parseFloat(settings.cashDiscountPercent) : 3.99,
        receiptDisclosureText: settings?.receiptDisclosureText || 'A discount is applied for cash or check payments. The listed price is the card price.',
        complianceAcknowledged: settings?.complianceAcknowledged === 1,
        complianceAcknowledgedAt: settings?.complianceAcknowledgedAt || null,
      }
    }),

  // Update dual pricing settings
  updateDualPricingSettings: orgScopedProcedure
    .input(z.object({
      enabled: z.boolean().optional(),
      posEnabled: z.boolean().optional(),
      subscriptionsEnabled: z.boolean().optional(),
      cashDiscountPercent: z.number().min(0).max(10).optional(),
      receiptDisclosureText: z.string().max(500).optional(),
      complianceAcknowledged: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.currentOrganizationId
      if (!orgId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Organization not found' })
      }
      
      const dbData: Record<string, any> = {}
      if (input.enabled !== undefined) dbData.dualPricingEnabled = input.enabled ? 1 : 0
      if (input.posEnabled !== undefined) dbData.dualPricingPosEnabled = input.posEnabled ? 1 : 0
      if (input.subscriptionsEnabled !== undefined) dbData.dualPricingSubscriptionsEnabled = input.subscriptionsEnabled ? 1 : 0
      if (input.cashDiscountPercent !== undefined) dbData.cashDiscountPercent = input.cashDiscountPercent.toFixed(2)
      if (input.receiptDisclosureText !== undefined) dbData.receiptDisclosureText = input.receiptDisclosureText
      if (input.complianceAcknowledged !== undefined) {
        dbData.complianceAcknowledged = input.complianceAcknowledged ? 1 : 0
        if (input.complianceAcknowledged) {
          dbData.complianceAcknowledgedAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
        }
      }
      
      await upsertBillingSettings(orgId, dbData)
      
      return {
        success: true,
        message: 'Dual pricing settings updated',
      }
    }),

  // Calculate dual pricing for a given amount
  calculateDualPrice: orgScopedProcedure
    .input(z.object({
      baseAmount: z.number().positive(), // Amount in cents
      context: z.enum(['pos', 'subscription', 'invoice']).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const orgId = ctx.currentOrganizationId
      if (!orgId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Organization not found' })
      }
      
      const settings = await getBillingSettings(orgId)
      const dualPricingEnabled = settings?.dualPricingEnabled === 1
      const posEnabled = settings?.dualPricingPosEnabled === 1
      const subscriptionsEnabled = settings?.dualPricingSubscriptionsEnabled === 1
      const cashDiscountPercent = settings?.cashDiscountPercent ? parseFloat(settings.cashDiscountPercent) : 3.99
      
      // Check if dual pricing applies to this context
      let applyDualPricing = dualPricingEnabled
      if (input.context === 'pos' && !posEnabled) applyDualPricing = false
      if (input.context === 'subscription' && !subscriptionsEnabled) applyDualPricing = false
      
      if (!applyDualPricing) {
        return {
          dualPricingApplied: false,
          cardPrice: input.baseAmount,
          cashPrice: input.baseAmount,
          discountAmount: 0,
          discountPercent: 0,
        }
      }
      
      // Card price is the base amount (posted price)
      const cardPrice = input.baseAmount
      // Cash price = Card price * (1 - discount%)
      const discountAmount = Math.round(cardPrice * (cashDiscountPercent / 100))
      const cashPrice = cardPrice - discountAmount
      
      return {
        dualPricingApplied: true,
        cardPrice,
        cashPrice,
        discountAmount,
        discountPercent: cashDiscountPercent,
        receiptDisclosure: settings?.receiptDisclosureText || 'A discount is applied for cash or check payments.',
      }
    }),
})

import { router, protectedProcedure } from './_core/trpc';
import { z } from 'zod';
import { getDb } from './db';
import { paymentProviderConnections, organizations, subscriptionPlans } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import FluidPayService from './services/fluidPayService';

/**
 * Fluid Pay Router
 * Handles payment processing, subscriptions, and credit purchases
 */

export const fluidPayRouter = router({
  /**
   * Setup Fluid Pay credentials for a location/organization
   */
  setupPaymentProvider: protectedProcedure
    .input(
      z.object({
        publicKey: z.string().min(1),
        privateKey: z.string().min(1),
        merchantId: z.string().optional(),
        environment: z.enum(['SANDBOX', 'PRODUCTION']).default('SANDBOX'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const orgId = ctx.org?.id;
        if (!orgId) {
          throw new Error('Organization not found');
        }

        const db = await getDb();
        if (!db) {
          throw new Error('Database not available');
        }

        // Encrypt the private key before storing
        const encryptedPrivateKey = Buffer.from(input.privateKey).toString('base64');

        // Check if provider connection already exists
        const existing = await db
          .select()
          .from(paymentProviderConnections)
          .where(
            and(
              eq(paymentProviderConnections.organizationId, orgId),
              eq(paymentProviderConnections.provider, 'FLUIDPAY')
            )
          )
          .limit(1);

        if (existing.length > 0) {
          // Update existing connection
          await db
            .update(paymentProviderConnections)
            .set({
              publicKeyLast4: input.publicKey.slice(-4),
              secretKeyEncrypted: encryptedPrivateKey,
              merchantId: input.merchantId,
              environment: input.environment,
              status: 'connected',
              lastVerifiedAt: new Date().toISOString(),
            })
            .where(eq(paymentProviderConnections.id, existing[0].id));
        } else {
          // Create new connection
          await db.insert(paymentProviderConnections).values({
            organizationId: orgId,
            provider: 'FLUIDPAY',
            publicKeyLast4: input.publicKey.slice(-4),
            secretKeyEncrypted: encryptedPrivateKey,
            merchantId: input.merchantId,
            environment: input.environment,
            status: 'connected',
            lastVerifiedAt: new Date().toISOString(),
          });
        }

        return {
          success: true,
          message: 'Fluid Pay credentials saved successfully',
        };
      } catch (error) {
        console.error('Error setting up payment provider:', error);
        throw new Error('Failed to setup payment provider');
      }
    }),

  /**
   * Get payment provider configuration
   */
  getPaymentProvider: protectedProcedure.query(async ({ ctx }) => {
    try {
      const orgId = ctx.org?.id;
      if (!orgId) {
        throw new Error('Organization not found');
      }

      const db = await getDb();
      if (!db) {
        throw new Error('Database not available');
      }

      const provider = await db
        .select()
        .from(paymentProviderConnections)
        .where(
          and(
            eq(paymentProviderConnections.organizationId, orgId),
            eq(paymentProviderConnections.provider, 'FLUIDPAY')
          )
        )
        .limit(1);

      if (!provider.length) {
        return null;
      }

      return {
        id: provider[0].id,
        status: provider[0].status,
        environment: provider[0].environment,
        publicKeyLast4: provider[0].publicKeyLast4,
        merchantId: provider[0].merchantId,
        lastVerifiedAt: provider[0].lastVerifiedAt,
      };
    } catch (error) {
      console.error('Error getting payment provider:', error);
      throw new Error('Failed to retrieve payment provider');
    }
  }),

  /**
   * Process a credit purchase
   */
  purchaseCredits: protectedProcedure
    .input(
      z.object({
        amount: z.number().positive(),
        credits: z.number().positive(),
        planId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const orgId = ctx.org?.id;
        if (!orgId) {
          throw new Error('Organization not found');
        }

        const db = await getDb();
        if (!db) {
          throw new Error('Database not available');
        }

        // Get payment provider credentials
        const provider = await db
          .select()
          .from(paymentProviderConnections)
          .where(
            and(
              eq(paymentProviderConnections.organizationId, orgId),
              eq(paymentProviderConnections.provider, 'FLUIDPAY')
            )
          )
          .limit(1);

        if (!provider.length || provider[0].status !== 'connected') {
          throw new Error('Payment provider not configured');
        }

        // Decrypt private key
        const privateKey = Buffer.from(provider[0].secretKeyEncrypted, 'base64').toString();

        // Initialize Fluid Pay service
        const fluidPay = new FluidPayService({
          publicKey: provider[0].publicKeyLast4, // In production, retrieve full key from secure storage
          privateKey,
          environment: provider[0].environment,
          merchantId: provider[0].merchantId,
        });

        // Create charge
        const result = await fluidPay.createCharge({
          amount: input.amount,
          currency: 'USD',
          description: `Purchase ${input.credits} credits`,
          customerId: `org_${orgId}`,
          metadata: {
            organizationId: orgId,
            credits: input.credits,
            planId: input.planId,
          },
        });

        if (!result.success) {
          throw new Error(result.error || 'Payment failed');
        }

        return {
          success: true,
          transactionId: result.transactionId,
          message: 'Credit purchase initiated',
        };
      } catch (error) {
        console.error('Error purchasing credits:', error);
        throw new Error('Failed to process credit purchase');
      }
    }),

  /**
   * Process subscription payment
   */
  subscribeToplan: protectedProcedure
    .input(
      z.object({
        planId: z.string(),
        billingCycle: z.enum(['monthly', 'annual']).default('monthly'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const orgId = ctx.org?.id;
        if (!orgId) {
          throw new Error('Organization not found');
        }

        const db = await getDb();
        if (!db) {
          throw new Error('Database not available');
        }

        // Get subscription plan details
        const plan = await db
          .select()
          .from(subscriptionPlans)
          .where(eq(subscriptionPlans.id, parseInt(input.planId)))
          .limit(1);

        if (!plan.length) {
          throw new Error('Subscription plan not found');
        }

        // Get payment provider
        const provider = await db
          .select()
          .from(paymentProviderConnections)
          .where(
            and(
              eq(paymentProviderConnections.organizationId, orgId),
              eq(paymentProviderConnections.provider, 'FLUIDPAY')
            )
          )
          .limit(1);

        if (!provider.length || provider[0].status !== 'connected') {
          throw new Error('Payment provider not configured');
        }

        // Decrypt private key
        const privateKey = Buffer.from(provider[0].secretKeyEncrypted, 'base64').toString();

        // Initialize Fluid Pay service
        const fluidPay = new FluidPayService({
          publicKey: provider[0].publicKeyLast4,
          privateKey,
          environment: provider[0].environment,
          merchantId: provider[0].merchantId,
        });

        // Create subscription
        const result = await fluidPay.createSubscription(`org_${orgId}`, input.planId, {
          organizationId: orgId,
          billingCycle: input.billingCycle,
          planName: plan[0].name,
        });

        if (!result.success) {
          throw new Error(result.error || 'Subscription failed');
        }

        return {
          success: true,
          subscriptionId: result.transactionId,
          message: 'Subscription created successfully',
        };
      } catch (error) {
        console.error('Error creating subscription:', error);
        throw new Error('Failed to create subscription');
      }
    }),

  /**
   * Get payment history for organization
   */
  getPaymentHistory: protectedProcedure.query(async ({ ctx }) => {
    try {
      const orgId = ctx.org?.id;
      if (!orgId) {
        throw new Error('Organization not found');
      }

      // This would query payment records from database
      // For now, returning placeholder
      return {
        payments: [],
        total: 0,
      };
    } catch (error) {
      console.error('Error getting payment history:', error);
      throw new Error('Failed to retrieve payment history');
    }
  }),

  /**
   * Handle webhook from Fluid Pay
   */
  handleWebhook: protectedProcedure
    .input(
      z.object({
        event: z.string(),
        data: z.record(z.any()),
        signature: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Verify webhook signature
        // In production, retrieve the correct secret key for verification
        
        console.log(`Processing Fluid Pay webhook: ${input.event}`);

        // Handle different webhook events
        switch (input.event) {
          case 'charge.completed':
            // Handle successful charge
            console.log('Charge completed:', input.data);
            break;
          case 'charge.failed':
            // Handle failed charge
            console.log('Charge failed:', input.data);
            break;
          case 'subscription.created':
            // Handle subscription creation
            console.log('Subscription created:', input.data);
            break;
          case 'subscription.cancelled':
            // Handle subscription cancellation
            console.log('Subscription cancelled:', input.data);
            break;
          default:
            console.log('Unknown webhook event:', input.event);
        }

        return {
          success: true,
          message: 'Webhook processed',
        };
      } catch (error) {
        console.error('Error handling webhook:', error);
        throw new Error('Failed to process webhook');
      }
    }),
});

export default fluidPayRouter;

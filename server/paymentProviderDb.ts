import { getDb } from './db'
import { paymentProviderConnections, billingSettings, paymentWebhookEvents } from '../drizzle/schema'
import { eq, and, desc } from 'drizzle-orm'
import crypto from 'crypto'

// Encryption key from environment (32 bytes for AES-256)
const ENCRYPTION_KEY = process.env.PAYMENT_ENCRYPTION_KEY || 'dojoflow-payment-key-32-bytes!!'
const IV_LENGTH = 16

// Encrypt sensitive data
export function encryptKey(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv)
  let encrypted = cipher.update(text)
  encrypted = Buffer.concat([encrypted, cipher.final()])
  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

// Decrypt sensitive data
export function decryptKey(text: string): string {
  const parts = text.split(':')
  const iv = Buffer.from(parts[0], 'hex')
  const encryptedText = Buffer.from(parts[1], 'hex')
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv)
  let decrypted = decipher.update(encryptedText)
  decrypted = Buffer.concat([decrypted, decipher.final()])
  return decrypted.toString()
}

// Get last 4 characters of a key for display
export function maskKey(key: string): string {
  return key.slice(-4)
}

// ============ Payment Provider Connections ============

export async function getPaymentProviderConnection(organizationId: number) {
  const db = await getDb()
  const [connection] = await db
    .select()
    .from(paymentProviderConnections)
    .where(eq(paymentProviderConnections.organizationId, organizationId))
    .limit(1)
  return connection || null
}

export async function createPaymentProviderConnection(data: {
  organizationId: number
  provider: 'FLUIDPAY' | 'STRIPE'
  environment: 'SANDBOX' | 'PRODUCTION'
  publicKey: string
  secretKey: string
  merchantId?: string
  terminalId?: string
}) {
  const encryptedSecretKey = encryptKey(data.secretKey)
  const publicKeyLast4 = maskKey(data.publicKey)
  
  const db = await getDb()
  const result = await db.insert(paymentProviderConnections).values({
    organizationId: data.organizationId,
    provider: data.provider,
    environment: data.environment,
    publicKeyLast4,
    secretKeyEncrypted: encryptedSecretKey,
    merchantId: data.merchantId || null,
    terminalId: data.terminalId || null,
    status: 'connected',
    lastVerifiedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
  })
  
  return result
}

export async function updatePaymentProviderConnection(
  organizationId: number,
  data: Partial<{
    environment: 'SANDBOX' | 'PRODUCTION'
    publicKey: string
    secretKey: string
    merchantId: string | null
    terminalId: string | null
    status: 'connected' | 'disconnected'
    lastVerifiedAt: string
  }>
) {
  const updateData: Record<string, any> = {}
  
  if (data.environment) updateData.environment = data.environment
  if (data.publicKey) updateData.publicKeyLast4 = maskKey(data.publicKey)
  if (data.secretKey) updateData.secretKeyEncrypted = encryptKey(data.secretKey)
  if (data.merchantId !== undefined) updateData.merchantId = data.merchantId
  if (data.terminalId !== undefined) updateData.terminalId = data.terminalId
  if (data.status) updateData.status = data.status
  if (data.lastVerifiedAt) updateData.lastVerifiedAt = data.lastVerifiedAt
  
  const db = await getDb()
  await db
    .update(paymentProviderConnections)
    .set(updateData)
    .where(eq(paymentProviderConnections.organizationId, organizationId))
}

export async function disconnectPaymentProvider(organizationId: number) {
  const db = await getDb()
  await db
    .update(paymentProviderConnections)
    .set({ status: 'disconnected' })
    .where(eq(paymentProviderConnections.organizationId, organizationId))
}

export async function deletePaymentProviderConnection(organizationId: number) {
  const db = await getDb()
  await db
    .delete(paymentProviderConnections)
    .where(eq(paymentProviderConnections.organizationId, organizationId))
}

// Get decrypted secret key for API calls (internal use only)
export async function getDecryptedSecretKey(organizationId: number): Promise<string | null> {
  const connection = await getPaymentProviderConnection(organizationId)
  if (!connection || !connection.secretKeyEncrypted) return null
  try {
    return decryptKey(connection.secretKeyEncrypted)
  } catch (e) {
    console.error('[PaymentProvider] Failed to decrypt secret key:', e)
    return null
  }
}

// ============ Billing Settings ============

export async function getBillingSettings(organizationId: number) {
  const db = await getDb()
  const [settings] = await db
    .select()
    .from(billingSettings)
    .where(eq(billingSettings.organizationId, organizationId))
    .limit(1)
  return settings || null
}

export async function upsertBillingSettings(organizationId: number, data: Partial<{
  recurringEnabled: number
  billingCadence: 'monthly' | 'weekly' | 'custom'
  customBillingDay: number | null
  retryAttempts: number
  retryIntervalDays: number
  autoEmailReceipts: number
  sendFailedPaymentNotices: number
  posTrackingEnabled: number
  posMode: 'standalone_terminal' | 'integrated_checkout' | null
  dailySettlementSyncTime: string | null
  paymentMatchingMethod: 'invoice_number' | 'student_name' | 'amount_date'
  chargeApiEnabled: number
  refundApiEnabled: number
  // Dual pricing fields
  dualPricingEnabled: number
  dualPricingPosEnabled: number
  dualPricingSubscriptionsEnabled: number
  cashDiscountPercent: string
  receiptDisclosureText: string | null
  complianceAcknowledged: number
  complianceAcknowledgedAt: string | null
}>) {
  const existing = await getBillingSettings(organizationId)
  
  const db = await getDb()
  if (existing) {
    await db
      .update(billingSettings)
      .set(data)
      .where(eq(billingSettings.organizationId, organizationId))
  } else {
    await db.insert(billingSettings).values({
      organizationId,
      ...data,
    })
  }
}

// ============ Webhook Events ============

export async function logWebhookEvent(data: {
  organizationId: number
  eventType: string
  payload: string
  linkedInvoiceId?: number
  linkedStudentId?: number
}) {
  const payloadHash = crypto.createHash('sha256').update(data.payload).digest('hex')
  
  const db = await getDb()
  await db.insert(paymentWebhookEvents).values({
    organizationId: data.organizationId,
    eventType: data.eventType,
    payloadHash,
    payload: data.payload,
    linkedInvoiceId: data.linkedInvoiceId || null,
    linkedStudentId: data.linkedStudentId || null,
    status: 'received',
    receivedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
  })
}

export async function getRecentWebhookEvents(organizationId: number, limit: number = 10) {
  const db = await getDb()
  const events = await db
    .select({
      id: paymentWebhookEvents.id,
      eventType: paymentWebhookEvents.eventType,
      status: paymentWebhookEvents.status,
      linkedInvoiceId: paymentWebhookEvents.linkedInvoiceId,
      linkedStudentId: paymentWebhookEvents.linkedStudentId,
      receivedAt: paymentWebhookEvents.receivedAt,
      processedAt: paymentWebhookEvents.processedAt,
      errorMessage: paymentWebhookEvents.errorMessage,
    })
    .from(paymentWebhookEvents)
    .where(eq(paymentWebhookEvents.organizationId, organizationId))
    .orderBy(desc(paymentWebhookEvents.receivedAt))
    .limit(limit)
  
  return events
}

export async function updateWebhookEventStatus(
  eventId: number,
  status: 'received' | 'processed' | 'failed',
  errorMessage?: string
) {
  const updateData: Record<string, any> = { status }
  if (status === 'processed') {
    updateData.processedAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
  }
  if (errorMessage) {
    updateData.errorMessage = errorMessage
  }
  
  const db = await getDb()
  await db
    .update(paymentWebhookEvents)
    .set(updateData)
    .where(eq(paymentWebhookEvents.id, eventId))
}

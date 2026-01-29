import { describe, it, expect, beforeAll } from 'vitest'
import { appRouter } from './routers'
import { db } from './db'
import { paymentProcessorApplication } from '../drizzle/schema'
import { eq } from 'drizzle-orm'

describe('PC Bank Card Router', () => {
  const mockContext = {
    user: {
      id: 2580004,
      openId: 'test_user',
      email: 'test@example.com',
      name: 'Test User',
      role: 'owner',
      activeOrgId: 120001,
    },
    currentOrganizationId: 120001,
    req: {} as any,
    res: {} as any,
  }

  const caller = appRouter.createCaller(mockContext)

  it('should create a new draft application', async () => {
    const result = await caller.pcBankCard.getApplication()
    
    expect(result).toBeDefined()
    expect(result.status).toBe('DRAFT')
    expect(result.currentStep).toBe(1)
    expect(result.processor).toBe('PC_BANK_CARD')
    expect(result.organizationId).toBe(120001)
  })

  it('should save draft with form data', async () => {
    const testData = {
      legalBusinessName: 'Test Dojo LLC',
      businessEmail: 'test@testdojo.com',
      businessPhone: '555-1234',
    }

    const result = await caller.pcBankCard.saveDraft({
      currentStep: 2,
      dataJson: testData,
    })

    expect(result.success).toBe(true)

    // Verify data was saved
    const app = await caller.pcBankCard.getApplication()
    expect(app.currentStep).toBe(2)
    expect(app.dataJson).toMatchObject(testData)
  })

  it('should return application status', async () => {
    const status = await caller.pcBankCard.getStatus()
    
    expect(status).toBeDefined()
    expect(status.status).toBe('DRAFT')
    expect(status.currentStep).toBeGreaterThanOrEqual(1)
  })

  it('should handle file upload', async () => {
    const testFile = {
      fileType: 'OWNER_ID' as const,
      fileName: 'test-id.jpg',
      fileData: Buffer.from('test image data').toString('base64'),
      mimeType: 'image/jpeg',
      size: 1024,
    }

    const result = await caller.pcBankCard.uploadFile(testFile)

    expect(result).toBeDefined()
    expect(result.fileName).toBe('test-id.jpg')
    expect(result.fileType).toBe('OWNER_ID')
    expect(result.fileUrl).toContain('http')
  })

  it('should retrieve uploaded files', async () => {
    const files = await caller.pcBankCard.getFiles()
    
    expect(Array.isArray(files)).toBe(true)
    if (files.length > 0) {
      expect(files[0]).toHaveProperty('fileName')
      expect(files[0]).toHaveProperty('fileUrl')
      expect(files[0]).toHaveProperty('fileType')
    }
  })
})

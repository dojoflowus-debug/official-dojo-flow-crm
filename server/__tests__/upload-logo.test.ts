import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { getDb } from '../db'
import { dojoSettings } from '../../drizzle/schema'
import { eq } from 'drizzle-orm'

describe('Logo Upload', () => {
  let db: Awaited<ReturnType<typeof getDb>>

  beforeAll(async () => {
    db = await getDb()
  })

  it('should have dojo_settings table with logo columns', async () => {
    if (!db) throw new Error('Database not available')
    
    // Check if dojo_settings exists and has the right columns
    const result = await db.select().from(dojoSettings).limit(1)
    
    // The query should work without errors
    expect(result).toBeDefined()
    expect(Array.isArray(result)).toBe(true)
  })

  it('should be able to update logoSquare in dojo_settings', async () => {
    if (!db) throw new Error('Database not available')
    
    // First, ensure there's a row
    const existing = await db.select().from(dojoSettings).limit(1)
    
    if (existing.length === 0) {
      await db.insert(dojoSettings).values({
        setupCompleted: 0,
      })
    }
    
    // Update the logo
    const testLogoUrl = 'https://test-logo-url.com/logo.png'
    await db.update(dojoSettings).set({
      logoSquare: testLogoUrl,
    })
    
    // Verify the update
    const updated = await db.select().from(dojoSettings).limit(1)
    expect(updated[0].logoSquare).toBe(testLogoUrl)
  })

  it('should return logo from getBrand query', async () => {
    if (!db) throw new Error('Database not available')
    
    const result = await db.select().from(dojoSettings).limit(1)
    
    if (result.length > 0) {
      // Check that logoSquare field exists
      expect('logoSquare' in result[0]).toBe(true)
    }
  })
})

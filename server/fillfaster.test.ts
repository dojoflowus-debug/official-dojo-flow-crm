import { describe, it, expect } from 'vitest'

describe('FillFaster API Integration', () => {
  it('should validate FILLFASTER_API_KEY by calling getFormsList endpoint', async () => {
    const apiKey = process.env.FILLFASTER_API_KEY
    expect(apiKey).toBeDefined()
    expect(apiKey).toBeTruthy()

    // Call FillFaster API to validate the key
    const response = await fetch('https://api.fillfaster.com/v1/getFormsList?sort=created&order=desc&page=1', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    expect(response.ok).toBe(true)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data).toHaveProperty('items')
    expect(Array.isArray(data.items)).toBe(true)

    console.log(`✅ FillFaster API key validated successfully. Found ${data.total_count} forms.`)
  }, 15000) // 15 second timeout for API call
})

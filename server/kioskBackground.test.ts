import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from './db';
import { locations } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Kiosk Background Upload and Retrieval Flow', () => {
  let testLocationId: number;
  let db: any;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error('Database not available');

    // Create a test location
    const result = await db
      .insert(locations)
      .values({
        name: 'Test Dojo Background',
        kioskSlug: 'test-dojo-bg-' + Date.now(),
        kioskEnabled: 1,
        kioskSettings: JSON.stringify({
          theme: { mode: 'dark', primaryColor: '#2563EB', accentColor: '#EF4444' },
          background: { type: 'preset', presetKey: 'dojo-warm-lights', blur: 0, dim: 0, vignette: false },
        }),
      });
    testLocationId = result[0].insertId;
    console.log('Created test location:', testLocationId);
  });

  afterAll(async () => {
    if (db && testLocationId) {
      await db.delete(locations).where(eq(locations.id, testLocationId));
      console.log('Cleaned up test location');
    }
  });

  it('should save custom background URL to kioskSettings', async () => {
    const { updateKioskBackgroundImage } = await import('./db');
    
    const customUrl = 'https://s3.example.com/kiosk-backgrounds/location-' + testLocationId + '/test-image.jpg';
    const success = await updateKioskBackgroundImage(testLocationId, customUrl, 5, 20);

    expect(success).toBe(true);

    // Verify the settings were saved
    const location = await db
      .select()
      .from(locations)
      .where(eq(locations.id, testLocationId))
      .limit(1);

    expect(location.length).toBe(1);
    const settings = JSON.parse(location[0].kioskSettings);
    console.log('Saved settings:', JSON.stringify(settings, null, 2));
    
    expect(settings.background).toBeDefined();
    expect(settings.background.type).toBe('image');
    expect(settings.background.imageUrl).toBe(customUrl);
    expect(settings.background.blur).toBe(5);
    expect(settings.background.dim).toBe(20);
    expect(settings.background.presetKey).toBeNull();
  });

  it('should retrieve custom background via getLocationBackgroundWithFallback', async () => {
    const { getLocationBackgroundWithFallback } = await import('./db');
    
    const background = await getLocationBackgroundWithFallback(testLocationId);
    console.log('Retrieved background:', JSON.stringify(background, null, 2));
    
    expect(background).toBeDefined();
    expect(background.imageUrl).toBeDefined();
    expect(background.imageUrl).toContain('s3.example.com');
    expect(background.blur).toBe(5);
    expect(background.dim).toBe(20);
  });

  it('should prioritize imageUrl over presetKey', async () => {
    const { updateKioskBackgroundImage, getLocationBackgroundWithFallback } = await import('./db');
    
    // Set a custom URL
    const customUrl = 'https://s3.example.com/custom-bg-' + Date.now() + '.jpg';
    await updateKioskBackgroundImage(testLocationId, customUrl, 3, 10);

    const background = await getLocationBackgroundWithFallback(testLocationId);
    console.log('Background with custom imageUrl:', JSON.stringify(background, null, 2));
    
    // Should use imageUrl, not presetKey
    expect(background.imageUrl).toBe(customUrl);
    expect(background.imageUrl).toBeTruthy();
  });

  it('should revert to preset when custom background is removed', async () => {
    const { resetKioskBackground, getLocationBackgroundWithFallback } = await import('./db');
    
    // Reset to preset
    const success = await resetKioskBackground(testLocationId, 'dojo-warm-lights');
    expect(success).toBe(true);

    const background = await getLocationBackgroundWithFallback(testLocationId);
    console.log('Background after reset:', JSON.stringify(background, null, 2));
    
    // Should now have presetKey and resolved imageUrl
    expect(background.presetKey).toBe('dojo-warm-lights');
    expect(background.imageUrl).toBeDefined();
    expect(background.imageUrl).toContain('unsplash.com');
  });

  it('should resolve preset keys to actual image URLs', async () => {
    const { resetKioskBackground, getLocationBackgroundWithFallback } = await import('./db');
    
    // Test dojo-warm-lights preset
    await resetKioskBackground(testLocationId, 'dojo-warm-lights');
    let background = await getLocationBackgroundWithFallback(testLocationId);
    console.log('Resolved dojo-warm-lights:', background.imageUrl);
    expect(background.imageUrl).toBeDefined();
    expect(background.imageUrl).toContain('unsplash.com');
    expect(background.presetKey).toBe('dojo-warm-lights');
    
    // Test clean-modern-gym preset
    await resetKioskBackground(testLocationId, 'clean-modern-gym');
    background = await getLocationBackgroundWithFallback(testLocationId);
    console.log('Resolved clean-modern-gym:', background.imageUrl);
    expect(background.imageUrl).toBeDefined();
    expect(background.imageUrl).toContain('unsplash.com');
    expect(background.presetKey).toBe('clean-modern-gym');
    
    // Test kids-class-bright preset
    await resetKioskBackground(testLocationId, 'kids-class-bright');
    background = await getLocationBackgroundWithFallback(testLocationId);
    console.log('Resolved kids-class-bright:', background.imageUrl);
    expect(background.imageUrl).toBeDefined();
    expect(background.imageUrl).toContain('unsplash.com');
    expect(background.presetKey).toBe('kids-class-bright');
  });

  it('should handle blur and dim updates correctly', async () => {
    const { updateKioskBackgroundEffects, getLocationBackgroundWithFallback } = await import('./db');
    
    // First set a custom background
    const { updateKioskBackgroundImage } = await import('./db');
    const customUrl = 'https://s3.example.com/effects-test-' + Date.now() + '.jpg';
    await updateKioskBackgroundImage(testLocationId, customUrl, 0, 0);

    // Now update effects
    const success = await updateKioskBackgroundEffects(testLocationId, 12, 35);
    expect(success).toBe(true);

    const background = await getLocationBackgroundWithFallback(testLocationId);
    console.log('Background with updated effects:', JSON.stringify(background, null, 2));
    
    expect(background.blur).toBe(12);
    expect(background.dim).toBe(35);
    expect(background.imageUrl).toBe(customUrl);
  });
});

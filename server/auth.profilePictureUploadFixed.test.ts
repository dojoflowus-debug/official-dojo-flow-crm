import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from './routers';
import { getDb } from './db';
import { users } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Profile Picture Upload - Fixed', () => {
  // Small 1x1 red pixel PNG
  const redPixelPNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
  const testUserId = 2580004; // Vincent Holmes

  it('should upload profile picture with full data URL', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Create caller context
    const caller = appRouter.createCaller({
      user: { id: testUserId, openId: 'test_open_id', role: 'owner' as const },
      req: {} as any,
      res: {} as any,
    });

    // Full data URL (as sent by FileReader.readAsDataURL())
    const dataUrl = `data:image/png;base64,${redPixelPNG}`;

    const result = await caller.auth.uploadProfilePicture({
      imageData: dataUrl,
      mimeType: 'image/png',
    });

    expect(result.success).toBe(true);
    expect(result.photoUrl).toBeDefined();
    expect(result.photoUrl).toContain('profile-pictures');

    // Verify database was updated
    const [updatedUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, testUserId))
      .limit(1);

    expect(updatedUser).toBeDefined();
    expect(updatedUser.photoUrl).toBe(result.photoUrl);
    expect(updatedUser.photoUrlSmall).toBe(result.photoUrl);
  }, 10000); // 10 second timeout for S3 upload
});

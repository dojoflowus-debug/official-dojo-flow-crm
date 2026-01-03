import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from './routers';
import type { Context } from './_core/context';

describe('Profile Picture Upload', () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(() => {
    const mockContext: Context = {
      user: {
        id: 1,
        openId: 'test-user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'owner',
      },
      req: {} as any,
      res: {
        cookie: () => {},
        clearCookie: () => {},
      } as any,
      currentOrganizationId: 1,
    };
    
    caller = appRouter.createCaller(mockContext);
  });

  it('should have uploadProfilePicture endpoint', () => {
    expect(caller.auth.uploadProfilePicture).toBeDefined();
  });

  it('should have deleteProfilePicture endpoint', () => {
    expect(caller.auth.deleteProfilePicture).toBeDefined();
  });

  it('should upload profile picture with valid base64 image', async () => {
    // Create a small 1x1 red PNG image in base64
    const redPixelPNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
    const base64Data = `data:image/png;base64,${redPixelPNG}`;

    const result = await caller.auth.uploadProfilePicture({
      imageData: base64Data,
      mimeType: 'image/png',
    });

    expect(result.success).toBe(true);
    expect(result.photoUrl).toBeDefined();
    expect(typeof result.photoUrl).toBe('string');
    expect(result.photoUrl).toContain('http');
  });

  it('should delete profile picture', async () => {
    const result = await caller.auth.deleteProfilePicture();

    expect(result.success).toBe(true);
  });

  it('should return user data from auth.me', async () => {
    const user = await caller.auth.me();

    expect(user).toBeDefined();
    expect(user?.id).toBeDefined();
    expect(user?.openId).toBe('test-user-123');
    // photoUrl is added dynamically by the me procedure
  });
});

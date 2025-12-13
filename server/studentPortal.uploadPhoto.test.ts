import { describe, it, expect, vi, beforeEach } from 'vitest';
import { appRouter } from './routers';
import { createContext } from './_core/context';

// Mock the storage module
vi.mock('./storage', () => ({
  storagePut: vi.fn().mockResolvedValue({
    key: 'profile-photos/test-photo.jpg',
    url: 'https://storage.example.com/profile-photos/test-photo.jpg'
  })
}));

describe('studentPortal.uploadProfilePhoto', () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const ctx = await createContext({ req: {} as any, res: {} as any });
    caller = appRouter.createCaller(ctx);
  });

  it('should successfully upload a profile photo', async () => {
    // Create a small test image as base64
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    const result = await caller.studentPortal.uploadProfilePhoto({
      imageData: testImageBase64,
      mimeType: 'image/png',
    });

    expect(result.success).toBe(true);
    expect(result.url).toBeDefined();
    expect(result.fileKey).toBeDefined();
    expect(result.fileKey).toContain('profile-photos/');
    expect(result.fileKey).toContain('.png');
  });

  it('should include student ID in file key when provided', async () => {
    const testImageBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBEQCEAwEPwAB//9k=';
    
    const result = await caller.studentPortal.uploadProfilePhoto({
      imageData: testImageBase64,
      mimeType: 'image/jpeg',
      studentId: 12345,
    });

    expect(result.success).toBe(true);
    expect(result.fileKey).toContain('student-12345');
  });

  it('should handle upload errors gracefully', async () => {
    // Override mock to simulate error
    const { storagePut } = await import('./storage');
    vi.mocked(storagePut).mockRejectedValueOnce(new Error('Storage service unavailable'));

    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    const result = await caller.studentPortal.uploadProfilePhoto({
      imageData: testImageBase64,
      mimeType: 'image/png',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

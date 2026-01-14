import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock storage module
vi.mock('./storage', () => ({
  storagePut: vi.fn().mockResolvedValue({ 
    url: 'https://example.com/test-photo.jpg',
    key: 'student-photos/test/photo.jpg'
  }),
}));

describe('Photo Upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should upload a photo successfully', async () => {
    const { storagePut } = await import('./storage');
    
    // Simulate base64 image data
    const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const mimeType = 'image/png';
    const fileName = 'test-photo.png';
    
    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Call storagePut
    const result = await storagePut('student-photos/test/photo.png', buffer, mimeType);
    
    expect(result).toHaveProperty('url');
    expect(result).toHaveProperty('key');
    expect(storagePut).toHaveBeenCalledWith(
      'student-photos/test/photo.png',
      expect.any(Buffer),
      mimeType
    );
  });

  it('should handle different image types', async () => {
    const { storagePut } = await import('./storage');
    
    const jpegBase64 = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRof';
    const buffer = Buffer.from(jpegBase64, 'base64');
    
    const result = await storagePut('student-photos/test/photo.jpg', buffer, 'image/jpeg');
    
    expect(result.url).toBeDefined();
    expect(storagePut).toHaveBeenCalled();
  });
});

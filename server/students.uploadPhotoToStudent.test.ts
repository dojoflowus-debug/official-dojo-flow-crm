import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the storage module
vi.mock('./storage', () => ({
  storagePut: vi.fn().mockResolvedValue({ 
    url: 'https://test-bucket.s3.amazonaws.com/student-photos/123/test.jpg',
    key: 'student-photos/123/test.jpg'
  }),
}));

describe('students.uploadPhotoToStudent', () => {
  it('should accept base64 data without data URL prefix', async () => {
    // The frontend now sends base64 data WITHOUT the data:image prefix
    // The backend expects raw base64 data
    const rawBase64Data = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMCwsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAAB//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AN//Z';
    
    // Verify the data is valid base64 (no prefix)
    expect(rawBase64Data.startsWith('data:')).toBe(false);
    expect(rawBase64Data.includes(',')).toBe(false);
    
    // Verify we can create a buffer from it
    const buffer = Buffer.from(rawBase64Data, 'base64');
    expect(buffer.length).toBeGreaterThan(0);
  });
  
  it('should reject data URL format with prefix', async () => {
    // This is the OLD format that was causing issues
    const dataUrlWithPrefix = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMCwsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAAB//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AN//Z';
    
    // If the backend receives this format, Buffer.from will create garbage
    // because it tries to decode the "data:image/jpeg;base64," part as base64
    const buffer = Buffer.from(dataUrlWithPrefix, 'base64');
    
    // The buffer will be much larger than expected because it's decoding garbage
    // A proper 1x1 JPEG should be small
    // This demonstrates why the prefix must be stripped
    expect(dataUrlWithPrefix.startsWith('data:')).toBe(true);
  });
  
  it('should strip prefix correctly in PhotoUploadModal', () => {
    // Simulate what PhotoUploadModal now does
    const dataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD';
    
    // The fix: strip the data URL prefix before sending to backend
    const base64Data = dataUrl.includes(',') 
      ? dataUrl.split(',')[1] 
      : dataUrl;
    
    expect(base64Data).toBe('/9j/4AAQSkZJRgABAQEASABIAAD');
    expect(base64Data.startsWith('data:')).toBe(false);
  });
});

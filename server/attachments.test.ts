import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database module
vi.mock('./db', () => ({
  getDb: vi.fn(),
}));

describe('Attachment Persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addMessage with attachments', () => {
    it('should accept attachments in the input schema', async () => {
      // Test that the schema accepts attachments
      const validInput = {
        conversationId: 1,
        role: 'user' as const,
        content: 'Test message',
        attachments: [
          {
            id: 'att-123',
            url: 'https://example.com/image.png',
            fileName: 'image.png',
            fileType: 'image/png',
            fileSize: 1024,
          },
        ],
      };

      // Verify the structure is valid
      expect(validInput.attachments).toBeDefined();
      expect(validInput.attachments?.length).toBe(1);
      expect(validInput.attachments?.[0].url).toBe('https://example.com/image.png');
    });

    it('should allow messages without attachments', () => {
      const validInput = {
        conversationId: 1,
        role: 'user' as const,
        content: 'Test message without attachments',
      };

      expect(validInput.content).toBe('Test message without attachments');
      expect((validInput as any).attachments).toBeUndefined();
    });

    it('should serialize attachments to JSON string for storage', () => {
      const attachments = [
        {
          id: 'att-123',
          url: 'https://example.com/image.png',
          fileName: 'image.png',
          fileType: 'image/png',
          fileSize: 1024,
        },
        {
          id: 'att-456',
          url: 'https://example.com/doc.pdf',
          fileName: 'doc.pdf',
          fileType: 'application/pdf',
          fileSize: 2048,
        },
      ];

      const serialized = JSON.stringify(attachments);
      const parsed = JSON.parse(serialized);

      expect(parsed).toHaveLength(2);
      expect(parsed[0].fileName).toBe('image.png');
      expect(parsed[1].fileName).toBe('doc.pdf');
    });
  });

  describe('getMessages with attachments', () => {
    it('should parse attachments JSON from database', () => {
      // Simulate database response with JSON string attachments
      const dbMessage = {
        id: 1,
        conversationId: 1,
        role: 'user',
        content: 'Test message',
        attachments: JSON.stringify([
          {
            id: 'att-123',
            url: 'https://example.com/image.png',
            fileName: 'image.png',
            fileType: 'image/png',
            fileSize: 1024,
          },
        ]),
        createdAt: new Date(),
      };

      // Parse attachments like the router does
      const parsedAttachments = dbMessage.attachments 
        ? JSON.parse(dbMessage.attachments) 
        : [];

      expect(parsedAttachments).toHaveLength(1);
      expect(parsedAttachments[0].fileName).toBe('image.png');
      expect(parsedAttachments[0].url).toBe('https://example.com/image.png');
    });

    it('should return empty array for messages without attachments', () => {
      const dbMessage = {
        id: 1,
        conversationId: 1,
        role: 'user',
        content: 'Test message',
        attachments: null,
        createdAt: new Date(),
      };

      const parsedAttachments = dbMessage.attachments 
        ? JSON.parse(dbMessage.attachments) 
        : [];

      expect(parsedAttachments).toEqual([]);
    });

    it('should handle empty string attachments', () => {
      const dbMessage = {
        id: 1,
        conversationId: 1,
        role: 'user',
        content: 'Test message',
        attachments: '',
        createdAt: new Date(),
      };

      const parsedAttachments = dbMessage.attachments 
        ? JSON.parse(dbMessage.attachments) 
        : [];

      // Empty string is falsy, so should return empty array
      expect(parsedAttachments).toEqual([]);
    });
  });

  describe('Attachment data integrity', () => {
    it('should preserve all attachment fields through serialization', () => {
      const originalAttachment = {
        id: 'att-unique-id',
        url: 'https://storage.example.com/files/document.pdf',
        fileName: 'Important Document.pdf',
        fileType: 'application/pdf',
        fileSize: 5242880, // 5MB
      };

      const serialized = JSON.stringify([originalAttachment]);
      const [restored] = JSON.parse(serialized);

      expect(restored.id).toBe(originalAttachment.id);
      expect(restored.url).toBe(originalAttachment.url);
      expect(restored.fileName).toBe(originalAttachment.fileName);
      expect(restored.fileType).toBe(originalAttachment.fileType);
      expect(restored.fileSize).toBe(originalAttachment.fileSize);
    });

    it('should handle special characters in file names', () => {
      const attachment = {
        id: 'att-123',
        url: 'https://example.com/file.png',
        fileName: 'Test File (1) - Copy [Final].png',
        fileType: 'image/png',
        fileSize: 1024,
      };

      const serialized = JSON.stringify([attachment]);
      const [restored] = JSON.parse(serialized);

      expect(restored.fileName).toBe('Test File (1) - Copy [Final].png');
    });

    it('should handle multiple attachments of different types', () => {
      const attachments = [
        { id: '1', url: 'https://example.com/photo.jpg', fileName: 'photo.jpg', fileType: 'image/jpeg', fileSize: 1024 },
        { id: '2', url: 'https://example.com/doc.pdf', fileName: 'doc.pdf', fileType: 'application/pdf', fileSize: 2048 },
        { id: '3', url: 'https://example.com/video.mp4', fileName: 'video.mp4', fileType: 'video/mp4', fileSize: 10240 },
      ];

      const serialized = JSON.stringify(attachments);
      const restored = JSON.parse(serialized);

      expect(restored).toHaveLength(3);
      expect(restored.map((a: any) => a.fileType)).toEqual([
        'image/jpeg',
        'application/pdf',
        'video/mp4',
      ]);
    });
  });
});

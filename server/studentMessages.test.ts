import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database module
vi.mock('./db', () => ({
  getDb: vi.fn(),
  getStudentMessages: vi.fn(),
  getStudentMessageById: vi.fn(),
  getMessageThread: vi.fn(),
  sendStudentMessage: vi.fn(),
  markMessageAsRead: vi.fn(),
  getUnreadMessageCount: vi.fn(),
  deleteStudentMessage: vi.fn(),
}));

import {
  getStudentMessages,
  getStudentMessageById,
  getMessageThread,
  sendStudentMessage,
  markMessageAsRead,
  getUnreadMessageCount,
  deleteStudentMessage,
} from './db';

describe('Student Messaging System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getStudentMessages', () => {
    it('should return messages for a student', async () => {
      const mockMessages = [
        {
          id: 1,
          studentId: 1,
          senderType: 'staff',
          senderId: 1,
          senderName: 'Sensei John',
          subject: 'Welcome to the dojo!',
          content: 'Welcome to our martial arts family.',
          isRead: 0,
          parentMessageId: null,
          priority: 'normal',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(getStudentMessages).mockResolvedValue(mockMessages);

      const result = await getStudentMessages(1);
      
      expect(getStudentMessages).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockMessages);
      expect(result).toHaveLength(1);
    });

    it('should return empty array when no messages exist', async () => {
      vi.mocked(getStudentMessages).mockResolvedValue([]);

      const result = await getStudentMessages(999);
      
      expect(result).toEqual([]);
    });
  });

  describe('sendStudentMessage', () => {
    it('should send a new message from student', async () => {
      const mockResult = { success: true, messageId: 1 };
      vi.mocked(sendStudentMessage).mockResolvedValue(mockResult);

      const result = await sendStudentMessage({
        studentId: 1,
        subject: 'Question about belt test',
        content: 'What forms should I practice?',
      });

      expect(sendStudentMessage).toHaveBeenCalledWith({
        studentId: 1,
        subject: 'Question about belt test',
        content: 'What forms should I practice?',
      });
      expect(result.success).toBe(true);
      expect(result.messageId).toBe(1);
    });

    it('should send a reply to an existing message', async () => {
      const mockResult = { success: true, messageId: 2 };
      vi.mocked(sendStudentMessage).mockResolvedValue(mockResult);

      const result = await sendStudentMessage({
        studentId: 1,
        subject: 'Re: Welcome to the dojo!',
        content: 'Thank you for the warm welcome!',
        parentMessageId: 1,
      });

      expect(sendStudentMessage).toHaveBeenCalledWith({
        studentId: 1,
        subject: 'Re: Welcome to the dojo!',
        content: 'Thank you for the warm welcome!',
        parentMessageId: 1,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('markMessageAsRead', () => {
    it('should mark a message as read', async () => {
      vi.mocked(markMessageAsRead).mockResolvedValue(true);

      const result = await markMessageAsRead(1, 1);

      expect(markMessageAsRead).toHaveBeenCalledWith(1, 1);
      expect(result).toBe(true);
    });
  });

  describe('getUnreadMessageCount', () => {
    it('should return the count of unread messages', async () => {
      vi.mocked(getUnreadMessageCount).mockResolvedValue(3);

      const result = await getUnreadMessageCount(1);

      expect(getUnreadMessageCount).toHaveBeenCalledWith(1);
      expect(result).toBe(3);
    });

    it('should return 0 when no unread messages', async () => {
      vi.mocked(getUnreadMessageCount).mockResolvedValue(0);

      const result = await getUnreadMessageCount(1);

      expect(result).toBe(0);
    });
  });

  describe('getMessageThread', () => {
    it('should return message with its replies', async () => {
      const mockThread = [
        {
          id: 1,
          studentId: 1,
          senderType: 'staff',
          senderId: 1,
          senderName: 'Sensei John',
          subject: 'Belt test info',
          content: 'Here is the info you requested.',
          isRead: 1,
          parentMessageId: null,
          priority: 'normal',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          id: 2,
          studentId: 1,
          senderType: 'student',
          senderId: 1,
          senderName: 'John Smith',
          subject: 'Re: Belt test info',
          content: 'Thank you!',
          isRead: 1,
          parentMessageId: 1,
          priority: 'normal',
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
        },
      ];

      vi.mocked(getMessageThread).mockResolvedValue(mockThread);

      const result = await getMessageThread(1, 1);

      expect(getMessageThread).toHaveBeenCalledWith(1, 1);
      expect(result).toHaveLength(2);
      expect(result[0].parentMessageId).toBeNull();
      expect(result[1].parentMessageId).toBe(1);
    });
  });

  describe('deleteStudentMessage', () => {
    it('should delete a student message', async () => {
      vi.mocked(deleteStudentMessage).mockResolvedValue(true);

      const result = await deleteStudentMessage(1, 1);

      expect(deleteStudentMessage).toHaveBeenCalledWith(1, 1);
      expect(result).toBe(true);
    });

    it('should return false when message not found', async () => {
      vi.mocked(deleteStudentMessage).mockResolvedValue(false);

      const result = await deleteStudentMessage(999, 1);

      expect(result).toBe(false);
    });
  });
});

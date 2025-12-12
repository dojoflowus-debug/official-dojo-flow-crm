import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('SendGrid Integration', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Set up environment variables for tests
    process.env.SENDGRID_API_KEY = 'SG.test_api_key';
    process.env.SENDGRID_FROM_EMAIL = 'noreply@dojoflow.com';
    process.env.SENDGRID_FROM_NAME = 'DojoFlow';
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['x-message-id', 'msg123']]),
        text: async () => ''
      });

      // Dynamic import to get fresh module with mocked env
      const { sendEmail } = await import('./_core/sendgrid');
      
      const result = await sendEmail({
        to: { email: 'test@example.com', name: 'Test User' },
        subject: 'Test Email',
        text: 'This is a test email from DojoFlow'
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.sendgrid.com/v3/mail/send',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
      expect(result.success).toBe(true);
    });

    it('should send HTML email', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['x-message-id', 'msg456']]),
        text: async () => ''
      });

      const { sendEmail } = await import('./_core/sendgrid');
      
      const result = await sendEmail({
        to: { email: 'test@example.com' },
        subject: 'HTML Test',
        html: '<h1>Welcome!</h1><p>This is an HTML email.</p>'
      });

      expect(result.success).toBe(true);
    });

    it('should fail without content', async () => {
      const { sendEmail } = await import('./_core/sendgrid');
      
      const result = await sendEmail({
        to: { email: 'test@example.com' },
        subject: 'No Content'
        // No text, html, or templateId
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('text, html, or templateId');
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized'
      });

      const { sendEmail } = await import('./_core/sendgrid');
      
      const result = await sendEmail({
        to: { email: 'test@example.com' },
        subject: 'Test',
        text: 'Test content'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('401');
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email with correct content', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map(),
        text: async () => ''
      });

      const { sendWelcomeEmail } = await import('./_core/sendgrid');
      
      const result = await sendWelcomeEmail(
        { email: 'student@example.com', name: 'John Doe' },
        'John',
        'Dragon Dojo'
      );

      expect(result.success).toBe(true);
      
      // Verify the email content includes the dojo name
      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.personalizations[0].subject).toContain('Dragon Dojo');
    });
  });
});

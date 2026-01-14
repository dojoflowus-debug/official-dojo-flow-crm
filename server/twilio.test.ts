import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Twilio Integration', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Set up environment variables for tests
    process.env.TWILIO_ACCOUNT_SID = 'test_account_sid';
    process.env.TWILIO_AUTH_TOKEN = 'test_auth_token';
    process.env.TWILIO_PHONE_NUMBER = '+15551234567';
  });

  describe('sendSMS', () => {
    it('should send SMS successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sid: 'SM123456789' })
      });

      // Dynamic import to get fresh module with mocked env
      const { sendSMS } = await import('./_core/twilio');
      
      const result = await sendSMS({
        to: '+15559876543',
        body: 'Test message from DojoFlow'
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('api.twilio.com'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/x-www-form-urlencoded'
          })
        })
      );
      expect(result.success).toBe(true);
      expect(result.messageId).toBe('SM123456789');
    });

    it('should handle SMS send failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Invalid phone number' })
      });

      const { sendSMS } = await import('./_core/twilio');
      
      const result = await sendSMS({
        to: 'invalid',
        body: 'Test message'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('makeCall', () => {
    it('should initiate call successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sid: 'CA123456789' })
      });

      const { makeCall } = await import('./_core/twilio');
      
      const result = await makeCall({
        to: '+15559876543',
        twiml: '<Response><Say>Hello from DojoFlow!</Say></Response>'
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(true);
      expect(result.callId).toBe('CA123456789');
    });

    it('should fail without twiml or url', async () => {
      const { makeCall } = await import('./_core/twilio');
      
      const result = await makeCall({
        to: '+15559876543'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('twiml or url');
    });
  });
});

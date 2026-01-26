/**
 * Webhook Service Tests
 * Tests for webhook payload building, signing, and delivery
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateWebhookSignature,
  buildLeadCapturePayload,
  sendWebhook,
} from './services/webhookService';

describe('Webhook Service', () => {
  describe('generateWebhookSignature', () => {
    it('should generate consistent HMAC-SHA256 signatures', () => {
      const payload = JSON.stringify({ test: 'data' });
      const secret = 'test-secret';

      const sig1 = generateWebhookSignature(payload, secret);
      const sig2 = generateWebhookSignature(payload, secret);

      expect(sig1).toBe(sig2);
      expect(sig1).toMatch(/^[a-f0-9]{64}$/); // SHA256 hex is 64 chars
    });

    it('should generate different signatures for different payloads', () => {
      const secret = 'test-secret';
      const payload1 = JSON.stringify({ test: 'data1' });
      const payload2 = JSON.stringify({ test: 'data2' });

      const sig1 = generateWebhookSignature(payload1, secret);
      const sig2 = generateWebhookSignature(payload2, secret);

      expect(sig1).not.toBe(sig2);
    });

    it('should generate different signatures for different secrets', () => {
      const payload = JSON.stringify({ test: 'data' });
      const sig1 = generateWebhookSignature(payload, 'secret1');
      const sig2 = generateWebhookSignature(payload, 'secret2');

      expect(sig1).not.toBe(sig2);
    });
  });

  describe('buildLeadCapturePayload', () => {
    it('should build a valid lead capture payload', () => {
      const leadData = {
        id: 123,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '555-0123',
        interestedProgram: 'Dragon Kids',
        ageGroup: 'child',
        locationId: 1,
        source: 'website_chat',
        status: 'New Lead',
        stage: 'new',
        leadScore: 75,
        message: 'Test lead',
      };

      const payload = buildLeadCapturePayload(leadData, 100);

      expect(payload.eventType).toBe('lead.captured');
      expect(payload.leadId).toBe(123);
      expect(payload.organizationId).toBe(100);
      expect(payload.lead.firstName).toBe('John');
      expect(payload.lead.email).toBe('john@example.com');
      expect(payload.timestamp).toBeDefined();
    });

    it('should handle missing optional fields', () => {
      const leadData = {
        id: 456,
        firstName: 'Jane',
        lastName: 'Smith',
        source: 'website_chat',
        status: 'New Lead',
        stage: 'new',
        leadScore: 50,
      };

      const payload = buildLeadCapturePayload(leadData, 200);

      expect(payload.lead.firstName).toBe('Jane');
      expect(payload.lead.email).toBeUndefined();
      expect(payload.lead.phone).toBeUndefined();
    });
  });

  describe('sendWebhook', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should send webhook with correct headers', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => 'OK',
      });

      global.fetch = mockFetch;

      const payload = {
        eventType: 'lead.captured',
        timestamp: new Date().toISOString(),
        leadId: 1,
        organizationId: 1,
        lead: {
          id: 1,
          firstName: 'Test',
          lastName: 'User',
          source: 'test',
          status: 'New Lead',
          stage: 'new',
          leadScore: 50,
        },
      };

      const result = await sendWebhook(
        'https://example.com/webhook',
        payload,
        'test-secret'
      );

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(mockFetch).toHaveBeenCalled();

      const call = mockFetch.mock.calls[0];
      const headers = call[1].headers;

      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['X-Webhook-Signature']).toBeDefined();
      expect(headers['X-Webhook-Event']).toBe('lead.captured');
    });

    it('should handle webhook delivery failure', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      global.fetch = mockFetch;

      const payload = {
        eventType: 'lead.captured',
        timestamp: new Date().toISOString(),
        leadId: 1,
        organizationId: 1,
        lead: {
          id: 1,
          firstName: 'Test',
          lastName: 'User',
          source: 'test',
          status: 'New Lead',
          stage: 'new',
          leadScore: 50,
        },
      };

      const result = await sendWebhook(
        'https://example.com/webhook',
        payload,
        'test-secret'
      );

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(500);
      expect(result.errorMessage).toBeDefined();
    });

    it('should handle network errors', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));

      global.fetch = mockFetch;

      const payload = {
        eventType: 'lead.captured',
        timestamp: new Date().toISOString(),
        leadId: 1,
        organizationId: 1,
        lead: {
          id: 1,
          firstName: 'Test',
          lastName: 'User',
          source: 'test',
          status: 'New Lead',
          stage: 'new',
          leadScore: 50,
        },
      };

      const result = await sendWebhook(
        'https://example.com/webhook',
        payload,
        'test-secret'
      );

      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('Network error');
    });

    it('should include custom headers in webhook request', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => 'OK',
      });

      global.fetch = mockFetch;

      const payload = {
        eventType: 'lead.captured',
        timestamp: new Date().toISOString(),
        leadId: 1,
        organizationId: 1,
        lead: {
          id: 1,
          firstName: 'Test',
          lastName: 'User',
          source: 'test',
          status: 'New Lead',
          stage: 'new',
          leadScore: 50,
        },
      };

      const customHeaders = {
        'X-Custom-Header': 'custom-value',
        'Authorization': 'Bearer token123',
      };

      await sendWebhook(
        'https://example.com/webhook',
        payload,
        'test-secret',
        customHeaders
      );

      const call = mockFetch.mock.calls[0];
      const headers = call[1].headers;

      expect(headers['X-Custom-Header']).toBe('custom-value');
      expect(headers['Authorization']).toBe('Bearer token123');
    });
  });
});

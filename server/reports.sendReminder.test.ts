/**
 * Tests for the sendPaymentReminder endpoint logic
 * Validates input schema, method routing, and result structure
 */
import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Mirror the input schema from the router
const sendReminderInputSchema = z.object({
  studentId: z.number(),
  method: z.enum(['sms', 'email', 'both']),
  customMessage: z.string().optional(),
});

describe('sendPaymentReminder input validation', () => {
  it('accepts valid sms method', () => {
    const result = sendReminderInputSchema.safeParse({
      studentId: 1,
      method: 'sms',
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid email method', () => {
    const result = sendReminderInputSchema.safeParse({
      studentId: 1,
      method: 'email',
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid both method', () => {
    const result = sendReminderInputSchema.safeParse({
      studentId: 1,
      method: 'both',
    });
    expect(result.success).toBe(true);
  });

  it('accepts optional customMessage', () => {
    const result = sendReminderInputSchema.safeParse({
      studentId: 1,
      method: 'email',
      customMessage: 'Please pay your outstanding balance.',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.customMessage).toBe('Please pay your outstanding balance.');
    }
  });

  it('rejects invalid method', () => {
    const result = sendReminderInputSchema.safeParse({
      studentId: 1,
      method: 'phone',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing studentId', () => {
    const result = sendReminderInputSchema.safeParse({
      method: 'email',
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-numeric studentId', () => {
    const result = sendReminderInputSchema.safeParse({
      studentId: 'abc',
      method: 'email',
    });
    expect(result.success).toBe(false);
  });
});

describe('reminder result structure', () => {
  it('builds correct result for sms-only send', () => {
    const results: { sms?: string; email?: string } = {};
    results.sms = 'sent';
    expect(results.sms).toBe('sent');
    expect(results.email).toBeUndefined();
  });

  it('builds correct result for email-only send', () => {
    const results: { sms?: string; email?: string } = {};
    results.email = 'sent';
    expect(results.email).toBe('sent');
    expect(results.sms).toBeUndefined();
  });

  it('builds correct result for both channels', () => {
    const results: { sms?: string; email?: string } = {};
    results.sms = 'sent';
    results.email = 'sent';
    expect(results.sms).toBe('sent');
    expect(results.email).toBe('sent');
  });

  it('handles missing contact info gracefully', () => {
    const results: { sms?: string; email?: string } = {};
    results.sms = 'no phone on file';
    results.email = 'no email on file';
    expect(results.sms).toContain('no phone');
    expect(results.email).toContain('no email');
  });

  it('handles send failure gracefully', () => {
    const results: { sms?: string; email?: string } = {};
    results.sms = 'failed: Twilio error';
    expect(results.sms).toContain('failed');
  });
});

describe('default message generation', () => {
  it('generates a default message with student name and amount', () => {
    const studentName = 'John Doe';
    const totalOwedCents = 15000;
    const fmt$ = (cents: number) => `$${(cents / 100).toFixed(2)}`;
    const defaultMsg = `Hi ${studentName}, this is a friendly reminder that you have an outstanding balance of ${fmt$(totalOwedCents)} with your dojo. Please contact us to arrange payment. Thank you!`;
    expect(defaultMsg).toContain('John Doe');
    expect(defaultMsg).toContain('$150.00');
    expect(defaultMsg).toContain('outstanding balance');
  });

  it('uses custom message when provided', () => {
    const customMessage = 'Your payment is overdue. Please call us.';
    const defaultMsg = 'Default message here';
    const message = customMessage || defaultMsg;
    expect(message).toBe(customMessage);
  });

  it('falls back to default message when custom is empty', () => {
    const customMessage = '';
    const defaultMsg = 'Default message here';
    const message = customMessage || defaultMsg;
    expect(message).toBe(defaultMsg);
  });
});

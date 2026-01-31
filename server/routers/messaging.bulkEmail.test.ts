import { describe, it, expect } from 'vitest';
import { sendEmail } from '../lib/sendgrid';

describe('Bulk Email Sending', () => {
  it('should send bulk emails to multiple recipients', async () => {
    const recipients = [
      {
        email: 'solbittech@gmail.com',
        name: 'Test Student 1',
      },
      {
        email: 'solbittech+test2@gmail.com',
        name: 'Test Student 2',
      },
    ];

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const recipient of recipients) {
      try {
        await sendEmail({
          to: recipient.email,
          subject: `Welcome to DojoFlow, ${recipient.name}!`,
          html: `<h1>Welcome ${recipient.name}!</h1><p>We're excited to have you at DojoFlow Academy.</p>`,
        });
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`${recipient.email}: ${error.message}`);
      }
    }

    expect(results.success).toBe(2);
    expect(results.failed).toBe(0);
    expect(results.errors.length).toBe(0);
  }, 30000); // 30 second timeout for multiple emails

  it('should handle partial failures gracefully', async () => {
    const recipients = [
      {
        email: 'solbittech@gmail.com',
        name: 'Valid Student',
      },
      {
        email: 'invalid-email',
        name: 'Invalid Student',
      },
    ];

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const recipient of recipients) {
      try {
        await sendEmail({
          to: recipient.email,
          subject: `Test Email for ${recipient.name}`,
          html: `<p>Test content for ${recipient.name}</p>`,
        });
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`${recipient.email}: ${error.message}`);
      }
    }

    expect(results.success).toBeGreaterThan(0);
    expect(results.failed).toBeGreaterThan(0);
    expect(results.errors.length).toBeGreaterThan(0);
  }, 30000);
});

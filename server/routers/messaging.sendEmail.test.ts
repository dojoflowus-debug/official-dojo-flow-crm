import { describe, it, expect } from 'vitest';
import { sendEmail, replaceTemplateVariables } from '../lib/sendgrid';

describe('SendGrid Email Sending', () => {
  it('should send a test email via SendGrid', async () => {
    const html = replaceTemplateVariables(
      '<h1>Welcome to {{school_name}}, {{student_name}}!</h1><p>Your first class is on {{date}}.</p>',
      {
        school_name: 'DojoFlow Test Academy',
        student_name: 'Test Student',
        date: '2026-02-15',
      }
    );

    await sendEmail({
      to: 'solbittech@gmail.com',
      subject: 'DojoFlow SendGrid Integration Test',
      html,
    });

    // If we reach here without throwing, the email was sent successfully
    expect(true).toBe(true);
  }, 15000); // 15 second timeout for SendGrid API

  it('should replace template variables correctly', () => {
    const template = 'Hello {{name}}, welcome to {{school}}!';
    const result = replaceTemplateVariables(template, {
      name: 'John',
      school: 'DojoFlow',
    });
    expect(result).toBe('Hello John, welcome to DojoFlow!');
  });

  it('should handle missing SendGrid API key gracefully', async () => {
    const originalKey = process.env.SENDGRID_API_KEY;
    delete process.env.SENDGRID_API_KEY;

    await expect(
      sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      })
    ).rejects.toThrow('SendGrid API key not configured');

    process.env.SENDGRID_API_KEY = originalKey;
  });
});

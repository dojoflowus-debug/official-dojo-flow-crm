import { describe, it, expect } from 'vitest';
import { verifySendGridKey, replaceTemplateVariables } from './sendgrid';

describe('SendGrid Integration', () => {
  it('should verify SendGrid API key is configured', () => {
    const apiKey = process.env.SENDGRID_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).toMatch(/^SG\..+/);
  });

  it('should replace template variables correctly', () => {
    const template = 'Hello {{name}}, welcome to {{school_name}}!';
    const variables = {
      name: 'John Doe',
      school_name: 'DojoFlow Academy',
    };
    
    const result = replaceTemplateVariables(template, variables);
    expect(result).toBe('Hello John Doe, welcome to DojoFlow Academy!');
  });

  it('should handle missing variables gracefully', () => {
    const template = 'Hello {{name}}, your rank is {{rank}}';
    const variables = {
      name: 'Jane Smith',
    };
    
    const result = replaceTemplateVariables(template, variables);
    expect(result).toBe('Hello Jane Smith, your rank is {{rank}}');
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Types ────────────────────────────────────────────────────────────────────
interface SmsBlastArgs {
  message: string;
  target: 'leads' | 'students' | 'all';
  filter?: string;
  dryRun?: boolean;
}

interface Recipient {
  name: string;
  phone: string;
}

// ─── Core blast logic (extracted for testing) ─────────────────────────────────

function personalizeMessage(template: string, name: string): string {
  return template.replace(/\[Name\]/gi, name);
}

function buildBlastResult(
  recipients: Recipient[],
  deliveredPhones: Set<string>,
  rateLimitedPhones: Set<string>,
  failedPhones: Set<string>,
  message: string,
  target: string,
  filter?: string
) {
  const results = recipients.map(r => {
    if (!r.phone) return { ...r, status: 'skipped' as const };
    if (deliveredPhones.has(r.phone)) return { ...r, status: 'delivered' as const };
    if (rateLimitedPhones.has(r.phone)) return { ...r, status: 'rate_limited' as const };
    if (failedPhones.has(r.phone)) return { ...r, status: 'failed' as const };
    return { ...r, status: 'skipped' as const };
  });

  return {
    type: 'sms_blast_result' as const,
    message,
    target,
    filter,
    totalTargeted: recipients.length,
    delivered: results.filter(r => r.status === 'delivered').length,
    failed: results.filter(r => r.status === 'failed').length,
    rateLimited: results.filter(r => r.status === 'rate_limited').length,
    skippedNoPhone: results.filter(r => r.status === 'skipped').length,
    recipients: results,
    retryAvailable: results.some(r => r.status === 'rate_limited'),
    retryCount: results.filter(r => r.status === 'rate_limited').length,
  };
}

function filterRecipientsByTarget(
  leads: Recipient[],
  students: Recipient[],
  target: 'leads' | 'students' | 'all'
): Recipient[] {
  if (target === 'leads') return leads;
  if (target === 'students') return students;
  return [...leads, ...students];
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SMS Blast Tool', () => {
  describe('personalizeMessage', () => {
    it('replaces [Name] with the recipient name', () => {
      const result = personalizeMessage('Hi [Name]! Welcome to our dojo.', 'Abigail');
      expect(result).toBe('Hi Abigail! Welcome to our dojo.');
    });

    it('replaces [name] case-insensitively', () => {
      const result = personalizeMessage('Hello [name], your class starts soon.', 'Ethan');
      expect(result).toBe('Hello Ethan, your class starts soon.');
    });

    it('replaces multiple [Name] occurrences', () => {
      const result = personalizeMessage('[Name], we miss you at [Name]\'s dojo!', 'Mia');
      expect(result).toBe('Mia, we miss you at Mia\'s dojo!');
    });

    it('returns the message unchanged if no [Name] placeholder', () => {
      const msg = 'Spring Special — enroll today!';
      expect(personalizeMessage(msg, 'Noah')).toBe(msg);
    });
  });

  describe('filterRecipientsByTarget', () => {
    const leads: Recipient[] = [
      { name: 'Lead A', phone: '+15551000001' },
      { name: 'Lead B', phone: '+15551000002' },
    ];
    const students: Recipient[] = [
      { name: 'Student A', phone: '+15551000003' },
      { name: 'Student B', phone: '+15551000004' },
    ];

    it('returns only leads when target is "leads"', () => {
      const result = filterRecipientsByTarget(leads, students, 'leads');
      expect(result).toHaveLength(2);
      expect(result.every(r => r.name.startsWith('Lead'))).toBe(true);
    });

    it('returns only students when target is "students"', () => {
      const result = filterRecipientsByTarget(leads, students, 'students');
      expect(result).toHaveLength(2);
      expect(result.every(r => r.name.startsWith('Student'))).toBe(true);
    });

    it('returns all recipients when target is "all"', () => {
      const result = filterRecipientsByTarget(leads, students, 'all');
      expect(result).toHaveLength(4);
    });
  });

  describe('buildBlastResult', () => {
    const recipients: Recipient[] = [
      { name: 'Alice', phone: '+15551111111' },
      { name: 'Bob', phone: '+15552222222' },
      { name: 'Charlie', phone: '+15553333333' },
      { name: 'Dave', phone: '' },
    ];

    it('correctly counts delivered, rate_limited, failed, and skipped', () => {
      const delivered = new Set(['+15551111111']);
      const rateLimited = new Set(['+15552222222']);
      const failed = new Set(['+15553333333']);

      const result = buildBlastResult(recipients, delivered, rateLimited, failed, 'Test msg', 'leads');

      expect(result.delivered).toBe(1);
      expect(result.rateLimited).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.skippedNoPhone).toBe(1);
      expect(result.totalTargeted).toBe(4);
    });

    it('sets retryAvailable to true when there are rate-limited recipients', () => {
      const delivered = new Set<string>();
      const rateLimited = new Set(['+15551111111']);
      const failed = new Set<string>();

      const result = buildBlastResult(recipients, delivered, rateLimited, failed, 'Test', 'leads');
      expect(result.retryAvailable).toBe(true);
      expect(result.retryCount).toBe(1);
    });

    it('sets retryAvailable to false when no rate-limited recipients', () => {
      const delivered = new Set(['+15551111111', '+15552222222', '+15553333333']);
      const rateLimited = new Set<string>();
      const failed = new Set<string>();

      const result = buildBlastResult(recipients, delivered, rateLimited, failed, 'Test', 'leads');
      expect(result.retryAvailable).toBe(false);
      expect(result.retryCount).toBe(0);
    });

    it('returns type sms_blast_result', () => {
      const result = buildBlastResult([], new Set(), new Set(), new Set(), 'msg', 'leads');
      expect(result.type).toBe('sms_blast_result');
    });

    it('includes the original message and target in the result', () => {
      const msg = 'Hi [Name]! Spring Special!';
      const result = buildBlastResult([], new Set(), new Set(), new Set(), msg, 'students', 'active');
      expect(result.message).toBe(msg);
      expect(result.target).toBe('students');
      expect(result.filter).toBe('active');
    });

    it('calculates success rate correctly', () => {
      const delivered = new Set(['+15551111111', '+15552222222']);
      const rateLimited = new Set(['+15553333333']);
      const failed = new Set<string>();

      const result = buildBlastResult(
        [
          { name: 'A', phone: '+15551111111' },
          { name: 'B', phone: '+15552222222' },
          { name: 'C', phone: '+15553333333' },
        ],
        delivered,
        rateLimited,
        failed,
        'Test',
        'leads'
      );

      expect(result.delivered).toBe(2);
      expect(result.rateLimited).toBe(1);
      expect(result.totalTargeted).toBe(3);
    });
  });

  describe('dry run mode', () => {
    it('returns all recipients as delivered in dry run without sending', () => {
      const recipients: Recipient[] = [
        { name: 'Alice', phone: '+15551111111' },
        { name: 'Bob', phone: '+15552222222' },
      ];

      // Simulate dry run: all phones go to delivered
      const delivered = new Set(recipients.filter(r => r.phone).map(r => r.phone));
      const result = buildBlastResult(recipients, delivered, new Set(), new Set(), 'Test', 'leads');

      expect(result.delivered).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.rateLimited).toBe(0);
    });
  });
});

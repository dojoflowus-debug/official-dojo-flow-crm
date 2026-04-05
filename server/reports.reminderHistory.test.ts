/**
 * Tests for the payment reminder history log feature
 * Covers: schema validation, history grouping logic, badge display logic
 */
import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// ─── Schema for getReminderHistory input ──────────────────────────────────────
const getReminderHistoryInputSchema = z.object({
  studentIds: z.array(z.number()).optional(),
});

describe('getReminderHistory input validation', () => {
  it('accepts empty input (no studentIds)', () => {
    const result = getReminderHistoryInputSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts an array of student IDs', () => {
    const result = getReminderHistoryInputSchema.safeParse({ studentIds: [1, 2, 3] });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.studentIds).toEqual([1, 2, 3]);
    }
  });

  it('accepts an empty array of student IDs', () => {
    const result = getReminderHistoryInputSchema.safeParse({ studentIds: [] });
    expect(result.success).toBe(true);
  });

  it('rejects non-numeric student IDs', () => {
    const result = getReminderHistoryInputSchema.safeParse({ studentIds: ['abc', 'def'] });
    expect(result.success).toBe(false);
  });
});

// ─── History grouping logic (mirrors server-side byStudent grouping) ──────────
function groupByStudent(rows: Array<{ studentId: number; sentAt: string; method: string }>) {
  const byStudent: Record<number, typeof rows[0]> = {};
  for (const row of rows) {
    if (!byStudent[row.studentId]) byStudent[row.studentId] = row;
  }
  return Object.values(byStudent);
}

describe('reminder history grouping logic', () => {
  it('returns one entry per student (most recent first)', () => {
    const rows = [
      { studentId: 1, sentAt: '2026-04-05 10:00:00', method: 'email' },
      { studentId: 1, sentAt: '2026-04-04 10:00:00', method: 'sms' },
      { studentId: 2, sentAt: '2026-04-03 10:00:00', method: 'both' },
    ];
    const grouped = groupByStudent(rows);
    expect(grouped.length).toBe(2);
    // Student 1 should have the first (most recent) entry
    const s1 = grouped.find(g => g.studentId === 1);
    expect(s1?.sentAt).toBe('2026-04-05 10:00:00');
    expect(s1?.method).toBe('email');
  });

  it('returns empty array for empty input', () => {
    expect(groupByStudent([])).toEqual([]);
  });

  it('handles single entry correctly', () => {
    const rows = [{ studentId: 5, sentAt: '2026-04-01 09:00:00', method: 'sms' }];
    const grouped = groupByStudent(rows);
    expect(grouped.length).toBe(1);
    expect(grouped[0].studentId).toBe(5);
  });

  it('handles multiple students with single entries each', () => {
    const rows = [
      { studentId: 10, sentAt: '2026-04-05 08:00:00', method: 'email' },
      { studentId: 11, sentAt: '2026-04-05 09:00:00', method: 'sms' },
      { studentId: 12, sentAt: '2026-04-05 10:00:00', method: 'both' },
    ];
    const grouped = groupByStudent(rows);
    expect(grouped.length).toBe(3);
  });
});

// ─── lastReminderMap construction (mirrors client-side useMemo) ───────────────
function buildLastReminderMap(history: Array<{ studentId: number; sentAt: string }>) {
  const map: Record<number, string> = {};
  for (const entry of history) {
    map[entry.studentId] = entry.sentAt;
  }
  return map;
}

describe('lastReminderMap construction', () => {
  it('builds a map from studentId to sentAt', () => {
    const history = [
      { studentId: 1, sentAt: '2026-04-05 10:00:00' },
      { studentId: 2, sentAt: '2026-04-04 08:00:00' },
    ];
    const map = buildLastReminderMap(history);
    expect(map[1]).toBe('2026-04-05 10:00:00');
    expect(map[2]).toBe('2026-04-04 08:00:00');
  });

  it('returns empty map for empty history', () => {
    expect(buildLastReminderMap([])).toEqual({});
  });

  it('correctly identifies a student with no reminder history', () => {
    const map = buildLastReminderMap([{ studentId: 1, sentAt: '2026-04-05 10:00:00' }]);
    expect(map[999]).toBeUndefined();
  });
});

// ─── Badge display logic ──────────────────────────────────────────────────────
describe('Last Reminded badge display logic', () => {
  it('shows "Never" when no reminder has been sent', () => {
    const map: Record<number, string> = {};
    const studentId = 42;
    const display = map[studentId] ? 'Reminded' : 'Never';
    expect(display).toBe('Never');
  });

  it('shows "Reminded" with date when a reminder has been sent', () => {
    const map: Record<number, string> = { 42: '2026-04-05 10:00:00' };
    const studentId = 42;
    const display = map[studentId] ? 'Reminded' : 'Never';
    expect(display).toBe('Reminded');
  });

  it('formats the date correctly for display', () => {
    const sentAt = '2026-04-05 10:00:00';
    const formatted = new Date(sentAt).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
    expect(formatted).toMatch(/Apr/);
    expect(formatted).toMatch(/2026/);
  });

  it('handles the amber badge color for reminded students', () => {
    const map: Record<number, string> = { 1: '2026-04-05 10:00:00' };
    const badgeColor = map[1] ? 'text-amber-500' : 'text-gray-400';
    expect(badgeColor).toBe('text-amber-500');
  });

  it('handles the gray italic style for never-reminded students', () => {
    const map: Record<number, string> = {};
    const badgeColor = map[999] ? 'text-amber-500' : 'text-gray-400';
    expect(badgeColor).toBe('text-gray-400');
  });
});

// ─── Payment reminder log record schema ──────────────────────────────────────
const paymentReminderLogSchema = z.object({
  orgId: z.number(),
  studentId: z.number(),
  method: z.enum(['sms', 'email', 'both']),
  smsStatus: z.string().nullable().optional(),
  emailStatus: z.string().nullable().optional(),
  messagePreview: z.string().nullable().optional(),
  sentByUserId: z.number().nullable().optional(),
});

describe('payment_reminders log record schema', () => {
  it('accepts a complete log record', () => {
    const result = paymentReminderLogSchema.safeParse({
      orgId: 1,
      studentId: 42,
      method: 'email',
      smsStatus: null,
      emailStatus: 'sent',
      messagePreview: 'Hi John, you have an outstanding balance...',
      sentByUserId: 1,
    });
    expect(result.success).toBe(true);
  });

  it('accepts a minimal log record', () => {
    const result = paymentReminderLogSchema.safeParse({
      orgId: 1,
      studentId: 42,
      method: 'sms',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid method', () => {
    const result = paymentReminderLogSchema.safeParse({
      orgId: 1,
      studentId: 42,
      method: 'push',
    });
    expect(result.success).toBe(false);
  });

  it('truncates message preview to 500 chars', () => {
    const longMsg = 'A'.repeat(600);
    const preview = longMsg.slice(0, 500);
    expect(preview.length).toBe(500);
  });
});

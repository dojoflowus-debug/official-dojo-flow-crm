import { describe, it, expect } from 'vitest';

// ─── Helpers extracted from KioskHome.tsx ────────────────────────────────────

function formatTime(t: string): string {
  if (!t) return '';
  if (t.includes(' ')) return t;
  const [h, m] = t.split(':').map(Number);
  if (isNaN(h)) return t;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function initials(name: string): string {
  return name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('KioskHome helpers', () => {
  describe('formatTime', () => {
    it('converts 24h afternoon time to 12h PM', () => {
      expect(formatTime('14:30')).toBe('2:30 PM');
    });
    it('converts 24h morning time to 12h AM', () => {
      expect(formatTime('09:00')).toBe('9:00 AM');
    });
    it('handles noon correctly', () => {
      expect(formatTime('12:00')).toBe('12:00 PM');
    });
    it('handles midnight correctly', () => {
      expect(formatTime('00:00')).toBe('12:00 AM');
    });
    it('passes through already-formatted time strings', () => {
      expect(formatTime('2:30 PM')).toBe('2:30 PM');
    });
    it('returns empty string for empty input', () => {
      expect(formatTime('')).toBe('');
    });
  });

  describe('initials', () => {
    it('extracts two initials from full name', () => {
      expect(initials('John Doe')).toBe('JD');
    });
    it('returns single initial for single name', () => {
      expect(initials('Patricia')).toBe('P');
    });
    it('handles lowercase names', () => {
      expect(initials('bosco urcuyo')).toBe('BU');
    });
    it('limits to 2 characters for multi-word names', () => {
      expect(initials('John Michael Doe')).toBe('JM');
    });
  });
});

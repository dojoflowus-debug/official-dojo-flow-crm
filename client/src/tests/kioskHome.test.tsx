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

// ─── Feature Flags Tests ──────────────────────────────────────────────────────

interface KioskFeatureFlags {
  showLockButton: boolean;
  showArcadeGames: boolean;
  showDayPass: boolean;
  showEnrollNow: boolean;
  showNewStudents: boolean;
  showClassSchedule: boolean;
  showAttendanceLeaderboard: boolean;
  showBeltPromotion: boolean;
}

const DEFAULT_FEATURE_FLAGS: KioskFeatureFlags = {
  showLockButton: true,
  showArcadeGames: true,
  showDayPass: true,
  showEnrollNow: true,
  showNewStudents: true,
  showClassSchedule: true,
  showAttendanceLeaderboard: true,
  showBeltPromotion: true,
};

function mergeWithDefaults(saved: Partial<KioskFeatureFlags>): KioskFeatureFlags {
  return { ...DEFAULT_FEATURE_FLAGS, ...saved };
}

function shouldShowActionButtons(flags: KioskFeatureFlags): boolean {
  return flags.showDayPass || flags.showEnrollNow || flags.showArcadeGames;
}

function shouldShowBottomRightPanel(flags: KioskFeatureFlags): boolean {
  return flags.showAttendanceLeaderboard || flags.showBeltPromotion;
}

describe('KioskHome feature flags', () => {
  it('defaults all flags to true', () => {
    const flags = mergeWithDefaults({});
    expect(flags.showLockButton).toBe(true);
    expect(flags.showArcadeGames).toBe(true);
    expect(flags.showDayPass).toBe(true);
    expect(flags.showEnrollNow).toBe(true);
    expect(flags.showNewStudents).toBe(true);
    expect(flags.showClassSchedule).toBe(true);
    expect(flags.showAttendanceLeaderboard).toBe(true);
    expect(flags.showBeltPromotion).toBe(true);
  });

  it('overrides individual flags from saved data', () => {
    const flags = mergeWithDefaults({ showArcadeGames: false, showDayPass: false });
    expect(flags.showArcadeGames).toBe(false);
    expect(flags.showDayPass).toBe(false);
    expect(flags.showEnrollNow).toBe(true); // unchanged
  });

  it('hides action buttons section when all three are disabled', () => {
    const flags = mergeWithDefaults({ showDayPass: false, showEnrollNow: false, showArcadeGames: false });
    expect(shouldShowActionButtons(flags)).toBe(false);
  });

  it('shows action buttons section when at least one is enabled', () => {
    const flags = mergeWithDefaults({ showDayPass: false, showEnrollNow: false, showArcadeGames: true });
    expect(shouldShowActionButtons(flags)).toBe(true);
  });

  it('hides bottom-right panel when both leaderboard and belt promotion are off', () => {
    const flags = mergeWithDefaults({ showAttendanceLeaderboard: false, showBeltPromotion: false });
    expect(shouldShowBottomRightPanel(flags)).toBe(false);
  });

  it('shows bottom-right panel when only belt promotion is on', () => {
    const flags = mergeWithDefaults({ showAttendanceLeaderboard: false, showBeltPromotion: true });
    expect(shouldShowBottomRightPanel(flags)).toBe(true);
  });

  it('handles corrupted JSON gracefully by falling back to defaults', () => {
    const savedJson = 'not-valid-json';
    let parsed: Partial<KioskFeatureFlags> = {};
    try {
      parsed = JSON.parse(savedJson);
    } catch {
      parsed = {};
    }
    const flags = mergeWithDefaults(parsed);
    expect(flags).toEqual(DEFAULT_FEATURE_FLAGS);
  });
});

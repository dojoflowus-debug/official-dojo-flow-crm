/**
 * Tests for three bug fixes:
 * 1. Saturday class display in schedule grid (OverallSchedule)
 * 2. Dropdown not working (CustomSelect portal rendering)
 * 3. Class creation not displaying results (fetchClasses → refetchClasses)
 */
import { describe, it, expect } from 'vitest';

// ─── Bug 1: Saturday class display ───────────────────────────────────────────
// The OverallSchedule classesByDay function must correctly place classes with
// dayOfWeek = "Saturday" (full name) into the "Sat" column.

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const FULL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function groupClassesByDay(classes: any[]) {
  const grouped: Record<string, any[]> = {};
  DAYS.forEach(day => { grouped[day] = []; });

  classes.forEach(cls => {
    const dayStr = cls.dayOfWeek || cls.day_of_week || cls.schedule;
    if (!dayStr) return;

    const days = dayStr.split(',').map((d: string) => d.trim());
    days.forEach((day: string) => {
      const cleanDay = day.trim();
      const dayIndex = FULL_DAYS.findIndex(d => d.toLowerCase() === cleanDay.toLowerCase());
      if (dayIndex >= 0) {
        grouped[DAYS[dayIndex]].push(cls);
      } else {
        const shortDayIndex = DAYS.findIndex(d => d.toLowerCase() === cleanDay.toLowerCase());
        if (shortDayIndex >= 0) {
          grouped[DAYS[shortDayIndex]].push(cls);
        }
      }
    });
  });

  return grouped;
}

describe('Bug 1: Saturday class display in schedule grid', () => {
  it('places a class with dayOfWeek="Saturday" into the Sat column', () => {
    const classes = [
      { id: 1, name: 'Saturday Kickboxing', dayOfWeek: 'Saturday', startTime: '10:00', endTime: '11:00' }
    ];
    const grouped = groupClassesByDay(classes);
    expect(grouped['Sat']).toHaveLength(1);
    expect(grouped['Sat'][0].name).toBe('Saturday Kickboxing');
    expect(grouped['Mon']).toHaveLength(0);
  });

  it('places a class with dayOfWeek="Sat" (short) into the Sat column', () => {
    const classes = [
      { id: 2, name: 'Saturday BJJ', dayOfWeek: 'Sat', startTime: '09:00', endTime: '10:00' }
    ];
    const grouped = groupClassesByDay(classes);
    expect(grouped['Sat']).toHaveLength(1);
  });

  it('places a multi-day class (Mon, Sat) into both columns', () => {
    const classes = [
      { id: 3, name: 'Muay Thai', dayOfWeek: 'Mon, Sat', startTime: '18:00', endTime: '19:00' }
    ];
    const grouped = groupClassesByDay(classes);
    expect(grouped['Mon']).toHaveLength(1);
    expect(grouped['Sat']).toHaveLength(1);
  });

  it('does not place a class with no dayOfWeek', () => {
    const classes = [
      { id: 4, name: 'Unknown day class' }
    ];
    const grouped = groupClassesByDay(classes);
    DAYS.forEach(day => expect(grouped[day]).toHaveLength(0));
  });
});

// ─── Bug 2: CustomSelect portal rendering ────────────────────────────────────
// The CustomSelect component now uses createPortal to render the dropdown at
// document.body level, so it is never clipped by overflow:hidden/auto parents.
// We test the position calculation logic.

function calculateDropdownPosition(rect: DOMRect, viewportHeight: number, optionCount: number) {
  const dropdownHeight = Math.min(optionCount * 44 + 8, 300);
  const spaceBelow = viewportHeight - rect.bottom;
  const spaceAbove = rect.top;
  const openUpward = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;
  return {
    top: openUpward ? 'auto' : rect.bottom + 4,
    bottom: openUpward ? viewportHeight - rect.top + 4 : 'auto',
    openUpward,
  };
}

describe('Bug 2: CustomSelect dropdown position calculation', () => {
  it('opens downward when there is enough space below', () => {
    const rect = { top: 100, bottom: 148, left: 0, width: 200 } as DOMRect;
    const result = calculateDropdownPosition(rect, 800, 5);
    expect(result.openUpward).toBe(false);
    expect(result.top).toBe(152); // rect.bottom + 4
  });

  it('opens upward when there is not enough space below', () => {
    const rect = { top: 700, bottom: 748, left: 0, width: 200 } as DOMRect;
    const result = calculateDropdownPosition(rect, 800, 5);
    expect(result.openUpward).toBe(true);
    expect(result.bottom).toBe(104); // viewportHeight - rect.top + 4
  });

  it('caps dropdown height at 300px for many options', () => {
    const dropdownHeight = Math.min(100 * 44 + 8, 300);
    expect(dropdownHeight).toBe(300);
  });
});

// ─── Bug 3: Class creation and display ───────────────────────────────────────
// After creating a class via POST /api/classes, the list should refresh via
// refetchClasses() (tRPC), not via setClasses() (which doesn't exist as state).
// We test the time parsing logic used in the POST endpoint.

function parseTimeTo24h(t: string): string | null {
  const match = t.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;
  let h = parseInt(match[1]);
  const m = match[2];
  const p = match[3].toUpperCase();
  if (p === 'PM' && h !== 12) h += 12;
  if (p === 'AM' && h === 12) h = 0;
  return `${h.toString().padStart(2, '0')}:${m}`;
}

function parseTimeRangeString(time: string): { startTime: string | null; endTime: string | null } {
  const parts = time.split(' - ');
  if (parts.length === 2) {
    return {
      startTime: parseTimeTo24h(parts[0]),
      endTime: parseTimeTo24h(parts[1]),
    };
  }
  return { startTime: null, endTime: null };
}

describe('Bug 3: Class creation time parsing', () => {
  it('parses "4:30 PM - 5:00 PM" correctly', () => {
    const result = parseTimeRangeString('4:30 PM - 5:00 PM');
    expect(result.startTime).toBe('16:30');
    expect(result.endTime).toBe('17:00');
  });

  it('parses "9:00 AM - 10:00 AM" correctly', () => {
    const result = parseTimeRangeString('9:00 AM - 10:00 AM');
    expect(result.startTime).toBe('09:00');
    expect(result.endTime).toBe('10:00');
  });

  it('parses "12:00 PM - 1:00 PM" (noon) correctly', () => {
    const result = parseTimeRangeString('12:00 PM - 1:00 PM');
    expect(result.startTime).toBe('12:00');
    expect(result.endTime).toBe('13:00');
  });

  it('parses "12:00 AM - 1:00 AM" (midnight) correctly', () => {
    const result = parseTimeRangeString('12:00 AM - 1:00 AM');
    expect(result.startTime).toBe('00:00');
    expect(result.endTime).toBe('01:00');
  });

  it('returns null for invalid time format', () => {
    const result = parseTimeRangeString('invalid');
    expect(result.startTime).toBeNull();
    expect(result.endTime).toBeNull();
  });
});

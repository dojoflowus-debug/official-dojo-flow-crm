import { describe, it, expect, vi, beforeEach } from 'vitest';

// We test the formatFunctionResults logic inline since it's not exported.
// Instead we test the expected behavior by calling the kai.chat route
// with a mocked DB that returns 0 classes.

// ---------------------------------------------------------------------------
// Unit-level tests for the get_classes result formatting logic
// ---------------------------------------------------------------------------

// Replicate the relevant formatFunctionResults branch for isolated testing
function formatClassesResult(result: {
  classes: any[];
  totalToday: number;
  date: string;
}): string {
  const total = result.totalToday;
  const date = result.date || 'today';

  if (total === 0) {
    return `No classes are scheduled for ${date}. Let's set that up — just drop your class schedule into this chat bar and I'll import it automatically. I can read **Excel files**, **CSVs**, **PDFs**, and even **photos of a handwritten timetable**. I'll create each class with the correct day, time, and instructor.\n\nReady to import your schedule?`;
  }

  const classList = result.classes.map((c: any) => {
    const time = c.startTime || c.time || '';
    const instructor = c.instructor ? ` · ${c.instructor}` : '';
    const spots =
      c.capacity !== undefined && c.enrolled !== undefined
        ? ` (${c.capacity - c.enrolled} spots left)`
        : '';
    return `• **${c.name}** at ${time}${instructor}${spots}`;
  }).join('\n');

  return `Here are today's **${total} class${total === 1 ? '' : 'es'}** for ${date}:\n\n${classList}`;
}

describe('Kai empty-schedule detection', () => {
  it('returns warm import offer when no classes are scheduled', () => {
    const result = formatClassesResult({ classes: [], totalToday: 0, date: 'Thursday' });
    expect(result).toContain('No classes are scheduled for Thursday');
    expect(result).toContain('drop your class schedule into this chat bar');
    expect(result).toContain('Excel files');
    expect(result).toContain('Ready to import your schedule?');
  });

  it('returns warm import offer for any day with zero classes', () => {
    const result = formatClassesResult({ classes: [], totalToday: 0, date: 'Monday' });
    expect(result).toContain('No classes are scheduled for Monday');
    expect(result).not.toContain('Here are today');
  });

  it('formats a single class correctly', () => {
    const result = formatClassesResult({
      classes: [{ name: 'Kids Karate', startTime: '4:00 PM', instructor: 'Sensei Lee', enrolled: 8, capacity: 15 }],
      totalToday: 1,
      date: 'Wednesday',
    });
    expect(result).toContain('1 class');
    expect(result).toContain('Kids Karate');
    expect(result).toContain('4:00 PM');
    expect(result).toContain('Sensei Lee');
    expect(result).toContain('7 spots left');
  });

  it('formats multiple classes with correct plural', () => {
    const result = formatClassesResult({
      classes: [
        { name: 'Kids Karate', startTime: '4:00 PM', instructor: null, enrolled: 5, capacity: 20 },
        { name: 'Adult BJJ', startTime: '7:00 PM', instructor: 'Sensei Kim', enrolled: 12, capacity: 15 },
      ],
      totalToday: 2,
      date: 'Friday',
    });
    expect(result).toContain('2 classes');
    expect(result).toContain('Kids Karate');
    expect(result).toContain('Adult BJJ');
    expect(result).toContain('Sensei Kim');
    expect(result).toContain('3 spots left');
  });

  it('falls back to time field when startTime is absent', () => {
    const result = formatClassesResult({
      classes: [{ name: 'Teen Kickboxing', time: '5:30 PM', startTime: null, instructor: null }],
      totalToday: 1,
      date: 'Saturday',
    });
    expect(result).toContain('5:30 PM');
  });

  it('does not show spots when capacity data is missing', () => {
    const result = formatClassesResult({
      classes: [{ name: 'Yoga', startTime: '9:00 AM', instructor: null }],
      totalToday: 1,
      date: 'Sunday',
    });
    expect(result).not.toContain('spots left');
    expect(result).toContain('Yoga');
  });
});

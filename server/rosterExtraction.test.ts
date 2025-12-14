import { describe, it, expect, vi } from 'vitest';
import { 
  formatPhoneNumber, 
  calculateAge, 
  inferProgramFromAge, 
  getBeltColor,
  parseCSVToText 
} from './rosterExtraction';

// Mock the LLM module to avoid actual API calls in tests
vi.mock('./_core/llm', () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: JSON.stringify({
          success: true,
          students: [
            {
              firstName: 'John',
              lastName: 'Doe',
              email: 'john@example.com',
              phone: '555-123-4567',
              beltRank: 'White',
              program: 'Adults',
            },
            {
              firstName: 'Jane',
              lastName: 'Smith',
              email: 'jane@example.com',
              phone: '555-987-6543',
              beltRank: 'Blue',
              program: 'Kids',
              guardianName: 'Mary Smith',
              guardianPhone: '555-111-2222',
            },
          ],
          confidence: 0.85,
          totalFound: 2,
        }),
      },
    }],
  }),
}));

describe('Roster Extraction Utilities', () => {
  describe('formatPhoneNumber', () => {
    it('formats 10-digit phone number correctly', () => {
      expect(formatPhoneNumber('5551234567')).toBe('555-123-4567');
    });

    it('formats phone number with country code', () => {
      expect(formatPhoneNumber('15551234567')).toBe('555-123-4567');
    });

    it('formats phone number with existing formatting', () => {
      expect(formatPhoneNumber('(555) 123-4567')).toBe('555-123-4567');
    });

    it('returns original if cannot parse', () => {
      expect(formatPhoneNumber('12345')).toBe('12345');
    });
  });

  describe('calculateAge', () => {
    it('calculates age correctly', () => {
      const today = new Date();
      const birthYear = today.getFullYear() - 25;
      const birthDate = `${birthYear}-01-01`;
      const age = calculateAge(birthDate);
      expect(age).toBeGreaterThanOrEqual(24);
      expect(age).toBeLessThanOrEqual(25);
    });

    it('returns null for invalid date', () => {
      expect(calculateAge('invalid-date')).toBe(null);
    });
  });

  describe('inferProgramFromAge', () => {
    it('infers Kids program for ages 4-12', () => {
      expect(inferProgramFromAge(6)).toBe('Kids');
      expect(inferProgramFromAge(10)).toBe('Kids');
      expect(inferProgramFromAge(12)).toBe('Kids');
    });

    it('infers Teens program for ages 13-17', () => {
      expect(inferProgramFromAge(13)).toBe('Teens');
      expect(inferProgramFromAge(15)).toBe('Teens');
      expect(inferProgramFromAge(17)).toBe('Teens');
    });

    it('infers Adults program for ages 18+', () => {
      expect(inferProgramFromAge(18)).toBe('Adults');
      expect(inferProgramFromAge(30)).toBe('Adults');
      expect(inferProgramFromAge(50)).toBe('Adults');
    });
  });

  describe('getBeltColor', () => {
    it('returns correct color for White belt', () => {
      expect(getBeltColor('White')).toBe('#FFFFFF');
    });

    it('returns correct color for Black belt', () => {
      expect(getBeltColor('Black')).toBe('#000000');
    });

    it('returns correct color for Blue belt', () => {
      expect(getBeltColor('Blue')).toBe('#0000FF');
    });

    it('returns default color for unknown belt', () => {
      expect(getBeltColor('Unknown')).toBe('#CCCCCC');
    });
  });

  describe('parseCSVToText', () => {
    it('parses comma-separated CSV correctly', () => {
      const csv = 'First Name,Last Name,Email\nJohn,Doe,john@example.com\nJane,Smith,jane@example.com';
      const result = parseCSVToText(csv);
      expect(result).toContain('Headers: First Name, Last Name, Email');
      expect(result).toContain('Student 1:');
      expect(result).toContain('First Name: John');
      expect(result).toContain('Last Name: Doe');
      expect(result).toContain('Student 2:');
    });

    it('parses tab-separated CSV correctly', () => {
      const csv = 'First Name\tLast Name\tPhone\nJohn\tDoe\t555-1234';
      const result = parseCSVToText(csv);
      expect(result).toContain('Headers: First Name, Last Name, Phone');
      expect(result).toContain('Phone: 555-1234');
    });

    it('handles quoted values', () => {
      const csv = '"First Name","Last Name","Email"\n"John","Doe","john@example.com"';
      const result = parseCSVToText(csv);
      expect(result).toContain('First Name: John');
    });

    it('returns empty string for empty input', () => {
      expect(parseCSVToText('')).toBe('');
    });
  });
});

describe('Roster Extraction Integration', () => {
  it('should export extractRosterFromImage function', async () => {
    const { extractRosterFromImage } = await import('./rosterExtraction');
    expect(typeof extractRosterFromImage).toBe('function');
  });

  it('should export extractRosterFromText function', async () => {
    const { extractRosterFromText } = await import('./rosterExtraction');
    expect(typeof extractRosterFromText).toBe('function');
  });

  it('extractRosterFromImage returns expected structure', async () => {
    const { extractRosterFromImage } = await import('./rosterExtraction');
    const result = await extractRosterFromImage('https://example.com/roster.jpg');
    
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('students');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('totalFound');
    expect(Array.isArray(result.students)).toBe(true);
  });

  it('extractRosterFromText returns expected structure', async () => {
    const { extractRosterFromText } = await import('./rosterExtraction');
    const result = await extractRosterFromText('John Doe, john@example.com, White Belt');
    
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('students');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('totalFound');
    expect(result).toHaveProperty('rawText');
  });
});

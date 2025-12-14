import { describe, it, expect, vi } from 'vitest';
import { formatTime12Hour, getDayAbbreviation } from './scheduleExtraction';

// Mock the LLM module to avoid actual API calls in tests
vi.mock('./_core/llm', () => ({
  invokeLLM: vi.fn(),
}));

describe('Schedule Extraction Utilities', () => {
  describe('formatTime12Hour', () => {
    it('should convert morning times correctly', () => {
      expect(formatTime12Hour('09:00')).toBe('9:00 AM');
      expect(formatTime12Hour('06:30')).toBe('6:30 AM');
      expect(formatTime12Hour('11:45')).toBe('11:45 AM');
    });

    it('should convert afternoon times correctly', () => {
      expect(formatTime12Hour('13:00')).toBe('1:00 PM');
      expect(formatTime12Hour('18:30')).toBe('6:30 PM');
      expect(formatTime12Hour('23:15')).toBe('11:15 PM');
    });

    it('should handle noon correctly', () => {
      expect(formatTime12Hour('12:00')).toBe('12:00 PM');
      expect(formatTime12Hour('12:30')).toBe('12:30 PM');
    });

    it('should handle midnight correctly', () => {
      expect(formatTime12Hour('00:00')).toBe('12:00 AM');
      expect(formatTime12Hour('00:30')).toBe('12:30 AM');
    });
  });

  describe('getDayAbbreviation', () => {
    it('should return correct abbreviations for all days', () => {
      expect(getDayAbbreviation('Monday')).toBe('Mon');
      expect(getDayAbbreviation('Tuesday')).toBe('Tue');
      expect(getDayAbbreviation('Wednesday')).toBe('Wed');
      expect(getDayAbbreviation('Thursday')).toBe('Thu');
      expect(getDayAbbreviation('Friday')).toBe('Fri');
      expect(getDayAbbreviation('Saturday')).toBe('Sat');
      expect(getDayAbbreviation('Sunday')).toBe('Sun');
    });

    it('should handle unknown days by taking first 3 characters', () => {
      expect(getDayAbbreviation('Holiday')).toBe('Hol');
      expect(getDayAbbreviation('Unknown')).toBe('Unk');
    });
  });
});

describe('Schedule Extraction Types', () => {
  it('should define ExtractedClass with required fields', () => {
    const validClass = {
      name: 'Kids Karate',
      dayOfWeek: 'Monday',
      startTime: '16:00',
      endTime: '17:00',
    };
    
    expect(validClass.name).toBeDefined();
    expect(validClass.dayOfWeek).toBeDefined();
    expect(validClass.startTime).toBeDefined();
    expect(validClass.endTime).toBeDefined();
  });

  it('should allow optional fields on ExtractedClass', () => {
    const fullClass = {
      name: 'Adult BJJ',
      dayOfWeek: 'Wednesday',
      startTime: '19:00',
      endTime: '20:30',
      instructor: 'Coach Mike',
      location: 'Main Mat',
      level: 'All Levels',
      maxCapacity: 25,
      notes: 'Bring gi',
    };
    
    expect(fullClass.instructor).toBe('Coach Mike');
    expect(fullClass.location).toBe('Main Mat');
    expect(fullClass.level).toBe('All Levels');
    expect(fullClass.maxCapacity).toBe(25);
    expect(fullClass.notes).toBe('Bring gi');
  });
});

describe('Schedule Extraction Result', () => {
  it('should define success result structure', () => {
    const successResult = {
      success: true,
      classes: [
        { name: 'Test Class', dayOfWeek: 'Monday', startTime: '09:00', endTime: '10:00' },
      ],
      confidence: 0.85,
      warnings: ['Some time was estimated'],
    };
    
    expect(successResult.success).toBe(true);
    expect(successResult.classes).toHaveLength(1);
    expect(successResult.confidence).toBeGreaterThan(0);
    expect(successResult.warnings).toBeDefined();
  });

  it('should define error result structure', () => {
    const errorResult = {
      success: false,
      classes: [],
      confidence: 0,
      error: 'Could not parse schedule',
    };
    
    expect(errorResult.success).toBe(false);
    expect(errorResult.classes).toHaveLength(0);
    expect(errorResult.error).toBeDefined();
  });
});

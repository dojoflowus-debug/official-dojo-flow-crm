import { describe, it, expect } from 'vitest';
import { 
  formatPhoneNumber, 
  extractDigits, 
  isValidPhoneNumber, 
  getPhoneValidationMessage,
  normalizePhoneForStorage 
} from './phoneUtils';

describe('phoneUtils', () => {
  describe('formatPhoneNumber', () => {
    it('should format empty string', () => {
      expect(formatPhoneNumber('')).toBe('');
    });

    it('should format 3 digits', () => {
      expect(formatPhoneNumber('555')).toBe('(555');
    });

    it('should format 6 digits', () => {
      expect(formatPhoneNumber('555123')).toBe('(555) 123');
    });

    it('should format 10 digits', () => {
      expect(formatPhoneNumber('5551234567')).toBe('(555) 123-4567');
    });

    it('should strip non-digit characters', () => {
      expect(formatPhoneNumber('(555) 123-4567')).toBe('(555) 123-4567');
    });

    it('should limit to 10 digits', () => {
      expect(formatPhoneNumber('55512345678901')).toBe('(555) 123-4567');
    });
  });

  describe('extractDigits', () => {
    it('should extract digits from formatted number', () => {
      expect(extractDigits('(555) 123-4567')).toBe('5551234567');
    });

    it('should return empty string for empty input', () => {
      expect(extractDigits('')).toBe('');
    });

    it('should handle mixed input', () => {
      expect(extractDigits('abc123def456')).toBe('123456');
    });
  });

  describe('isValidPhoneNumber', () => {
    it('should return true for 10-digit number', () => {
      expect(isValidPhoneNumber('(555) 123-4567')).toBe(true);
    });

    it('should return false for partial number', () => {
      expect(isValidPhoneNumber('(555) 123')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidPhoneNumber('')).toBe(false);
    });
  });

  describe('getPhoneValidationMessage', () => {
    it('should return null for empty string', () => {
      expect(getPhoneValidationMessage('')).toBe(null);
    });

    it('should return null for valid 10-digit number', () => {
      expect(getPhoneValidationMessage('(555) 123-4567')).toBe(null);
    });

    it('should return message for partial number', () => {
      const msg = getPhoneValidationMessage('(555) 123');
      expect(msg).toContain('more digit');
    });
  });

  describe('normalizePhoneForStorage', () => {
    it('should format valid number for storage', () => {
      expect(normalizePhoneForStorage('5551234567')).toBe('(555) 123-4567');
    });

    it('should return as-is if not valid', () => {
      expect(normalizePhoneForStorage('555')).toBe('555');
    });
  });
});

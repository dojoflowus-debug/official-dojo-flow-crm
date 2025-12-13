import { describe, it, expect } from 'vitest';

// Guardian validation logic (server-side copy for testing)
function validateGuardianRequirement(
  age: number,
  guardianName: string | undefined,
  guardianPhone: string | undefined
): { valid: boolean; error?: string } {
  const isMinor = age < 18;
  
  if (isMinor) {
    if (!guardianName || !guardianName.trim()) {
      return { valid: false, error: 'Parent/Guardian name is required for students under 18' };
    }
    if (!guardianPhone || !guardianPhone.trim()) {
      return { valid: false, error: 'Parent/Guardian phone is required for students under 18' };
    }
  }
  
  return { valid: true };
}

describe('Guardian Validation', () => {
  describe('Minor students (under 18)', () => {
    it('should require guardian name for 10-year-old', () => {
      const result = validateGuardianRequirement(10, undefined, '(555) 123-4567');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('name is required');
    });

    it('should require guardian phone for 15-year-old', () => {
      const result = validateGuardianRequirement(15, 'John Doe', undefined);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('phone is required');
    });

    it('should reject empty guardian name for 17-year-old', () => {
      const result = validateGuardianRequirement(17, '   ', '(555) 123-4567');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('name is required');
    });

    it('should reject empty guardian phone for minor', () => {
      const result = validateGuardianRequirement(12, 'Jane Doe', '   ');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('phone is required');
    });

    it('should accept valid guardian info for 8-year-old', () => {
      const result = validateGuardianRequirement(8, 'Parent Name', '(555) 123-4567');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid guardian info for 17-year-old', () => {
      const result = validateGuardianRequirement(17, 'Guardian Name', '(555) 987-6543');
      expect(result.valid).toBe(true);
    });
  });

  describe('Adult students (18+)', () => {
    it('should not require guardian for 18-year-old', () => {
      const result = validateGuardianRequirement(18, undefined, undefined);
      expect(result.valid).toBe(true);
    });

    it('should not require guardian for 25-year-old', () => {
      const result = validateGuardianRequirement(25, undefined, undefined);
      expect(result.valid).toBe(true);
    });

    it('should not require guardian for 50-year-old', () => {
      const result = validateGuardianRequirement(50, '', '');
      expect(result.valid).toBe(true);
    });

    it('should accept optional guardian info for adult', () => {
      const result = validateGuardianRequirement(30, 'Emergency Contact', '(555) 111-2222');
      expect(result.valid).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should require guardian for exactly 17 years old', () => {
      const result = validateGuardianRequirement(17, undefined, undefined);
      expect(result.valid).toBe(false);
    });

    it('should not require guardian for exactly 18 years old', () => {
      const result = validateGuardianRequirement(18, undefined, undefined);
      expect(result.valid).toBe(true);
    });

    it('should require guardian for 4-year-old (minimum age)', () => {
      const result = validateGuardianRequirement(4, undefined, undefined);
      expect(result.valid).toBe(false);
    });
  });
});

import { describe, it, expect } from 'vitest';

// Age validation utilities (server-side copy for testing)
const PROGRAM_AGE_RANGES = {
  kids: { min: 4, max: 12, label: 'Kids (4-12 years)' },
  teens: { min: 13, max: 17, label: 'Teens (13-17 years)' },
  adults: { min: 18, max: 120, label: 'Adults (18+ years)' },
} as const;

type ProgramType = keyof typeof PROGRAM_AGE_RANGES;

function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  
  if (isNaN(birthDate.getTime())) {
    return -1;
  }
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

function getRecommendedProgram(age: number): ProgramType | null {
  if (age < 0) return null;
  
  if (age >= PROGRAM_AGE_RANGES.kids.min && age <= PROGRAM_AGE_RANGES.kids.max) {
    return 'kids';
  }
  if (age >= PROGRAM_AGE_RANGES.teens.min && age <= PROGRAM_AGE_RANGES.teens.max) {
    return 'teens';
  }
  if (age >= PROGRAM_AGE_RANGES.adults.min) {
    return 'adults';
  }
  
  return null;
}

function isAgeValidForProgram(age: number, program: ProgramType): boolean {
  const range = PROGRAM_AGE_RANGES[program];
  return age >= range.min && age <= range.max;
}

describe('Age Validation Utilities', () => {
  describe('calculateAge', () => {
    it('should return -1 for invalid date', () => {
      expect(calculateAge('invalid')).toBe(-1);
    });

    it('should calculate age correctly for past date', () => {
      const tenYearsAgo = new Date();
      tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
      const dob = tenYearsAgo.toISOString().split('T')[0];
      expect(calculateAge(dob)).toBe(10);
    });

    it('should handle birthday not yet occurred this year', () => {
      const today = new Date();
      const futureMonth = new Date();
      futureMonth.setFullYear(futureMonth.getFullYear() - 10);
      futureMonth.setMonth(today.getMonth() + 1);
      const dob = futureMonth.toISOString().split('T')[0];
      expect(calculateAge(dob)).toBe(9);
    });
  });

  describe('getRecommendedProgram', () => {
    it('should return null for negative age', () => {
      expect(getRecommendedProgram(-1)).toBe(null);
    });

    it('should return null for age below minimum', () => {
      expect(getRecommendedProgram(3)).toBe(null);
    });

    it('should return kids for ages 4-12', () => {
      expect(getRecommendedProgram(4)).toBe('kids');
      expect(getRecommendedProgram(8)).toBe('kids');
      expect(getRecommendedProgram(12)).toBe('kids');
    });

    it('should return teens for ages 13-17', () => {
      expect(getRecommendedProgram(13)).toBe('teens');
      expect(getRecommendedProgram(15)).toBe('teens');
      expect(getRecommendedProgram(17)).toBe('teens');
    });

    it('should return adults for ages 18+', () => {
      expect(getRecommendedProgram(18)).toBe('adults');
      expect(getRecommendedProgram(30)).toBe('adults');
      expect(getRecommendedProgram(65)).toBe('adults');
    });
  });

  describe('isAgeValidForProgram', () => {
    it('should validate kids program correctly', () => {
      expect(isAgeValidForProgram(4, 'kids')).toBe(true);
      expect(isAgeValidForProgram(12, 'kids')).toBe(true);
      expect(isAgeValidForProgram(3, 'kids')).toBe(false);
      expect(isAgeValidForProgram(13, 'kids')).toBe(false);
    });

    it('should validate teens program correctly', () => {
      expect(isAgeValidForProgram(13, 'teens')).toBe(true);
      expect(isAgeValidForProgram(17, 'teens')).toBe(true);
      expect(isAgeValidForProgram(12, 'teens')).toBe(false);
      expect(isAgeValidForProgram(18, 'teens')).toBe(false);
    });

    it('should validate adults program correctly', () => {
      expect(isAgeValidForProgram(18, 'adults')).toBe(true);
      expect(isAgeValidForProgram(50, 'adults')).toBe(true);
      expect(isAgeValidForProgram(17, 'adults')).toBe(false);
    });
  });

  describe('PROGRAM_AGE_RANGES', () => {
    it('should have correct ranges defined', () => {
      expect(PROGRAM_AGE_RANGES.kids.min).toBe(4);
      expect(PROGRAM_AGE_RANGES.kids.max).toBe(12);
      expect(PROGRAM_AGE_RANGES.teens.min).toBe(13);
      expect(PROGRAM_AGE_RANGES.teens.max).toBe(17);
      expect(PROGRAM_AGE_RANGES.adults.min).toBe(18);
    });

    it('should have no gaps between programs', () => {
      expect(PROGRAM_AGE_RANGES.teens.min).toBe(PROGRAM_AGE_RANGES.kids.max + 1);
      expect(PROGRAM_AGE_RANGES.adults.min).toBe(PROGRAM_AGE_RANGES.teens.max + 1);
    });
  });
});

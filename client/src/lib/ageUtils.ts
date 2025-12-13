/**
 * Age validation utilities for martial arts programs
 * Defines program-specific age requirements and validation
 */

// Program age ranges
export const PROGRAM_AGE_RANGES = {
  kids: { min: 4, max: 12, label: 'Kids (4-12 years)' },
  teens: { min: 13, max: 17, label: 'Teens (13-17 years)' },
  adults: { min: 18, max: 120, label: 'Adults (18+ years)' },
} as const;

export type ProgramType = keyof typeof PROGRAM_AGE_RANGES;

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  
  if (isNaN(birthDate.getTime())) {
    return -1; // Invalid date
  }
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  // Adjust age if birthday hasn't occurred this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Get the recommended program based on age
 */
export function getRecommendedProgram(age: number): ProgramType | null {
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
  
  return null; // Too young
}

/**
 * Check if age is valid for a specific program
 */
export function isAgeValidForProgram(age: number, program: ProgramType): boolean {
  const range = PROGRAM_AGE_RANGES[program];
  return age >= range.min && age <= range.max;
}

/**
 * Get validation message for age/program mismatch
 */
export function getAgeValidationMessage(dateOfBirth: string, program: ProgramType): string | null {
  if (!dateOfBirth) {
    return null; // Empty is allowed until form submission
  }
  
  const age = calculateAge(dateOfBirth);
  
  if (age < 0) {
    return 'Please enter a valid date of birth';
  }
  
  if (age < PROGRAM_AGE_RANGES.kids.min) {
    return `Students must be at least ${PROGRAM_AGE_RANGES.kids.min} years old to enroll`;
  }
  
  if (!isAgeValidForProgram(age, program)) {
    const range = PROGRAM_AGE_RANGES[program];
    const recommended = getRecommendedProgram(age);
    
    if (recommended) {
      return `Age ${age} is outside the ${program} program range (${range.min}-${range.max}). Consider the ${PROGRAM_AGE_RANGES[recommended].label} program.`;
    }
    
    return `Age ${age} is outside the ${program} program range (${range.min}-${range.max})`;
  }
  
  return null; // Valid
}

/**
 * Get minimum date for date picker (max age 120)
 */
export function getMinBirthDate(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 120);
  return date.toISOString().split('T')[0];
}

/**
 * Get maximum date for date picker (min age 4)
 */
export function getMaxBirthDate(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() - PROGRAM_AGE_RANGES.kids.min);
  return date.toISOString().split('T')[0];
}

/**
 * Format age display string
 */
export function formatAgeDisplay(age: number): string {
  if (age < 0) return '';
  if (age === 1) return '1 year old';
  return `${age} years old`;
}

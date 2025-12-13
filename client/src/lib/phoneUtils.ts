/**
 * Phone number formatting utilities
 * Ensures consistent phone number format: (XXX) XXX-XXXX
 */

/**
 * Format a phone number string as (XXX) XXX-XXXX
 * Handles partial input for live formatting while typing
 */
export function formatPhoneNumber(value: string): string {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');
  
  // Limit to 10 digits (US phone number)
  const limited = digits.slice(0, 10);
  
  // Format based on number of digits
  if (limited.length === 0) {
    return '';
  } else if (limited.length <= 3) {
    return `(${limited}`;
  } else if (limited.length <= 6) {
    return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
  } else {
    return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
  }
}

/**
 * Extract only digits from a phone number string
 * Used for storage and comparison
 */
export function extractDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Validate if a phone number has exactly 10 digits
 */
export function isValidPhoneNumber(value: string): boolean {
  const digits = extractDigits(value);
  return digits.length === 10;
}

/**
 * Check if a phone number is partially valid (for live validation)
 * Returns true if empty or has valid partial format
 */
export function isPartiallyValidPhone(value: string): boolean {
  const digits = extractDigits(value);
  return digits.length <= 10;
}

/**
 * Get validation message for phone number
 */
export function getPhoneValidationMessage(value: string): string | null {
  if (!value || value.trim() === '') {
    return null; // Empty is allowed (optional field)
  }
  
  const digits = extractDigits(value);
  
  if (digits.length === 0) {
    return null; // Cleared field
  }
  
  if (digits.length < 10) {
    return `Phone number needs ${10 - digits.length} more digit${10 - digits.length > 1 ? 's' : ''}`;
  }
  
  if (digits.length > 10) {
    return 'Phone number is too long';
  }
  
  return null; // Valid
}

/**
 * Normalize phone number for storage
 * Stores as formatted string: (XXX) XXX-XXXX
 */
export function normalizePhoneForStorage(value: string): string {
  const digits = extractDigits(value);
  if (digits.length !== 10) {
    return value; // Return as-is if not valid
  }
  return formatPhoneNumber(digits);
}

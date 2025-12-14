import { describe, it, expect } from 'vitest';
import { 
  detectStructuredData, 
  looksLikeStructuredData 
} from '../client/src/lib/structuredDataDetection';

describe('Structured Data Detection', () => {
  describe('looksLikeStructuredData', () => {
    it('returns false for empty string', () => {
      expect(looksLikeStructuredData('')).toBe(false);
    });

    it('returns false for single line', () => {
      expect(looksLikeStructuredData('Hello world')).toBe(false);
    });

    it('returns true for comma-separated data', () => {
      const data = 'Name,Email,Phone\nJohn Doe,john@example.com,555-1234';
      expect(looksLikeStructuredData(data)).toBe(true);
    });

    it('returns true for tab-separated data', () => {
      const data = 'Name\tEmail\tPhone\nJohn Doe\tjohn@example.com\t555-1234';
      expect(looksLikeStructuredData(data)).toBe(true);
    });

    it('returns false for regular paragraph text', () => {
      const text = 'This is a paragraph.\nThis is another paragraph.';
      expect(looksLikeStructuredData(text)).toBe(false);
    });
  });

  describe('detectStructuredData', () => {
    it('returns null for empty string', () => {
      expect(detectStructuredData('')).toBe(null);
    });

    it('returns null for single line', () => {
      expect(detectStructuredData('Just a single line')).toBe(null);
    });

    it('detects student roster from CSV', () => {
      const csv = 'First Name,Last Name,Email,Belt\nJohn,Doe,john@example.com,White\nJane,Smith,jane@example.com,Blue';
      const result = detectStructuredData(csv);
      
      expect(result).not.toBe(null);
      expect(result?.type).toBe('student_roster');
      expect(result?.rows.length).toBe(2);
      expect(result?.headers).toContain('First Name');
      expect(result?.headers).toContain('Email');
    });

    it('detects student roster from tab-separated data', () => {
      const tsv = 'Name\tPhone\tBelt Rank\nJohn Doe\t555-1234\tWhite\nJane Smith\t555-5678\tBlue';
      const result = detectStructuredData(tsv);
      
      expect(result).not.toBe(null);
      expect(result?.type).toBe('student_roster');
      expect(result?.rows.length).toBe(2);
    });

    it('extracts correct row data', () => {
      const csv = 'First Name,Last Name,Email\nJohn,Doe,john@example.com';
      const result = detectStructuredData(csv);
      
      expect(result?.rows[0]['First Name']).toBe('John');
      expect(result?.rows[0]['Last Name']).toBe('Doe');
      expect(result?.rows[0]['Email']).toBe('john@example.com');
    });

    it('handles quoted values', () => {
      const csv = '"First Name","Last Name","Email"\n"John","Doe","john@example.com"';
      const result = detectStructuredData(csv);
      
      expect(result?.rows[0]['First Name']).toBe('John');
    });

    it('generates appropriate summary', () => {
      const csv = 'First Name,Last Name,Email\nJohn,Doe,john@example.com\nJane,Smith,jane@example.com';
      const result = detectStructuredData(csv);
      
      expect(result?.summary).toContain('student roster');
      expect(result?.summary).toContain('2 entries');
    });

    it('has confidence score', () => {
      const csv = 'First Name,Last Name,Email,Belt\nJohn,Doe,john@example.com,White';
      const result = detectStructuredData(csv);
      
      expect(result?.confidence).toBeGreaterThan(0);
      expect(result?.confidence).toBeLessThanOrEqual(1);
    });

    it('detects class schedule type', () => {
      const csv = 'Class,Day,Time,Instructor\nKids BJJ,Monday,4:00 PM,John';
      const result = detectStructuredData(csv);
      
      expect(result?.type).toBe('class_schedule');
    });

    it('detects lead list type', () => {
      const csv = 'Lead Name,Source,Status,Interest\nJohn Doe,Website,New,Kids Program';
      const result = detectStructuredData(csv);
      
      expect(result?.type).toBe('lead_list');
    });
  });
});

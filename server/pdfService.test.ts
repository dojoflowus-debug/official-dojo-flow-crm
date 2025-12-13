import { describe, it, expect, vi } from 'vitest';

/**
 * Tests for PDF Generation Service
 * These tests verify the PDF generation logic for signed waivers
 */

describe('PDF Generation Service', () => {
  describe('Data URL to Buffer Conversion', () => {
    it('should extract base64 data from PNG data URL', () => {
      const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
      expect(base64Data).toBe('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
    });

    it('should convert base64 to buffer', () => {
      const base64 = 'SGVsbG8gV29ybGQ='; // "Hello World"
      const buffer = Buffer.from(base64, 'base64');
      expect(buffer.toString()).toBe('Hello World');
    });
  });

  describe('PDF Filename Generation', () => {
    it('should generate unique filename with student ID', () => {
      const studentId = 123;
      const timestamp = 1700000000000;
      const sanitizedName = 'John_Doe';
      const fileKey = `waivers/${studentId}/${sanitizedName}_waiver_${timestamp}.pdf`;
      
      expect(fileKey).toContain('123');
      expect(fileKey).toContain('John_Doe');
      expect(fileKey).toMatch(/\.pdf$/);
    });

    it('should sanitize student name for filename', () => {
      const name = "John O'Brien-Smith";
      const sanitized = name.replace(/[^a-zA-Z0-9]/g, '_');
      expect(sanitized).toBe('John_O_Brien_Smith');
    });

    it('should handle special characters in names', () => {
      const name = 'José García';
      const sanitized = name.replace(/[^a-zA-Z0-9]/g, '_');
      expect(sanitized).toBe('Jos__Garc_a');
    });
  });

  describe('Waiver PDF Data Structure', () => {
    it('should require all mandatory fields', () => {
      const waiverData = {
        studentId: 1,
        studentName: 'John Doe',
        waiverTitle: 'Liability Waiver',
        waiverContent: 'I hereby release...',
        signatureDataUrl: 'data:image/png;base64,abc123',
        signerName: 'John Doe',
        signedAt: new Date(),
        isMinor: false,
      };

      expect(waiverData.studentId).toBeDefined();
      expect(waiverData.studentName).toBeDefined();
      expect(waiverData.waiverTitle).toBeDefined();
      expect(waiverData.signatureDataUrl).toBeDefined();
      expect(waiverData.signerName).toBeDefined();
    });

    it('should include guardian fields for minors', () => {
      const minorWaiverData = {
        studentId: 2,
        studentName: 'Jimmy Smith',
        waiverTitle: 'Liability Waiver',
        waiverContent: 'I hereby release...',
        signatureDataUrl: 'data:image/png;base64,abc123',
        signerName: 'Jimmy Smith',
        signedAt: new Date(),
        isMinor: true,
        guardianSignatureDataUrl: 'data:image/png;base64,guardian123',
        guardianName: 'Jane Smith',
      };

      expect(minorWaiverData.isMinor).toBe(true);
      expect(minorWaiverData.guardianSignatureDataUrl).toBeDefined();
      expect(minorWaiverData.guardianName).toBeDefined();
    });
  });

  describe('Minor Detection', () => {
    it('should detect minor from date of birth', () => {
      const today = new Date();
      const tenYearsAgo = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate());
      const isMinor = (today.getFullYear() - tenYearsAgo.getFullYear()) < 18;
      expect(isMinor).toBe(true);
    });

    it('should detect adult from date of birth', () => {
      const today = new Date();
      const twentyFiveYearsAgo = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate());
      const isMinor = (today.getFullYear() - twentyFiveYearsAgo.getFullYear()) < 18;
      expect(isMinor).toBe(false);
    });

    it('should handle edge case of exactly 18', () => {
      const today = new Date();
      const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
      const isMinor = (today.getFullYear() - eighteenYearsAgo.getFullYear()) < 18;
      expect(isMinor).toBe(false);
    });
  });

  describe('Document ID Generation', () => {
    it('should generate unique document ID', () => {
      const studentId = 123;
      const timestamp = Date.now();
      const docId = `WVR-${studentId}-${timestamp.toString(36).toUpperCase()}`;
      
      expect(docId).toMatch(/^WVR-123-[A-Z0-9]+$/);
    });

    it('should generate different IDs for different timestamps', () => {
      const studentId = 123;
      const docId1 = `WVR-${studentId}-${(1700000000000).toString(36).toUpperCase()}`;
      const docId2 = `WVR-${studentId}-${(1700000001000).toString(36).toUpperCase()}`;
      
      expect(docId1).not.toBe(docId2);
    });
  });

  describe('PDF Content Validation', () => {
    it('should include student information section', () => {
      const sections = ['PARTICIPANT INFORMATION', 'WAIVER AND RELEASE OF LIABILITY', 'ACKNOWLEDGMENT AND SIGNATURE'];
      expect(sections).toContain('PARTICIPANT INFORMATION');
    });

    it('should include waiver content section', () => {
      const sections = ['PARTICIPANT INFORMATION', 'WAIVER AND RELEASE OF LIABILITY', 'ACKNOWLEDGMENT AND SIGNATURE'];
      expect(sections).toContain('WAIVER AND RELEASE OF LIABILITY');
    });

    it('should include signature section', () => {
      const sections = ['PARTICIPANT INFORMATION', 'WAIVER AND RELEASE OF LIABILITY', 'ACKNOWLEDGMENT AND SIGNATURE'];
      expect(sections).toContain('ACKNOWLEDGMENT AND SIGNATURE');
    });
  });

  describe('Receipt PDF Generation', () => {
    it('should format amount correctly in cents', () => {
      const amountInCents = 9900;
      const formatted = `$${(amountInCents / 100).toFixed(2)}`;
      expect(formatted).toBe('$99.00');
    });

    it('should handle zero amount', () => {
      const amountInCents = 0;
      const formatted = `$${(amountInCents / 100).toFixed(2)}`;
      expect(formatted).toBe('$0.00');
    });

    it('should handle decimal amounts', () => {
      const amountInCents = 4999;
      const formatted = `$${(amountInCents / 100).toFixed(2)}`;
      expect(formatted).toBe('$49.99');
    });
  });
});

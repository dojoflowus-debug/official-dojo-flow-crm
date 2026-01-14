import { describe, it, expect } from 'vitest';
import {
  detectColumns,
  validateAndTransformRow,
  detectConflicts,
  generatePreview,
} from './setupWizardUtils';

describe('Setup Wizard Utils', () => {
  describe('detectColumns', () => {
    it('should detect program columns', () => {
      const columns = ['Program Name', 'Type', 'Age Range', 'Price', 'Max Size'];
      const mappings = detectColumns(columns, 'programs');

      expect(mappings).toHaveLength(5);
      expect(mappings[0].targetField).toBe('name');
      expect(mappings[0].confidence).toBeGreaterThan(0.7);
    });

    it('should detect class columns', () => {
      const columns = ['Class Name', 'Program', 'Day', 'Time', 'Instructor'];
      const mappings = detectColumns(columns, 'classes');

      expect(mappings.length).toBeGreaterThan(0);
      expect(mappings.some((m) => m.targetField === 'name')).toBe(true);
      expect(mappings.some((m) => m.targetField === 'program')).toBe(true);
    });

    it('should detect pricing columns', () => {
      const columns = ['Plan Name', 'Price', 'Billing Cycle'];
      const mappings = detectColumns(columns, 'pricing');

      expect(mappings.length).toBeGreaterThan(0);
      expect(mappings.some((m) => m.targetField === 'name')).toBe(true);
      expect(mappings.some((m) => m.targetField === 'price')).toBe(true);
    });

    it('should detect staff columns', () => {
      const columns = ['First Name', 'Last Name', 'Email', 'Phone'];
      const mappings = detectColumns(columns, 'staff');

      expect(mappings.length).toBeGreaterThan(0);
      expect(mappings.some((m) => m.targetField === 'firstName')).toBe(true);
      expect(mappings.some((m) => m.targetField === 'lastName')).toBe(true);
    });

    it('should detect location columns', () => {
      const columns = ['Location Name', 'Address', 'City', 'State', 'Zip Code'];
      const mappings = detectColumns(columns, 'locations');

      expect(mappings.length).toBeGreaterThan(0);
      expect(mappings.some((m) => m.targetField === 'name')).toBe(true);
      expect(mappings.some((m) => m.targetField === 'address')).toBe(true);
    });

    it('should handle case-insensitive matching', () => {
      const columns = ['PROGRAM NAME', 'type', 'PrIcE'];
      const mappings = detectColumns(columns, 'programs');

      expect(mappings.length).toBeGreaterThan(0);
    });
  });

  describe('validateAndTransformRow', () => {
    it('should validate required fields for programs', () => {
      const row = { name: 'Karate 101', type: 'membership' };
      const mappings = { name: 'name', type: 'type' };

      const result = validateAndTransformRow(row, mappings, 'programs');

      expect(result.errors).toHaveLength(0);
      expect(result.data.name).toBe('Karate 101');
    });

    it('should report missing required fields', () => {
      const row = { type: 'membership' };
      const mappings = { type: 'type' };

      const result = validateAndTransformRow(row, mappings, 'programs');

      expect(result.errors).toContain('Missing required field: name');
    });

    it('should validate numeric fields', () => {
      const row = { name: 'Program', price: 'invalid' };
      const mappings = { name: 'name', price: 'price' };

      const result = validateAndTransformRow(row, mappings, 'programs');

      expect(result.errors.some((e) => e.includes('Invalid number'))).toBe(true);
    });

    it('should validate email format', () => {
      const row = { firstName: 'John', lastName: 'Doe', email: 'invalid-email' };
      const mappings = {
        firstName: 'firstName',
        lastName: 'lastName',
        email: 'email',
      };

      const result = validateAndTransformRow(row, mappings, 'staff');

      expect(result.errors.some((e) => e.includes('Invalid email'))).toBe(true);
    });

    it('should validate day of week', () => {
      const row = { name: 'Class', dayOfWeek: 'InvalidDay' };
      const mappings = { name: 'name', dayOfWeek: 'dayOfWeek' };

      const result = validateAndTransformRow(row, mappings, 'classes');

      expect(result.errors.some((e) => e.includes('Invalid day'))).toBe(true);
    });

    it('should validate program type enum', () => {
      const row = { name: 'Program', type: 'invalid_type' };
      const mappings = { name: 'name', type: 'type' };

      const result = validateAndTransformRow(row, mappings, 'programs');

      expect(result.errors.some((e) => e.includes('Invalid program type'))).toBe(
        true
      );
    });

    it('should validate billing cycle enum', () => {
      const row = { name: 'Plan', price: '99', billing: 'invalid_billing' };
      const mappings = { name: 'name', price: 'price', billing: 'billing' };

      const result = validateAndTransformRow(row, mappings, 'pricing');

      expect(result.errors.some((e) => e.includes('Invalid billing'))).toBe(true);
    });

    it('should trim whitespace from text fields', () => {
      const row = { name: '  Karate 101  ' };
      const mappings = { name: 'name' };

      const result = validateAndTransformRow(row, mappings, 'programs');

      expect(result.data.name).toBe('Karate 101');
    });

    it('should convert email to lowercase', () => {
      const row = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'JOHN@EXAMPLE.COM',
      };
      const mappings = {
        firstName: 'firstName',
        lastName: 'lastName',
        email: 'email',
      };

      const result = validateAndTransformRow(row, mappings, 'staff');

      expect(result.data.email).toBe('john@example.com');
    });
  });

  describe('detectConflicts', () => {
    it('should detect duplicate names', () => {
      const rows = [
        { name: 'Karate 101', type: 'membership' },
        { name: 'Karate 101', type: 'class_pack' },
      ];
      const mappings = { name: 'name', type: 'type' };

      const conflicts = detectConflicts(rows, mappings, 'programs');

      expect(conflicts.some((c) => c.type === 'duplicate_name')).toBe(true);
    });

    it('should detect invalid capacity', () => {
      const rows = [{ name: 'Class', capacity: '0' }];
      const mappings = { name: 'name', capacity: 'capacity' };

      const conflicts = detectConflicts(rows, mappings, 'classes');

      expect(conflicts.some((c) => c.type === 'capacity_invalid')).toBe(true);
    });

    it('should detect invalid data', () => {
      const rows = [{ type: 'membership' }];
      const mappings = { type: 'type' };

      const conflicts = detectConflicts(rows, mappings, 'programs');

      expect(conflicts.some((c) => c.type === 'invalid_data')).toBe(true);
    });

    it('should return empty array for valid data', () => {
      const rows = [
        { name: 'Karate 101', type: 'membership' },
        { name: 'Karate 102', type: 'class_pack' },
      ];
      const mappings = { name: 'name', type: 'type' };

      const conflicts = detectConflicts(rows, mappings, 'programs');

      expect(conflicts).toHaveLength(0);
    });
  });

  describe('generatePreview', () => {
    it('should generate preview with mapped columns', () => {
      const rows = [
        { 'Program Name': 'Karate 101', Type: 'membership', Price: '99' },
        { 'Program Name': 'Karate 102', Type: 'class_pack', Price: '49' },
      ];
      const mappings = {
        'Program Name': 'name',
        Type: 'type',
        Price: 'price',
      };

      const preview = generatePreview(rows, mappings, 5);

      expect(preview).toHaveLength(2);
      expect(preview[0].name).toBe('Karate 101');
      expect(preview[0].type).toBe('membership');
    });

    it('should limit preview to specified number of rows', () => {
      const rows = Array.from({ length: 10 }, (_, i) => ({
        name: `Item ${i}`,
      }));
      const mappings = { name: 'name' };

      const preview = generatePreview(rows, mappings, 3);

      expect(preview).toHaveLength(3);
    });

    it('should handle missing columns gracefully', () => {
      const rows = [{ 'Program Name': 'Karate 101' }];
      const mappings = {
        'Program Name': 'name',
        'Missing Column': 'type',
      };

      const preview = generatePreview(rows, mappings, 5);

      expect(preview[0].name).toBe('Karate 101');
      expect(preview[0].type).toBe('');
    });
  });
});

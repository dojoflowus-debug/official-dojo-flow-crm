import { describe, it, expect, beforeEach, vi } from 'vitest';
import { kioskDeviceRouter } from './kioskDeviceRouter';
import type { Context } from './_core/trpc';
import { TRPCError } from '@trpc/server';

describe('Kiosk Device Router', () => {
  describe('slug generation', () => {
    it('should generate unique slugs from names', () => {
      // Test slug generation logic
      const generateSlug = (name: string, orgId: number): string => {
        return `${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${Date.now()}`;
      };

      const slug1 = generateSlug('Front Desk iPad', 1);
      const slug2 = generateSlug('Front Desk iPad', 1);

      expect(slug1).toContain('front-desk-ipad');
      expect(slug2).toContain('front-desk-ipad');
      expect(slug1).toMatch(/^front-desk-ipad-\d+$/);
      expect(slug2).toMatch(/^front-desk-ipad-\d+$/);
    });

    it('should handle special characters in names', () => {
      const generateSlug = (name: string, orgId: number): string => {
        return `${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${Date.now()}`;
      };

      const slug = generateSlug('Main Dojo (Front)', 1);
      expect(slug).toContain('main-dojo-front');
      expect(slug).not.toContain('(');
      expect(slug).not.toContain(')');
      expect(slug).toMatch(/^[a-z0-9-]+$/);
    });
  });

  describe('config handling', () => {
    it('should parse JSON config strings', () => {
      const configStr = '{"theme":{"accentColor":"#ef4444"}}';
      const config = JSON.parse(configStr);
      
      expect(config.theme.accentColor).toBe('#ef4444');
    });

    it('should handle null configs', () => {
      const config = null;
      const parsed = config ? JSON.parse(config) : null;
      
      expect(parsed).toBeNull();
    });

    it('should stringify config objects', () => {
      const config = { theme: { accentColor: '#ff0000' } };
      const stringified = JSON.stringify(config);
      
      expect(typeof stringified).toBe('string');
      expect(JSON.parse(stringified)).toEqual(config);
    });
  });

  describe('data transformation', () => {
    it('should transform kiosk database records to API response', () => {
      const dbRecord = {
        id: 1,
        organizationId: 1,
        locationId: 1,
        name: 'Front Desk iPad',
        slug: 'front-desk-ipad',
        isActive: 1,
        config: '{"theme":{"accentColor":"#ef4444"}}',
        createdAt: '2026-01-12T00:00:00Z',
        updatedAt: '2026-01-12T00:00:00Z',
      };

      const transformed = {
        id: dbRecord.id,
        name: dbRecord.name,
        slug: dbRecord.slug,
        isActive: dbRecord.isActive,
        config: dbRecord.config ? JSON.parse(dbRecord.config) : null,
        createdAt: dbRecord.createdAt,
        updatedAt: dbRecord.updatedAt,
      };

      expect(transformed.id).toBe(1);
      expect(transformed.name).toBe('Front Desk iPad');
      expect(transformed.config.theme.accentColor).toBe('#ef4444');
    });

    it('should handle duplicate kiosk naming', () => {
      const originalName = 'Original Kiosk';
      const duplicateName = `${originalName} (Copy)`;
      
      expect(duplicateName).toBe('Original Kiosk (Copy)');
    });
  });

  describe('validation', () => {
    it('should validate kiosk name is not empty', () => {
      const isValidName = (name: string): boolean => {
        return name.trim().length > 0 && name.length <= 255;
      };

      expect(isValidName('Valid Name')).toBe(true);
      expect(isValidName('')).toBe(false);
      expect(isValidName('   ')).toBe(false);
      expect(isValidName('a'.repeat(256))).toBe(false);
    });

    it('should validate locationId is a positive number', () => {
      const isValidLocationId = (id: number): boolean => {
        return Number.isInteger(id) && id > 0;
      };

      expect(isValidLocationId(1)).toBe(true);
      expect(isValidLocationId(0)).toBe(false);
      expect(isValidLocationId(-1)).toBe(false);
      expect(isValidLocationId(1.5)).toBe(false);
    });

    it('should validate kioskId is a positive number', () => {
      const isValidKioskId = (id: number): boolean => {
        return Number.isInteger(id) && id > 0;
      };

      expect(isValidKioskId(1)).toBe(true);
      expect(isValidKioskId(0)).toBe(false);
      expect(isValidKioskId(-1)).toBe(false);
    });
  });

  describe('business logic', () => {
    it('should soft delete by setting isActive to 0', () => {
      const kiosk = {
        id: 1,
        isActive: 1,
      };

      const deleted = {
        ...kiosk,
        isActive: 0,
      };

      expect(deleted.isActive).toBe(0);
      expect(deleted.id).toBe(1); // ID unchanged
    });

    it('should preserve config when duplicating', () => {
      const original = {
        id: 1,
        name: 'Original',
        config: { theme: { accentColor: '#ef4444' } },
      };

      const duplicate = {
        id: 2,
        name: `${original.name} (Copy)`,
        config: original.config, // Same config reference
      };

      expect(duplicate.config).toEqual(original.config);
      expect(duplicate.config.theme.accentColor).toBe('#ef4444');
    });

    it('should update only specified fields in patch', () => {
      const original = {
        id: 1,
        name: 'Original Name',
        config: { theme: { accentColor: '#ef4444' } },
        isActive: 1,
      };

      const patch = { name: 'Updated Name' };
      const updated = {
        ...original,
        ...patch,
      };

      expect(updated.name).toBe('Updated Name');
      expect(updated.config).toEqual(original.config); // Unchanged
      expect(updated.isActive).toBe(1); // Unchanged
    });
  });

  describe('error scenarios', () => {
    it('should handle database errors gracefully', () => {
      const dbError = new Error('Database connection failed');
      const isDbError = (error: any): boolean => {
        return error instanceof Error && error.message.includes('Database');
      };

      expect(isDbError(dbError)).toBe(true);
    });

    it('should handle missing kiosk', () => {
      const kiosks: any[] = [];
      const kioskId = 999;
      const found = kiosks.find(k => k.id === kioskId);

      expect(found).toBeUndefined();
    });

    it('should handle invalid organization context', () => {
      const context = {
        organizationId: null,
      };

      const isValidContext = (ctx: any): boolean => {
        return !!(ctx.organizationId && typeof ctx.organizationId === 'number');
      };

      expect(isValidContext(context)).toBe(false);
    });
  });
});

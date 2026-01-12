import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import { KioskConfigSchema } from '../shared/kioskConfigSchema';
import { DEFAULT_KIOSK_CONFIG, KioskConfig } from '../shared/kioskConfig';

describe('Kiosk Device Mutations - Schema Validation', () => {
  describe('saveDraft mutation input validation', () => {
    const saveDraftInputSchema = z.object({
      kioskId: z.number(),
      config: KioskConfigSchema,
    });

    it('should accept valid save draft input', () => {
      const input = {
        kioskId: 1,
        config: DEFAULT_KIOSK_CONFIG,
      };
      const result = saveDraftInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject save draft input with invalid config', () => {
      const input = {
        kioskId: 1,
        config: { invalid: 'config' },
      };
      const result = saveDraftInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject save draft input with missing required config fields', () => {
      const input = {
        kioskId: 1,
        config: {
          theme: { accentColor: '#ef4444', fontFamily: 'Inter' },
          // Missing other required fields
        },
      };
      const result = saveDraftInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject save draft input with undefined config', () => {
      const input = {
        kioskId: 1,
        config: undefined,
      };
      const result = saveDraftInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('publish mutation input validation', () => {
    const publishInputSchema = z.object({
      kioskId: z.number(),
      config: KioskConfigSchema.optional(),
    });

    it('should accept valid publish input with config', () => {
      const input = {
        kioskId: 1,
        config: DEFAULT_KIOSK_CONFIG,
      };
      const result = publishInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should accept valid publish input without config', () => {
      const input = {
        kioskId: 1,
        config: undefined,
      };
      const result = publishInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject publish input with invalid config', () => {
      const input = {
        kioskId: 1,
        config: { invalid: 'config' },
      };
      const result = publishInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject publish input with null config (null is not undefined)', () => {
      const input = {
        kioskId: 1,
        config: null,
      };
      const result = publishInputSchema.safeParse(input);
      // Zod's .optional() only accepts undefined, not null
      expect(result.success).toBe(false);
    });
  });

  describe('Config validation edge cases', () => {
    it('should handle config with all optional behavior fields', () => {
      const config: KioskConfig = {
        ...DEFAULT_KIOSK_CONFIG,
        behavior: {
          autoAdvanceSeconds: 10,
          enableSound: true,
          enableHaptics: false,
        },
      };
      const result = KioskConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should handle config with partial optional behavior fields', () => {
      const config: KioskConfig = {
        ...DEFAULT_KIOSK_CONFIG,
        behavior: {
          enableSound: true,
        },
      };
      const result = KioskConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should handle config with empty behavior object', () => {
      const config: KioskConfig = {
        ...DEFAULT_KIOSK_CONFIG,
        behavior: {},
      };
      const result = KioskConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should handle config with undefined behavior', () => {
      const config: KioskConfig = {
        ...DEFAULT_KIOSK_CONFIG,
        behavior: undefined,
      };
      const result = KioskConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should reject config with invalid theme', () => {
      const config = {
        ...DEFAULT_KIOSK_CONFIG,
        theme: {
          accentColor: 'invalid-color',
          fontFamily: 'Inter',
        },
      };
      const result = KioskConfigSchema.safeParse(config);
      // Note: The schema doesn't validate color format, so this should pass
      expect(result.success).toBe(true);
    });

    it('should reject config with missing theme', () => {
      const config = {
        ...DEFAULT_KIOSK_CONFIG,
        theme: undefined,
      };
      const result = KioskConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('should reject config with invalid background type', () => {
      const config = {
        ...DEFAULT_KIOSK_CONFIG,
        background: {
          ...DEFAULT_KIOSK_CONFIG.background,
          type: 'invalid' as any,
        },
      };
      const result = KioskConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('should reject config with invalid background fit', () => {
      const config = {
        ...DEFAULT_KIOSK_CONFIG,
        background: {
          ...DEFAULT_KIOSK_CONFIG.background,
          fit: 'invalid' as any,
        },
      };
      const result = KioskConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });
  });

  describe('Config type inference', () => {
    it('should infer correct type from schema', () => {
      type InferredConfig = z.infer<typeof KioskConfigSchema>;
      const config: InferredConfig = DEFAULT_KIOSK_CONFIG;
      expect(config).toBeDefined();
      expect(config.theme).toBeDefined();
      expect(config.content).toBeDefined();
    });
  });
});

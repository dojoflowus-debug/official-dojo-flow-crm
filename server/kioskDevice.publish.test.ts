import { describe, it, expect, beforeEach, vi } from 'vitest';
import { z } from 'zod';
import { KioskConfigSchema } from '../shared/kioskConfigSchema';
import { DEFAULT_KIOSK_CONFIG } from '../shared/kioskConfig';

describe('KioskConfigSchema validation', () => {
  it('should validate a valid config', () => {
    const result = KioskConfigSchema.safeParse(DEFAULT_KIOSK_CONFIG);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(DEFAULT_KIOSK_CONFIG);
    }
  });

  it('should reject undefined config', () => {
    const result = KioskConfigSchema.safeParse(undefined);
    expect(result.success).toBe(false);
  });

  it('should reject null config', () => {
    const result = KioskConfigSchema.safeParse(null);
    expect(result.success).toBe(false);
  });

  it('should reject config with missing required fields', () => {
    const invalidConfig = {
      theme: {
        accentColor: '#ef4444',
        fontFamily: 'Inter',
      },
      // Missing content, typography, layout, background, screensaver
    };
    const result = KioskConfigSchema.safeParse(invalidConfig);
    expect(result.success).toBe(false);
  });

  it('should validate optional behavior field', () => {
    const configWithoutBehavior = {
      ...DEFAULT_KIOSK_CONFIG,
      behavior: undefined,
    };
    const result = KioskConfigSchema.safeParse(configWithoutBehavior);
    expect(result.success).toBe(true);
  });

  it('should validate config with partial behavior', () => {
    const configWithPartialBehavior = {
      ...DEFAULT_KIOSK_CONFIG,
      behavior: {
        enableSound: true,
      },
    };
    const result = KioskConfigSchema.safeParse(configWithPartialBehavior);
    expect(result.success).toBe(true);
  });



  it('should handle schema.optional() correctly', () => {
    const optionalSchema = KioskConfigSchema.optional();
    const result1 = optionalSchema.safeParse(DEFAULT_KIOSK_CONFIG);
    const result2 = optionalSchema.safeParse(undefined);
    
    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
  });
});

describe('Publish mutation input validation', () => {
  it('should validate publish input with config', () => {
    const publishInputSchema = z.object({
      kioskId: z.number(),
      config: KioskConfigSchema.optional(),
    });

    const validInput = {
      kioskId: 1,
      config: DEFAULT_KIOSK_CONFIG,
    };

    const result = publishInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should validate publish input without config', () => {
    const publishInputSchema = z.object({
      kioskId: z.number(),
      config: KioskConfigSchema.optional(),
    });

    const validInput = {
      kioskId: 1,
      config: undefined,
    };

    const result = publishInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should reject publish input with invalid config', () => {
    const publishInputSchema = z.object({
      kioskId: z.number(),
      config: KioskConfigSchema.optional(),
    });

    const invalidInput = {
      kioskId: 1,
      config: { invalid: 'config' },
    };

    const result = publishInputSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });
});

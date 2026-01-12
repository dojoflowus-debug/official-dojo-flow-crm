import { z } from 'zod';
import { DEFAULT_KIOSK_CONFIG } from './kioskConfig';

/**
 * Zod schema for KioskConfig - shared between client and server
 * Used for TRPC validation
 * 
 * IMPORTANT: This schema must match the DEFAULT_KIOSK_CONFIG structure
 * to ensure validation always succeeds with default values.
 */
export const KioskConfigSchema = z.object({
  theme: z.object({
    accentColor: z.string(),
    fontFamily: z.string(),
  }),
  content: z.object({
    headline: z.string(),
    subtext: z.string(),
    tileLeft: z.object({
      title: z.string(),
      subtitle: z.string(),
      button: z.string(),
    }),
    tileRight: z.object({
      title: z.string(),
      subtitle: z.string(),
      button: z.string(),
    }),
    infoLeftLabel: z.string(),
    infoRightLabel: z.string(),
  }),
  typography: z.object({
    titleSize: z.number(),
    titleWeight: z.number(),
    subtitleSize: z.number(),
    letterSpacing: z.number(),
    buttonFontSize: z.number(),
  }),
  layout: z.object({
    showClock: z.boolean(),
    showInfoBar: z.boolean(),
  }),
  background: z.object({
    type: z.enum(['solid', 'preset', 'custom']),
    color: z.string(),
    presetKey: z.string().nullable(),
    customUrl: z.string().nullable(),
    blur: z.number(),
    dim: z.number(),
    fit: z.enum(['cover', 'contain', 'stretch']),
  }),
  behavior: z.object({
    autoAdvanceSeconds: z.number().optional(),
    enableSound: z.boolean().optional(),
    enableHaptics: z.boolean().optional(),
  }).optional(),
  screensaver: z.object({
    enabled: z.boolean(),
    idleSeconds: z.number(),
    message: z.string(),
    showLogo: z.boolean(),
  }),
});

export type KioskConfigType = z.infer<typeof KioskConfigSchema>;

/**
 * Validate a config object against the schema
 * Returns the validated config or DEFAULT_KIOSK_CONFIG if validation fails
 */
export function validateKioskConfig(config: unknown): KioskConfigType {
  const result = KioskConfigSchema.safeParse(config);
  if (!result.success) {
    console.warn('[KioskConfigSchema] Validation failed, using defaults:', result.error);
    return DEFAULT_KIOSK_CONFIG as KioskConfigType;
  }
  return result.data;
}

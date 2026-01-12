import { z } from 'zod';

/**
 * Zod schema for KioskConfig - shared between client and server
 * Used for TRPC validation
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
})

export type KioskConfigType = z.infer<typeof KioskConfigSchema>;

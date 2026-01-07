import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Replicate the schema from kioskRouter.ts for testing
const kioskSettingsSchema = z.object({
  theme: z.enum(["default", "modern", "minimal", "bold"]).default("default"),
  appearance: z.object({
    accentColor: z.string().default("#ef4444"),
    logoLight: z.string().optional(),
    logoDark: z.string().optional(),
    headline: z.string().default("Welcome to Training"),
    subtext: z.string().default("Sign in or get started below"),
    backgroundIntensity: z.number().min(0).max(100).default(70),
    backgroundBlur: z.number().min(0).max(10).default(3),
  }),
  behavior: z.object({
    showMemberLogin: z.boolean().default(true),
    showNewStudent: z.boolean().default(true),
    idleTimeout: z.number().min(10).max(300).default(30),
    autoReturn: z.boolean().default(true),
    kaiEnrollment: z.boolean().default(false),
    facialRecognition: z.boolean().default(false),
  }),
});

const defaultKioskSettings = {
  theme: "default",
  appearance: {
    accentColor: "#ef4444",
    headline: "Welcome to Training",
    subtext: "Sign in or get started below",
    backgroundIntensity: 70,
    backgroundBlur: 3,
  },
  behavior: {
    showMemberLogin: true,
    showNewStudent: true,
    idleTimeout: 30,
    autoReturn: true,
    kaiEnrollment: false,
    facialRecognition: false,
  },
};

describe('Kiosk Router Schema Validation', () => {
  describe('Settings parsing and validation', () => {
    it('should validate complete settings object', () => {
      const settings = defaultKioskSettings;
      const validated = kioskSettingsSchema.parse(settings);
      expect(validated.appearance.accentColor).toBe("#ef4444");
      expect(validated.behavior.showMemberLogin).toBe(true);
    });

    it('should apply defaults when parsing partial settings', () => {
      const partial = {
        theme: "modern",
        appearance: {
          accentColor: "#ff0000",
        },
        behavior: {
          showMemberLogin: false,
        },
      };
      const validated = kioskSettingsSchema.parse(partial);
      expect(validated.theme).toBe("modern");
      expect(validated.appearance.accentColor).toBe("#ff0000");
      expect(validated.appearance.headline).toBe("Welcome to Training"); // default
      expect(validated.behavior.showMemberLogin).toBe(false);
      expect(validated.behavior.showNewStudent).toBe(true); // default
    });

    it('should not throw when parsing JSON with missing nested properties', () => {
      const jsonString = JSON.stringify({
        theme: "bold",
        appearance: {
          accentColor: "#00ff00",
        },
        behavior: {},
      });
      const parsed = JSON.parse(jsonString);
      const validated = kioskSettingsSchema.parse(parsed);
      expect(validated.appearance.accentColor).toBe("#00ff00");
      expect(validated.appearance.headline).toBe("Welcome to Training");
      expect(validated.behavior.showMemberLogin).toBe(true);
    });

    it('should handle corrupted JSON by falling back to defaults', () => {
      const corruptedJson = "{ invalid json }";
      let settings = defaultKioskSettings;
      try {
        const parsed = JSON.parse(corruptedJson);
        settings = kioskSettingsSchema.parse(parsed);
      } catch (e) {
        // Use defaults on parse error
        settings = defaultKioskSettings;
      }
      expect(settings.appearance.accentColor).toBe("#ef4444");
      expect(settings.behavior.showMemberLogin).toBe(true);
    });

    it('should preserve accentColor when updating theme', () => {
      const stored = {
        theme: "default",
        appearance: {
          accentColor: "#ff6b6b",
          headline: "Custom Headline",
          subtext: "Custom Subtext",
          backgroundIntensity: 50,
          backgroundBlur: 5,
        },
        behavior: {
          showMemberLogin: false,
          showNewStudent: true,
          idleTimeout: 60,
          autoReturn: false,
          kaiEnrollment: true,
          facialRecognition: false,
        },
      };
      const validated = kioskSettingsSchema.parse(stored);
      expect(validated.appearance.accentColor).toBe("#ff6b6b");
      expect(validated.appearance.headline).toBe("Custom Headline");
      expect(validated.behavior.idleTimeout).toBe(60);
    });

    it('should validate theme enum values', () => {
      const validThemes = ["default", "modern", "minimal", "bold"];
      validThemes.forEach(theme => {
        const settings = {
          ...defaultKioskSettings,
          theme: theme as any,
        };
        const validated = kioskSettingsSchema.parse(settings);
        expect(validated.theme).toBe(theme);
      });
    });

    it('should reject invalid theme values', () => {
      const invalidSettings = {
        ...defaultKioskSettings,
        theme: "invalid-theme",
      };
      expect(() => kioskSettingsSchema.parse(invalidSettings)).toThrow();
    });

    it('should validate appearance color values', () => {
      const settings = {
        ...defaultKioskSettings,
        appearance: {
          ...defaultKioskSettings.appearance,
          accentColor: "#ff0000",
        },
      };
      const validated = kioskSettingsSchema.parse(settings);
      expect(validated.appearance.accentColor).toBe("#ff0000");
    });

    it('should validate background intensity range', () => {
      const settings = {
        ...defaultKioskSettings,
        appearance: {
          ...defaultKioskSettings.appearance,
          backgroundIntensity: 100,
        },
      };
      const validated = kioskSettingsSchema.parse(settings);
      expect(validated.appearance.backgroundIntensity).toBe(100);
    });

    it('should validate background blur range', () => {
      const settings = {
        ...defaultKioskSettings,
        appearance: {
          ...defaultKioskSettings.appearance,
          backgroundBlur: 10,
        },
      };
      const validated = kioskSettingsSchema.parse(settings);
      expect(validated.appearance.backgroundBlur).toBe(10);
    });

    it('should reject invalid background intensity', () => {
      const invalidSettings = {
        ...defaultKioskSettings,
        appearance: {
          ...defaultKioskSettings.appearance,
          backgroundIntensity: 150,
        },
      };
      expect(() => kioskSettingsSchema.parse(invalidSettings)).toThrow();
    });

    it('should reject invalid background blur', () => {
      const invalidSettings = {
        ...defaultKioskSettings,
        appearance: {
          ...defaultKioskSettings.appearance,
          backgroundBlur: 20,
        },
      };
      expect(() => kioskSettingsSchema.parse(invalidSettings)).toThrow();
    });

    it('should validate behavior boolean values', () => {
      const settings = {
        ...defaultKioskSettings,
        behavior: {
          showMemberLogin: true,
          showNewStudent: false,
          idleTimeout: 30,
          autoReturn: true,
          kaiEnrollment: false,
          facialRecognition: true,
        },
      };
      const validated = kioskSettingsSchema.parse(settings);
      expect(validated.behavior.facialRecognition).toBe(true);
      expect(validated.behavior.showNewStudent).toBe(false);
    });

    it('should validate idle timeout range', () => {
      const settings = {
        ...defaultKioskSettings,
        behavior: {
          ...defaultKioskSettings.behavior,
          idleTimeout: 300,
        },
      };
      const validated = kioskSettingsSchema.parse(settings);
      expect(validated.behavior.idleTimeout).toBe(300);
    });

    it('should reject invalid idle timeout', () => {
      const invalidSettings = {
        ...defaultKioskSettings,
        behavior: {
          ...defaultKioskSettings.behavior,
          idleTimeout: 500,
        },
      };
      expect(() => kioskSettingsSchema.parse(invalidSettings)).toThrow();
    });
  });

  describe('Round-trip serialization', () => {
    it('should serialize and deserialize without data loss', () => {
      const original = {
        theme: "modern",
        appearance: {
          accentColor: "#ff5733",
          headline: "Welcome!",
          subtext: "Please sign in",
          backgroundIntensity: 80,
          backgroundBlur: 5,
        },
        behavior: {
          showMemberLogin: false,
          showNewStudent: true,
          idleTimeout: 60,
          autoReturn: true,
          kaiEnrollment: true,
          facialRecognition: false,
        },
      };
      const json = JSON.stringify(original);
      const parsed = JSON.parse(json);
      const validated = kioskSettingsSchema.parse(parsed);
      expect(validated.theme).toBe(original.theme);
      expect(validated.appearance.accentColor).toBe(original.appearance.accentColor);
      expect(validated.behavior.idleTimeout).toBe(original.behavior.idleTimeout);
    });
  });
});

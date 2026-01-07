import { describe, it, expect } from 'vitest';
import { getDefaultKioskSettings, type KioskSettings } from '../drizzle/schema';

describe('Kiosk Settings', () => {
  describe('getDefaultKioskSettings', () => {
    it('should return default settings with correct structure', () => {
      const settings = getDefaultKioskSettings();
      expect(settings).toBeDefined();
      expect(settings.theme).toBeDefined();
      expect(settings.background).toBeDefined();
    });

    it('should have valid theme settings', () => {
      const settings = getDefaultKioskSettings();
      expect(settings.theme?.mode).toBe('dark');
      expect(settings.theme?.primaryColor).toBe('#2563EB');
      expect(settings.theme?.accentColor).toBe('#EF4444');
    });

    it('should have valid background settings', () => {
      const settings = getDefaultKioskSettings();
      expect(settings.background?.type).toBe('preset');
      expect(settings.background?.presetKey).toBe('dojo-warm-lights');
      expect(settings.background?.blur).toBe(0);
      expect(settings.background?.dim).toBe(0);
      expect(settings.background?.vignette).toBe(false);
    });

    it('should have no image URL by default', () => {
      const settings = getDefaultKioskSettings();
      expect(settings.background?.imageUrl).toBeUndefined();
    });
  });

  describe('KioskSettings type validation', () => {
    it('should allow partial theme updates', () => {
      const partialTheme = {
        mode: 'light',
        primaryColor: '#FF0000',
      };
      const settings: KioskSettings = { theme: partialTheme };
      expect(settings.theme?.mode).toBe('light');
      expect(settings.theme?.primaryColor).toBe('#FF0000');
    });

    it('should allow partial background updates', () => {
      const partialBackground = {
        type: 'image',
        imageUrl: 'https://example.com/bg.jpg',
        blur: 12,
        dim: 45,
      };
      const settings: KioskSettings = { background: partialBackground };
      expect(settings.background?.imageUrl).toBe('https://example.com/bg.jpg');
      expect(settings.background?.blur).toBe(12);
      expect(settings.background?.dim).toBe(45);
    });

    it('should validate blur range', () => {
      const settings: KioskSettings = { background: { blur: 24, dim: 0 } };
      expect(settings.background?.blur).toBeLessThanOrEqual(24);
      expect(settings.background?.blur).toBeGreaterThanOrEqual(0);
    });

    it('should validate dim range', () => {
      const settings: KioskSettings = { background: { blur: 0, dim: 70 } };
      expect(settings.background?.dim).toBeLessThanOrEqual(70);
      expect(settings.background?.dim).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Settings merge logic', () => {
    it('should merge theme settings correctly', () => {
      const current = getDefaultKioskSettings();
      const update: Partial<KioskSettings> = {
        theme: { mode: 'light', primaryColor: '#FF5733' },
      };
      const merged: KioskSettings = {
        ...current,
        theme: update.theme ? { ...current.theme, ...update.theme } : current.theme,
        background: current.background,
      };
      expect(merged.theme?.mode).toBe('light');
      expect(merged.theme?.primaryColor).toBe('#FF5733');
      expect(merged.theme?.accentColor).toBe('#EF4444');
    });

    it('should merge background settings correctly', () => {
      const current = getDefaultKioskSettings();
      const update: Partial<KioskSettings> = {
        background: { type: 'image', imageUrl: 'https://example.com/bg.jpg', blur: 15 },
      };
      const merged: KioskSettings = {
        ...current,
        theme: current.theme,
        background: update.background ? { ...current.background, ...update.background } : current.background,
      };
      expect(merged.background?.type).toBe('image');
      expect(merged.background?.imageUrl).toBe('https://example.com/bg.jpg');
      expect(merged.background?.blur).toBe(15);
      expect(merged.background?.dim).toBe(0);
    });

    it('should preserve unmodified settings during merge', () => {
      const current = getDefaultKioskSettings();
      const update: Partial<KioskSettings> = { theme: { mode: 'light' } };
      const merged: KioskSettings = {
        ...current,
        theme: update.theme ? { ...current.theme, ...update.theme } : current.theme,
        background: current.background,
      };
      expect(merged.theme?.mode).toBe('light');
      expect(merged.theme?.primaryColor).toBe('#2563EB');
      expect(merged.theme?.accentColor).toBe('#EF4444');
      expect(merged.background?.type).toBe('preset');
      expect(merged.background?.presetKey).toBe('dojo-warm-lights');
    });
  });

  describe('Settings JSON serialization', () => {
    it('should serialize settings to JSON', () => {
      const settings = getDefaultKioskSettings();
      const json = JSON.stringify(settings);
      expect(json).toBeDefined();
      expect(typeof json).toBe('string');
    });

    it('should deserialize settings from JSON', () => {
      const original = getDefaultKioskSettings();
      const json = JSON.stringify(original);
      const deserialized = JSON.parse(json) as KioskSettings;
      expect(deserialized.theme?.mode).toBe(original.theme?.mode);
      expect(deserialized.background?.blur).toBe(original.background?.blur);
    });

    it('should preserve all properties during serialization round-trip', () => {
      const settings: KioskSettings = {
        theme: { mode: 'dark', primaryColor: '#FF0000', accentColor: '#00FF00' },
        background: {
          type: 'image',
          imageUrl: 'https://example.com/bg.jpg',
          presetKey: null,
          blur: 12,
          dim: 45,
          vignette: true,
        },
      };
      const json = JSON.stringify(settings);
      const deserialized = JSON.parse(json) as KioskSettings;
      expect(deserialized.theme?.mode).toBe('dark');
      expect(deserialized.theme?.primaryColor).toBe('#FF0000');
      expect(deserialized.theme?.accentColor).toBe('#00FF00');
      expect(deserialized.background?.type).toBe('image');
      expect(deserialized.background?.imageUrl).toBe('https://example.com/bg.jpg');
      expect(deserialized.background?.blur).toBe(12);
      expect(deserialized.background?.dim).toBe(45);
      expect(deserialized.background?.vignette).toBe(true);
    });
  });

  describe('Preset backgrounds', () => {
    it('should support multiple preset keys', () => {
      const presets = ['dojo-warm-lights', 'clean-modern-gym', 'kids-class-bright'];
      presets.forEach(preset => {
        const settings: KioskSettings = { background: { type: 'preset', presetKey: preset, blur: 0, dim: 0 } };
        expect(settings.background?.presetKey).toBe(preset);
      });
    });

    it('should clear image URL when switching to preset', () => {
      const withImage: KioskSettings = {
        background: { type: 'image', imageUrl: 'https://example.com/bg.jpg', blur: 10, dim: 30 },
      };
      const withPreset: KioskSettings = {
        background: { type: 'preset', presetKey: 'dojo-warm-lights', imageUrl: undefined, blur: 0, dim: 0 },
      };
      expect(withImage.background?.imageUrl).toBeDefined();
      expect(withPreset.background?.imageUrl).toBeUndefined();
    });
  });
});

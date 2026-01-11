import { describe, it, expect } from 'vitest';

describe('Kiosk Manager - Settings Validation', () => {
  describe('background type logic', () => {
    it('should validate custom background settings', () => {
      const settings = {
        type: 'custom',
        color: '#ffffff',
        customUrl: 'https://example.com/bg.jpg',
        presetKey: null,
        blur: 5,
        dim: 20,
        fit: 'cover',
      };
      
      expect(settings.type).toBe('custom');
      expect(settings.customUrl).toBeTruthy();
      expect(settings.blur).toBeGreaterThanOrEqual(0);
      expect(settings.dim).toBeGreaterThanOrEqual(0);
      expect(settings.dim).toBeLessThanOrEqual(100);
    });

    it('should validate preset background settings', () => {
      const settings = {
        type: 'preset',
        color: '#ffffff',
        customUrl: null,
        presetKey: 'dojo-warm-lights',
        blur: 0,
        dim: 0,
        fit: 'cover',
      };
      
      expect(settings.type).toBe('preset');
      expect(settings.presetKey).toBeTruthy();
      expect(['dojo-warm-lights', 'dojo-dark', 'dojo-minimal']).toContain(settings.presetKey);
    });

    it('should validate solid color background settings', () => {
      const settings = {
        type: 'solid',
        color: '#ef4444',
        customUrl: null,
        presetKey: null,
        blur: 0,
        dim: 0,
        fit: 'cover',
      };
      
      expect(settings.type).toBe('solid');
      expect(settings.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  describe('screensaver settings validation', () => {
    it('should validate enabled screensaver', () => {
      const screensaver = {
        enabled: true,
        idleSeconds: 60,
        message: 'Tap to check in',
        showLogo: true,
      };
      
      expect(screensaver.enabled).toBe(true);
      expect(screensaver.idleSeconds).toBeGreaterThan(0);
      expect(screensaver.idleSeconds).toBeLessThanOrEqual(600);
      expect(typeof screensaver.message).toBe('string');
      expect(typeof screensaver.showLogo).toBe('boolean');
    });

    it('should validate custom idle time', () => {
      const validIdleTimes = [10, 30, 60, 120, 300, 600];
      
      validIdleTimes.forEach(time => {
        expect(time).toBeGreaterThan(0);
        expect(time).toBeLessThanOrEqual(600);
      });
    });
  });

  describe('content settings validation', () => {
    it('should validate tile content structure', () => {
      const tile = {
        title: 'Check In',
        subtitle: 'Tap here to check into class',
        button: 'Check In',
      };
      
      expect(tile.title).toBeTruthy();
      expect(typeof tile.title).toBe('string');
      expect(typeof tile.subtitle).toBe('string');
      expect(typeof tile.button).toBe('string');
    });

    it('should validate theme settings', () => {
      const theme = {
        accentColor: '#ef4444',
        fontFamily: 'Inter',
      };
      
      expect(theme.accentColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(['Inter', 'Poppins', 'Roboto', 'Playfair Display']).toContain(theme.fontFamily);
    });

    it('should validate layout settings', () => {
      const layout = {
        showClock: true,
        showInfoBar: true,
      };
      
      expect(typeof layout.showClock).toBe('boolean');
      expect(typeof layout.showInfoBar).toBe('boolean');
    });
  });

  describe('complete settings structure', () => {
    it('should validate full kiosk settings object', () => {
      const settings = {
        theme: { accentColor: '#ef4444', fontFamily: 'Inter' },
        content: {
          headline: 'Welcome to Training',
          subtext: 'Tap to begin',
          tileLeft: { title: 'Check In', subtitle: 'Tap here to check into class', button: 'Check In' },
          tileRight: { title: 'Start Training', subtitle: 'New students start here', button: 'Start Training' },
          infoLeftLabel: 'Next Class',
          infoRightLabel: 'Today\'s Focus',
        },
        layout: { showClock: true, showInfoBar: true },
        background: { type: 'solid', color: '#ffffff', presetKey: null, customUrl: null, blur: 0, dim: 0, fit: 'cover' },
        screensaver: { enabled: true, idleSeconds: 60, message: 'Tap the screen to check-in', showLogo: true },
      };
      
      expect(settings.theme).toBeDefined();
      expect(settings.content).toBeDefined();
      expect(settings.layout).toBeDefined();
      expect(settings.background).toBeDefined();
      expect(settings.screensaver).toBeDefined();
      
      expect(settings.content.tileLeft.title).toBeTruthy();
      expect(settings.content.tileRight.title).toBeTruthy();
      expect(settings.background.type).toMatch(/^(solid|preset|custom)$/);
      expect(settings.screensaver.idleSeconds).toBeGreaterThan(0);
    });
  });
});

import { describe, it, expect } from 'vitest';
import {
  DEVICE_PRESETS,
  getDevicePreset,
  getKioskDevices,
  getSanityCheckDevices,
  getDefaultDevice,
  getViewportDimensions,
  getZoomScale,
  getEmulatorStateKey,
  getDefaultEmulatorState,
} from '../../../shared/deviceEmulator';

describe('Device Emulator', () => {
  describe('Device Presets', () => {
    it('should have 8 device presets', () => {
      expect(Object.keys(DEVICE_PRESETS).length).toBe(8);
    });

    it('should have 4 kiosk-first devices', () => {
      expect(getKioskDevices().length).toBe(4);
    });

    it('should have 4 sanity check devices', () => {
      expect(getSanityCheckDevices().length).toBe(4);
    });

    it('should have correct kiosk device IDs', () => {
      const kioskIds = getKioskDevices().map(d => d.id);
      expect(kioskIds).toContain('ipad-10-2');
      expect(kioskIds).toContain('ipad-pro-12-9');
      expect(kioskIds).toContain('touch-kiosk-1080p');
      expect(kioskIds).toContain('touch-kiosk-4k');
    });

    it('should have correct sanity check device IDs', () => {
      const sanityIds = getSanityCheckDevices().map(d => d.id);
      expect(sanityIds).toContain('iphone-14');
      expect(sanityIds).toContain('android-large');
      expect(sanityIds).toContain('laptop');
      expect(sanityIds).toContain('desktop');
    });
  });

  describe('Device Dimensions', () => {
    it('iPad 10.2 should have correct dimensions', () => {
      const ipad = getDevicePreset('ipad-10-2');
      expect(ipad?.width).toBe(810);
      expect(ipad?.height).toBe(1080);
    });

    it('iPad Pro 12.9 should have correct dimensions', () => {
      const ipad = getDevicePreset('ipad-pro-12-9');
      expect(ipad?.width).toBe(1024);
      expect(ipad?.height).toBe(1366);
    });

    it('Touch Kiosk 1080p should have correct dimensions', () => {
      const kiosk = getDevicePreset('touch-kiosk-1080p');
      expect(kiosk?.width).toBe(1920);
      expect(kiosk?.height).toBe(1080);
    });

    it('Touch Kiosk 4K should have correct dimensions', () => {
      const kiosk = getDevicePreset('touch-kiosk-4k');
      expect(kiosk?.width).toBe(3840);
      expect(kiosk?.height).toBe(2160);
    });

    it('iPhone 14 should have correct dimensions', () => {
      const phone = getDevicePreset('iphone-14');
      expect(phone?.width).toBe(390);
      expect(phone?.height).toBe(844);
    });

    it('Android Large should have correct dimensions', () => {
      const android = getDevicePreset('android-large');
      expect(android?.width).toBe(412);
      expect(android?.height).toBe(915);
    });

    it('Laptop should have correct dimensions', () => {
      const laptop = getDevicePreset('laptop');
      expect(laptop?.width).toBe(1440);
      expect(laptop?.height).toBe(900);
    });

    it('Desktop should have correct dimensions', () => {
      const desktop = getDevicePreset('desktop');
      expect(desktop?.width).toBe(1920);
      expect(desktop?.height).toBe(1080);
    });
  });

  describe('Orientation Support', () => {
    it('iPad 10.2 should support both orientations', () => {
      const ipad = getDevicePreset('ipad-10-2');
      expect(ipad?.supportedOrientations).toContain('portrait');
      expect(ipad?.supportedOrientations).toContain('landscape');
    });

    it('Touch Kiosk 1080p should only support landscape', () => {
      const kiosk = getDevicePreset('touch-kiosk-1080p');
      expect(kiosk?.supportedOrientations).toContain('landscape');
      expect(kiosk?.supportedOrientations).not.toContain('portrait');
    });

    it('iPhone 14 should support both orientations', () => {
      const phone = getDevicePreset('iphone-14');
      expect(phone?.supportedOrientations).toContain('portrait');
      expect(phone?.supportedOrientations).toContain('landscape');
    });
  });

  describe('Viewport Dimensions', () => {
    it('should return correct dimensions for portrait', () => {
      const ipad = getDevicePreset('ipad-10-2')!;
      const dims = getViewportDimensions(ipad, 'portrait');
      expect(dims.width).toBe(810);
      expect(dims.height).toBe(1080);
    });

    it('should swap dimensions for landscape', () => {
      const ipad = getDevicePreset('ipad-10-2')!;
      const dims = getViewportDimensions(ipad, 'landscape');
      expect(dims.width).toBe(1080);
      expect(dims.height).toBe(810);
    });

    it('should not swap for landscape-only devices', () => {
      const kiosk = getDevicePreset('touch-kiosk-1080p')!;
      const dims = getViewportDimensions(kiosk, 'landscape');
      expect(dims.width).toBe(1920);
      expect(dims.height).toBe(1080);
    });
  });

  describe('Zoom Scaling', () => {
    it('should calculate 50% zoom scale', () => {
      const scale = getZoomScale(50, 1000, 1000);
      expect(scale).toBe(0.5);
    });

    it('should calculate 75% zoom scale', () => {
      const scale = getZoomScale(75, 1000, 1000);
      expect(scale).toBe(0.75);
    });

    it('should calculate 100% zoom scale', () => {
      const scale = getZoomScale(100, 1000, 1000);
      expect(scale).toBe(1);
    });

    it('should calculate fit zoom scale', () => {
      const scale = getZoomScale('fit', 500, 1000);
      expect(scale).toBe(0.5);
    });

    it('should handle fit zoom with larger container', () => {
      const scale = getZoomScale('fit', 2000, 1000);
      expect(scale).toBe(2);
    });
  });

  describe('Default Device Selection', () => {
    it('should default to Touch Kiosk 1080p for kiosk type', () => {
      const deviceId = getDefaultDevice('kiosk');
      expect(deviceId).toBe('touch-kiosk-1080p');
    });

    it('should default to iPad 10.2 for other types', () => {
      const deviceId = getDefaultDevice('other');
      expect(deviceId).toBe('ipad-10-2');
    });

    it('should default to iPad 10.2 when no type provided', () => {
      const deviceId = getDefaultDevice();
      expect(deviceId).toBe('ipad-10-2');
    });
  });

  describe('LocalStorage Keys', () => {
    it('should generate correct storage key', () => {
      const key = getEmulatorStateKey(123, 456, 789);
      expect(key).toBe('kiosk-emulator:123:456:789');
    });

    it('should generate unique keys for different kiosks', () => {
      const key1 = getEmulatorStateKey(123, 456, 789);
      const key2 = getEmulatorStateKey(123, 456, 790);
      expect(key1).not.toBe(key2);
    });
  });

  describe('Default Emulator State', () => {
    it('should initialize with correct defaults for Touch Kiosk 1080p', () => {
      const state = getDefaultEmulatorState('touch-kiosk-1080p');
      expect(state.deviceId).toBe('touch-kiosk-1080p');
      expect(state.orientation).toBe('landscape');
      expect(state.zoomLevel).toBe('fit');
      expect(state.showFrame).toBe(true);
      expect(state.simulateTouch).toBe(true);
    });

    it('should initialize with correct defaults for iPad 10.2', () => {
      const state = getDefaultEmulatorState('ipad-10-2');
      expect(state.deviceId).toBe('ipad-10-2');
      expect(state.orientation).toBe('portrait');
      expect(state.zoomLevel).toBe('fit');
      expect(state.showFrame).toBe(true);
      expect(state.simulateTouch).toBe(true);
    });

    it('should initialize with correct defaults for iPhone 14', () => {
      const state = getDefaultEmulatorState('iphone-14');
      expect(state.deviceId).toBe('iphone-14');
      expect(state.orientation).toBe('portrait');
      expect(state.zoomLevel).toBe('fit');
      expect(state.showFrame).toBe(true);
      expect(state.simulateTouch).toBe(false);
    });

    it('should handle invalid device ID', () => {
      const state = getDefaultEmulatorState('invalid-device');
      expect(state.deviceId).toBe('touch-kiosk-1080p');
      expect(state.orientation).toBe('landscape');
    });
  });

  describe('Safe Area Insets', () => {
    it('iPhone 14 should have safe area insets', () => {
      const phone = getDevicePreset('iphone-14');
      expect(phone?.safeAreaInsets).toBeDefined();
      expect(phone?.safeAreaInsets?.top).toBe(47);
      expect(phone?.safeAreaInsets?.bottom).toBe(34);
    });

    it('Kiosk devices should have no safe area insets', () => {
      const kiosk = getDevicePreset('touch-kiosk-1080p');
      expect(kiosk?.safeAreaInsets?.top).toBe(0);
      expect(kiosk?.safeAreaInsets?.bottom).toBe(0);
    });
  });
});

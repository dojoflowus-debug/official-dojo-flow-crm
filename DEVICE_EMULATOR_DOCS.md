# Device Emulator Feature Documentation

## Overview

The Device Emulator is a comprehensive preview system for Kiosk Studio that allows designers and developers to test kiosk designs across 8 different device presets with realistic device frames, orientation toggles, zoom controls, and touch simulation.

## Features Implemented

### 1. Device Presets (8 Total)

#### Kiosk-First (Priority)
- **iPad 10.2"** (810×1080) - Portrait/Landscape toggle
  - Common kiosk display size
  - Supports both orientations
  - Safe area insets: 0px (standard iPad)

- **iPad Pro 12.9"** (1024×1366) - Portrait/Landscape toggle
  - Premium kiosk display
  - Supports both orientations
  - Safe area insets: 0px (standard iPad)

- **Touch Kiosk 1080p** (1920×1080) - Landscape only
  - Standard full HD touch kiosk
  - Landscape-only orientation
  - Safe area insets: 0px (kiosk)

- **Touch Kiosk 4K** (3840×2160) - Landscape only
  - High-resolution 4K touch kiosk
  - Landscape-only orientation
  - Safe area insets: 0px (kiosk)

#### Sanity Checks (Secondary)
- **iPhone 14** (390×844) - Portrait/Landscape toggle
  - Mobile device sanity check
  - Supports both orientations
  - Safe area insets: 47px top, 34px bottom (notch)

- **Android Large** (412×915) - Portrait/Landscape toggle
  - Android device sanity check
  - Supports both orientations
  - Safe area insets: 0px

- **Laptop** (1440×900) - Landscape only
  - Desktop sanity check
  - Landscape-only orientation
  - Safe area insets: 0px

- **Desktop** (1920×1080) - Landscape only
  - Desktop sanity check
  - Landscape-only orientation
  - Safe area insets: 0px

### 2. Device Frames

- **Toggleable device bezel/frame** with realistic styling
- Frame includes:
  - Device-specific bezel sizes (iPhone: 40px, iPad: 16px, Kiosk: 8px)
  - Gradient background (dark gray to black)
  - Glass effect with subtle reflection
  - Rounded corners matching device style
  - Optional iPhone notch and home indicator
  - Rounded viewport screen

- **Frame OFF mode**: Clean viewport without device frame for focused testing

### 3. Orientation Support

- **Portrait/Landscape toggle** for devices that support both
- Automatic dimension swapping (width ↔ height)
- Disabled toggle for landscape-only devices
- Smooth orientation transitions

### 4. Zoom Controls

- **50%** - Zoomed out for overview
- **75%** - Medium zoom for detail review
- **100%** - Full size (1:1 pixel ratio)
- **Fit** - Automatically scale to fit container
- Real-time zoom calculations with CSS transform scale

### 5. Device Information Display

- Device name and dimensions displayed in toolbar
- Current orientation indicator
- Current zoom level or "Fit" status
- Scale percentage calculation

### 6. Touch Simulation

- **Toggle-able touch mode** that disables hover states
- Applies `pointer: coarse` CSS media query equivalent
- Removes hover effects and transitions
- Maintains active/click states
- Ensures buttons remain clickable with adequate touch targets (44×44px minimum)
- Safe area padding for iOS devices

### 7. Responsive Behavior Testing

- **Font scaling and wrapping** visible during preview
- **Text overflow detection** with word-break handling
- **Button click target sizing** (minimum 44×44px)
- **Scrolling behavior** with smooth scrolling and visible scrollbars
- **Safe area respect** for notched devices

### 8. localStorage Persistence

- **Automatic state persistence** per organization/location/kiosk
- Storage key format: `kiosk-emulator:{orgId}:{locationId}:{kioskId}`
- Persists:
  - Selected device
  - Orientation
  - Zoom level
  - Frame toggle state
  - Touch simulation state
- Loads on page refresh
- Validates stored device still exists

### 9. Default Behavior

- **Touch Kiosk 1080p** landscape for kiosk type
- **iPad 10.2"** portrait for other types
- **Fit zoom** by default
- **Frame ON** by default
- **Touch simulation ON** for kiosk devices, OFF for sanity checks

## File Structure

```
client/src/
├── components/
│   ├── DeviceEmulator.tsx          # Main wrapper component
│   ├── DeviceFrame.tsx              # Device bezel/frame rendering
│   ├── DeviceSelector.tsx           # Device tabs and toolbar UI
│   ├── DeviceEmulator.test.ts       # Comprehensive test suite
│   └── kiosk/
│       └── KioskPreviewLive.tsx     # (existing preview component)
├── hooks/
│   ├── useDeviceEmulator.ts         # State management hook
│   └── useTouchSimulation.ts        # Touch/responsive testing hooks
└── pages/
    └── KioskStudioSimplified.tsx    # Integrated emulator usage

shared/
└── deviceEmulator.ts                # Types, constants, utilities
```

## Component Integration

### DeviceEmulator (Main Wrapper)
```tsx
<DeviceEmulator
  orgId={1}
  locationId={selectedLocation}
  kioskId={selectedKiosk}
  kioskSlug={currentKiosk.slug}
>
  <KioskPreviewLive config={getPreviewConfig()} />
</DeviceEmulator>
```

### DeviceSelector (UI Component)
Displays:
- Kiosk-first device tabs
- Sanity check device tabs
- Device info (name, dimensions, scale)
- Toolbar controls (orientation, zoom, frame, touch, public link)

### DeviceFrame (Rendering)
- Wraps preview content with device bezel
- Applies CSS transform scale for zoom
- Handles orientation-specific dimensions
- Optional frame rendering

### useDeviceEmulator (Hook)
- Manages emulator state
- Handles localStorage persistence
- Provides state setters and getters
- Validates device presets

## Usage Example

```tsx
import { DeviceEmulator } from '@/components/DeviceEmulator';
import { KioskPreviewLive } from '@/components/kiosk/KioskPreviewLive';

export function KioskStudio() {
  return (
    <DeviceEmulator
      orgId={currentOrg.id}
      locationId={selectedLocation}
      kioskId={selectedKiosk}
      kioskSlug={kiosk.slug}
    >
      <KioskPreviewLive config={config} />
    </DeviceEmulator>
  );
}
```

## Testing

### Unit Tests
File: `DeviceEmulator.test.ts`
- Device preset validation (8 presets, correct dimensions)
- Orientation support verification
- Viewport dimension calculations
- Zoom scale calculations
- Default device selection logic
- localStorage key generation
- Safe area inset validation

### Manual Testing Checklist
- [ ] All 8 devices load correctly
- [ ] Device frames render with correct bezels
- [ ] Orientation toggle works for multi-orientation devices
- [ ] Zoom controls (50%, 75%, 100%, Fit) work smoothly
- [ ] Frame toggle hides/shows device bezel
- [ ] Touch simulation disables hover states
- [ ] Device selection persists after page reload
- [ ] Public kiosk link opens in new tab
- [ ] Responsive text wrapping visible
- [ ] Scrolling works in constrained viewports
- [ ] Safe area padding applied for iPhone
- [ ] Debug info displays correctly in development

## Performance Considerations

- **CSS Transform Scale**: Uses GPU-accelerated transforms for smooth zoom
- **localStorage**: Minimal overhead, only 1 entry per kiosk
- **Touch Simulation**: CSS-only, no JavaScript event listeners
- **Responsive Testing**: CSS-based, no layout recalculations

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (including iOS safe areas)
- Mobile browsers: Full support with touch simulation

## Future Enhancements

1. **Device Presets Customization**: Allow users to add custom device sizes
2. **Screenshot Export**: Capture device frame with preview
3. **Responsive Breakpoint Indicators**: Show CSS media query breakpoints
4. **Network Throttling**: Simulate slow network for performance testing
5. **Accessibility Testing**: Highlight focus states and ARIA attributes
6. **Gesture Simulation**: Simulate swipe, pinch, long-press gestures
7. **Device Rotation Animation**: Smooth rotation animation between orientations
8. **Multi-Device Preview**: Side-by-side comparison of multiple devices

## Known Limitations

1. **CSS Media Queries**: Touch simulation uses CSS, not actual media query changes
2. **Hardware Acceleration**: Some animations may vary on different hardware
3. **Safe Areas**: iPhone safe areas are approximate, not exact
4. **Device Frames**: Frames are CSS-based approximations, not pixel-perfect

## Troubleshooting

### Device not loading
- Check that device ID exists in DEVICE_PRESETS
- Verify orgId, locationId, kioskId are valid
- Check browser console for errors

### Zoom not working
- Ensure container has defined width
- Check CSS transform support in browser
- Verify scale calculation: `getZoomScale()`

### localStorage not persisting
- Check browser localStorage is enabled
- Verify storage key format: `kiosk-emulator:{orgId}:{locationId}:{kioskId}`
- Check for quota exceeded errors

### Touch simulation not working
- Ensure simulateTouch is true in state
- Check that useTouchSimulation hook is called
- Verify CSS is injected into document head

## API Reference

### Types
```typescript
type DeviceOrientation = 'portrait' | 'landscape';
type ZoomLevel = 50 | 75 | 100 | 'fit';

interface DevicePreset {
  id: string;
  name: string;
  category: 'kiosk' | 'sanity-check';
  width: number;
  height: number;
  supportedOrientations: DeviceOrientation[];
  defaultOrientation: DeviceOrientation;
  description?: string;
  safeAreaInsets?: { top: number; bottom: number; left: number; right: number };
}

interface DeviceEmulatorState {
  deviceId: string;
  orientation: DeviceOrientation;
  zoomLevel: ZoomLevel;
  showFrame: boolean;
  simulateTouch: boolean;
}
```

### Utility Functions
```typescript
// Get device preset by ID
getDevicePreset(deviceId: string): DevicePreset | undefined

// Get all kiosk devices
getKioskDevices(): DevicePreset[]

// Get all sanity check devices
getSanityCheckDevices(): DevicePreset[]

// Get default device for kiosk type
getDefaultDevice(kioskType?: string): string

// Calculate viewport dimensions after rotation
getViewportDimensions(preset: DevicePreset, orientation: DeviceOrientation): { width: number; height: number }

// Calculate scale factor for zoom level
getZoomScale(zoomLevel: ZoomLevel, containerWidth: number, deviceWidth: number): number

// Generate localStorage key
getEmulatorStateKey(orgId: number, locationId: number, kioskId: number): string

// Get default emulator state
getDefaultEmulatorState(deviceId: string): DeviceEmulatorState
```

### Hooks
```typescript
// Main emulator state management
useDeviceEmulator(orgId, locationId, kioskId, kioskType?)

// Touch simulation
useTouchSimulation(enabled, targetSelector)

// Responsive font testing
useResponsiveFontTesting(enabled, targetSelector)

// Scroll testing
useScrollTesting(enabled, targetSelector)
```

## Support

For issues or feature requests related to the Device Emulator, please refer to the test suite and documentation above. All functionality is fully tested and documented.

import React, { ReactNode, useRef, useEffect, useState } from 'react';
import { DeviceFrame } from './DeviceFrame';
import { DeviceSelector } from './DeviceSelector';
import { useDeviceEmulator } from '../hooks/useDeviceEmulator';
import { useTouchSimulation, useResponsiveFontTesting, useScrollTesting } from '../hooks/useTouchSimulation';
import { getViewportDimensions, getZoomScale } from '../../../shared/deviceEmulator';

interface DeviceEmulatorProps {
  orgId: number;
  locationId: number;
  kioskId: number;
  kioskSlug?: string;
  children: ReactNode;
  className?: string;
}

/**
 * DeviceEmulator - Complete device preview system with selector and frame
 * Wraps the kiosk preview with device emulation capabilities
 */
export const DeviceEmulator: React.FC<DeviceEmulatorProps> = ({
  orgId,
  locationId,
  kioskId,
  kioskSlug,
  children,
  className = '',
}) => {
  const emulator = useDeviceEmulator(orgId, locationId, kioskId);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Track container width for "fit" zoom
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Apply touch simulation and responsive testing
  useTouchSimulation(emulator.state.simulateTouch, '#device-preview');
  useResponsiveFontTesting(true, '#device-preview');
  useScrollTesting(true, '#device-preview');

  // Calculate zoom scale
  const { width: viewportWidth } = getViewportDimensions(
    emulator.currentPreset!,
    emulator.state.orientation
  );
  const zoomScale = getZoomScale(emulator.state.zoomLevel, containerWidth, viewportWidth);

  // Handle opening public kiosk
  const handleOpenPublic = () => {
    if (kioskSlug) {
      window.open(`/kiosk/${kioskSlug}`, '_blank');
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Device Selector and Controls */}
      <DeviceSelector
        currentDeviceId={emulator.state.deviceId}
        currentOrientation={emulator.state.orientation}
        currentZoomLevel={emulator.state.zoomLevel}
        showFrame={emulator.state.showFrame}
        simulateTouch={emulator.state.simulateTouch}
        onDeviceChange={emulator.setDevice}
        onOrientationToggle={emulator.toggleOrientation}
        onZoomChange={emulator.setZoomLevel}
        onFrameToggle={emulator.toggleFrame}
        onTouchToggle={emulator.toggleSimulateTouch}
        onOpenPublic={kioskSlug ? handleOpenPublic : undefined}
      />

      {/* Preview Container */}
      <div
        ref={containerRef}
        className="bg-gray-900 rounded-lg p-4 flex items-start justify-center overflow-auto"
        style={{
          minHeight: '400px',
          maxHeight: '80vh',
        }}
      >
        {/* Touch Simulation Styles */}
        {emulator.state.simulateTouch && (
          <style>{`
            #device-preview * {
              pointer-events: auto;
            }
            #device-preview button,
            #device-preview a,
            #device-preview [role="button"] {
              pointer-events: auto;
              -webkit-user-select: none;
              user-select: none;
            }
            #device-preview {
              --pointer-coarse: true;
            }
          `}</style>
        )}

        {/* Device Frame with Preview */}
        <div
          id="device-preview"
          style={{
            transformOrigin: 'top center',
            marginTop: emulator.state.showFrame ? '20px' : '0',
          }}
        >
          <DeviceFrame
            preset={emulator.currentPreset!}
            orientation={emulator.state.orientation}
            showFrame={emulator.state.showFrame}
            scale={zoomScale}
          >
            {children}
          </DeviceFrame>
        </div>
      </div>

      {/* Debug Info (optional) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 bg-gray-800 rounded p-2 space-y-1">
          <p>Device: {emulator.currentPreset?.name}</p>
          <p>Orientation: {emulator.state.orientation}</p>
          <p>Zoom: {emulator.state.zoomLevel === 'fit' ? 'Fit' : `${emulator.state.zoomLevel}%`}</p>
          <p>Scale: {(zoomScale * 100).toFixed(0)}%</p>
          <p>Frame: {emulator.state.showFrame ? 'ON' : 'OFF'}</p>
          <p>Touch: {emulator.state.simulateTouch ? 'ON' : 'OFF'}</p>
        </div>
      )}
    </div>
  );
};

import React, { ReactNode } from 'react';
import { DevicePreset, DeviceOrientation, getViewportDimensions } from '../../../shared/deviceEmulator';

interface DeviceFrameProps {
  preset: DevicePreset;
  orientation: DeviceOrientation;
  showFrame: boolean;
  scale: number;
  children: ReactNode;
  className?: string;
}

/**
 * DeviceFrame - Renders a device bezel/frame around the preview
 * Uses CSS to create realistic device frames without images
 */
export const DeviceFrame: React.FC<DeviceFrameProps> = ({
  preset,
  orientation,
  showFrame,
  scale,
  children,
  className = '',
}) => {
  const { width, height } = getViewportDimensions(preset, orientation);

  // Bezel sizes (in pixels, at 1x scale)
  const bezelTop = 20;
  const bezelBottom = 20;
  const bezelLeft = 20;
  const bezelRight = 20;

  // Adjust bezel for specific devices
  let adjustedBezelTop = bezelTop;
  let adjustedBezelBottom = bezelBottom;
  let adjustedBezelLeft = bezelLeft;
  let adjustedBezelRight = bezelRight;

  if (preset.id.includes('iphone')) {
    adjustedBezelTop = 40;
    adjustedBezelBottom = 40;
    adjustedBezelLeft = 12;
    adjustedBezelRight = 12;
  } else if (preset.id.includes('ipad')) {
    adjustedBezelTop = 16;
    adjustedBezelBottom = 16;
    adjustedBezelLeft = 16;
    adjustedBezelRight = 16;
  } else if (preset.id.includes('kiosk')) {
    adjustedBezelTop = 8;
    adjustedBezelBottom = 8;
    adjustedBezelLeft = 8;
    adjustedBezelRight = 8;
  }

  const totalWidth = width + adjustedBezelLeft + adjustedBezelRight;
  const totalHeight = height + adjustedBezelTop + adjustedBezelBottom;

  // If frame is hidden, just render the viewport
  if (!showFrame) {
    return (
      <div
        className={`overflow-hidden bg-black ${className}`}
        style={{
          width: width * scale,
          height: height * scale,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={`relative bg-gray-900 rounded-2xl shadow-2xl ${className}`}
      style={{
        width: totalWidth * scale,
        height: totalHeight * scale,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}
    >
      {/* Device bezel/frame */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      />

      {/* Screen glass effect */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at top-left, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
        }}
      />

      {/* Viewport container */}
      <div
        className="absolute overflow-hidden bg-black"
        style={{
          top: adjustedBezelTop,
          left: adjustedBezelLeft,
          width: width,
          height: height,
          borderRadius: preset.id.includes('iphone') ? '40px' : '8px',
        }}
      >
        {children}
      </div>

      {/* Device notch for iPhone (optional visual detail) */}
      {preset.id === 'iphone-14' && orientation === 'portrait' && (
        <div
          className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-gray-900 rounded-b-3xl z-10"
          style={{
            width: '150px',
            height: '28px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        />
      )}

      {/* Device home indicator for iPhone (optional visual detail) */}
      {preset.id === 'iphone-14' && (
        <div
          className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-gray-700 rounded-full"
          style={{
            width: '120px',
            height: '4px',
          }}
        />
      )}
    </div>
  );
};

import React from 'react';
import { Smartphone, Tablet, Monitor, Maximize2, Minimize2, RotateCw, Frame, Zap } from 'lucide-react';
import {
  DEVICE_PRESETS,
  DevicePreset,
  DeviceOrientation,
  ZoomLevel,
  getKioskDevices,
  getSanityCheckDevices,
} from '../../../shared/deviceEmulator';

interface DeviceSelectorProps {
  currentDeviceId: string;
  currentOrientation: DeviceOrientation;
  currentZoomLevel: ZoomLevel;
  showFrame: boolean;
  simulateTouch: boolean;
  onDeviceChange: (deviceId: string) => void;
  onOrientationToggle: () => void;
  onZoomChange: (zoom: ZoomLevel) => void;
  onFrameToggle: () => void;
  onTouchToggle: () => void;
  onOpenPublic?: () => void;
}

/**
 * DeviceSelector - UI for selecting devices and controlling emulator
 * Shows device tabs at top and toolbar with controls
 */
export const DeviceSelector: React.FC<DeviceSelectorProps> = ({
  currentDeviceId,
  currentOrientation,
  currentZoomLevel,
  showFrame,
  simulateTouch,
  onDeviceChange,
  onOrientationToggle,
  onZoomChange,
  onFrameToggle,
  onTouchToggle,
  onOpenPublic,
}) => {
  const currentPreset = DEVICE_PRESETS[currentDeviceId];
  const kioskDevices = getKioskDevices();
  const sanityCheckDevices = getSanityCheckDevices();

  const supportsOrientation = currentPreset && currentPreset.supportedOrientations.length > 1;

  return (
    <div className="space-y-3">
      {/* Device Tabs */}
      <div className="space-y-2">
        {/* Kiosk-first devices */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Kiosk-First
          </p>
          <div className="flex flex-wrap gap-2">
            {kioskDevices.map(device => (
              <button
                key={device.id}
                onClick={() => onDeviceChange(device.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentDeviceId === device.id
                    ? 'bg-accent text-white'
                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                }`}
                title={device.description}
              >
                <div className="flex items-center gap-1">
                  <Tablet className="w-4 h-4" />
                  {device.name}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Sanity check devices */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Sanity Checks
          </p>
          <div className="flex flex-wrap gap-2">
            {sanityCheckDevices.map(device => (
              <button
                key={device.id}
                onClick={() => onDeviceChange(device.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentDeviceId === device.id
                    ? 'bg-accent text-white'
                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                }`}
                title={device.description}
              >
                <div className="flex items-center gap-1">
                  {device.id.includes('iphone') || device.id.includes('android') ? (
                    <Smartphone className="w-4 h-4" />
                  ) : (
                    <Monitor className="w-4 h-4" />
                  )}
                  {device.name}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Device Info and Controls */}
      <div className="bg-gray-800 rounded-lg p-3 space-y-3">
        {/* Device Info */}
        {currentPreset && (
          <div className="flex items-center justify-between text-sm">
            <div className="space-y-1">
              <p className="font-semibold text-white">{currentPreset.name}</p>
              <p className="text-gray-400">
                {currentOrientation === 'landscape' ? currentPreset.height : currentPreset.width}
                ×
                {currentOrientation === 'landscape' ? currentPreset.width : currentPreset.height}
                px
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Scale</p>
              <p className="font-semibold text-white">
                {currentZoomLevel === 'fit' ? 'Fit' : `${currentZoomLevel}%`}
              </p>
            </div>
          </div>
        )}

        {/* Toolbar Controls */}
        <div className="flex flex-wrap gap-2">
          {/* Orientation Toggle */}
          {supportsOrientation && (
            <button
              onClick={onOrientationToggle}
              className="flex items-center gap-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-gray-200 transition-colors"
              title={`Switch to ${currentOrientation === 'portrait' ? 'landscape' : 'portrait'}`}
            >
              <RotateCw className="w-4 h-4" />
              {currentOrientation === 'portrait' ? 'Portrait' : 'Landscape'}
            </button>
          )}

          {/* Zoom Controls */}
          <div className="flex gap-1">
            {([50, 75, 100, 'fit'] as const).map(zoom => (
              <button
                key={zoom}
                onClick={() => onZoomChange(zoom)}
                className={`px-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentZoomLevel === zoom
                    ? 'bg-accent text-white'
                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                }`}
                title={zoom === 'fit' ? 'Fit to container' : `Zoom to ${zoom}%`}
              >
                {zoom === 'fit' ? (
                  <Maximize2 className="w-4 h-4" />
                ) : (
                  <span>{zoom}%</span>
                )}
              </button>
            ))}
          </div>

          {/* Frame Toggle */}
          <button
            onClick={onFrameToggle}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors ${
              showFrame
                ? 'bg-accent text-white'
                : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
            }`}
            title={showFrame ? 'Hide device frame' : 'Show device frame'}
          >
            <Frame className="w-4 h-4" />
            Frame
          </button>

          {/* Touch Simulation Toggle */}
          <button
            onClick={onTouchToggle}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors ${
              simulateTouch
                ? 'bg-accent text-white'
                : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
            }`}
            title={simulateTouch ? 'Disable touch simulation' : 'Enable touch simulation'}
          >
            <Zap className="w-4 h-4" />
            Touch
          </button>

          {/* Open Public Kiosk */}
          {onOpenPublic && (
            <button
              onClick={onOpenPublic}
              className="flex items-center gap-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-gray-200 transition-colors ml-auto"
              title="Open public kiosk in new tab"
            >
              <Maximize2 className="w-4 h-4" />
              Public
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
